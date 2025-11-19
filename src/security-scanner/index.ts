/**
 * Security Scanner - Vulnerability detection and security auditing
 */

export { TaurusSecurityScannerManager } from './security-scanner-manager';
export { VulnerabilityDetector } from './vulnerability-detector';
export { DependencyScanner } from './dependency-scanner';
export { SecretDetector } from './secret-detector';

export type {
  SecurityScannerConfig,
  SecurityScannerManager,
  SecurityScanRequest,
  SecurityScanResult,
  Vulnerability,
  VulnerabilityType,
  VulnerabilitySeverity,
  DependencyVulnerability,
  SecretFinding,
  SecretType,
  SecurityRecommendation,
  SecurityReport,
  SecurityAuditResult,
  OWASPCategory,
  ScanSummary,
} from './types';
