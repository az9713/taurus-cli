/**
 * Test Case Generator - Generates test cases using AI
 */

import { ClaudeClient } from '../api/claude.js';
import {
  CodeElement,
  GeneratedTestCase,
  TestFramework,
  TestType,
  TestAssertion,
  MockDefinition,
  TestGenerationOptions,
} from './types';

export class TestCaseGenerator {
  constructor(private client: ClaudeClient) {}

  /**
   * Generate test cases for a code element
   */
  async generateTestCases(
    element: CodeElement,
    sourceCode: string,
    framework: TestFramework,
    testTypes: TestType[],
    options: TestGenerationOptions = {}
  ): Promise<GeneratedTestCase[]> {
    const testCases: GeneratedTestCase[] = [];

    for (const testType of testTypes) {
      const generated = await this.generateTestCase(
        element,
        sourceCode,
        framework,
        testType,
        options
      );
      testCases.push(generated);
    }

    return testCases;
  }

  /**
   * Generate a single test case
   */
  private async generateTestCase(
    element: CodeElement,
    sourceCode: string,
    framework: TestFramework,
    testType: TestType,
    options: TestGenerationOptions
  ): Promise<GeneratedTestCase> {
    const prompt = this.buildTestGenerationPrompt(
      element,
      sourceCode,
      framework,
      testType,
      options
    );

    const testCode = await this.client.generateText(prompt);

    // Parse generated test to extract assertions and mocks
    const assertions = this.extractAssertions(testCode, framework);
    const mocks = this.extractMocks(testCode, framework);

    return {
      name: this.generateTestName(element, testType),
      description: this.generateTestDescription(element, testType),
      type: testType,
      code: testCode,
      target: element,
      assertions,
      mocks,
      setup: options.includeSetup
        ? this.generateSetup(element, framework)
        : undefined,
      teardown: options.includeTeardown
        ? this.generateTeardown(element, framework)
        : undefined,
    };
  }

  /**
   * Build prompt for test generation
   */
  private buildTestGenerationPrompt(
    element: CodeElement,
    sourceCode: string,
    framework: TestFramework,
    testType: TestType,
    options: TestGenerationOptions
  ): string {
    const frameworkInstructions = this.getFrameworkInstructions(framework);
    const testTypeGuidelines = this.getTestTypeGuidelines(testType);

    return `Generate a ${testType} test for the following ${element.type} using ${framework}.

CODE TO TEST:
\`\`\`typescript
${this.extractRelevantCode(sourceCode, element)}
\`\`\`

ELEMENT DETAILS:
- Name: ${element.name}
- Type: ${element.type}
- Signature: ${element.signature || 'N/A'}
- Complexity: ${element.complexity}
- Dependencies: ${element.dependencies.join(', ') || 'None'}

${frameworkInstructions}

${testTypeGuidelines}

REQUIREMENTS:
${options.mockExternal ? '- Mock all external dependencies' : '- Use real dependencies where possible'}
${options.includeSetup ? '- Include setup/beforeEach block' : ''}
${options.includeTeardown ? '- Include teardown/afterEach block' : ''}
- Include at least 3 assertions per test
- Test both happy path and edge cases
- Use descriptive test names
- Add comments explaining complex test logic

Generate ONLY the test code, no explanations.`;
  }

