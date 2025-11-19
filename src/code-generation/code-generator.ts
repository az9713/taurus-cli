/**
 * Code Generator
 *
 * Generates code from specifications using AI
 */

import { ClaudeClient } from '../api/claude.js';
import {
  GenerationSpec,
  GeneratedCode,
  CodeMetadata,
  TargetLanguage,
  CodePattern,
  GenerationQuality,
  GenerationContext,
} from './types.js';

export class CodeGenerator {
  private client: ClaudeClient;
  private quality: GenerationQuality;

  constructor(client: ClaudeClient, quality: GenerationQuality = 'balanced') {
    this.client = client;
    this.quality = quality;
  }

  /**
   * Generate code from specification
   */
  async generate(spec: GenerationSpec, context?: GenerationContext): Promise<GeneratedCode> {
    const prompt = this.buildPrompt(spec, context);

    const response = await this.client.generateText(prompt);
    const code = this.extractCode(response);

    const metadata: CodeMetadata = {
      generatedAt: new Date(),
      spec,
      quality: this.quality,
      linesOfCode: code.split('\n').length,
      estimatedComplexity: this.estimateComplexity(code),
      dependencies: this.extractDependencies(code, spec.language),
      exports: this.extractExports(code, spec.language),
      validated: false,
    };

    return {
      language: spec.language,
      pattern: spec.pattern,
      code,
      metadata,
    };
  }

  /**
   * Generate multiple code variants
   */
  async generateVariants(spec: GenerationSpec, count: number = 3): Promise<GeneratedCode[]> {
    const variants: GeneratedCode[] = [];

    for (let i = 0; i < count; i++) {
      const variant = await this.generate(spec);
      variants.push(variant);
    }

    return variants;
  }

  /**
   * Build generation prompt
   */
  private buildPrompt(spec: GenerationSpec, context?: GenerationContext): string {
    let prompt = `Generate ${spec.language} code for the following specification:\n\n`;

    prompt += `Name: ${spec.name}\n`;
    prompt += `Pattern: ${spec.pattern}\n`;
    prompt += `Description: ${spec.description}\n\n`;

    if (spec.requirements && spec.requirements.length > 0) {
      prompt += 'Requirements:\n';
      spec.requirements.forEach((req, i) => {
        prompt += `${i + 1}. ${req}\n`;
      });
      prompt += '\n';
    }

    if (spec.constraints && spec.constraints.length > 0) {
      prompt += 'Constraints:\n';
      spec.constraints.forEach((constraint, i) => {
        prompt += `${i + 1}. ${constraint}\n`;
      });
      prompt += '\n';
    }

    if (spec.examples && spec.examples.length > 0) {
      prompt += 'Examples:\n';
      spec.examples.forEach((example, i) => {
        prompt += `Example ${i + 1}:\n`;
        prompt += `Input: ${example.input}\n`;
        prompt += `Output: ${example.output}\n`;
        if (example.description) {
          prompt += `Description: ${example.description}\n`;
        }
        prompt += '\n';
      });
    }

    if (spec.dependencies && spec.dependencies.length > 0) {
      prompt += `Dependencies: ${spec.dependencies.join(', ')}\n\n`;
    }

    if (context?.codeStyle) {
      prompt += this.formatCodeStyleInstructions(context.codeStyle);
    }

    prompt += `Please generate clean, well-documented ${spec.language} code that:\n`;
    prompt += `- Follows ${spec.language} best practices\n`;
    prompt += `- Includes comprehensive error handling\n`;
    prompt += `- Has clear variable and function names\n`;
    prompt += `- Includes JSDoc/docstring comments\n`;
    prompt += `- Is production-ready and maintainable\n\n`;

    prompt += `Return only the code, no explanations.`;

    return prompt;
  }

  /**
   * Extract code from AI response
   */
  private extractCode(response: string): string {
    // Remove markdown code blocks if present
    const codeBlockRegex = /```[\w]*\n([\s\S]*?)\n```/;
    const match = response.match(codeBlockRegex);

    if (match) {
      return match[1].trim();
    }

    return response.trim();
  }

  /**
   * Estimate code complexity
   */
  private estimateComplexity(code: string): 'low' | 'medium' | 'high' {
    const lines = code.split('\n').length;
    const cyclomaticIndicators = (code.match(/\b(if|else|for|while|switch|case|\?|&&|\|\|)\b/g) || []).length;

    const complexity = cyclomaticIndicators / Math.max(lines, 1);

    if (complexity < 0.1) return 'low';
    if (complexity < 0.3) return 'medium';
    return 'high';
  }

