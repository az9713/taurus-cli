/**
 * Translation Manager
 *
 * Manages code translation operations
 */

import { EventEmitter } from 'events';
import { ClaudeClient } from '../api/claude.js';
import { CodeTranslator } from './translator.js';
import { CodeParser } from './code-parser.js';
import {
  CodeTranslatorConfig,
  TranslationRequest,
  TranslationResult,
  SupportedLanguage,
} from './types.js';

export class TranslationManager extends EventEmitter {
  private config: CodeTranslatorConfig;
  private client: ClaudeClient;
  private translator: CodeTranslator;
  private parser: CodeParser;

  constructor(config: CodeTranslatorConfig, client: ClaudeClient) {
    super();
    this.config = config;
    this.client = client;
    this.translator = new CodeTranslator(client, config.quality);
    this.parser = new CodeParser();
  }

  /**
   * Translate code
   */
  async translate(request: TranslationRequest): Promise<TranslationResult> {
    this.emit('translation-start', {
      sourceLanguage: request.sourceLanguage,
      targetLanguage: request.targetLanguage,
    });

    try {
      const result = await this.translator.translate(request);

      // Validate if enabled
      if (this.config.validation.enabled) {
        await this.validateTranslation(result);
      }

      this.emit('translation-complete', {
        sourceLanguage: request.sourceLanguage,
        targetLanguage: request.targetLanguage,
        confidence: result.metadata.confidence,
      });

      return result;
    } catch (error: any) {
      this.emit('translation-error', { error });
      throw error;
    }
  }

  /**
   * Translate code from file
   */
  async translateCode(
    code: string,
    sourceLanguage: SupportedLanguage,
    targetLanguage: SupportedLanguage,
    options?: any
  ): Promise<string> {
    const result = await this.translate({
      sourceCode: code,
      sourceLanguage,
      targetLanguage,
      options,
    });

    return result.translatedCode;
  }

  /**
   * Batch translate multiple code snippets
   */
  async translateBatch(
    requests: TranslationRequest[]
  ): Promise<TranslationResult[]> {
    this.emit('batch-translation-start', { count: requests.length });

    const results: TranslationResult[] = [];

    for (const request of requests) {
      const result = await this.translate(request);
      results.push(result);
    }

    this.emit('batch-translation-complete', { count: results.length });

    return results;
  }

  /**
   * Get supported language pairs
   */
  getSupportedPairs(): Array<{
    from: SupportedLanguage;
    to: SupportedLanguage;
  }> {
    const languages: SupportedLanguage[] = [
      'typescript',
      'javascript',
      'python',
      'java',
      'go',
      'rust',
      'csharp',
      'ruby',
      'php',
      'kotlin',
      'swift',
      'cpp',
    ];

    const pairs: Array<{ from: SupportedLanguage; to: SupportedLanguage }> = [];

    for (const from of languages) {
      for (const to of languages) {
        if (from !== to) {
          pairs.push({ from, to });
        }
      }
    }

    return pairs;
  }

  /**
   * Detect source language
   */
  detectLanguage(code: string): SupportedLanguage {
    // Simple heuristic-based detection
    if (code.includes('function') && code.includes(':')) {
      return 'typescript';
    } else if (code.includes('function')) {
      return 'javascript';
    } else if (code.includes('def ')) {
      return 'python';
    } else if (code.includes('public class')) {
      return 'java';
    } else if (code.includes('func ')) {
      return 'go';
    } else if (code.includes('fn ')) {
      return 'rust';
    }

    return 'javascript'; // Default
  }

  /**
   * Validate translation
   */
  private async validateTranslation(result: TranslationResult): Promise<void> {
    // Parse the translated code to check structure
    try {
      const structure = this.parser.parse(
        result.translatedCode,
        result.targetLanguage
      );

      this.emit('validation-complete', {
        valid: true,
        structure,
      });
    } catch (error: any) {
      this.emit('validation-error', {
        valid: false,
        error: error.message,
      });
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CodeTranslatorConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<CodeTranslatorConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.quality) {
      this.translator.setQuality(config.quality);
    }
  }
}
