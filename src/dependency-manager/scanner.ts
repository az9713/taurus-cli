/**
 * Dependency Scanner
 *
 * Scans project dependencies and analyzes package.json
 */

import { promises as fs } from 'fs';
import { join } from 'path';
import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { PackageInfo, DependencyInfo, UnusedDependency } from './types.js';

const exec = promisify(execCallback);

export class DependencyScanner {
  private projectRoot: string;
  private packageManager: 'npm' | 'yarn' | 'pnpm';

  constructor(projectRoot: string, packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm') {
    this.projectRoot = projectRoot;
    this.packageManager = packageManager;
  }

  /**
   * Read and parse package.json
   */
  async readPackageJson(): Promise<PackageInfo> {
    const packagePath = join(this.projectRoot, 'package.json');

    try {
      const content = await fs.readFile(packagePath, 'utf-8');
      const pkg = JSON.parse(content);

      return {
        name: pkg.name,
        version: pkg.version,
        description: pkg.description,
        license: pkg.license,
        repository: pkg.repository?.url || pkg.repository,
        homepage: pkg.homepage,
        dependencies: pkg.dependencies || {},
        devDependencies: pkg.devDependencies || {},
      };
    } catch (error: any) {
      throw new Error(`Failed to read package.json: ${error.message}`);
    }
  }

  /**
   * Get list of all dependencies
   */
  async getAllDependencies(): Promise<DependencyInfo[]> {
    const pkg = await this.readPackageJson();
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
    };

    const dependencies: DependencyInfo[] = [];

    for (const [name, version] of Object.entries(allDeps)) {
      const info = await this.getDependencyInfo(name, version);
      dependencies.push(info);
    }

