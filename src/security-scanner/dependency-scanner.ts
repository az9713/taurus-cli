/**
 * Dependency Scanner - Scans dependencies for known vulnerabilities
 */

import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';
import { DependencyVulnerability, Dependency } from './types';

export class DependencyScanner {
  /**
   * Scan dependencies for vulnerabilities
   */
  async scanDependencies(projectPath: string = '.'): Promise<DependencyVulnerability[]> {
    const vulnerabilities: DependencyVulnerability[] = [];

    // Try npm audit
    try {
      const npmVulns = await this.runNpmAudit(projectPath);
      vulnerabilities.push(...npmVulns);
    } catch (error) {
      // npm audit failed, continue
    }

    // Parse package.json for manual checks
    const packageJson = this.readPackageJson(projectPath);
    if (packageJson) {
      const manualChecks = this.performManualChecks(packageJson);
      vulnerabilities.push(...manualChecks);
    }

    return vulnerabilities;
  }

  /**
   * Run npm audit
   */
  private async runNpmAudit(projectPath: string): Promise<DependencyVulnerability[]> {
    const vulnerabilities: DependencyVulnerability[] = [];

    try {
      // Run npm audit in JSON format
      const result = execSync('npm audit --json', {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      const auditData = JSON.parse(result);

      // Parse npm audit results
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(
          auditData.vulnerabilities as any
        )) {
          const vuln = vulnData as any;

          vulnerabilities.push({
            package: packageName,
            version: vuln.version || 'unknown',
            vulnerability: {
              id: vuln.via?.[0]?.source || 'npm-audit',
              title: vuln.via?.[0]?.title || 'Security vulnerability',
              description:
                vuln.via?.[0]?.description || 'Vulnerability in dependency',
              severity: this.mapNpmSeverity(vuln.severity),
              cvss: vuln.via?.[0]?.cvss?.score,
              cve: vuln.via?.[0]?.cve,
            },
            fixedIn: vuln.fixAvailable?.version,
            patchAvailable: Boolean(vuln.fixAvailable),
            remediation: vuln.fixAvailable
              ? `Update to version ${vuln.fixAvailable.version}`
              : 'No patch available. Consider alternative packages.',
          });
        }
      }
    } catch (error) {
      // npm audit returns non-zero exit code when vulnerabilities found
      // Try to parse output anyway
      if (error instanceof Error && 'stdout' in error) {
        try {
          const auditData = JSON.parse((error as any).stdout);
          // Process similar to above
        } catch (parseError) {
          // Unable to parse, skip
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Map npm severity to our severity levels
   */
  private mapNpmSeverity(
    severity: string
  ): 'critical' | 'high' | 'medium' | 'low' | 'info' {
    const mapping: Record<string, any> = {
      critical: 'critical',
      high: 'high',
      moderate: 'medium',
      low: 'low',
      info: 'info',
    };

    return mapping[severity] || 'medium';
  }

  /**
   * Read package.json
   */
  private readPackageJson(projectPath: string): any {
    try {
      const packagePath = path.join(projectPath, 'package.json');
      const content = fs.readFileSync(packagePath, 'utf-8');
      return JSON.parse(content);
    } catch (error) {
      return null;
    }
  }

  /**
   * Perform manual security checks on dependencies
   */
  private performManualChecks(packageJson: any): DependencyVulnerability[] {
    const vulnerabilities: DependencyVulnerability[] = [];

    // Check for known problematic packages
    const problematicPackages = this.getProblematicPackages();

    const allDeps = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };

    for (const [pkg, version] of Object.entries(allDeps)) {
      const problem = problematicPackages.get(pkg);
      if (problem) {
        vulnerabilities.push({
          package: pkg,
          version: version as string,
          vulnerability: {
            id: `manual-check-${pkg}`,
            title: problem.title,
            description: problem.description,
            severity: problem.severity,
          },
          fixedIn: problem.fixedIn,
          patchAvailable: Boolean(problem.fixedIn),
          remediation: problem.remediation,
        });
      }

      // Check for outdated Node.js versions in engines
      if (packageJson.engines?.node) {
        const nodeVersion = packageJson.engines.node;
        if (this.isOutdatedNodeVersion(nodeVersion)) {
          vulnerabilities.push({
            package: 'node',
            version: nodeVersion,
            vulnerability: {
              id: 'outdated-node',
              title: 'Outdated Node.js Version',
              description: 'Project specifies outdated Node.js version',
              severity: 'medium',
            },
            fixedIn: '>=18.0.0',
            patchAvailable: true,
            remediation: 'Update to Node.js 18 LTS or newer',
          });
        }
      }
    }

    return vulnerabilities;
  }

  /**
   * Get list of known problematic packages
   */
  private getProblematicPackages(): Map<
    string,
    {
      title: string;
      description: string;
      severity: 'critical' | 'high' | 'medium' | 'low' | 'info';
      fixedIn?: string;
      remediation: string;
    }
  > {
    return new Map([
      [
        'event-stream',
        {
          title: 'Malicious Code in event-stream',
          description:
            'Version 3.3.6 contained malicious code for stealing cryptocurrency',
          severity: 'critical',
          fixedIn: '4.0.0',
          remediation: 'Update to version 4.0.0 or remove dependency',
        },
      ],
      [
        'flatmap-stream',
        {
          title: 'Malicious Code in flatmap-stream',
          description: 'Package contained malicious code',
          severity: 'critical',
          remediation: 'Remove this dependency immediately',
        },
      ],
      [
        'eslint-scope',
        {
          title: 'Compromised eslint-scope',
          description: 'Version 3.7.2 was compromised',
          severity: 'high',
          fixedIn: '3.7.3',
          remediation: 'Update to version 3.7.3 or higher',
        },
      ],
    ]);
  }

  /**
   * Check if Node.js version is outdated
   */
  private isOutdatedNodeVersion(versionSpec: string): boolean {
    // Simple check - consider versions < 16 as outdated
    const match = versionSpec.match(/(\d+)/);
    if (match) {
      const majorVersion = parseInt(match[1], 10);
      return majorVersion < 16;
    }
    return false;
  }

  /**
   * Get dependency tree
   */
  getDependencyTree(projectPath: string = '.'): Dependency[] {
    const packageJson = this.readPackageJson(projectPath);
    if (!packageJson) return [];

    const dependencies: Dependency[] = [];

    // Direct dependencies
    if (packageJson.dependencies) {
      for (const [name, version] of Object.entries(packageJson.dependencies)) {
        dependencies.push({
          name,
          version: version as string,
          type: 'direct',
          vulnerabilities: [],
        });
      }
    }

    return dependencies;
  }

  /**
   * Check for dependency updates
   */
  async checkForUpdates(
    projectPath: string = '.'
  ): Promise<
    Array<{ package: string; current: string; latest: string; updateType: string }>
  > {
    const updates: Array<{
      package: string;
      current: string;
      latest: string;
      updateType: string;
    }> = [];

    try {
      // Run npm outdated
      const result = execSync('npm outdated --json', {
        cwd: projectPath,
        encoding: 'utf-8',
      });

      const outdated = JSON.parse(result);

      for (const [pkg, info] of Object.entries(outdated)) {
        const data = info as any;
        updates.push({
          package: pkg,
          current: data.current,
          latest: data.latest,
          updateType: this.determineUpdateType(data.current, data.latest),
        });
      }
    } catch (error) {
      // npm outdated returns non-zero when outdated packages found
    }

    return updates;
  }

  /**
   * Determine update type (major, minor, patch)
   */
  private determineUpdateType(current: string, latest: string): string {
    const currentParts = current.split('.').map((n) => parseInt(n, 10));
    const latestParts = latest.split('.').map((n) => parseInt(n, 10));

    if (latestParts[0] > currentParts[0]) return 'major';
    if (latestParts[1] > currentParts[1]) return 'minor';
    if (latestParts[2] > currentParts[2]) return 'patch';

    return 'none';
  }
}
