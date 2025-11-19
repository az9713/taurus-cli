/**
 * Types for Security Vulnerability Scanner
 */

import { EventEmitter } from 'events';

/**
 * Security vulnerability severity levels
 */
export type VulnerabilitySeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

/**
 * Types of security vulnerabilities
 */
export type VulnerabilityType =
  | 'sql-injection'
  | 'xss'
  | 'command-injection'
  | 'path-traversal'
  | 'insecure-deserialization'
  | 'xxe'
  | 'ssrf'
  | 'open-redirect'
  | 'csrf'
  | 'broken-auth'
  | 'sensitive-data-exposure'
  | 'broken-access-control'
  | 'security-misconfiguration'
  | 'insecure-dependencies'
  | 'hardcoded-secrets'
  | 'weak-crypto'
  | 'mass-assignment'
  | 'buffer-overflow'
  | 'race-condition';

/**
 * OWASP Top 10 categories
 */
export type OWASPCategory =
  | 'A01-broken-access-control'
  | 'A02-cryptographic-failures'
  | 'A03-injection'
  | 'A04-insecure-design'
  | 'A05-security-misconfiguration'
  | 'A06-vulnerable-components'
  | 'A07-identification-auth-failures'
  | 'A08-software-data-integrity'
  | 'A09-security-logging-monitoring'
  | 'A10-ssrf';

/**
 * Configuration for security scanner
 */
export interface SecurityScannerConfig {
  enabled: boolean;
  scanTypes: ScanType[];
  severity: {
    minimum: VulnerabilitySeverity;
    failOnSeverity: VulnerabilitySeverity[];
  };
  staticAnalysis: StaticAnalysisConfig;
  dependencyScanning: DependencyScanningConfig;
  secretDetection: SecretDetectionConfig;
  reporting: ReportingConfig;
}

/**
 * Types of security scans
 */
export type ScanType =
  | 'static-analysis'
  | 'dependency-scan'
  | 'secret-detection'
  | 'configuration-audit'
  | 'best-practices';

/**
 * Static analysis configuration
 */
export interface StaticAnalysisConfig {
  enabled: boolean;
  rules: SecurityRule[];
  customRules?: string[];
  excludePatterns?: string[];
}

/**
 * Security rule definition
 */
export interface SecurityRule {
  id: string;
  name: string;
  type: VulnerabilityType;
  severity: VulnerabilitySeverity;
  pattern: RegExp | string;
  description: string;
  remediation: string;
  owaspCategory?: OWASPCategory;
}

/**
 * Dependency scanning configuration
 */
export interface DependencyScanningConfig {
  enabled: boolean;
  sources: DependencySource[];
  autoUpdate: boolean;
  excludePackages?: string[];
}

/**
 * Dependency vulnerability sources
 */
export type DependencySource = 'npm-audit' | 'snyk' | 'osv' | 'github-advisory';

/**
 * Secret detection configuration
 */
export interface SecretDetectionConfig {
  enabled: boolean;
  patterns: SecretPattern[];
  excludeFiles?: string[];
}

/**
 * Secret pattern definition
 */
export interface SecretPattern {
  name: string;
  pattern: RegExp;
  severity: VulnerabilitySeverity;
}

/**
 * Reporting configuration
 */
export interface ReportingConfig {
  formats: ReportFormat[];
  outputDir: string;
  includeRemediation: boolean;
  groupBy: 'severity' | 'type' | 'file';
}

/**
 * Report formats
 */
export type ReportFormat = 'json' | 'html' | 'markdown' | 'sarif' | 'csv';

/**
 * Security scan request
 */
export interface SecurityScanRequest {
  paths: string[];
  scanTypes: ScanType[];
  options?: SecurityScanOptions;
}

/**
 * Security scan options
 */
export interface SecurityScanOptions {
  includeTests?: boolean;
  excludePatterns?: string[];
  severity?: VulnerabilitySeverity;
  failFast?: boolean;
}

/**
 * Security scan result
 */
export interface SecurityScanResult {
  summary: ScanSummary;
  vulnerabilities: Vulnerability[];
  dependencies: DependencyVulnerability[];
  secrets: SecretFinding[];
  recommendations: SecurityRecommendation[];
  report?: SecurityReport;
}