  /**
   * Get framework-specific instructions
   */
  private getFrameworkInstructions(framework: TestFramework): string {
    const instructions: Record<TestFramework, string> = {
      jest: `JEST REQUIREMENTS:
- Use describe() for grouping tests
- Use test() or it() for individual test cases
- Use expect() for assertions
- Use jest.fn() for mocks
- Use beforeEach/afterEach for setup/teardown`,

      mocha: `MOCHA REQUIREMENTS:
- Use describe() for grouping tests
- Use it() for individual test cases
- Use chai expect() for assertions
- Use sinon for mocks
- Use beforeEach/afterEach for setup/teardown`,

      vitest: `VITEST REQUIREMENTS:
- Use describe() for grouping tests
- Use test() or it() for individual test cases
- Use expect() for assertions
- Use vi.fn() for mocks
- Use beforeEach/afterEach for setup/teardown`,

      pytest: `PYTEST REQUIREMENTS:
- Use def test_* functions for test cases
- Use assert statements
- Use @pytest.fixture for setup
- Use monkeypatch or unittest.mock for mocking`,

      unittest: `UNITTEST REQUIREMENTS:
- Use unittest.TestCase class
- Use self.assert* methods
- Use setUp/tearDown methods
- Use unittest.mock for mocking`,

      junit: `JUNIT REQUIREMENTS:
- Use @Test annotation
- Use assertEquals, assertTrue, etc.
- Use @Before/@After for setup/teardown
- Use Mockito for mocking`,

      testng: `TESTNG REQUIREMENTS:
- Use @Test annotation
- Use Assert.assertEquals, Assert.assertTrue, etc.
- Use @BeforeMethod/@AfterMethod for setup/teardown
- Use Mockito for mocking`,

      'go-test': `GO TEST REQUIREMENTS:
- Use func Test* functions
- Use testing.T parameter
- Use if/else for assertions
- Use testify/assert for better assertions`,

      'rust-test': `RUST TEST REQUIREMENTS:
- Use #[test] attribute
- Use assert!, assert_eq! macros
- Use #[should_panic] for error tests`,

      rspec: `RSPEC REQUIREMENTS:
- Use describe/context for grouping
- Use it for test cases
- Use expect().to for assertions
- Use before/after hooks`,
    };

    return instructions[framework];
  }

  /**
   * Get test type specific guidelines
   */
  private getTestTypeGuidelines(testType: TestType): string {
    const guidelines: Record<TestType, string> = {
      unit: `UNIT TEST GUIDELINES:
- Test single function/method in isolation
- Mock all external dependencies
- Test return values and side effects
- Cover edge cases and error conditions`,

      integration: `INTEGRATION TEST GUIDELINES:
- Test interaction between multiple components
- Use real dependencies where possible
- Test data flow and communication
- Verify integrated behavior`,

      e2e: `E2E TEST GUIDELINES:
- Test complete user workflows
- Use real external services
- Test from user perspective
- Verify end-to-end functionality`,

      functional: `FUNCTIONAL TEST GUIDELINES:
- Test business requirements
- Verify functional specifications
- Test with realistic data
- Focus on user-facing behavior`,

      performance: `PERFORMANCE TEST GUIDELINES:
- Measure execution time
- Test with large datasets
- Verify performance requirements
- Include benchmarks`,

      security: `SECURITY TEST GUIDELINES:
- Test input validation
- Test authentication/authorization
- Test for common vulnerabilities
- Verify security requirements`,

      snapshot: `SNAPSHOT TEST GUIDELINES:
- Capture component output
- Verify UI consistency
- Update snapshots when intentional changes
- Keep snapshots small and focused`,
    };

    return guidelines[testType];
  }