  /**
   * Extract dependencies from code
   */
  private extractDependencies(code: string, language: TargetLanguage): string[] {
    const dependencies: Set<string> = new Set();

    switch (language) {
      case 'typescript':
      case 'javascript':
        // Match import statements
        const importRegex = /import\s+(?:[\w{},\s*]+\s+from\s+)?['"]([^'"]+)['"]/g;
        let match;
        while ((match = importRegex.exec(code)) !== null) {
          const dep = match[1];
          // Only include external dependencies (not relative paths)
          if (!dep.startsWith('.') && !dep.startsWith('/')) {
            dependencies.add(dep.split('/')[0]);
          }
        }

        // Match require statements
        const requireRegex = /require\(['"]([^'"]+)['"]\)/g;
        while ((match = requireRegex.exec(code)) !== null) {
          const dep = match[1];
          if (!dep.startsWith('.') && !dep.startsWith('/')) {
            dependencies.add(dep.split('/')[0]);
          }
        }
        break;

      case 'python':
        // Match import statements
        const pyImportRegex = /^(?:from|import)\s+([\w.]+)/gm;
        while ((match = pyImportRegex.exec(code)) !== null) {
          dependencies.add(match[1].split('.')[0]);
        }
        break;

      case 'java':
        // Match import statements
        const javaImportRegex = /^import\s+([\w.]+);/gm;
        while ((match = javaImportRegex.exec(code)) !== null) {
          const parts = match[1].split('.');
          if (parts.length > 1) {
            dependencies.add(parts.slice(0, 2).join('.'));
          }
        }
        break;

      case 'go':
        // Match import statements
        const goImportRegex = /import\s+(?:\([\s\S]*?\)|"([^"]+)")/g;
        while ((match = goImportRegex.exec(code)) !== null) {
          if (match[1]) {
            dependencies.add(match[1]);
          }
        }
        break;
    }

    return Array.from(dependencies);
  }

  /**
   * Extract exported items from code
   */
  private extractExports(code: string, language: TargetLanguage): string[] {
    const exports: Set<string> = new Set();

    switch (language) {
      case 'typescript':
      case 'javascript':
        // Match export statements
        const exportRegex = /export\s+(?:async\s+)?(?:function|class|const|let|var|interface|type|enum)\s+([\w]+)/g;
        let match;
        while ((match = exportRegex.exec(code)) !== null) {
          exports.add(match[1]);
        }
        break;

      case 'python':
        // In Python, typically functions and classes at module level are "exported"
        const pyFuncRegex = /^def\s+([\w]+)\s*\(/gm;
        let pyMatch;
        while ((pyMatch = pyFuncRegex.exec(code)) !== null) {
          if (!pyMatch[1].startsWith('_')) {
            exports.add(pyMatch[1]);
          }
        }

        const pyClassRegex = /^class\s+([\w]+)/gm;
        while ((pyMatch = pyClassRegex.exec(code)) !== null) {
          if (!pyMatch[1].startsWith('_')) {
            exports.add(pyMatch[1]);
          }
        }
        break;

      case 'java':
        // Public classes and methods
        const javaClassRegex = /public\s+(?:class|interface|enum)\s+([\w]+)/g;
        let javaMatch;
        while ((javaMatch = javaClassRegex.exec(code)) !== null) {
          exports.add(javaMatch[1]);
        }
        break;

      case 'go':
        // Capitalized functions and types are exported in Go
        const goFuncRegex = /func\s+([A-Z][\w]*)/g;
        let goMatch;
        while ((goMatch = goFuncRegex.exec(code)) !== null) {
          exports.add(goMatch[1]);
        }

        const goTypeRegex = /type\s+([A-Z][\w]*)/g;
        while ((goMatch = goTypeRegex.exec(code)) !== null) {
          exports.add(goMatch[1]);
        }
        break;
    }

    return Array.from(exports);
  }

  /**
   * Format code style instructions
   */
  private formatCodeStyleInstructions(style: any): string {
    let instructions = 'Code Style:\n';
    instructions += `- Use ${style.indentation === 'tabs' ? 'tabs' : `${style.indentSize} spaces`} for indentation\n`;
    instructions += `- Use ${style.quotes} quotes for strings\n`;
    instructions += `- ${style.semicolons ? 'Include' : 'Omit'} semicolons\n`;
    instructions += `- ${style.trailingComma ? 'Include' : 'Omit'} trailing commas\n`;
    instructions += `- Max line length: ${style.maxLineLength}\n\n`;
    return instructions;
  }
}
