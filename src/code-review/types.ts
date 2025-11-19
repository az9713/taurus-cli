/**
 * Code Review Types
 *
 * Type definitions for AI-powered code review
 */

export type ReviewSeverity = 'critical' | 'high' | 'medium' | 'low' | 'info';

export type ReviewCategory =
  | 'style'
  | 'security'
  | 'performance'
  | 'testing'
  | 'documentation'
  | 'best-practices'
  | 'type-safety'
  | 'error-handling';

export interface ReviewFinding {
  id: string;
  severity: ReviewSeverity;
  category: ReviewCategory;
  message: string;
  file: string;
  line: number;
  column?: number;
  code?: string;
  suggestion?: string;
  autoFixable?: boolean;
  references?: string[];
}

export interface ReviewRule {
  id: string;
  name: string;
  category: ReviewCategory;
  severity: ReviewSeverity;
  enabled: boolean;
  pattern?: RegExp | string;
  message: string;
  autoFix?: (code: string) => string;
}

export interface ReviewContext {
  file: string;
  content: string;
  language: string;
  changedLines?: number[];
  fullReview?: boolean;
}

export interface ReviewResult {
  file: string;
  findings: ReviewFinding[];
  score: number; // 0-100
  summary: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    info: number;
  };
  reviewedAt: Date;
  reviewedBy: string;
}

export interface CodeReviewConfig {
  enabled: boolean;
  autoReview: boolean;
  reviewOn: Array<'pull_request' | 'commit' | 'save'>;
  checks: ReviewCategory[];
  severity: {
    blockOnCritical: boolean;
    blockOnHigh: boolean;
    warnOnMedium: boolean;
  };
  customRules?: ReviewRule[];
  excludePatterns?: string[];
  includePatterns?: string[];
}

export interface PRReviewRequest {
  prNumber: number;
  repository: string;
  baseBranch: string;
  headBranch: string;
  files: string[];
}

export interface PRReviewComment {
  file: string;
  line: number;
  body: string;
  severity: ReviewSeverity;
}

export interface SecurityVulnerability {
  type: 'sql-injection' | 'xss' | 'path-traversal' | 'command-injection' | 'insecure-crypto' | 'hardcoded-secret';
  severity: ReviewSeverity;
  file: string;
  line: number;
  description: string;
  recommendation: string;
  cwe?: string; // Common Weakness Enumeration ID
}

export interface PerformanceIssue {
  type: 'n-plus-one' | 'inefficient-loop' | 'memory-leak' | 'blocking-operation' | 'large-bundle';
  severity: ReviewSeverity;
  file: string;
  line: number;
  description: string;
  impact: string;
  suggestion: string;
}

export interface StyleViolation {
  rule: string;
  file: string;
  line: number;
  message: string;
  autoFixable: boolean;
}

export interface TestCoverageGap {
  file: string;
  function: string;
  line: number;
  reason: string;
  suggestedTest: string;
}
