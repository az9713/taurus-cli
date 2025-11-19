/**
 * License Checker
 *
 * Checks dependency licenses for compliance
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { LicenseType, LicensePolicy, DependencyInfo } from './types.js';

const exec = promisify(execCallback);

export class LicenseChecker {
  private policy: LicensePolicy;

  constructor(policy: LicensePolicy) {
    this.policy = policy;
  }

  /**
   * Check all dependencies for license compliance
   */
  async checkCompliance(dependencies: DependencyInfo[]): Promise<{
    compliant: DependencyInfo[];
    violations: DependencyInfo[];
    warnings: DependencyInfo[];
  }> {
    const compliant: DependencyInfo[] = [];
    const violations: DependencyInfo[] = [];
    const warnings: DependencyInfo[] = [];

    for (const dep of dependencies) {
      const status = this.checkLicense(dep.license);

      if (status === 'allowed') {
        compliant.push(dep);
      } else if (status === 'blocked') {
        violations.push(dep);
      } else {
        warnings.push(dep);
      }
    }

    return { compliant, violations, warnings };
  }

  /**
   * Check single license
   */
  private checkLicense(license: LicenseType): 'allowed' | 'blocked' | 'unknown' {
    // Check if blocked
    if (this.policy.blockedLicenses.includes(license)) {
      return 'blocked';
    }

    // Check if allowed
    if (this.policy.allowedLicenses.includes(license)) {
      return 'allowed';
    }

    // Check if unknown and policy says to warn
    if (license === 'UNKNOWN' && this.policy.warnOnUnknown) {
      return 'unknown';
    }

    return 'unknown';
  }

  /**
   * Get license for package
   */
  async getPackageLicense(packageName: string): Promise<LicenseType> {
    try {
      const { stdout } = await exec(`npm view ${packageName} license`);
      return this.normalizeLicense(stdout.trim());
    } catch (error) {
      return 'UNKNOWN';
    }
  }

  /**
   * Normalize license string to LicenseType
   */
  private normalizeLicense(license: string): LicenseType {
    const normalized = license.toUpperCase().replace(/[^A-Z0-9.-]/g, '');

    const mapping: Record<string, LicenseType> = {
      'MIT': 'MIT',
      'APACHE-2.0': 'Apache-2.0',
      'APACHE2.0': 'Apache-2.0',
      'BSD-2-CLAUSE': 'BSD-2-Clause',
      'BSD-3-CLAUSE': 'BSD-3-Clause',
      'GPL-2.0': 'GPL-2.0',
      'GPL-3.0': 'GPL-3.0',
      'LGPL-2.1': 'LGPL-2.1',
      'LGPL-3.0': 'LGPL-3.0',
      'ISC': 'ISC',
      'MPL-2.0': 'MPL-2.0',
      'UNLICENSED': 'UNLICENSED',
    };

    return mapping[normalized] || 'UNKNOWN';
  }

  /**
   * Generate license report
   */
  generateLicenseReport(dependencies: DependencyInfo[]): string {
    let report = '# License Compliance Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Group by license
    const byLicense = new Map<LicenseType, DependencyInfo[]>();

    for (const dep of dependencies) {
      if (!byLicense.has(dep.license)) {
        byLicense.set(dep.license, []);
      }
      byLicense.get(dep.license)!.push(dep);
    }

    // Summary
    report += '## Summary\n\n';
    report += `- Total Dependencies: ${dependencies.length}\n`;
    report += `- Unique Licenses: ${byLicense.size}\n\n`;

    // List by license
    report += '## Dependencies by License\n\n';

    for (const [license, deps] of byLicense.entries()) {
      const status = this.checkLicense(license);
      const icon = status === 'allowed' ? '✅' : status === 'blocked' ? '❌' : '⚠️';

      report += `### ${icon} ${license} (${deps.length} packages)\n\n`;

      if (status === 'blocked') {
        report += '**⚠️ This license is blocked by policy!**\n\n';
      } else if (status === 'unknown') {
        report += '**⚠️ This license requires review**\n\n';
      }

      for (const dep of deps) {
        report += `- ${dep.name}@${dep.currentVersion}\n`;
      }

      report += '\n';
    }

    // Attribution requirements
    if (this.policy.requireAttribution) {
      report += '## Attribution Requirements\n\n';
      report += 'The following licenses require attribution:\n\n';

      const attributionRequired = ['MIT', 'Apache-2.0', 'BSD-2-Clause', 'BSD-3-Clause'];

      for (const license of attributionRequired) {
        const deps = byLicense.get(license as LicenseType);
        if (deps && deps.length > 0) {
          report += `### ${license}\n\n`;
          for (const dep of deps) {
            report += `- ${dep.name}@${dep.currentVersion}\n`;
          }
          report += '\n';
        }
      }
    }

    return report;
  }

  /**
   * Check if license allows commercial use
   */
  isCommercialUseAllowed(license: LicenseType): boolean {
    const commercialFriendly: LicenseType[] = [
      'MIT',
      'Apache-2.0',
      'BSD-2-Clause',
      'BSD-3-Clause',
      'ISC',
    ];

    return commercialFriendly.includes(license);
  }

  /**
   * Check if license is copyleft
   */
  isCopyleft(license: LicenseType): boolean {
    const copyleft: LicenseType[] = [
      'GPL-2.0',
      'GPL-3.0',
      'LGPL-2.1',
      'LGPL-3.0',
      'MPL-2.0',
    ];

    return copyleft.includes(license);
  }

  /**
   * Get license compatibility matrix
   */
  checkCompatibility(license1: LicenseType, license2: LicenseType): boolean {
    // Simplified compatibility check
    // In reality, this is more complex

    // MIT is compatible with everything
    if (license1 === 'MIT' || license2 === 'MIT') {
      return true;
    }

    // GPL is not compatible with most others
    if ((license1.startsWith('GPL') && !license2.startsWith('GPL')) ||
        (license2.startsWith('GPL') && !license1.startsWith('GPL'))) {
      return false;
    }

    // Default to compatible
    return true;
  }
}
