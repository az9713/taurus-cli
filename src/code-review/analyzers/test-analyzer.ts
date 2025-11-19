/**
 * Test Analyzer
 *
 * Analyzes code for testing gaps and suggests test improvements
 */

import { ReviewFinding, ReviewContext, TestCoverageGap } from '../types.js';

export class TestAnalyzer {
  /**
   * Analyze code for test coverage gaps
   */
  async analyze(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];

    // Skip if this is already a test file
    if (context.file.includes('.test.') || context.file.includes('.spec.')) {
      return findings;
    }

    findings.push(...await this.checkMissingTests(context));
    findings.push(...await this.checkErrorHandling(context));
    findings.push(...await this.checkEdgeCases(context));
    findings.push(...await this.checkAsyncFunctions(context));

    return findings;
  }

  /**
   * Check for exported functions without tests
   */
  private async checkMissingTests(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Look for exported functions
      if (/export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)\s*=.*(?:function|=>)/.test(line)) {
        const match = line.match(/export\s+(?:async\s+)?function\s+(\w+)|export\s+const\s+(\w+)/);
        const functionName = match?.[1] || match?.[2];

        if (functionName) {
          findings.push({
            id: `test-missing-${index}`,
            severity: 'medium',
            category: 'testing',
            message: `Exported function '${functionName}' may need test coverage`,
            file: context.file,
            line: index + 1,
            code: line.trim(),
            suggestion: `Create test file: ${this.getTestFilePath(context.file)}\n` +
                       `Test case: describe('${functionName}', () => { it('should...', () => { ... }) })`,
            autoFixable: false,
            references: ['Test Coverage Best Practices'],
          });
        }
      }

      // Look for class methods
      if (/^\s*(?:public\s+|private\s+|protected\s+)?(?:async\s+)?(\w+)\s*\([^)]*\)\s*[:{]/.test(line) &&
          !line.includes('constructor')) {
        const match = line.match(/(\w+)\s*\(/);
        const methodName = match?.[1];

        if (methodName && !methodName.startsWith('_')) {
          findings.push({
            id: `test-method-${index}`,
            severity: 'low',
            category: 'testing',
            message: `Method '${methodName}' should have test coverage`,
            file: context.file,
            line: index + 1,
            code: line.trim(),
            suggestion: `Add test: it('should ${this.methodNameToTestCase(methodName)}', async () => { ... })`,
            autoFixable: false,
            references: ['Unit Testing'],
          });
        }
      }
    });

    return findings;
  }

  /**
   * Check for error handling that needs testing
   */
  private async checkErrorHandling(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for throw statements
      if (/throw\s+new\s+\w+Error/.test(line)) {
        findings.push({
          id: `test-error-${index}`,
          severity: 'medium',
          category: 'testing',
          message: 'Error throwing should be tested',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Add test case to verify error is thrown with correct message',
          autoFixable: false,
          references: ['Error Testing'],
        });
      }

      // Check for try-catch blocks
      if (/try\s*\{/.test(line)) {
        findings.push({
          id: `test-try-catch-${index}`,
          severity: 'medium',
          category: 'testing',
          message: 'Both success and error paths in try-catch should be tested',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Create test cases for both successful execution and error scenarios',
          autoFixable: false,
          references: ['Exception Testing'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for edge cases that need testing
   */
  private async checkEdgeCases(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for array operations (test empty arrays)
      if (/\.length|\.push\(|\.pop\(|\.shift\(|\.unshift\(|\[0\]/.test(line)) {
        findings.push({
          id: `test-edge-array-${index}`,
          severity: 'low',
          category: 'testing',
          message: 'Array operations should test edge cases',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Test with: empty array, single item, multiple items, very large arrays',
          autoFixable: false,
          references: ['Edge Case Testing'],
        });
      }

      // Check for division (test zero division)
      if (/\/\s*[a-zA-Z_]/.test(line) && !/\/\//.test(line)) {
        findings.push({
          id: `test-edge-div-${index}`,
          severity: 'medium',
          category: 'testing',
          message: 'Division operation should test zero divisor',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Add test case for division by zero and very small numbers',
          autoFixable: false,
          references: ['Boundary Testing'],
        });
      }

      // Check for string operations (test null/undefined)
      if (/\.trim\(|\.split\(|\.substring\(|\.slice\(/.test(line)) {
        findings.push({
          id: `test-edge-string-${index}`,
          severity: 'low',
          category: 'testing',
          message: 'String operations should test null/undefined inputs',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Test with: null, undefined, empty string, very long string',
          autoFixable: false,
          references: ['Input Validation Testing'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for async functions that need testing
   */
  private async checkAsyncFunctions(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for async functions
      if (/async\s+function|async\s+\w+\s*\(/.test(line)) {
        findings.push({
          id: `test-async-${index}`,
          severity: 'medium',
          category: 'testing',
          message: 'Async function needs comprehensive testing',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Test: successful resolution, rejection, timeout, and concurrent calls',
          autoFixable: false,
          references: ['Async Testing'],
        });
      }

      // Check for Promise chains
      if (/\.then\(|\.catch\(/.test(line)) {
        findings.push({
          id: `test-promise-${index}`,
          severity: 'low',
          category: 'testing',
          message: 'Promise chain should test all paths',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Test both .then() and .catch() branches',
          autoFixable: false,
          references: ['Promise Testing'],
        });
      }
    });

    return findings;
  }

  /**
   * Get test file path for source file
   */
  private getTestFilePath(sourceFile: string): string {
    const ext = sourceFile.substring(sourceFile.lastIndexOf('.'));
    const base = sourceFile.substring(0, sourceFile.lastIndexOf('.'));

    // Check common test patterns
    if (sourceFile.includes('/src/')) {
      return sourceFile.replace('/src/', '/tests/').replace(ext, `.test${ext}`);
    }

    return `${base}.test${ext}`;
  }

  /**
   * Convert method name to test case description
   */
  private methodNameToTestCase(methodName: string): string {
    // Convert camelCase to words
    const words = methodName.replace(/([A-Z])/g, ' $1').toLowerCase().trim();

    // Common patterns
    if (methodName.startsWith('get')) return words.replace('get', 'retrieve');
    if (methodName.startsWith('set')) return words.replace('set', 'update');
    if (methodName.startsWith('is')) return words;
    if (methodName.startsWith('has')) return words;
    if (methodName.startsWith('create')) return words;
    if (methodName.startsWith('delete')) return words;
    if (methodName.startsWith('update')) return words;

    return words;
  }

  /**
   * Generate test template for a function
   */
  generateTestTemplate(functionName: string, context: ReviewContext): string {
    return `
describe('${functionName}', () => {
  it('should handle valid input correctly', () => {
    // Arrange
    const input = /* your test input */;

    // Act
    const result = ${functionName}(input);

    // Assert
    expect(result).toBe(/* expected output */);
  });

  it('should handle edge cases', () => {
    // Test with null, undefined, empty values
    expect(() => ${functionName}(null)).toThrow();
  });

  it('should handle error conditions', () => {
    // Test error scenarios
  });
});
`.trim();
  }
}
