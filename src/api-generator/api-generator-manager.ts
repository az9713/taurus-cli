/**
 * API Generator Manager
 *
 * Main orchestrator for API client generation and testing
 */

import { EventEmitter } from 'events';
import { ClaudeClient } from '../api/claude.js';
import { APISpecParser } from './spec-parser.js';
import { APIClientGenerator } from './client-generator.js';
import { APITestGenerator } from './test-generator.js';
import {
  APIGeneratorConfig,
  APISpecification,
  GeneratedClient,
  ClientLanguage,
  ClientGenerationOptions,
} from './types.js';

export class APIGeneratorManager extends EventEmitter {
  private config: APIGeneratorConfig;
  private client: ClaudeClient;
  private specParser: APISpecParser;
  private clientGenerator: APIClientGenerator;
  private testGenerator: APITestGenerator;

  constructor(config: APIGeneratorConfig, client: ClaudeClient) {
    super();
    this.config = config;
    this.client = client;
    this.specParser = new APISpecParser();
    this.clientGenerator = new APIClientGenerator(client);
    this.testGenerator = new APITestGenerator(client);
  }

  /**
   * Generate API client from specification
   */
  async generateClient(
    spec: any,
    language?: ClientLanguage,
    options?: ClientGenerationOptions
  ): Promise<GeneratedClient> {
    this.emit('generation-start');

    try {
      // Parse specification
      const apiSpec = this.specParser.parse(spec);

      // Validate specification
      const validation = this.specParser.validate(apiSpec);
      if (!validation.valid) {
        throw new Error(`Invalid API spec: ${validation.errors.join(', ')}`);
      }

      // Generate client
      const targetLanguage = language || this.config.defaultLanguage;
      const generationOptions: ClientGenerationOptions = {
        includeAuth: this.config.authentication.type !== 'none',
        includeRetry: this.config.client.includeRetry,
        includeValidation: this.config.client.includeValidation,
        ...options,
      };

      const generatedClient = await this.clientGenerator.generate(
        apiSpec,
        targetLanguage,
        generationOptions
      );

      // Generate tests if enabled
      if (this.config.generateTests) {
        const testFile = await this.testGenerator.generateTests(
          apiSpec,
          targetLanguage,
          this.config.testing.framework
        );
        generatedClient.tests = [testFile];
      }

      // Generate documentation if enabled
      if (this.config.generateDocs) {
        generatedClient.documentation = this.generateDocumentation(apiSpec);
      }

      this.emit('generation-complete', {
        endpoints: generatedClient.metadata.endpoints,
        files: generatedClient.files.length,
      });

      return generatedClient;
    } catch (error: any) {
      this.emit('generation-error', { error });
      throw error;
    }
  }

  /**
   * Parse API specification from various formats
   */
  parseSpec(input: string | object): APISpecification {
    const spec = typeof input === 'string' ? JSON.parse(input) : input;
    return this.specParser.parse(spec);
  }

  /**
   * Generate documentation
   */
  private generateDocumentation(spec: APISpecification): string {
    let doc = `# ${spec.info.title}\n\n`;
    doc += `Version: ${spec.info.version}\n\n`;

    if (spec.info.description) {
      doc += `${spec.info.description}\n\n`;
    }

    doc += `## Base URL\n\n`;
    doc += `\`${spec.servers[0]?.url || 'http://localhost'}\`\n\n`;

    doc += `## Endpoints\n\n`;
    const endpoints = this.specParser.extractEndpoints(spec);

    for (const endpoint of endpoints) {
      doc += `### ${endpoint.method} ${endpoint.path}\n\n`;
      if (endpoint.operation.summary) {
        doc += `${endpoint.operation.summary}\n\n`;
      }
      if (endpoint.operation.description) {
        doc += `${endpoint.operation.description}\n\n`;
      }
    }

    return doc;
  }

  /**
   * Get configuration
   */
  getConfig(): APIGeneratorConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<APIGeneratorConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
