/**
 * Specification Parser
 *
 * Parses natural language specifications into structured generation specs
 */

import { GenerationSpec, TargetLanguage, CodePattern, SpecExample, ValidationResult } from './types.js';

export class SpecParser {
  /**
   * Parse natural language specification into structured spec
   */
  parse(text: string): GenerationSpec {
    const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

    const spec: Partial<GenerationSpec> = {
      requirements: [],
      constraints: [],
      examples: [],
      dependencies: [],
    };

    let currentSection: 'description' | 'requirements' | 'constraints' | 'examples' | 'dependencies' = 'description';
    let descriptionLines: string[] = [];

    for (const line of lines) {
      // Detect sections
      if (line.toLowerCase().startsWith('name:')) {
        spec.name = line.substring(5).trim();
        continue;
      }

      if (line.toLowerCase().startsWith('language:')) {
        spec.language = this.parseLanguage(line.substring(9).trim());
        continue;
      }

      if (line.toLowerCase().startsWith('pattern:') || line.toLowerCase().startsWith('type:')) {
        spec.pattern = this.parsePattern(line.substring(line.indexOf(':') + 1).trim());
        continue;
      }

      if (line.toLowerCase().includes('requirement')) {
        currentSection = 'requirements';
        continue;
      }

      if (line.toLowerCase().includes('constraint')) {
        currentSection = 'constraints';
        continue;
      }

      if (line.toLowerCase().includes('example')) {
        currentSection = 'examples';
        continue;
      }

      if (line.toLowerCase().includes('dependenc')) {
        currentSection = 'dependencies';
        continue;
      }

      // Parse content based on current section
      if (currentSection === 'description') {
        descriptionLines.push(line);
      } else if (currentSection === 'requirements') {
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          spec.requirements!.push(line.replace(/^[-*\d.]\s*/, ''));
        } else if (line.length > 0) {
          spec.requirements!.push(line);
        }
      } else if (currentSection === 'constraints') {
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          spec.constraints!.push(line.replace(/^[-*\d.]\s*/, ''));
        } else if (line.length > 0) {
          spec.constraints!.push(line);
        }
      } else if (currentSection === 'dependencies') {
        if (line.startsWith('-') || line.startsWith('*') || line.match(/^\d+\./)) {
          spec.dependencies!.push(line.replace(/^[-*\d.]\s*/, ''));
        } else if (line.length > 0) {
          spec.dependencies!.push(line);
        }
      }
    }

    // Set defaults
    if (!spec.name) {
      spec.name = this.inferNameFromDescription(descriptionLines.join(' '));
    }

    if (!spec.description) {
      spec.description = descriptionLines.join(' ');
    }

    if (!spec.language) {
      spec.language = 'typescript';
    }

    if (!spec.pattern) {
      spec.pattern = this.inferPattern(spec.description);
    }

    return spec as GenerationSpec;
  }

  /**
   * Validate a generation spec
   */
  validate(spec: GenerationSpec): ValidationResult {
    const errors: any[] = [];
    const warnings: any[] = [];

    if (!spec.name || spec.name.length === 0) {
      errors.push({
        line: 0,
        column: 0,
        message: 'Spec name is required',
        severity: 'error' as const,
      });
    }

    if (!spec.description || spec.description.length < 10) {
      warnings.push({
        line: 0,
        column: 0,
        message: 'Spec description is too short or missing',
        severity: 'warning' as const,
      });
    }

    if (!spec.requirements || spec.requirements.length === 0) {
      warnings.push({
        line: 0,
        column: 0,
        message: 'No requirements specified',
        severity: 'warning' as const,
      });
    }

    return {
      type: 'syntax',
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Parse language from string
   */
  private parseLanguage(lang: string): TargetLanguage {
    const normalized = lang.toLowerCase().trim();

    const languageMap: Record<string, TargetLanguage> = {
      'ts': 'typescript',
      'typescript': 'typescript',
      'js': 'javascript',
      'javascript': 'javascript',
      'py': 'python',
      'python': 'python',
      'java': 'java',
      'go': 'go',
      'golang': 'go',
      'rs': 'rust',
      'rust': 'rust',
      'c#': 'csharp',
      'csharp': 'csharp',
      'rb': 'ruby',
      'ruby': 'ruby',
      'php': 'php',
    };

    return languageMap[normalized] || 'typescript';
  }

  /**
   * Parse pattern from string
   */
  private parsePattern(pattern: string): CodePattern {
    const normalized = pattern.toLowerCase().trim();

    if (normalized.includes('class')) return 'class';
    if (normalized.includes('function') || normalized.includes('method')) return 'function';
    if (normalized.includes('api') || normalized.includes('endpoint')) return 'api-endpoint';
    if (normalized.includes('model') || normalized.includes('schema')) return 'data-model';
    if (normalized.includes('service')) return 'service';
    if (normalized.includes('component')) return 'component';
    if (normalized.includes('test')) return 'test';
    if (normalized.includes('util')) return 'utility';

    return 'function';
  }

  /**
   * Infer name from description
   */
  private inferNameFromDescription(description: string): string {
    // Extract first capitalized word or phrase
    const words = description.split(' ');
    const capitalizedWords = words.filter(w => /^[A-Z]/.test(w));

    if (capitalizedWords.length > 0) {
      return capitalizedWords.slice(0, 2).join('');
    }

    // Default to first few words in camelCase
    return words.slice(0, 3)
      .map((w, i) => i === 0 ? w.toLowerCase() : w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Infer pattern from description
   */
  private inferPattern(description: string): CodePattern {
    const lower = description.toLowerCase();

    if (lower.includes('class') || lower.includes('object')) return 'class';
    if (lower.includes('api') || lower.includes('endpoint') || lower.includes('route')) return 'api-endpoint';
    if (lower.includes('model') || lower.includes('schema') || lower.includes('entity')) return 'data-model';
    if (lower.includes('service') || lower.includes('manager')) return 'service';
    if (lower.includes('component') || lower.includes('widget')) return 'component';
    if (lower.includes('test') || lower.includes('spec')) return 'test';
    if (lower.includes('util') || lower.includes('helper')) return 'utility';

    return 'function';
  }

  /**
   * Parse examples from text
   */
  parseExamples(text: string): SpecExample[] {
    const examples: SpecExample[] = [];
    const lines = text.split('\n');

    let currentExample: Partial<SpecExample> | null = null;

    for (const line of lines) {
      if (line.toLowerCase().includes('input:')) {
        if (currentExample) {
          examples.push(currentExample as SpecExample);
        }
        currentExample = { input: '', output: '', description: '' };
        currentExample.input = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.toLowerCase().includes('output:') && currentExample) {
        currentExample.output = line.substring(line.indexOf(':') + 1).trim();
      } else if (line.toLowerCase().includes('description:') && currentExample) {
        currentExample.description = line.substring(line.indexOf(':') + 1).trim();
      }
    }

    if (currentExample) {
      examples.push(currentExample as SpecExample);
    }

    return examples;
  }
}
