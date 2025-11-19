/**
 * Code Translator
 *
 * Translates code between programming languages
 */

import { ClaudeClient } from '../api/claude.js';
import { CodeParser } from './code-parser.js';
import {
  SupportedLanguage,
  TranslationRequest,
  TranslationResult,
  TranslationOptions,
  TranslationQuality,
  TranslationWarning,
  CodeStructure,
} from './types.js';

export class CodeTranslator {
  private client: ClaudeClient;
  private parser: CodeParser;
  private quality: TranslationQuality;

  constructor(client: ClaudeClient, quality: TranslationQuality = 'balanced') {
    this.client = client;
    this.parser = new CodeParser();
    this.quality = quality;
  }

  /**
   * Translate code from one language to another
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    const { sourceCode, sourceLanguage, targetLanguage, options = {} } = request;

    // Parse source code structure
    const sourceStructure = this.parser.parse(sourceCode, sourceLanguage);

    // Build translation prompt
    const prompt = this.buildTranslationPrompt(
      sourceCode,
      sourceLanguage,
      targetLanguage,
      sourceStructure,
      options
    );

    // Perform translation
    const translatedCode = await this.client.generateText(prompt);

    // Extract code from response
    const cleanCode = this.extractCode(translatedCode);

    // Analyze translation
    const warnings = this.analyzeTranslation(sourceStructure, targetLanguage);
    const confidence = this.calculateConfidence(sourceCode, cleanCode, warnings);

    return {
      success: true,
      translatedCode: cleanCode,
      sourceLanguage,
      targetLanguage,
      metadata: {
        translatedAt: new Date(),
        quality: this.quality,
        linesOfCode: cleanCode.split('\n').length,
        preservedFeatures: this.identifyPreservedFeatures(sourceStructure, targetLanguage),
        addedDependencies: [],
        removedFeatures: [],
        confidence,
      },
      warnings,
      suggestions: this.generateSuggestions(warnings),
    };
  }

  /**
   * Translate multiple files
   */
  async translateBatch(
    requests: TranslationRequest[]
  ): Promise<TranslationResult[]> {
    const results: TranslationResult[] = [];

    for (const request of requests) {
      const result = await this.translate(request);
      results.push(result);
    }

    return results;
  }

  /**
   * Build translation prompt
   */
  private buildTranslationPrompt(
    code: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    structure: CodeStructure,
    options: TranslationOptions
  ): string {
    let prompt = `Translate the following ${sourceLanguage} code to ${targetLanguage}:\n\n`;

    prompt += `Source Code:\n\`\`\`${sourceLanguage}\n${code}\n\`\`\`\n\n`;

    prompt += 'Requirements:\n';
    prompt += `- Maintain the same functionality and logic\n`;
    prompt += `- Use ${targetLanguage} best practices and idioms\n`;
    prompt += `- Ensure the code is syntactically correct\n`;

    if (options.preserveComments) {
      prompt += '- Preserve all comments and documentation\n';
    }

    if (options.preserveStructure) {
      prompt += '- Maintain the same class and function structure\n';
    }

    if (options.optimizeForPerformance) {
      prompt += `- Optimize for ${targetLanguage} performance\n`;
    }

    if (options.targetFramework) {
      prompt += `- Use ${options.targetFramework} framework conventions\n`;
    }

    prompt += '\nImportant:\n';
    prompt += '- Return only the translated code, no explanations\n';
    prompt += `- Use proper ${targetLanguage} syntax and conventions\n`;
    prompt += '- Add necessary imports and dependencies\n';

    if (structure.classes.length > 0) {
      prompt += `- The code contains ${structure.classes.length} class(es)\n`;
    }

    if (structure.functions.length > 0) {
      prompt += `- The code contains ${structure.functions.length} function(s)\n`;
    }

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
   * Analyze translation for potential issues
   */
  private analyzeTranslation(
    sourceStructure: CodeStructure,
    targetLanguage: SupportedLanguage
  ): TranslationWarning[] {
    const warnings: TranslationWarning[] = [];

    // Check for language feature mismatches
    const featureMismatches = this.checkFeatureSupport(sourceStructure, targetLanguage);
    warnings.push(...featureMismatches);

    return warnings;
  }

  /**
   * Check feature support in target language
   */
  private checkFeatureSupport(
    structure: CodeStructure,
    targetLanguage: SupportedLanguage
  ): TranslationWarning[] {
    const warnings: TranslationWarning[] = [];

    // Check for async/await support
    const hasAsync = structure.functions.some(f => f.isAsync);
    if (hasAsync && !this.supportsAsync(targetLanguage)) {
      warnings.push({
        type: 'feature-mismatch',
        severity: 'high',
        message: `${targetLanguage} may not support async/await syntax`,
        suggestion: 'Consider using callbacks or promises instead',
      });
    }

    // Check for class support
    const hasClasses = structure.classes.length > 0;
    if (hasClasses && !this.supportsClasses(targetLanguage)) {
      warnings.push({
        type: 'feature-mismatch',
        severity: 'high',
        message: `${targetLanguage} may have different class semantics`,
        suggestion: 'Review translated class structure carefully',
      });
    }

    return warnings;
  }

  /**
   * Check if language supports async/await
   */
  private supportsAsync(language: SupportedLanguage): boolean {
    return ['typescript', 'javascript', 'python', 'csharp', 'rust'].includes(language);
  }

  /**
   * Check if language supports classes
   */
  private supportsClasses(language: SupportedLanguage): boolean {
    return !['go'].includes(language);
  }

  /**
   * Identify preserved features
   */
  private identifyPreservedFeatures(
    structure: CodeStructure,
    targetLanguage: SupportedLanguage
  ): string[] {
    const features: string[] = [];

    if (structure.classes.length > 0 && this.supportsClasses(targetLanguage)) {
      features.push('class-structure');
    }

    if (structure.functions.some(f => f.isAsync) && this.supportsAsync(targetLanguage)) {
      features.push('async-await');
    }

    if (structure.imports.length > 0) {
      features.push('module-imports');
    }

    return features;
  }

  /**
   * Calculate translation confidence
   */
  private calculateConfidence(
    sourceCode: string,
    translatedCode: string,
    warnings: TranslationWarning[]
  ): number {
    let confidence = 100;

    // Reduce confidence based on warnings
    const highWarnings = warnings.filter(w => w.severity === 'high').length;
    const mediumWarnings = warnings.filter(w => w.severity === 'medium').length;

    confidence -= highWarnings * 15;
    confidence -= mediumWarnings * 5;

    // Reduce if size differs significantly
    const sizeDiff = Math.abs(sourceCode.length - translatedCode.length) / sourceCode.length;
    if (sizeDiff > 0.5) {
      confidence -= 10;
    }

    return Math.max(0, Math.min(100, confidence));
  }

  /**
   * Generate suggestions from warnings
   */
  private generateSuggestions(warnings: TranslationWarning[]): string[] {
    const suggestions: string[] = [];

    if (warnings.length > 0) {
      suggestions.push('Review the translated code carefully');
      suggestions.push('Test all functionality to ensure correct behavior');
    }

    const featureMismatches = warnings.filter(w => w.type === 'feature-mismatch');
    if (featureMismatches.length > 0) {
      suggestions.push('Some language features may have been adapted - verify behavior');
    }

    return suggestions;
  }

  /**
   * Set translation quality
   */
  setQuality(quality: TranslationQuality): void {
    this.quality = quality;
  }
}