    return dependencies;
  }

  /**
   * Get information about a specific dependency
   */
  async getDependencyInfo(name: string, currentVersion: string): Promise<DependencyInfo> {
    try {
      // Get latest version from registry
      const { stdout } = await exec(`${this.packageManager} view ${name} version`);
      const latestVersion = stdout.trim();

      // Get license
      const { stdout: licenseOut } = await exec(`${this.packageManager} view ${name} license`);
      const license = licenseOut.trim() as any;

      // Determine update type
      const updateType = this.determineUpdateType(currentVersion, latestVersion);

      return {
        name,
        currentVersion: currentVersion.replace(/^[\^~]/, ''),
        latestVersion,
        wantedVersion: latestVersion,
        isOutdated: currentVersion.replace(/^[\^~]/, '') !== latestVersion,
        updateType,
        license,
        vulnerabilities: [], // Will be populated by security checker
        usedIn: await this.findUsageLocations(name),
      };
    } catch (error: any) {
      // Package might not be in registry
      return {
        name,
        currentVersion: currentVersion.replace(/^[\^~]/, ''),
        latestVersion: currentVersion.replace(/^[\^~]/, ''),
        wantedVersion: currentVersion.replace(/^[\^~]/, ''),
        isOutdated: false,
        updateType: 'none',
        license: 'UNKNOWN',
        vulnerabilities: [],
        usedIn: [],
      };
    }
  }

  /**
   * Check for outdated dependencies
   */
  async getOutdatedDependencies(): Promise<DependencyInfo[]> {
    try {
      const command = this.packageManager === 'npm'
        ? 'npm outdated --json'
        : `${this.packageManager} outdated --json`;

      const { stdout } = await exec(command, { cwd: this.projectRoot });

      if (!stdout) return [];

      const outdated = JSON.parse(stdout);
      const result: DependencyInfo[] = [];

      for (const [name, info] of Object.entries(outdated as any)) {
        const pkgInfo = info as any;
        result.push({
          name,
          currentVersion: pkgInfo.current,
          latestVersion: pkgInfo.latest,
          wantedVersion: pkgInfo.wanted,
          isOutdated: true,
          updateType: this.determineUpdateType(pkgInfo.current, pkgInfo.latest),
          license: 'UNKNOWN', // Will be fetched separately
          vulnerabilities: [],
          usedIn: await this.findUsageLocations(name),
        });
      }

      return result;
    } catch (error: any) {
      // npm outdated returns exit code 1 when there are outdated packages
      // Parse stdout anyway
      if (error.stdout) {
        try {
          const outdated = JSON.parse(error.stdout);
          const result: DependencyInfo[] = [];

          for (const [name, info] of Object.entries(outdated as any)) {
            const pkgInfo = info as any;
            result.push({
              name,
              currentVersion: pkgInfo.current,
              latestVersion: pkgInfo.latest,
              wantedVersion: pkgInfo.wanted,
              isOutdated: true,
              updateType: this.determineUpdateType(pkgInfo.current, pkgInfo.latest),
              license: 'UNKNOWN',
              vulnerabilities: [],
              usedIn: await this.findUsageLocations(name),
            });
          }

          return result;
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Detect unused dependencies
   */
  async detectUnusedDependencies(): Promise<UnusedDependency[]> {
    const pkg = await this.readPackageJson();
    const unused: UnusedDependency[] = [];

    // Get all source files
    const sourceFiles = await this.getAllSourceFiles();

    // Check each dependency
    for (const [name, version] of Object.entries({ ...pkg.dependencies, ...pkg.devDependencies })) {
      const isUsed = await this.isDependencyUsed(name, sourceFiles);

      if (!isUsed) {
        const isDev = name in (pkg.devDependencies || {});
        const isProd = name in (pkg.dependencies || {});

        unused.push({
          name,
          version,
          reason: 'not-imported',
          recommendation: isDev ? 'remove' : 'review',
        });
      }
    }

    return unused;
  }

  /**
   * Find where a dependency is used
   */
  private async findUsageLocations(packageName: string): Promise<string[]> {
    const locations: string[] = [];

    try {
      const sourceFiles = await this.getAllSourceFiles();

      for (const file of sourceFiles) {
        const content = await fs.readFile(file, 'utf-8');

        // Check for imports
        const importPatterns = [
          new RegExp(`from ['"]${packageName}['"]`, 'g'),
          new RegExp(`require\\(['"]${packageName}['"]\\)`, 'g'),
          new RegExp(`import\\(['"]${packageName}['"]\\)`, 'g'),
        ];

        for (const pattern of importPatterns) {
          if (pattern.test(content)) {
            locations.push(file);
            break;
          }
        }
      }
    } catch (error) {
      // Ignore errors
    }

    return locations;
  }

  /**
   * Check if dependency is actually used
   */
  private async isDependencyUsed(packageName: string, sourceFiles: string[]): Promise<boolean> {
    for (const file of sourceFiles) {
      try {
        const content = await fs.readFile(file, 'utf-8');

        const importPatterns = [
          new RegExp(`from ['"]${packageName}['"]`),
          new RegExp(`require\\(['"]${packageName}['"]\\)`),
          new RegExp(`import\\(['"]${packageName}['"]\\)`),
        ];

        for (const pattern of importPatterns) {
          if (pattern.test(content)) {
            return true;
          }
        }
      } catch (error) {
        // Ignore file read errors
      }
    }

    return false;
  }

  /**
   * Get all source files in project
   */
  private async getAllSourceFiles(): Promise<string[]> {
    const files: string[] = [];

    async function scanDir(dir: string): Promise<void> {
      try {
        const entries = await fs.readdir(dir, { withFileTypes: true });

        for (const entry of entries) {
          const fullPath = join(dir, entry.name);

          // Skip node_modules and other directories
          if (entry.isDirectory()) {
            if (!['node_modules', 'dist', 'build', '.git', 'coverage'].includes(entry.name)) {
              await scanDir(fullPath);
            }
          } else if (entry.isFile()) {
            // Include source files
            if (/\.(ts|tsx|js|jsx|mjs|cjs)$/.test(entry.name)) {
              files.push(fullPath);
            }
          }
        }
      } catch (error) {
        // Ignore directory read errors
      }
    }

    await scanDir(this.projectRoot);
    return files;
  }

  /**
   * Determine update type from version comparison
   */
  private determineUpdateType(current: string, latest: string): 'major' | 'minor' | 'patch' | 'none' {
    // Remove ^ and ~ prefixes
    const cleanCurrent = current.replace(/^[\^~]/, '');
    const cleanLatest = latest.replace(/^[\^~]/, '');

    if (cleanCurrent === cleanLatest) return 'none';

    const currentParts = cleanCurrent.split('.').map(Number);
    const latestParts = cleanLatest.split('.').map(Number);

    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    if (latestParts[2] > currentParts[2]) return 'patch';

    return 'none';
  }

  /**
   * Get dependency tree
   */
  async getDependencyTree(): Promise<any> {
    try {
      const command = this.packageManager === 'npm'
        ? 'npm list --json --depth=5'
        : `${this.packageManager} list --json --depth=5`;

      const { stdout } = await exec(command, { cwd: this.projectRoot });
      return JSON.parse(stdout);
    } catch (error: any) {
      // Might fail with exit code 1 if there are issues
      if (error.stdout) {
        try {
          return JSON.parse(error.stdout);
        } catch {
          return {};
        }
      }
      return {};
    }
  }

  /**
   * Find duplicate dependencies
   */
  async findDuplicates(): Promise<Map<string, string[]>> {
    const tree = await this.getDependencyTree();
    const duplicates = new Map<string, string[]>();

    function traverse(node: any, depth = 0): void {
      if (!node.dependencies) return;

      for (const [name, info] of Object.entries(node.dependencies as any)) {
        const pkgInfo = info as any;
        if (!duplicates.has(name)) {
          duplicates.set(name, []);
        }

        const versions = duplicates.get(name)!;
        if (!versions.includes(pkgInfo.version)) {
          versions.push(pkgInfo.version);
        }

        traverse(pkgInfo, depth + 1);
      }
    }

    traverse(tree);

    // Filter to only packages with multiple versions
    const result = new Map();
    for (const [name, versions] of duplicates.entries()) {
      if (versions.length > 1) {
        result.set(name, versions);
      }
    }

    return result;
  }
}
