/**
 * Dependency Manager Types
 *
 * Type definitions for intelligent dependency management
 */

export type UpdatePolicy = 'immediately' | 'daily' | 'weekly' | 'monthly' | 'manual';

export type LicenseType =
  | 'MIT'
  | 'Apache-2.0'
  | 'BSD-2-Clause'
  | 'BSD-3-Clause'
  | 'GPL-2.0'
  | 'GPL-3.0'
  | 'LGPL-2.1'
  | 'LGPL-3.0'
  | 'ISC'
  | 'MPL-2.0'
  | 'UNLICENSED'
  | 'UNKNOWN';

export interface PackageInfo {
  name: string;
  version: string;
  description?: string;
  license?: LicenseType;
  repository?: string;
  homepage?: string;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

export interface DependencyInfo {
  name: string;
  currentVersion: string;
  latestVersion: string;
  wantedVersion: string;
  isOutdated: boolean;
  updateType: 'major' | 'minor' | 'patch' | 'none';
  license: LicenseType;
  vulnerabilities: Vulnerability[];
  usedIn: string[]; // Files that import this dependency
}

export interface Vulnerability {
  id: string; // CVE ID or npm advisory ID
  severity: 'critical' | 'high' | 'moderate' | 'low';
  title: string;
  description: string;
  vulnerableVersions: string;
  patchedVersions: string;
  references: string[];
  cwe?: string[];
}

export interface UpdateAnalysis {
  package: string;
  from: string;
  to: string;
  updateType: 'major' | 'minor' | 'patch';
  breakingChanges: BreakingChange[];
  filesAffected: number;
  estimatedImpact: 'low' | 'medium' | 'high';
  recommendation: 'safe' | 'review' | 'risky';
  changelog?: string;
  migrationGuide?: string;
}

export interface BreakingChange {
  type: 'api' | 'behavior' | 'deprecation' | 'removal';
  description: string;
  affectedCode: string[];
  migrationSteps?: string[];
}

export interface LicensePolicy {
  allowedLicenses: LicenseType[];
  blockedLicenses: LicenseType[];
  requireAttribution: boolean;
  warnOnUnknown: boolean;
}

export interface DependencyManagerConfig {
  enabled: boolean;
  packageManager: 'npm' | 'yarn' | 'pnpm';
  autoUpdate: {
    security: UpdatePolicy;
    patch: UpdatePolicy;
    minor: UpdatePolicy;
    major: UpdatePolicy;
  };
  policies: {
    licensePolicy: LicensePolicy;
    blockedPackages: string[];
    maxDependencyAge?: number; // days
  };
  optimization: {
    bundleSizeLimit?: number; // KB
    suggestAlternatives: boolean;
    detectUnused: boolean;
    treeShaking: boolean;
  };
  notifications: {
    slack?: boolean;
    email?: boolean;
    github?: boolean;
  };
}

export interface BundleAnalysis {
  package: string;
  size: number; // bytes
  gzipSize: number;
  treeshakeable: boolean;
  sideEffects: boolean;
  alternatives: PackageAlternative[];
}

export interface PackageAlternative {
  name: string;
  size: number;
  popularityScore: number;
  maintenanceScore: number;
  qualityScore: number;
  description: string;
  pros: string[];
  cons: string[];
}

export interface UnusedDependency {
  name: string;
  version: string;
  reason: 'not-imported' | 'only-in-types' | 'dev-in-prod';
  recommendation: 'remove' | 'move-to-dev' | 'review';
}

export interface DependencyTree {
  name: string;
  version: string;
  dependencies: Map<string, DependencyTree>;
  depth: number;
  duplicates?: string[];
}

export interface SecurityAudit {
  package: string;
  vulnerabilities: Vulnerability[];
  fixAvailable: boolean;
  fixVersion?: string;
  requiresManualReview: boolean;
}

export interface UpdateReport {
  timestamp: Date;
  packagesChecked: number;
  updatesAvailable: number;
  securityUpdates: number;
  breakingUpdates: number;
  safeUpdates: number;
  updates: UpdateAnalysis[];
  securityAudits: SecurityAudit[];
}
