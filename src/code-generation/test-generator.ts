/**
 * Test Generator
 *
 * Generates test code for generated implementations
 */

import { ClaudeClient } from '../api/claude.js';
import { GenerationSpec, TargetLanguage } from './types.js';

export class TestGenerator {
  private client: ClaudeClient;
  private testFrameworks: Map<TargetLanguage, string[]>;

  constructor(client: ClaudeClient) {
    this.client = client;
    this.testFrameworks = new Map([
      ['typescript', ['jest', 'mocha', 'vitest']],
      ['javascript', ['jest', 'mocha', 'vitest']],
      ['python', ['pytest', 'unittest']],
      ['java', ['junit', 'testng']],
      ['go', ['testing']],
      ['rust', ['cargo test']],
      ['csharp', ['nunit', 'xunit']],
      ['ruby', ['rspec', 'minitest']],
      ['php', ['phpunit']],
    ]);
  }

  /**
   * Generate tests for code
   */
  async generate(code: string, spec: GenerationSpec, framework?: string): Promise<string> {
    const testFramework = framework || this.getDefaultFramework(spec.language);
    const prompt = this.buildTestPrompt(code, spec, testFramework);

    const response = await this.client.generateText(prompt);
    return this.extractCode(response);
  }

  /**
   * Generate tests with specific coverage targets
   */
  async generateWithCoverage(
    code: string,
    spec: GenerationSpec,
    targetCoverage: number = 80
  ): Promise<string> {
    const framework = this.getDefaultFramework(spec.language);
    const prompt = this.buildTestPrompt(code, spec, framework, targetCoverage);

    const response = await this.client.generateText(prompt);
    return this.extractCode(response);
  }

  /**
   * Build test generation prompt
   */
  private buildTestPrompt(
    code: string,
    spec: GenerationSpec,
    framework: string,
    targetCoverage?: number
  ): string {
    let prompt = `Generate comprehensive tests for the following ${spec.language} code using ${framework}:\n\n`;
    prompt += '```' + spec.language + '\n';
    prompt += code;
    prompt += '\n```\n\n';

    prompt += 'Requirements:\n';
    prompt += '- Test all public functions/methods\n';
    prompt += '- Include edge cases and error scenarios\n';
    prompt += '- Test with valid and invalid inputs\n';
    prompt += '- Include setup and teardown as needed\n';
    prompt += '- Use descriptive test names\n';
    prompt += '- Follow ' + framework + ' best practices\n';

    if (targetCoverage) {
      prompt += `- Aim for ${targetCoverage}% code coverage\n`;
    }

    if (spec.examples && spec.examples.length > 0) {
      prompt += '\nTest Examples from Spec:\n';
      spec.examples.forEach((example, i) => {
        prompt += `${i + 1}. Input: ${example.input}, Expected Output: ${example.output}\n`;
      });
    }

    prompt += '\nReturn only the test code, no explanations.';

    return prompt;
  }

  /**
   * Get default test framework for language
   */
  private getDefaultFramework(language: TargetLanguage): string {
    const frameworks = this.testFrameworks.get(language);
    return frameworks ? frameworks[0] : 'jest';
  }

  /**
   * Extract code from response
   */
  private extractCode(response: string): string {
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    return response.trim();
  }

  /**
   * Generate test cases for specific scenarios
   */
  async generateTestCases(
    functionName: string,
    language: TargetLanguage,
    scenarios: string[]
  ): Promise<string[]> {
    const testCases: string[] = [];
    const framework = this.getDefaultFramework(language);

    for (const scenario of scenarios) {
      const prompt = `Generate a single ${framework} test case for function "${functionName}" that tests: ${scenario}\n\nReturn only the test code.`;
      const response = await this.client.generateText(prompt);
      testCases.push(this.extractCode(response));
    }

    return testCases;
  }

  /**
   * Generate mock objects for testing
   */
  async generateMocks(
    dependencies: string[],
    language: TargetLanguage
  ): Promise<string> {
    let prompt = `Generate mock objects for the following dependencies in ${language}:\n`;
    dependencies.forEach(dep => {
      prompt += `- ${dep}\n`;
    });
    prompt += '\nReturn only the mock code.';

    const response = await this.client.generateText(prompt);
    return this.extractCode(response);
  }
}
