/**
 * Security Checker
 *
 * Checks dependencies for security vulnerabilities
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { Vulnerability, SecurityAudit, DependencyInfo } from './types.js';

const exec = promisify(execCallback);

export class SecurityChecker {
  private projectRoot: string;
  private packageManager: 'npm' | 'yarn' | 'pnpm';

  constructor(projectRoot: string, packageManager: 'npm' | 'yarn' | 'pnpm' = 'npm') {
    this.projectRoot = projectRoot;
    this.packageManager = packageManager;
  }

  /**
   * Run security audit
   */
  async runAudit(): Promise<SecurityAudit[]> {
    try {
      const command = this.packageManager === 'npm'
        ? 'npm audit --json'
        : `${this.packageManager} audit --json`;

      const { stdout } = await exec(command, { cwd: this.projectRoot });
      const auditResult = JSON.parse(stdout);

      return this.parseAuditResults(auditResult);
    } catch (error: any) {
      // npm audit returns exit code 1 when vulnerabilities are found
      if (error.stdout) {
        try {
          const auditResult = JSON.parse(error.stdout);
          return this.parseAuditResults(auditResult);
        } catch {
          return [];
        }
      }
      return [];
    }
  }

  /**
   * Check specific dependency for vulnerabilities
   */
  async checkDependency(name: string, version: string): Promise<Vulnerability[]> {
    const audits = await this.runAudit();

    for (const audit of audits) {
      if (audit.package === name) {
        return audit.vulnerabilities;
      }
    }

    return [];
  }

  /**
   * Get critical vulnerabilities
   */
  async getCriticalVulnerabilities(): Promise<SecurityAudit[]> {
    const audits = await this.runAudit();
    return audits.filter(audit =>
      audit.vulnerabilities.some(v => v.severity === 'critical')
    );
  }

  /**
   * Get fixable vulnerabilities
   */
  async getFixableVulnerabilities(): Promise<SecurityAudit[]> {
    const audits = await this.runAudit();
    return audits.filter(audit => audit.fixAvailable);
  }

  /**
   * Fix vulnerabilities automatically
   */
  async autoFix(): Promise<{ fixed: number; remaining: number }> {
    try {
      const command = this.packageManager === 'npm'
        ? 'npm audit fix'
        : this.packageManager === 'yarn'
          ? 'yarn upgrade'
          : 'pnpm update';

      await exec(command, { cwd: this.projectRoot });

      // Run audit again to see what's left
      const remaining = await this.runAudit();

      return {
        fixed: 0, // Would need before/after comparison
        remaining: remaining.reduce((sum, a) => sum + a.vulnerabilities.length, 0),
      };
    } catch (error: any) {
      throw new Error(`Failed to auto-fix vulnerabilities: ${error.message}`);
    }
  }

  /**
   * Parse audit results from package manager
   */
  private parseAuditResults(auditData: any): SecurityAudit[] {
    const audits: SecurityAudit[] = [];

    if (this.packageManager === 'npm') {
      // NPM audit format
      if (auditData.vulnerabilities) {
        for (const [packageName, vulnData] of Object.entries(auditData.vulnerabilities as any)) {
          const vuln = vulnData as any;
          const vulnerabilities: Vulnerability[] = [];

          if (vuln.via && Array.isArray(vuln.via)) {
            for (const viaItem of vuln.via) {
              if (typeof viaItem === 'object' && viaItem.title) {
                vulnerabilities.push({
                  id: viaItem.url?.split('/').pop() || 'unknown',
                  severity: this.normalizeSeverity(viaItem.severity),
                  title: viaItem.title,
                  description: viaItem.title,
                  vulnerableVersions: viaItem.range || '*',
                  patchedVersions: '>=0.0.0', // Would need to parse from advisory
                  references: viaItem.url ? [viaItem.url] : [],
                  cwe: viaItem.cwe ? [viaItem.cwe] : undefined,
                });
              }
            }
          }

          if (vulnerabilities.length > 0) {
            audits.push({
              package: packageName,
              vulnerabilities,
              fixAvailable: vuln.fixAvailable !== false,
              fixVersion: typeof vuln.fixAvailable === 'object'
                ? vuln.fixAvailable.version
                : undefined,
              requiresManualReview: vuln.fixAvailable === false,
            });
          }
        }
      }
    } else if (this.packageManager === 'yarn') {
      // Yarn audit format (simplified)
      if (auditData.advisories) {
        for (const [id, advisory] of Object.entries(auditData.advisories as any)) {
          const adv = advisory as any;
          const vulnerability: Vulnerability = {
            id: id.toString(),
            severity: this.normalizeSeverity(adv.severity),
            title: adv.title,
            description: adv.overview || adv.title,
            vulnerableVersions: adv.vulnerable_versions || '*',
            patchedVersions: adv.patched_versions || '>=0.0.0',
            references: adv.references ? [adv.references] : [],
            cwe: adv.cwe ? [adv.cwe] : undefined,
          };

          audits.push({
            package: adv.module_name,
            vulnerabilities: [vulnerability],
            fixAvailable: !!adv.patched_versions,
            fixVersion: adv.patched_versions,
            requiresManualReview: !adv.patched_versions,
          });
        }
      }
    }

    return audits;
  }

  /**
   * Normalize severity levels across package managers
   */
  private normalizeSeverity(severity: string): 'critical' | 'high' | 'moderate' | 'low' {
    const normalized = severity.toLowerCase();

    if (normalized === 'critical') return 'critical';
    if (normalized === 'high') return 'high';
    if (normalized === 'moderate' || normalized === 'medium') return 'moderate';
    return 'low';
  }

  /**
   * Check for known malicious packages
   */
  async checkForMaliciousPackages(dependencies: DependencyInfo[]): Promise<string[]> {
    // List of known malicious packages (this would ideally come from a live database)
    const knownMalicious = [
      'flatmap-stream',
      'event-stream',
      'crossenv',
      'cross-env.js',
      'd3.js',
      'fabric-js',
    ];

    const found: string[] = [];

    for (const dep of dependencies) {
      if (knownMalicious.includes(dep.name)) {
        found.push(dep.name);
      }

      // Check for typosquatting (common misspellings of popular packages)
      const typosquatPatterns = this.getTyposquatPatterns();
      for (const [legitimate, variations] of typosquatPatterns.entries()) {
        if (variations.includes(dep.name)) {
          found.push(`${dep.name} (possible typosquat of ${legitimate})`);
        }
      }
    }

    return found;
  }

  /**
   * Get common typosquat patterns
   */
  private getTyposquatPatterns(): Map<string, string[]> {
    return new Map([
      ['react', ['reakt', 'raect', 'reatc']],
      ['express', ['expres', 'expresss']],
      ['lodash', ['loadash', 'lodahs']],
      ['axios', ['axois', 'axioss']],
      ['webpack', ['webpak', 'webpackk']],
    ]);
  }

  /**
   * Generate security report
   */
  generateSecurityReport(audits: SecurityAudit[]): string {
    let report = '# Security Audit Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    const totalVulns = audits.reduce((sum, a) => sum + a.vulnerabilities.length, 0);
    const critical = audits.reduce(
      (sum, a) => sum + a.vulnerabilities.filter(v => v.severity === 'critical').length,
      0
    );
    const high = audits.reduce(
      (sum, a) => sum + a.vulnerabilities.filter(v => v.severity === 'high').length,
      0
    );
    const fixable = audits.filter(a => a.fixAvailable).length;

    report += '## Summary\n\n';
    report += `- Total Vulnerabilities: ${totalVulns}\n`;
    report += `- Critical: ${critical}\n`;
    report += `- High: ${high}\n`;
    report += `- Fixable: ${fixable}\n\n`;

    if (critical > 0) {
      report += '## Critical Vulnerabilities\n\n';
      report += '⚠️ **These should be addressed immediately!**\n\n';

      for (const audit of audits) {
        const criticalVulns = audit.vulnerabilities.filter(v => v.severity === 'critical');

        for (const vuln of criticalVulns) {
          report += `### ${audit.package}\n\n`;
          report += `- **ID**: ${vuln.id}\n`;
          report += `- **Title**: ${vuln.title}\n`;
          report += `- **Description**: ${vuln.description}\n`;
          report += `- **Vulnerable Versions**: ${vuln.vulnerableVersions}\n`;

          if (audit.fixAvailable) {
            report += `- **Fix**: Update to ${audit.fixVersion || 'latest'}\n`;
          } else {
            report += `- **Fix**: ⚠️ Manual review required\n`;
          }

          if (vuln.references.length > 0) {
            report += `- **References**: ${vuln.references.join(', ')}\n`;
          }

          report += '\n';
        }
      }
    }

    if (fixable > 0) {
      report += '## Automated Fixes Available\n\n';
      report += `Run \`npm audit fix\` or \`yarn upgrade\` to automatically fix ${fixable} vulnerabilities.\n\n`;
    }

    return report;
  }
}
