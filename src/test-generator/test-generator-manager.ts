/**
 * Test Generator Manager - Main orchestrator for test generation and coverage
 */

import { EventEmitter } from 'events';
import * as fs from 'fs';
import * as path from 'path';
import { ClaudeClient } from '../api/claude.js';
import {
  TestGeneratorManager,
  TestGenerationRequest,
  TestGenerationResult,
  CoverageAnalysisRequest,
  CoverageAnalysisResult,
  TestQualityAnalysis,
  CoverageGap,
  TestGeneratorConfig,
  ExpectedCoverage,
} from './types';
import { TestAnalyzer } from './test-analyzer';
import { TestCaseGenerator } from './test-case-generator';
import { CoverageAnalyzer } from './coverage-analyzer';

export class TaurusTestGeneratorManager
  extends EventEmitter
  implements TestGeneratorManager
{
  private analyzer: TestAnalyzer;
  private generator: TestCaseGenerator;
  private coverageAnalyzer: CoverageAnalyzer;

  constructor(
    private config: TestGeneratorConfig,
    private client: ClaudeClient
  ) {
    super();
    this.analyzer = new TestAnalyzer();
    this.generator = new TestCaseGenerator(client);
    this.coverageAnalyzer = new CoverageAnalyzer(this.analyzer);
  }

  /**
   * Generate tests for source code
   */
  async generateTests(
    request: TestGenerationRequest
  ): Promise<TestGenerationResult> {
    this.emit('generation:started', request);

    try {
      // Read source code if not provided
      const sourceCode =
        request.sourceCode || fs.readFileSync(request.sourceFile, 'utf-8');

      // Analyze code to find testable elements
      this.emit('analysis:started');
      const elements = this.analyzer.analyzeCode(
        sourceCode,
        request.sourceFile
      );
      this.emit('analysis:completed', { elementCount: elements.length });

      // Generate test cases for each element
      const allTestCases = [];
      for (const element of elements) {
        this.emit('test:generating', { element: element.name });

        const testCases = await this.generator.generateTestCases(
          element,
          sourceCode,
          request.framework,
          request.testTypes,
          request.options || {}
        );

        allTestCases.push(...testCases);
        this.emit('test:generated', { element: element.name, count: testCases.length });
      }

      // Generate complete test file
      const testCode = await this.generator.generateTestFile(
        allTestCases,
        request.framework,
        request.sourceFile
      );

      // Calculate expected coverage
      const expectedCoverage = this.calculateExpectedCoverage(
        allTestCases,
        sourceCode
      );

      // Determine output file
      const testFile =
        request.options?.outputFile ||
        this.generateTestFileName(request.sourceFile, request.framework);

      // Write test file
      if (!request.options?.outputFile) {
        fs.writeFileSync(testFile, testCode);
      }

      const result: TestGenerationResult = {
        success: true,
        testFile,
        testCode,
        testCases: allTestCases,
        coverage: expectedCoverage,
        warnings: [],
        suggestions: this.generateSuggestions(allTestCases),
      };

      this.emit('generation:completed', result);
      return result;
    } catch (error) {
      this.emit('generation:failed', error);
      throw error;
    }
  }

  /**
   * Analyze test coverage
   */
  async analyzeCoverage(
    request: CoverageAnalysisRequest
  ): Promise<CoverageAnalysisResult> {
    this.emit('coverage:started', request);

    try {
      const result = await this.coverageAnalyzer.analyzeCoverage(request);

      this.emit('coverage:completed', {
        overall: result.overall.functions.percentage,
      });

      return result;
    } catch (error) {
      this.emit('coverage:failed', error);
      throw error;
    }
  }

  /**
   * Analyze test quality
   */
  async analyzeTestQuality(testFiles: string[]): Promise<TestQualityAnalysis> {
    this.emit('quality:started');

    const issues = [];
    const strengths = [];
    let totalTests = 0;

    for (const testFile of testFiles) {
      const testCode = fs.readFileSync(testFile, 'utf-8');
      totalTests += this.countTests(testCode);

      // Check for common quality issues
      const fileIssues = this.checkTestQuality(testCode, testFile);
      issues.push(...fileIssues);

      // Identify strengths
      if (this.hasGoodCoverage(testCode)) {
        strengths.push(`${path.basename(testFile)}: Good test coverage`);
      }
    }

    // Calculate score
    const score = this.calculateQualityScore(totalTests, issues);

    const result: TestQualityAnalysis = {
      score,
      testCount: totalTests,
      issues,
      strengths,
      recommendations: this.generateQualityRecommendations(issues, score),
    };

    this.emit('quality:completed', result);
    return result;
  }

  /**
   * Suggest missing tests for a source file
   */
  async suggestMissingTests(sourceFile: string): Promise<CoverageGap[]> {
    this.emit('suggestions:started');

    const sourceCode = fs.readFileSync(sourceFile, 'utf-8');
    const elements = this.analyzer.analyzeCode(sourceCode, sourceFile);

    // Find test file
    const testFile = this.findTestFile(sourceFile);
    const testCode = testFile ? fs.readFileSync(testFile, 'utf-8') : '';

    const gaps: CoverageGap[] = [];

    for (const element of elements) {
      // Check if element is tested
      const isTested =
        testCode.includes(element.name) ||
        testCode.includes(element.signature || '');

      if (!isTested) {
        const severity =
          element.complexity > 10
            ? 'critical'
            : element.complexity > 5
              ? 'high'
              : 'medium';

        gaps.push({
          file: sourceFile,
          element,
          severity,
          reason: `No tests found for ${element.type} "${element.name}"`,
          suggestedTests: [
            `Add unit test for ${element.name}`,
            `Test edge cases for ${element.name}`,
            `Test error handling for ${element.name}`,
          ],
        });
      }
    }

    this.emit('suggestions:completed', { count: gaps.length });
    return gaps;
  }

  /**
   * Calculate expected coverage from test cases
   */
  private calculateExpectedCoverage(
    testCases: any[],
    sourceCode: string
  ): ExpectedCoverage {
    const lines = sourceCode.split('\n');
    const executableLines = lines.filter(
      (line) => line.trim() && !line.trim().startsWith('//')
    ).length;

    const testedFunctions = new Set(testCases.map((tc) => tc.target.name));
    const totalFunctions = testCases.length;

    return {
      statements: 80, // Estimate
      branches: 70, // Estimate
      functions: (testedFunctions.size / totalFunctions) * 100 || 0,
      lines: 75, // Estimate
      uncoveredLines: [],
    };
  }

  /**
   * Generate test file name
   */
  private generateTestFileName(
    sourceFile: string,
    framework: string
  ): string {
    const dir = path.dirname(sourceFile);
    const ext = path.extname(sourceFile);
    const base = path.basename(sourceFile, ext);

    // Jest/Vitest convention
    if (framework === 'jest' || framework === 'vitest') {
      return path.join(dir, `${base}.test${ext}`);
    }

    // Mocha convention
    if (framework === 'mocha') {
      return path.join(dir, 'test', `${base}.test${ext}`);
    }

    // Default
    return path.join(dir, `${base}.test${ext}`);
  }

  /**
   * Generate suggestions for improvement
   */
  private generateSuggestions(testCases: any[]): string[] {
    const suggestions: string[] = [];

    // Check for missing test types
    const testTypes = new Set(testCases.map((tc) => tc.type));
    if (!testTypes.has('integration')) {
      suggestions.push('Consider adding integration tests');
    }
    if (!testTypes.has('e2e')) {
      suggestions.push('Consider adding end-to-end tests');
    }

    // Check for mock usage
    const hasMocks = testCases.some((tc) => tc.mocks.length > 0);
    if (!hasMocks) {
      suggestions.push(
        'Consider adding mocks for external dependencies to improve test isolation'
      );
    }

    return suggestions;
  }

  /**
   * Count tests in test file
   */
  private countTests(testCode: string): number {
    const patterns = [/\bit\(/g, /\btest\(/g, /def test_/g, /@Test/g];

    let count = 0;
    for (const pattern of patterns) {
      const matches = testCode.match(pattern);
      if (matches) {
        count += matches.length;
      }
    }

    return count;
  }

  /**
   * Check test quality
   */
  private checkTestQuality(testCode: string, testFile: string): any[] {
    const issues = [];

    // Check for tests without assertions
    if (testCode.includes('it(') && !testCode.includes('expect(')) {
      issues.push({
        type: 'no-assertions',
        severity: 'error',
        test: testFile,
        location: { file: testFile, startLine: 1, endLine: 1 },
        description: 'Tests found without assertions',
        fix: 'Add expect() assertions to verify behavior',
      });
    }

    // Check for poor naming
    if (testCode.match(/it\(['"]test/i)) {
      issues.push({
        type: 'poor-naming',
        severity: 'warning',
        test: testFile,
        location: { file: testFile, startLine: 1, endLine: 1 },
        description: 'Tests have non-descriptive names',
        fix: 'Use descriptive test names that explain what is being tested',
      });
    }

    return issues;
  }

  /**
   * Check if tests have good coverage
   */
  private hasGoodCoverage(testCode: string): boolean {
    const testCount = this.countTests(testCode);
    const assertionCount = (testCode.match(/expect\(/g) || []).length;

    return testCount > 5 && assertionCount / testCount >= 2;
  }

  /**
   * Calculate quality score
   */
  private calculateQualityScore(testCount: number, issues: any[]): number {
    let score = 100;

    // Deduct points for issues
    for (const issue of issues) {
      if (issue.severity === 'error') score -= 10;
      else if (issue.severity === 'warning') score -= 5;
      else score -= 2;
    }

    // Bonus for good test count
    if (testCount > 20) score += 5;
    else if (testCount < 5) score -= 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate quality recommendations
   */
  private generateQualityRecommendations(
    issues: any[],
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (score < 70) {
      recommendations.push(
        'Overall test quality is below recommended threshold'
      );
    }

    const errorCount = issues.filter((i) => i.severity === 'error').length;
    if (errorCount > 0) {
      recommendations.push(`Fix ${errorCount} critical test quality issues`);
    }

    const noAssertions = issues.filter((i) => i.type === 'no-assertions').length;
    if (noAssertions > 0) {
      recommendations.push('Add assertions to all test cases');
    }

    return recommendations;
  }

  /**
   * Find test file for source file
   */
  private findTestFile(sourceFile: string): string | null {
    const dir = path.dirname(sourceFile);
    const ext = path.extname(sourceFile);
    const base = path.basename(sourceFile, ext);

    const candidates = [
      path.join(dir, `${base}.test${ext}`),
      path.join(dir, `${base}.spec${ext}`),
      path.join(dir, '__tests__', `${base}.test${ext}`),
      path.join(dir, 'test', `${base}.test${ext}`),
    ];

    for (const candidate of candidates) {
      if (fs.existsSync(candidate)) {
        return candidate;
      }
    }

    return null;
  }
}
