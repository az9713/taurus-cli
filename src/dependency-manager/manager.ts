/**
 * Dependency Manager
 *
 * Main orchestrator for intelligent dependency management
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { DependencyManagerConfig, DependencyInfo, UpdateReport, UpdateAnalysis } from './types.js';
import { DependencyScanner } from './scanner.js';
import { SecurityChecker } from './security-checker.js';
import { UpdateAnalyzer } from './update-analyzer.js';
import { LicenseChecker } from './license-checker.js';

export class DependencyManager extends EventEmitter {
  private config: DependencyManagerConfig;
  private projectRoot: string;
  private scanner: DependencyScanner;
  private securityChecker: SecurityChecker;
  private updateAnalyzer: UpdateAnalyzer;
  private licenseChecker: LicenseChecker;

  constructor(projectRoot: string, config: DependencyManagerConfig) {
    super();
    this.projectRoot = projectRoot;
    this.config = config;
    this.scanner = new DependencyScanner(projectRoot, config.packageManager);
    this.securityChecker = new SecurityChecker(projectRoot, config.packageManager);
    this.updateAnalyzer = new UpdateAnalyzer(config.packageManager);
    this.licenseChecker = new LicenseChecker(config.policies.licensePolicy);
  }

  /**
   * Run full dependency check
   */
  async checkAll(): Promise<UpdateReport> {
    this.emit('check-started');

    try {
      // Get all dependencies
      const dependencies = await this.scanner.getAllDependencies();

      // Get outdated
      const outdated = await this.scanner.getOutdatedDependencies();

      // Run security audit
      const securityAudits = await this.securityChecker.runAudit();

      // Analyze updates
      const updates: UpdateAnalysis[] = [];
      for (const dep of outdated) {
        const analysis = await this.updateAnalyzer.analyzeUpdate(
          dep.name,
          dep.currentVersion,
          dep.latestVersion
        );
        updates.push(analysis);
      }

      // Filter by policies
      const securityUpdates = updates.filter(u => {
        const hasVuln = securityAudits.some(a => a.package === u.package);
        return hasVuln;
      });

      const breakingUpdates = updates.filter(u => u.breakingChanges.length > 0);
      const safeUpdates = updates.filter(u => u.recommendation === 'safe');

      const report: UpdateReport = {
        timestamp: new Date(),
        packagesChecked: dependencies.length,
        updatesAvailable: outdated.length,
        securityUpdates: securityUpdates.length,
        breakingUpdates: breakingUpdates.length,
        safeUpdates: safeUpdates.length,
        updates,
        securityAudits,
      };

      this.emit('check-completed', report);

      return report;
    } catch (error: any) {
      this.emit('check-failed', error);
      throw error;
    }
  }

  /**
   * Update dependencies based on policy
   */
  async autoUpdate(): Promise<{
    updated: string[];
    failed: string[];
    skipped: string[];
  }> {
    this.emit('auto-update-started');

    const report = await this.checkAll();
    const updated: string[] = [];
    const failed: string[] = [];
    const skipped: string[] = [];

    for (const update of report.updates) {
      // Check if should auto-update based on policy
      const shouldUpdate = this.shouldAutoUpdate(update, report.securityAudits);

      if (!shouldUpdate) {
        skipped.push(update.package);
        continue;
      }

      try {
        await this.updatePackage(update.package, update.to);
        updated.push(update.package);
        this.emit('package-updated', update.package, update.to);
      } catch (error) {
        failed.push(update.package);
        this.emit('package-update-failed', update.package, error);
      }
    }

    this.emit('auto-update-completed', { updated, failed, skipped });

    return { updated, failed, skipped };
  }

  /**
   * Check if package should be auto-updated based on policy
   */
  private shouldAutoUpdate(update: UpdateAnalysis, securityAudits: any[]): boolean {
    // Always update security vulnerabilities if policy allows
    const hasVuln = securityAudits.some(a => a.package === update.package);
    if (hasVuln && this.config.autoUpdate.security === 'immediately') {
      return true;
    }

    // Check update type policy
    switch (update.updateType) {
      case 'patch':
        return this.config.autoUpdate.patch === 'immediately';
      case 'minor':
        return this.config.autoUpdate.minor === 'immediately' && update.recommendation !== 'risky';
      case 'major':
        return this.config.autoUpdate.major === 'immediately' && update.recommendation === 'safe';
      default:
        return false;
    }
  }

  /**
   * Update a specific package
   */
  async updatePackage(packageName: string, version: string): Promise<void> {
    const command = this.config.packageManager === 'npm'
      ? `npm install ${packageName}@${version}`
      : this.config.packageManager === 'yarn'
        ? `yarn add ${packageName}@${version}`
        : `pnpm add ${packageName}@${version}`;

    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execPromise = promisify(exec);

    await execPromise(command, { cwd: this.projectRoot });
  }

  /**
   * Fix security vulnerabilities
   */
  async fixSecurityIssues(): Promise<{ fixed: number; remaining: number }> {
    this.emit('security-fix-started');

    try {
      const result = await this.securityChecker.autoFix();
      this.emit('security-fix-completed', result);
      return result;
    } catch (error) {
      this.emit('security-fix-failed', error);
      throw error;
    }
  }

  /**
   * Check license compliance
   */
  async checkLicenseCompliance(): Promise<{
    compliant: DependencyInfo[];
    violations: DependencyInfo[];
    warnings: DependencyInfo[];
  }> {
    const dependencies = await this.scanner.getAllDependencies();
    return this.licenseChecker.checkCompliance(dependencies);
  }

  /**
   * Find unused dependencies
   */
  async findUnused(): Promise<any[]> {
    return this.scanner.detectUnusedDependencies();
  }

  /**
   * Find duplicate dependencies
   */
  async findDuplicates(): Promise<Map<string, string[]>> {
    return this.scanner.findDuplicates();
  }

  /**
   * Generate comprehensive report
   */
  async generateReport(): Promise<string> {
    let report = '# Dependency Management Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Update report
    const updateReport = await this.checkAll();
    report += '## Updates Available\n\n';
    report += `- Total packages: ${updateReport.packagesChecked}\n`;
    report += `- Updates available: ${updateReport.updatesAvailable}\n`;
    report += `- Security updates: ${updateReport.securityUpdates}\n`;
    report += `- Breaking updates: ${updateReport.breakingUpdates}\n`;
    report += `- Safe updates: ${updateReport.safeUpdates}\n\n`;

    // Security report
    if (updateReport.securityAudits.length > 0) {
      report += this.securityChecker.generateSecurityReport(updateReport.securityAudits);
    }

    // License report
    const dependencies = await this.scanner.getAllDependencies();
    report += this.licenseChecker.generateLicenseReport(dependencies);

    // Unused dependencies
    const unused = await this.findUnused();
    if (unused.length > 0) {
      report += '## Unused Dependencies\n\n';
      for (const dep of unused) {
        report += `- ${dep.name}@${dep.version} (${dep.reason})\n`;
      }
      report += '\n';
    }

    // Duplicates
    const duplicates = await this.findDuplicates();
    if (duplicates.size > 0) {
      report += '## Duplicate Dependencies\n\n';
      for (const [name, versions] of duplicates.entries()) {
        report += `- ${name}: ${versions.join(', ')}\n`;
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Export report to file
   */
  async exportReport(outputPath: string): Promise<void> {
    const report = await this.generateReport();
    await fs.writeFile(outputPath, report);
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    totalDependencies: number;
    outdated: number;
    vulnerabilities: number;
    licenseViolations: number;
    unused: number;
  }> {
    const dependencies = await this.scanner.getAllDependencies();
    const outdated = await this.scanner.getOutdatedDependencies();
    const securityAudits = await this.securityChecker.runAudit();
    const licenseCheck = await this.checkLicenseCompliance();
    const unused = await this.findUnused();

    return {
      totalDependencies: dependencies.length,
      outdated: outdated.length,
      vulnerabilities: securityAudits.reduce((sum, a) => sum + a.vulnerabilities.length, 0),
      licenseViolations: licenseCheck.violations.length,
      unused: unused.length,
    };
  }
}
