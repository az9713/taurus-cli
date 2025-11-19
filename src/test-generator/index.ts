/**
 * Test Generator - Automatic test generation and coverage analysis
 */

export { TaurusTestGeneratorManager } from './test-generator-manager';
export { TestAnalyzer } from './test-analyzer';
export { TestCaseGenerator } from './test-case-generator';
export { CoverageAnalyzer } from './coverage-analyzer';

export type {
  TestGeneratorConfig,
  TestGeneratorManager,
  TestFramework,
  TestType,
  TestGenerationRequest,
  TestGenerationResult,
  GeneratedTestCase,
  CodeElement,
  CoverageAnalysisRequest,
  CoverageAnalysisResult,
  CoverageMetrics,
  CoverageGap,
  CoverageSuggestion,
  TestQualityAnalysis,
  TestQualityIssue,
  CoverageReport,
} from './types';
