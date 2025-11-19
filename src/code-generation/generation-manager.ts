/**
 * Generation Manager
 *
 * Main orchestrator for code generation
 */

import { EventEmitter } from 'events';
import { ClaudeClient } from '../api/claude.js';
import { SpecParser } from './spec-parser.js';
import { CodeGenerator } from './code-generator.js';
import { TestGenerator } from './test-generator.js';
import { CodeValidator } from './code-validator.js';
import { TemplateManager } from './template-manager.js';
import {
  CodeGenerationConfig,
  GenerationSpec,
  GenerationResult,
  GeneratedCode,
  GenerationContext,
} from './types.js';

export class GenerationManager extends EventEmitter {
  private config: CodeGenerationConfig;
  private client: ClaudeClient;
  private specParser: SpecParser;
  private codeGenerator: CodeGenerator;
  private testGenerator: TestGenerator;
  private codeValidator: CodeValidator;
  private templateManager: TemplateManager;

  constructor(config: CodeGenerationConfig, client: ClaudeClient) {
    super();
    this.config = config;
    this.client = client;
    this.specParser = new SpecParser();
    this.codeGenerator = new CodeGenerator(client, config.quality);
    this.testGenerator = new TestGenerator(client);
    this.codeValidator = new CodeValidator();
    this.templateManager = new TemplateManager(config.templates.customTemplatesPath);
  }

  /**
   * Generate code from specification text
   */
  async generateFromText(
    specText: string,
    context?: GenerationContext
  ): Promise<GenerationResult> {
    const startTime = Date.now();
    const result: GenerationResult = {
      success: false,
      generated: [],
      errors: [],
      warnings: [],
      suggestions: [],
      executionTime: 0,
    };

    try {
      this.emit('generation-start', { specText });

      // Parse specification
      const spec = this.specParser.parse(specText);
      this.emit('spec-parsed', { spec });

      // Validate specification
      const specValidation = this.specParser.validate(spec);
      if (!specValidation.passed) {
        result.errors.push(...specValidation.errors.map(e => e.message));
        result.warnings.push(...specValidation.warnings.map(w => w.message));

        if (specValidation.errors.length > 0) {
          result.executionTime = Date.now() - startTime;
          return result;
        }
      }

      // Generate code
      const generated = await this.generate(spec, context);
      result.generated.push(generated);

      this.emit('code-generated', { generated });

      result.success = true;
    } catch (error: any) {
      result.errors.push(error.message);
      this.emit('generation-error', { error });
    }

    result.executionTime = Date.now() - startTime;
    this.emit('generation-complete', result);

    return result;
  }

  /**
   * Generate code from specification
   */
  async generate(
    spec: GenerationSpec,
    context?: GenerationContext
  ): Promise<GeneratedCode> {
    // Generate code
    const generated = await this.codeGenerator.generate(spec, context);

    // Validate code if enabled
    if (this.config.validation.syntaxCheck) {
      const validation = await this.codeValidator.validate(generated.code, spec.language);
      generated.metadata.validated = validation.passed;
      generated.metadata.validationResults = [validation];

      this.emit('code-validated', { validation });
    }

    // Generate tests if enabled
    if (this.config.testing.generateTests) {
      const tests = await this.testGenerator.generate(
        generated.code,
        spec,
        this.config.testing.testFramework
      );
      generated.tests = tests;

      this.emit('tests-generated', { tests });
    }

    // Generate documentation if enabled
    if (this.config.documentation.generateDocs) {
      generated.documentation = this.generateDocumentation(generated, spec);

      this.emit('docs-generated', { documentation: generated.documentation });
    }

    return generated;
  }

  /**
   * Generate code from template
   */
  async generateFromTemplate(
    templateName: string,
    variables: Record<string, any>
  ): Promise<GeneratedCode> {
    // Validate template variables
    const errors = this.templateManager.validateTemplateVariables(templateName, variables);
    if (errors.length > 0) {
      throw new Error(`Template variable errors: ${errors.join(', ')}`);
    }

    // Apply template
    const code = this.templateManager.applyTemplate(templateName, variables);

    const template = this.templateManager.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const generated: GeneratedCode = {
      language: template.language,
      pattern: template.pattern,
      code,
      metadata: {
        generatedAt: new Date(),
        spec: {
          name: variables.name || templateName,
          description: variables.description || '',
          language: template.language,
          pattern: template.pattern,
          requirements: [],
        },
        quality: this.config.quality,
        linesOfCode: code.split('\n').length,
        estimatedComplexity: 'low',
        dependencies: [],
        exports: [],
        validated: false,
      },
    };

    // Validate if enabled
    if (this.config.validation.syntaxCheck) {
      const validation = await this.codeValidator.validate(code, template.language);
      generated.metadata.validated = validation.passed;
      generated.metadata.validationResults = [validation];
    }

    return generated;
  }

  /**
   * Generate multiple code variants
   */
  async generateVariants(
    spec: GenerationSpec,
    count: number = 3
  ): Promise<GeneratedCode[]> {
    const variants: GeneratedCode[] = [];

    for (let i = 0; i < count; i++) {
      this.emit('variant-generation-start', { index: i, total: count });
      const variant = await this.generate(spec);
      variants.push(variant);
      this.emit('variant-generated', { index: i, variant });
    }

    return variants;
  }

  /**
   * Refactor existing code
   */
  async refactor(
    code: string,
    language: string,
    instructions: string
  ): Promise<string> {
    const prompt = `Refactor the following ${language} code according to these instructions:\n\n`;
    const fullPrompt = prompt + `Instructions: ${instructions}\n\n` +
      `Code:\n\`\`\`${language}\n${code}\n\`\`\`\n\n` +
      `Return only the refactored code, no explanations.`;

    const response = await this.client.generateText(fullPrompt);

    // Extract code from response
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);

    return match ? match[1].trim() : response.trim();
  }

  /**
   * Generate documentation for generated code
   */
  private generateDocumentation(generated: GeneratedCode, spec: GenerationSpec): string {
    let doc = `# ${spec.name}\n\n`;
    doc += `${spec.description}\n\n`;

    doc += `## Language\n${generated.language}\n\n`;
    doc += `## Pattern\n${generated.pattern}\n\n`;

    if (spec.requirements && spec.requirements.length > 0) {
      doc += `## Requirements\n`;
      spec.requirements.forEach((req, i) => {
        doc += `${i + 1}. ${req}\n`;
      });
      doc += '\n';
    }

    if (generated.metadata.dependencies.length > 0) {
      doc += `## Dependencies\n`;
      generated.metadata.dependencies.forEach(dep => {
        doc += `- ${dep}\n`;
      });
      doc += '\n';
    }

    if (generated.metadata.exports.length > 0) {
      doc += `## Exports\n`;
      generated.metadata.exports.forEach(exp => {
        doc += `- ${exp}\n`;
      });
      doc += '\n';
    }

    doc += `## Usage\n\n`;
    doc += '```' + generated.language + '\n';
    doc += `// Example usage\n`;
    doc += '// TODO: Add usage example\n';
    doc += '```\n\n';

    doc += `## Code\n\n`;
    doc += '```' + generated.language + '\n';
    doc += generated.code;
    doc += '\n```\n';

    return doc;
  }

  /**
   * Get template manager
   */
  getTemplateManager(): TemplateManager {
    return this.templateManager;
  }

  /**
   * Get configuration
   */
  getConfig(): CodeGenerationConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CodeGenerationConfig>): void {
    this.config = { ...this.config, ...config };
    if (config.quality) {
      this.codeGenerator = new CodeGenerator(this.client, config.quality);
    }
  }
}
