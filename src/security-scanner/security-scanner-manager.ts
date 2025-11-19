/**
 * Security Scanner Manager - Main orchestrator for security scanning
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import {
  SecurityScannerManager,
  SecurityScanRequest,
  SecurityScanResult,
  Vulnerability,
  DependencyVulnerability,
  SecretFinding,
  SecurityScannerConfig,
  SecurityAuditResult,
  SecurityReport,
  ReportFormat,
  ScanSummary,
  SecurityRecommendation,
  BestPracticeCheck,
} from './types';
import { VulnerabilityDetector } from './vulnerability-detector';
import { DependencyScanner } from './dependency-scanner';
import { SecretDetector } from './secret-detector';

export class TaurusSecurityScannerManager
  extends EventEmitter
  implements SecurityScannerManager
{
  private vulnDetector: VulnerabilityDetector;
  private depScanner: DependencyScanner;
  private secretDetector: SecretDetector;

  constructor(private config: SecurityScannerConfig) {
    super();
    this.vulnDetector = new VulnerabilityDetector();
    this.depScanner = new DependencyScanner();
    this.secretDetector = new SecretDetector();
  }

  /**
   * Perform security scan
   */
  async scan(request: SecurityScanRequest): Promise<SecurityScanResult> {
    this.emit('scan:started', request);
    const startTime = Date.now();

    const vulnerabilities: Vulnerability[] = [];
    const dependencies: DependencyVulnerability[] = [];
    const secrets: SecretFinding[] = [];

    try {
      // Static analysis scan
      if (request.scanTypes.includes('static-analysis')) {
        this.emit('scan:static-analysis:started');
        for (const filePath of request.paths) {
          const fileVulns = await this.scanFile(filePath);
          vulnerabilities.push(...fileVulns);
        }
        this.emit('scan:static-analysis:completed', {
          count: vulnerabilities.length,
        });
      }

      // Dependency scan
      if (request.scanTypes.includes('dependency-scan')) {
        this.emit('scan:dependencies:started');
        const depVulns = await this.scanDependencies();
        dependencies.push(...depVulns);
        this.emit('scan:dependencies:completed', {
          count: dependencies.length,
        });
      }

      // Secret detection
      if (request.scanTypes.includes('secret-detection')) {
        this.emit('scan:secrets:started');
        const secretFindings = await this.detectSecrets(request.paths);
        secrets.push(...secretFindings);
        this.emit('scan:secrets:completed', { count: secrets.length });
      }

      // Generate summary
      const duration = Date.now() - startTime;
      const summary = this.generateSummary(
        vulnerabilities,
        dependencies,
        secrets,
        request.paths.length,
        duration
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(
        vulnerabilities,
        dependencies,
        secrets
      );

      // Generate report if configured
      const report = this.config.reporting
        ? await this.generateReport(
            {
              summary,
              vulnerabilities,
              dependencies,
              secrets,
              recommendations,
            },
            this.config.reporting.formats[0]
          )
        : undefined;

      const result: SecurityScanResult = {
        summary,
        vulnerabilities,
        dependencies,
        secrets,
        recommendations,
        report,
      };

      this.emit('scan:completed', result);
      return result;
    } catch (error) {
      this.emit('scan:failed', error);
      throw error;
    }
  }

  /**
   * Scan a single file
   */
  async scanFile(filePath: string): Promise<Vulnerability[]> {
    this.emit('file:scanning', { file: filePath });

    try {
      // Check if file should be excluded
      if (this.shouldExcludeFile(filePath)) {
        return [];
      }

      const code = fs.readFileSync(filePath, 'utf-8');
      const vulnerabilities = this.vulnDetector.detectVulnerabilities(
        code,
        filePath
      );

      // Filter by severity threshold
      const filtered = vulnerabilities.filter((v) =>
        this.meetsMinimumSeverity(v.severity)
      );

      this.emit('file:scanned', {
        file: filePath,
        count: filtered.length,
      });

      return filtered;
    } catch (error) {
      this.emit('file:error', { file: filePath, error });
      return [];
    }
  }

  /**
   * Scan dependencies
   */
  async scanDependencies(): Promise<DependencyVulnerability[]> {
    const vulnerabilities = await this.depScanner.scanDependencies();

    // Filter by severity
    return vulnerabilities.filter((v) =>
      this.meetsMinimumSeverity(v.vulnerability.severity)
    );
  }

  /**
   * Detect secrets
   */
  async detectSecrets(paths: string[]): Promise<SecretFinding[]> {
    const findings: SecretFinding[] = [];

    for (const p of paths) {
      if (fs.statSync(p).isDirectory()) {
        const dirFindings = this.secretDetector.scanDirectory(p);
        findings.push(...dirFindings);
      } else {
        const fileFindings = this.secretDetector.detectSecretsInFile(p);
        findings.push(...fileFindings);
      }
    }

    // Filter by severity
    return findings.filter((f) => this.meetsMinimumSeverity(f.severity));
  }

  /**
   * Perform security audit
   */
  async auditSecurity(): Promise<SecurityAuditResult> {
    this.emit('audit:started');

    const checks = this.performBestPracticeChecks();
    const issues = await this.scanFile('.');
    const recommendations = this.generateRecommendations(issues, [], []);

    const passedChecks = checks.filter((c) => c.passed).length;
    const score = (passedChecks / checks.length) * 100;
    const passed = score >= 70 && issues.filter((i) => i.severity === 'critical').length === 0;

    const result: SecurityAuditResult = {
      passed,
      score,
      checks,
      issues,
      recommendations,
    };

    this.emit('audit:completed', result);
    return result;
  }

  /**
   * Generate security report
   */
  async generateReport(
    result: SecurityScanResult,
    format: ReportFormat
  ): Promise<SecurityReport> {
    this.emit('report:generating', { format });

    let content: string;

    switch (format) {
      case 'json':
        content = this.generateJsonReport(result);
        break;
      case 'markdown':
        content = this.generateMarkdownReport(result);
        break;
      case 'html':
        content = this.generateHtmlReport(result);
        break;
      default:
        content = this.generateTextReport(result);
    }

    const report: SecurityReport = {
      format,
      content,
      metadata: {
        generatedAt: new Date(),
        scanDuration: result.summary.duration,
        toolVersion: '1.0.0',
        project: process.cwd(),
      },
    };

    this.emit('report:generated', report);
    return report;
  }

  /**
   * Generate scan summary
   */
  private generateSummary(
    vulnerabilities: Vulnerability[],
    dependencies: DependencyVulnerability[],
    secrets: SecretFinding[],
    filesScanned: number,
    duration: number
  ): ScanSummary {
    const allIssues = [
      ...vulnerabilities,
      ...dependencies.map((d) => ({ severity: d.vulnerability.severity })),
      ...secrets,
    ];

    const bySeverity = {
      critical: allIssues.filter((i) => i.severity === 'critical').length,
      high: allIssues.filter((i) => i.severity === 'high').length,
      medium: allIssues.filter((i) => i.severity === 'medium').length,
      low: allIssues.filter((i) => i.severity === 'low').length,
      info: allIssues.filter((i) => i.severity === 'info').length,
    };

    const byType = vulnerabilities.reduce(
      (acc, v) => {
        acc[v.type] = (acc[v.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );

    return {
      totalIssues: allIssues.length,
      bySeverity,
      byType: byType as any,
      filesScanned,
      duration,
      passed: bySeverity.critical === 0 && bySeverity.high === 0,
    };
  }

  /**
   * Generate security recommendations
   */
  private generateRecommendations(
    vulnerabilities: Vulnerability[],
    dependencies: DependencyVulnerability[],
    secrets: SecretFinding[]
  ): SecurityRecommendation[] {
    const recommendations: SecurityRecommendation[] = [];

    // Critical vulnerabilities
    const criticalVulns = vulnerabilities.filter(
      (v) => v.severity === 'critical'
    );
    if (criticalVulns.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Code Security',
        title: 'Fix Critical Vulnerabilities Immediately',
        description: `Found ${criticalVulns.length} critical security vulnerabilities in code`,
        impact: 'Critical vulnerabilities can lead to complete system compromise',
        implementation: [
          'Review each critical vulnerability',
          'Apply recommended fixes',
          'Test thoroughly after fixes',
          'Deploy security patches immediately',
        ],
        effort: 'high',
      });
    }

    // Secrets in code
    if (secrets.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Secret Management',
        title: 'Remove Hardcoded Secrets',
        description: `Found ${secrets.length} hardcoded secrets in code`,
        impact: 'Exposed secrets can lead to unauthorized access and data breaches',
        implementation: [
          'Rotate all exposed credentials immediately',
          'Move secrets to environment variables',
          'Implement secret management service',
          'Add pre-commit hooks to prevent secret commits',
        ],
        effort: 'medium',
      });
    }

    // Vulnerable dependencies
    const criticalDeps = dependencies.filter(
      (d) => d.vulnerability.severity === 'critical'
    );
    if (criticalDeps.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Dependency Management',
        title: 'Update Vulnerable Dependencies',
        description: `Found ${criticalDeps.length} dependencies with critical vulnerabilities`,
        impact:
          'Vulnerable dependencies can be exploited to compromise the application',
        implementation: [
          'Update all dependencies to latest secure versions',
          'Review breaking changes before updating',
          'Run tests after updates',
          'Implement automated dependency scanning',
        ],
        effort: 'medium',
      });
    }

    // SQL Injection
    const sqlInjection = vulnerabilities.filter(
      (v) => v.type === 'sql-injection'
    );
    if (sqlInjection.length > 0) {
      recommendations.push({
        priority: 'critical',
        category: 'Injection Prevention',
        title: 'Prevent SQL Injection',
        description: `Found ${sqlInjection.length} potential SQL injection vulnerabilities`,
        impact: 'SQL injection can lead to data theft, modification, or deletion',
        implementation: [
          'Use parameterized queries for all database operations',
          'Implement input validation',
          'Use ORM with built-in protections',
          'Apply principle of least privilege to database users',
        ],
        effort: 'medium',
      });
    }

    // XSS
    const xss = vulnerabilities.filter((v) => v.type === 'xss');
    if (xss.length > 0) {
      recommendations.push({
        priority: 'high',
        category: 'XSS Prevention',
        title: 'Prevent Cross-Site Scripting',
        description: `Found ${xss.length} potential XSS vulnerabilities`,
        impact: 'XSS can lead to session hijacking and user data theft',
        implementation: [
          'Sanitize all user input before rendering',
          'Implement Content Security Policy',
          'Use framework auto-escaping features',
          'Validate and encode output based on context',
        ],
        effort: 'medium',
      });
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Perform best practice checks
   */
  private performBestPracticeChecks(): BestPracticeCheck[] {
    const checks: BestPracticeCheck[] = [];

    // Check for package.json
    const hasPackageJson = fs.existsSync('package.json');
    checks.push({
      id: 'package-json',
      name: 'Package.json exists',
      category: 'Project Setup',
      passed: hasPackageJson,
      severity: 'medium',
      description: 'Project should have package.json for dependency management',
      recommendation: hasPackageJson ? undefined : 'Initialize npm project',
    });

    // Check for .gitignore
    const hasGitignore = fs.existsSync('.gitignore');
    checks.push({
      id: 'gitignore',
      name: 'Gitignore file exists',
      category: 'Version Control',
      passed: hasGitignore,
      severity: 'low',
      description: 'Should have .gitignore to exclude sensitive files',
      recommendation: hasGitignore
        ? undefined
        : 'Create .gitignore file to exclude node_modules, .env, etc.',
    });

    // Check for .env.example
    const hasEnvExample = fs.existsSync('.env.example');
    checks.push({
      id: 'env-example',
      name: 'Environment template exists',
      category: 'Configuration',
      passed: hasEnvExample,
      severity: 'low',
      description: 'Should have .env.example to document required variables',
      recommendation: hasEnvExample
        ? undefined
        : 'Create .env.example to document environment variables',
    });

    return checks;
  }

  /**
   * Check if file should be excluded
   */
  private shouldExcludeFile(filePath: string): boolean {
    const excludePatterns = this.config.staticAnalysis.excludePatterns || [
      'node_modules',
      'dist',
      'build',
      '.test.',
      '.spec.',
    ];

    return excludePatterns.some((pattern) => filePath.includes(pattern));
  }

  /**
   * Check if severity meets minimum threshold
   */
  private meetsMinimumSeverity(severity: string): boolean {
    const severityLevels = ['info', 'low', 'medium', 'high', 'critical'];
    const minLevel = severityLevels.indexOf(this.config.severity.minimum);
    const issueLevel = severityLevels.indexOf(severity);

    return issueLevel >= minLevel;
  }

  /**
   * Generate JSON report
   */
  private generateJsonReport(result: SecurityScanResult): string {
    return JSON.stringify(result, null, 2);
  }

  /**
   * Generate Markdown report
   */
  private generateMarkdownReport(result: SecurityScanResult): string {
    const lines: string[] = [];

    lines.push('# Security Scan Report\n');
    lines.push(`**Generated:** ${new Date().toISOString()}\n`);

    lines.push('## Summary\n');
    lines.push(`- **Total Issues:** ${result.summary.totalIssues}`);
    lines.push(`- **Files Scanned:** ${result.summary.filesScanned}`);
    lines.push(`- **Duration:** ${result.summary.duration}ms`);
    lines.push(`- **Status:** ${result.summary.passed ? '✅ PASSED' : '❌ FAILED'}\n`);

    lines.push('### Issues by Severity\n');
    lines.push(`- Critical: ${result.summary.bySeverity.critical}`);
    lines.push(`- High: ${result.summary.bySeverity.high}`);
    lines.push(`- Medium: ${result.summary.bySeverity.medium}`);
    lines.push(`- Low: ${result.summary.bySeverity.low}\n`);

    if (result.vulnerabilities.length > 0) {
      lines.push('## Vulnerabilities\n');
      for (const vuln of result.vulnerabilities) {
        lines.push(`### ${vuln.title}`);
        lines.push(`**Severity:** ${vuln.severity.toUpperCase()}`);
        lines.push(`**File:** ${vuln.file}:${vuln.location.startLine}`);
        lines.push(`**Description:** ${vuln.description}`);
        lines.push(`**Remediation:** ${vuln.remediation.description}\n`);
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate HTML report
   */
  private generateHtmlReport(result: SecurityScanResult): string {
    return `<!DOCTYPE html>
<html>
<head>
  <title>Security Scan Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 5px; }
    .vulnerability { border-left: 3px solid #dc3545; padding: 10px; margin: 10px 0; }
    .critical { border-color: #dc3545; }
    .high { border-color: #fd7e14; }
    .medium { border-color: #ffc107; }
    .low { border-color: #6c757d; }
  </style>
</head>
<body>
  <h1>Security Scan Report</h1>
  <div class="summary">
    <h2>Summary</h2>
    <p>Total Issues: ${result.summary.totalIssues}</p>
    <p>Status: ${result.summary.passed ? 'PASSED' : 'FAILED'}</p>
  </div>
  <!-- More HTML content -->
</body>
</html>`;
  }

  /**
   * Generate text report
   */
  private generateTextReport(result: SecurityScanResult): string {
    const lines: string[] = [];

    lines.push('Security Scan Report');
    lines.push('===================\n');

    lines.push(`Total Issues: ${result.summary.totalIssues}`);
    lines.push(`Files Scanned: ${result.summary.filesScanned}`);
    lines.push(`Status: ${result.summary.passed ? 'PASSED' : 'FAILED'}\n`);

    return lines.join('\n');
  }
}