  /**
   * Extract relevant code for testing
   */
  private extractRelevantCode(
    sourceCode: string,
    element: CodeElement
  ): string {
    const lines = sourceCode.split('\n');
    const start = Math.max(0, element.location.startLine - 1);
    const end = Math.min(lines.length, element.location.endLine);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Extract assertions from generated test code
   */
  private extractAssertions(
    testCode: string,
    framework: TestFramework
  ): TestAssertion[] {
    const assertions: TestAssertion[] = [];

    // Jest/Vitest pattern
    const jestPattern = /expect\((.*?)\)\.(.*?)\((.*?)\)/g;
    let match;

    while ((match = jestPattern.exec(testCode)) !== null) {
      assertions.push({
        type: this.mapAssertionType(match[2]),
        actual: match[1],
        expected: match[3],
      });
    }

    return assertions;
  }

  /**
   * Map assertion method to assertion type
   */
  private mapAssertionType(method: string): TestAssertion['type'] {
    const mapping: Record<string, TestAssertion['type']> = {
      toBe: 'equals',
      toEqual: 'deep-equals',
      not: 'not-equals',
      toBeTruthy: 'truthy',
      toBeFalsy: 'falsy',
      toThrow: 'throws',
      resolves: 'resolves',
      rejects: 'rejects',
      toContain: 'contains',
      toMatch: 'matches',
    };

    return mapping[method] || 'equals';
  }

  /**
   * Extract mocks from generated test code
   */
  private extractMocks(
    testCode: string,
    framework: TestFramework
  ): MockDefinition[] {
    const mocks: MockDefinition[] = [];

    // Jest mock pattern
    const jestMockPattern = /jest\.mock\(['"](.+?)['"]\)/g;
    let match;

    while ((match = jestMockPattern.exec(testCode)) !== null) {
      mocks.push({
        target: match[1],
        type: 'module',
      });
    }

    // jest.fn() pattern
    const fnPattern = /(\w+)\s*=\s*jest\.fn\(\)/g;
    while ((match = fnPattern.exec(testCode)) !== null) {
      mocks.push({
        target: match[1],
        type: 'function',
      });
    }

    return mocks;
  }

  /**
   * Generate test name
   */
  private generateTestName(element: CodeElement, testType: TestType): string {
    const prefix = testType === 'unit' ? 'should' : `${testType} test:`;
    return `${prefix} ${element.name}`;
  }

  /**
   * Generate test description
   */
  private generateTestDescription(
    element: CodeElement,
    testType: TestType
  ): string {
    return `${testType} test for ${element.type} ${element.name}`;
  }

  /**
   * Generate setup code
   */
  private generateSetup(
    element: CodeElement,
    framework: TestFramework
  ): string {
    if (framework === 'jest' || framework === 'vitest') {
      return `beforeEach(() => {
  // Setup code here
});`;
    }

    return '';
  }

  /**
   * Generate teardown code
   */
  private generateTeardown(
    element: CodeElement,
    framework: TestFramework
  ): string {
    if (framework === 'jest' || framework === 'vitest') {
      return `afterEach(() => {
  // Cleanup code here
});`;
    }

    return '';
  }

  /**
   * Generate complete test file
   */
  async generateTestFile(
    testCases: GeneratedTestCase[],
    framework: TestFramework,
    sourceFile: string
  ): Promise<string> {
    const imports = this.generateImports(testCases, framework, sourceFile);
    const testBlocks = testCases.map((tc) => this.formatTestCase(tc, framework));

    return `${imports}

describe('${this.getDescribeName(sourceFile)}', () => {
${testBlocks.join('\n\n')}
});`;
  }

  /**
   * Generate import statements
   */
  private generateImports(
    testCases: GeneratedTestCase[],
    framework: TestFramework,
    sourceFile: string
  ): string {
    const imports: string[] = [];

    // Import source code
    const modulePath = sourceFile.replace(/\.(ts|js)$/, '');
    const symbols = [
      ...new Set(testCases.map((tc) => tc.target.name.split('.')[0])),
    ];
    imports.push(`import { ${symbols.join(', ')} } from '${modulePath}';`);

    // Framework imports
    if (framework === 'jest') {
      imports.push(`import { jest } from '@jest/globals';`);
    }

    return imports.join('\n');
  }

  /**
   * Format test case
   */
  private formatTestCase(
    testCase: GeneratedTestCase,
    framework: TestFramework
  ): string {
    let formatted = `  ${testCase.code}`;

    // Indent properly
    formatted = formatted
      .split('\n')
      .map((line) => `  ${line}`)
      .join('\n');

    return formatted;
  }

  /**
   * Get describe block name from file path
   */
  private getDescribeName(filePath: string): string {
    const parts = filePath.split('/');
    const fileName = parts[parts.length - 1];
    return fileName.replace(/\.(ts|js)$/, '');
  }
}
