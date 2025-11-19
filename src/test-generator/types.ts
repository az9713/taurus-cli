/**
 * Types for Test Generation & Coverage Analysis
 */

import { EventEmitter } from 'events';

/**
 * Supported testing frameworks
 */
export type TestFramework =
  | 'jest'
  | 'mocha'
  | 'vitest'
  | 'pytest'
  | 'unittest'
  | 'junit'
  | 'testng'
  | 'go-test'
  | 'rust-test'
  | 'rspec';

/**
 * Test type categories
 */
export type TestType =
  | 'unit'
  | 'integration'
  | 'e2e'
  | 'functional'
  | 'performance'
  | 'security'
  | 'snapshot';

/**
 * Code element types that can be tested
 */
export type CodeElementType =
  | 'function'
  | 'class'
  | 'method'
  | 'component'
  | 'hook'
  | 'api-endpoint'
  | 'module';

/**
 * Configuration for test generation
 */
export interface TestGeneratorConfig {
  enabled: boolean;
  framework: TestFramework;
  testTypes: TestType[];
  coverage: CoverageConfig;
  generation: GenerationConfig;
  quality: QualityConfig;
}

/**
 * Coverage analysis configuration
 */
export interface CoverageConfig {
  enabled: boolean;
  threshold: CoverageThreshold;
  reportFormats: CoverageReportFormat[];
  includeUntested: boolean;
  trackBranches: boolean;
}

/**
 * Coverage thresholds
 */
export interface CoverageThreshold {
  statements: number; // Percentage (0-100)
  branches: number;
  functions: number;
  lines: number;
}

/**
 * Coverage report formats
 */
export type CoverageReportFormat =
  | 'text'
  | 'html'
  | 'json'
  | 'lcov'
  | 'cobertura'
  | 'clover';

/**
 * Test generation configuration
 */
export interface GenerationConfig {
  generateMocks: boolean;
  generateFixtures: boolean;
  generateHelpers: boolean;
  edgeCases: boolean;
  errorCases: boolean;
  asyncTests: boolean;
}

/**
 * Test quality configuration
 */
export interface QualityConfig {
  minAssertions: number;
  requireDescriptions: boolean;
  isolateTests: boolean;
  deterministicTests: boolean;
}

/**
 * Request to generate tests
 */
export interface TestGenerationRequest {
  sourceFile: string;
  sourceCode?: string;
  framework: TestFramework;
  testTypes: TestType[];
  options?: TestGenerationOptions;
}

/**
 * Options for test generation
 */
export interface TestGenerationOptions {
  outputFile?: string;
  includeSetup?: boolean;
  includeTeardown?: boolean;
  mockExternal?: boolean;
  coverageTarget?: number;
  customTemplates?: string;
}

/**
 * Result of test generation
 */
export interface TestGenerationResult {
  success: boolean;
  testFile: string;
  testCode: string;
  testCases: GeneratedTestCase[];
  coverage: ExpectedCoverage;
  warnings: string[];
  suggestions: string[];
}

/**
 * Individual generated test case
 */
export interface GeneratedTestCase {
  name: string;
  description: string;
  type: TestType;
  code: string;
  target: CodeElement;
  assertions: TestAssertion[];
  mocks: MockDefinition[];
  setup?: string;
  teardown?: string;
}

/**
 * Code element being tested
 */
export interface CodeElement {
  type: CodeElementType;
  name: string;
  signature?: string;
  location: CodeLocation;
  complexity: number;
  dependencies: string[];
}

/**
 * Location in source code
 */
export interface CodeLocation {
  file: string;
  startLine: number;
  endLine: number;
  startColumn?: number;
  endColumn?: number;
}

/**
 * Test assertion
 */
export interface TestAssertion {
  type: AssertionType;
  actual: string;
  expected: string;
  message?: string;
}

/**
 * Types of assertions
 */
export type AssertionType =
  | 'equals'
  | 'deep-equals'
  | 'not-equals'
  | 'truthy'
  | 'falsy'
  | 'throws'
  | 'resolves'
  | 'rejects'
  | 'contains'
  | 'matches';

