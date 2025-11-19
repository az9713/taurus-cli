/**
 * API Test Generator
 *
 * Generates test suites for API clients
 */

import { ClaudeClient } from '../api/claude.js';
import { APISpecification, TestSuite, TestCase, GeneratedFile, ClientLanguage } from './types.js';

export class APITestGenerator {
  private client: ClaudeClient;

  constructor(client: ClaudeClient) {
    this.client = client;
  }

  /**
   * Generate test suite
   */
  async generateTests(
    spec: APISpecification,
    language: ClientLanguage,
    framework: string = 'jest'
  ): Promise<GeneratedFile> {
    const testCode = await this.generateTestCode(spec, language, framework);

    return {
      path: `client.test.${this.getFileExtension(language)}`,
      content: testCode,
      type: 'test',
    };
  }

  /**
   * Generate test cases
   */
  generateTestCases(spec: APISpecification): TestCase[] {
    const testCases: TestCase[] = [];

    for (const [path, pathItem] of Object.entries(spec.paths)) {
      for (const [method, operation] of Object.entries(pathItem as any)) {
        if (method in ['get', 'post', 'put', 'delete', 'patch']) {
          testCases.push({
            name: `Test ${method.toUpperCase()} ${path}`,
            method: method.toUpperCase() as any,
            path,
            description: (operation as any).summary || (operation as any).description,
            assertions: [
              'Response status should be successful',
              'Response should match schema',
            ],
          });
        }
      }
    }

    return testCases;
  }

  /**
   * Generate test code
   */
  private async generateTestCode(
    spec: APISpecification,
    language: ClientLanguage,
    framework: string
  ): Promise<string> {
    const testCases = this.generateTestCases(spec);

    const prompt = `Generate ${framework} tests in ${language} for API:\n\n`;
    const fullPrompt = prompt +
      `API: ${spec.info.title}\n` +
      `Endpoints: ${testCases.length}\n\n` +
      `Include:\n` +
      `- Test each endpoint\n` +
      `- Test success and error cases\n` +
      `- Mock API responses\n\n` +
      `Return only the test code.`;

    const code = await this.client.generateText(fullPrompt);
    return this.extractCode(code);
  }

  /**
   * Extract code from response
   */
  private extractCode(response: string): string {
    const match = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    return match ? match[1].trim() : response.trim();
  }

  /**
   * Get file extension
   */
  private getFileExtension(language: ClientLanguage): string {
    const extensions: Record<ClientLanguage, string> = {
      typescript: 'ts',
      javascript: 'js',
      python: 'py',
      java: 'java',
      go: 'go',
      rust: 'rs',
    };
    return extensions[language] || 'txt';
  }
}
