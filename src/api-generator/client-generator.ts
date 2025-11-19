/**
 * API Client Generator
 *
 * Generates API client code from specifications
 */

import { ClaudeClient } from '../api/claude.js';
import { APISpecParser } from './spec-parser.js';
import {
  APISpecification,
  GeneratedClient,
  GeneratedFile,
  ClientLanguage,
  ClientGenerationOptions,
} from './types.js';

export class APIClientGenerator {
  private client: ClaudeClient;
  private parser: APISpecParser;

  constructor(client: ClaudeClient) {
    this.client = client;
    this.parser = new APISpecParser();
  }

  /**
   * Generate API client
   */
  async generate(
    spec: APISpecification,
    language: ClientLanguage,
    options: ClientGenerationOptions = {}
  ): Promise<GeneratedClient> {
    const endpoints = this.parser.extractEndpoints(spec);

    const files: GeneratedFile[] = [];

    // Generate main client file
    const clientCode = await this.generateClientCode(spec, language, endpoints, options);
    files.push({
      path: `client.${this.getFileExtension(language)}`,
      content: clientCode,
      type: 'client',
    });

    // Generate types if needed
    if (options.includeTypes !== false && spec.components?.schemas) {
      const typesCode = await this.generateTypes(spec, language);
      files.push({
        path: `types.${this.getFileExtension(language)}`,
        content: typesCode,
        type: 'types',
      });
    }

    return {
      language,
      files,
      metadata: {
        generatedAt: new Date(),
        apiVersion: spec.info.version,
        clientVersion: '1.0.0',
        endpoints: endpoints.length,
        types: Object.keys(spec.components?.schemas || {}).length,
        hasAuth: options.includeAuth || false,
      },
    };
  }

  /**
   * Generate client code
   */
  private async generateClientCode(
    spec: APISpecification,
    language: ClientLanguage,
    endpoints: any[],
    options: ClientGenerationOptions
  ): Promise<string> {
    const prompt = this.buildClientPrompt(spec, language, endpoints, options);
    const code = await this.client.generateText(prompt);
    return this.extractCode(code);
  }

  /**
   * Generate types
   */
  private async generateTypes(
    spec: APISpecification,
    language: ClientLanguage
  ): Promise<string> {
    const schemas = spec.components?.schemas || {};
    const prompt = `Generate ${language} type definitions for these API schemas:\n\n${JSON.stringify(schemas, null, 2)}\n\nReturn only the code.`;
    const code = await this.client.generateText(prompt);
    return this.extractCode(code);
  }

  /**
   * Build client generation prompt
   */
  private buildClientPrompt(
    spec: APISpecification,
    language: ClientLanguage,
    endpoints: any[],
    options: ClientGenerationOptions
  ): string {
    let prompt = `Generate a ${language} API client for ${spec.info.title}:\n\n`;
    prompt += `Base URL: ${spec.servers[0]?.url || 'http://localhost'}\n`;
    prompt += `Endpoints: ${endpoints.length}\n\n`;

    if (options.includeAuth) {
      prompt += 'Include authentication support\n';
    }

    if (options.includeRetry) {
      prompt += 'Include retry logic\n';
    }

    if (options.includeValidation) {
      prompt += 'Include request/response validation\n';
    }

    prompt += '\nReturn only the client code, no explanations.';

    return prompt;
  }

  /**
   * Extract code from response
   */
  private extractCode(response: string): string {
    const match = response.match(/```[\w]*\n([\s\S]*?)\n```/);
    return match ? match[1].trim() : response.trim();
  }

  /**
   * Get file extension for language
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