/**
 * Scan summary
 */
export interface ScanSummary {
  totalIssues: number;
  bySeverity: Record<VulnerabilitySeverity, number>;
  byType: Record<VulnerabilityType, number>;
  filesScanned: number;
  duration: number;
  passed: boolean;
}

/**
 * Vulnerability finding
 */
export interface Vulnerability {
  id: string;
  type: VulnerabilityType;
  severity: VulnerabilitySeverity;
  title: string;
  description: string;
  file: string;
  location: VulnerabilityLocation;
  code: CodeSnippet;
  cwe?: string;
  owaspCategory?: OWASPCategory;
  remediation: RemediationAdvice;
  references: string[];
}

/**
 * Location of vulnerability
 */
export interface VulnerabilityLocation {
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
  function?: string;
}

/**
 * Code snippet
 */
export interface CodeSnippet {
  source: string;
  highlight: string;
  context: string[];
}

/**
 * Remediation advice
 */
export interface RemediationAdvice {
  description: string;
  steps: string[];
  fixedCode?: string;
  effort: 'low' | 'medium' | 'high';
  references: string[];
}

/**
 * Dependency vulnerability
 */
export interface DependencyVulnerability {
  package: string;
  version: string;
  vulnerability: {
    id: string;
    title: string;
    description: string;
    severity: VulnerabilitySeverity;
    cvss?: number;
    cve?: string;
  };
  fixedIn?: string;
  patchAvailable: boolean;
  remediation: string;
}

/**
 * Secret finding
 */
export interface SecretFinding {
  type: SecretType;
  file: string;
  line: number;
  match: string;
  severity: VulnerabilitySeverity;
  masked: string;
  remediation: string;
}

/**
 * Types of secrets
 */
export type SecretType =
  | 'api-key'
  | 'password'
  | 'token'
  | 'private-key'
  | 'certificate'
  | 'connection-string'
  | 'aws-key'
  | 'github-token'
  | 'stripe-key'
  | 'generic-secret';

/**
 * Security recommendation
 */
export interface SecurityRecommendation {
  priority: 'critical' | 'high' | 'medium' | 'low';
  category: string;
  title: string;
  description: string;
  impact: string;
  implementation: string[];
  effort: 'low' | 'medium' | 'high';
}

/**
 * Security report
 */
export interface SecurityReport {
  format: ReportFormat;
  content: string;
  outputPath?: string;
  metadata: ReportMetadata;
}

/**
 * Report metadata
 */
export interface ReportMetadata {
  generatedAt: Date;
  scanDuration: number;
  toolVersion: string;
  project: string;
  branch?: string;
  commit?: string;
}

/**
 * Dependency information
 */
export interface Dependency {
  name: string;
  version: string;
  type: 'direct' | 'transitive';
  license?: string;
  vulnerabilities: DependencyVulnerability[];
}

/**
 * Best practices check
 */
export interface BestPracticeCheck {
  id: string;
  name: string;
  category: string;
  passed: boolean;
  severity: VulnerabilitySeverity;
  description: string;
  recommendation?: string;
}

/**
 * Security audit result
 */
export interface SecurityAuditResult {
  passed: boolean;
  score: number; // 0-100
  checks: BestPracticeCheck[];
  issues: Vulnerability[];
  recommendations: SecurityRecommendation[];
}

/**
 * Base manager interface
 */
export interface SecurityScannerManager extends EventEmitter {
  scan(request: SecurityScanRequest): Promise<SecurityScanResult>;
  scanFile(filePath: string): Promise<Vulnerability[]>;
  scanDependencies(): Promise<DependencyVulnerability[]>;
  detectSecrets(paths: string[]): Promise<SecretFinding[]>;
  auditSecurity(): Promise<SecurityAuditResult>;
  generateReport(
    result: SecurityScanResult,
    format: ReportFormat
  ): Promise<SecurityReport>;
}

/**
 * Vulnerability database entry
 */
export interface VulnerabilityDBEntry {
  id: string;
  type: VulnerabilityType;
  pattern: string | RegExp;
  description: string;
  severity: VulnerabilitySeverity;
  cwe: string;
  owaspCategory: OWASPCategory;
  examples: string[];
  remediation: string[];
}