/**
 * Mock definition
 */
export interface MockDefinition {
  target: string;
  type: MockType;
  implementation?: string;
  returnValue?: string;
  throws?: string;
}

/**
 * Types of mocks
 */
export type MockType = 'function' | 'class' | 'module' | 'api' | 'database';

/**
 * Expected coverage from generated tests
 */
export interface ExpectedCoverage {
  statements: number;
  branches: number;
  functions: number;
  lines: number;
  uncoveredLines: number[];
}

/**
 * Coverage analysis request
 */
export interface CoverageAnalysisRequest {
  sourceFiles: string[];
  testFiles: string[];
  framework: TestFramework;
  options?: CoverageAnalysisOptions;
}

/**
 * Coverage analysis options
 */
export interface CoverageAnalysisOptions {
  runTests?: boolean;
  includeReport?: boolean;
  reportFormat?: CoverageReportFormat[];
  outputDir?: string;
}

/**
 * Coverage analysis result
 */
export interface CoverageAnalysisResult {
  overall: CoverageMetrics;
  byFile: Map<string, FileCoverage>;
  gaps: CoverageGap[];
  report?: CoverageReport;
  suggestions: CoverageSuggestion[];
}

/**
 * Coverage metrics
 */
export interface CoverageMetrics {
  statements: CoverageMetric;
  branches: CoverageMetric;
  functions: CoverageMetric;
  lines: CoverageMetric;
}

/**
 * Individual coverage metric
 */
export interface CoverageMetric {
  total: number;
  covered: number;
  percentage: number;
}

/**
 * Coverage for a single file
 */
export interface FileCoverage {
  file: string;
  metrics: CoverageMetrics;
  uncoveredLines: number[];
  uncoveredBranches: BranchCoverage[];
  uncoveredFunctions: string[];
}

/**
 * Branch coverage information
 */
export interface BranchCoverage {
  line: number;
  branch: number;
  covered: boolean;
  condition?: string;
}

/**
 * Coverage gap (untested code)
 */
export interface CoverageGap {
  file: string;
  element: CodeElement;
  severity: 'critical' | 'high' | 'medium' | 'low';
  reason: string;
  suggestedTests: string[];
}

/**
 * Coverage report
 */
export interface CoverageReport {
  format: CoverageReportFormat;
  content: string;
  outputPath?: string;
}

/**
 * Suggestion to improve coverage
 */
export interface CoverageSuggestion {
  type: 'missing-test' | 'weak-test' | 'untested-branch' | 'untested-error';
  priority: 'high' | 'medium' | 'low';
  file: string;
  location: CodeLocation;
  description: string;
  suggestedTest: string;
}

/**
 * Test quality analysis
 */
export interface TestQualityAnalysis {
  score: number; // 0-100
  testCount: number;
  issues: TestQualityIssue[];
  strengths: string[];
  recommendations: string[];
}

/**
 * Test quality issue
 */
export interface TestQualityIssue {
  type: TestQualityIssueType;
  severity: 'error' | 'warning' | 'info';
  test: string;
  location: CodeLocation;
  description: string;
  fix?: string;
}

/**
 * Types of test quality issues
 */
export type TestQualityIssueType =
  | 'no-assertions'
  | 'weak-assertions'
  | 'flaky-test'
  | 'slow-test'
  | 'duplicate-test'
  | 'incomplete-setup'
  | 'missing-cleanup'
  | 'poor-naming';

/**
 * Base manager interface
 */
export interface TestGeneratorManager extends EventEmitter {
  generateTests(request: TestGenerationRequest): Promise<TestGenerationResult>;
  analyzeCoverage(
    request: CoverageAnalysisRequest
  ): Promise<CoverageAnalysisResult>;
  analyzeTestQuality(testFiles: string[]): Promise<TestQualityAnalysis>;
  suggestMissingTests(sourceFile: string): Promise<CoverageGap[]>;
}
