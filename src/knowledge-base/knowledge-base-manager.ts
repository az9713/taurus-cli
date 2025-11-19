/**
 * Knowledge Base Manager
 *
 * Main orchestrator for codebase knowledge base
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ClaudeClient } from '../api/claude.js';
import { CodeIndexer } from './code-indexer.js';
import { SemanticSearch } from './semantic-search.js';
import { QAEngine } from './qa-engine.js';
import {
  KnowledgeBaseConfig,
  CodebaseIndex,
  SearchQuery,
  SearchResult,
  Question,
  Answer,
  CodeElement,
  IndexingProgress,
  CodePattern,
  CodebaseInsight,
  DocumentationGap,
} from './types.js';

export class KnowledgeBaseManager extends EventEmitter {
  private config: KnowledgeBaseConfig;
  private client: ClaudeClient;
  private indexer: CodeIndexer;
  private searchEngine: SemanticSearch;
  private qaEngine: QAEngine;
  private index: CodebaseIndex | null;

  constructor(config: KnowledgeBaseConfig, client: ClaudeClient) {
    super();
    this.config = config;
    this.client = client;
    this.indexer = new CodeIndexer(
      process.cwd(),
      config.indexing.includePatterns,
      config.indexing.excludePatterns
    );
    this.searchEngine = new SemanticSearch(client);
    this.qaEngine = new QAEngine(client);
    this.index = null;
  }

  /**
   * Initialize knowledge base
   */
  async initialize(): Promise<void> {
    this.emit('initialization-start');

    try {
      // Try to load existing index
      const loaded = await this.loadIndex();

      if (!loaded) {
        // Build new index
        await this.buildIndex();
      }

      this.emit('initialization-complete');
    } catch (error: any) {
      this.emit('initialization-error', { error });
      throw error;
    }
  }

  /**
   * Build codebase index
   */
  async buildIndex(): Promise<void> {
    this.emit('indexing-start');

    const onProgress = (progress: IndexingProgress) => {
      this.emit('indexing-progress', progress);
    };

    try {
      this.index = await this.indexer.index(onProgress);

      // Set index for search and Q&A
      this.searchEngine.setIndex(this.index);
      this.qaEngine.setIndex(this.index);

      // Save index
      await this.saveIndex();

      this.emit('indexing-complete', {
        totalElements: this.index.metadata.totalElements,
        totalFiles: this.index.metadata.totalFiles,
      });
    } catch (error: any) {
      this.emit('indexing-error', { error });
      throw error;
    }
  }

  /**
   * Search codebase
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    this.emit('search-start', { query });

    try {
      const results = await this.searchEngine.search(query);
      this.emit('search-complete', { query, resultCount: results.length });
      return results;
    } catch (error: any) {
      this.emit('search-error', { query, error });
      throw error;
    }
  }

  /**
   * Ask a question
   */
  async ask(question: string, context?: string[]): Promise<Answer> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    this.emit('question-asked', { question });

    try {
      const answer = await this.qaEngine.answer({
        text: question,
        context,
        requiresCode: true,
      });

      this.emit('question-answered', { question, confidence: answer.confidence });
      return answer;
    } catch (error: any) {
      this.emit('question-error', { question, error });
      throw error;
    }
  }

  /**
   * Find similar code
   */
  async findSimilar(code: string): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    // Create temporary element for comparison
    const tempElement: CodeElement = {
      id: 'temp',
      type: 'function',
      name: 'temp',
      file: '',
      line: 0,
      endLine: 0,
      code,
      references: [],
      dependencies: [],
      metadata: {
        language: 'typescript',
        tags: [],
        visibility: 'public',
        isAsync: false,
        isExported: false,
        createdAt: new Date(),
        modifiedAt: new Date(),
      },
    };

    return await this.searchEngine.findSimilar(tempElement);
  }

  /**
   * Explain code
   */
  async explainCode(code: string, language?: string): Promise<string> {
    return await this.qaEngine.explainCode(code, language);
  }

  /**
   * Suggest improvements
   */
  async suggestImprovements(code: string, language?: string): Promise<string[]> {
    return await this.qaEngine.suggestImprovements(code, language);
  }

  /**
   * Find usage examples
   */
  async findUsageExamples(functionName: string): Promise<Answer> {
    return await this.qaEngine.findUsageExamples(functionName);
  }

  /**
   * Detect code patterns
   */
  async detectPatterns(): Promise<CodePattern[]> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    const patterns: CodePattern[] = [];

    // Detect singleton pattern
    const singletonClasses = Array.from(this.index.elements.values()).filter(
      e => e.type === 'class' && e.code.includes('private constructor')
    );

    if (singletonClasses.length > 0) {
      patterns.push({
        pattern: 'Singleton',
        description: 'Classes using the Singleton design pattern',
        examples: singletonClasses,
        occurrences: singletonClasses.length,
        category: 'design-pattern',
      });
    }

    // Detect factory pattern
    const factoryFunctions = Array.from(this.index.elements.values()).filter(
      e => e.type === 'function' && e.name.toLowerCase().includes('create')
    );

    if (factoryFunctions.length > 0) {
      patterns.push({
        pattern: 'Factory',
        description: 'Functions following factory pattern',
        examples: factoryFunctions.slice(0, 5),
        occurrences: factoryFunctions.length,
        category: 'design-pattern',
      });
    }

    return patterns;
  }

  /**
   * Analyze codebase insights
   */
  async analyzeInsights(): Promise<CodebaseInsight[]> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    const insights: CodebaseInsight[] = [];

    // Complexity insight
    const complexElements = Array.from(this.index.elements.values()).filter(
      e => (e.complexity || 0) > 10
    );

    if (complexElements.length > 0) {
      insights.push({
        type: 'complexity',
        score: complexElements.length / this.index.metadata.totalElements,
        description: `Found ${complexElements.length} high-complexity elements`,
        affectedElements: complexElements,
        recommendations: [
          'Consider refactoring complex functions into smaller units',
          'Add comprehensive tests for complex code',
          'Document complex algorithms clearly',
        ],
      });
    }

    return insights;
  }

  /**
   * Find documentation gaps
   */
  async findDocumentationGaps(): Promise<DocumentationGap[]> {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    const gaps: DocumentationGap[] = [];

    for (const [id, element] of this.index.elements.entries()) {
      // Check if public element lacks documentation
      if (
        element.metadata.visibility === 'public' &&
        element.metadata.isExported &&
        !element.documentation
      ) {
        gaps.push({
          element,
          severity: element.type === 'class' || element.type === 'function' ? 'high' : 'medium',
          reason: 'Missing documentation for public exported element',
          suggestion: `Add documentation explaining the purpose and usage of ${element.name}`,
        });
      }
    }

    return gaps.sort((a, b) => {
      const severityOrder = { high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Get knowledge graph
   */
  getKnowledgeGraph() {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    return this.index.graph;
  }

  /**
   * Get statistics
   */
  getStatistics() {
    if (!this.index) {
      throw new Error('Knowledge base not initialized');
    }

    return {
      totalElements: this.index.metadata.totalElements,
      totalChunks: this.index.metadata.totalChunks,
      totalFiles: this.index.metadata.totalFiles,
      languages: Array.from(this.index.metadata.languages),
      elementsByType: this.getElementsByType(),
      filesPerLanguage: this.getFilesPerLanguage(),
    };
  }

  /**
   * Save index to disk
   */
  private async saveIndex(): Promise<void> {
    if (!this.index) {
      return;
    }

    const indexPath = join(this.config.indexPath, 'codebase-index.json');

    // Convert Maps to Objects for JSON serialization
    const serializable = {
      elements: Array.from(this.index.elements.entries()),
      chunks: Array.from(this.index.chunks.entries()),
      files: Array.from(this.index.files.entries()),
      graph: this.index.graph,
      metadata: {
        ...this.index.metadata,
        languages: Array.from(this.index.metadata.languages),
      },
    };

    await fs.mkdir(this.config.indexPath, { recursive: true });
    await fs.writeFile(indexPath, JSON.stringify(serializable, null, 2));
  }

  /**
   * Load index from disk
   */
  private async loadIndex(): Promise<boolean> {
    try {
      const indexPath = join(this.config.indexPath, 'codebase-index.json');
      const data = await fs.readFile(indexPath, 'utf-8');
      const parsed = JSON.parse(data);

      this.index = {
        elements: new Map(parsed.elements),
        chunks: new Map(parsed.chunks),
        files: new Map(parsed.files),
        graph: parsed.graph,
        metadata: {
          ...parsed.metadata,
          languages: new Set(parsed.metadata.languages),
        },
      };

      this.searchEngine.setIndex(this.index);
      this.qaEngine.setIndex(this.index);

      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get elements by type
   */
  private getElementsByType(): Record<string, number> {
    if (!this.index) {
      return {};
    }

    const counts: Record<string, number> = {};

    for (const [id, element] of this.index.elements.entries()) {
      counts[element.type] = (counts[element.type] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get files per language
   */
  private getFilesPerLanguage(): Record<string, number> {
    if (!this.index) {
      return {};
    }

    const counts: Record<string, number> = {};

    for (const [path, file] of this.index.files.entries()) {
      counts[file.language] = (counts[file.language] || 0) + 1;
    }

    return counts;
  }

  /**
   * Get configuration
   */
  getConfig(): KnowledgeBaseConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<KnowledgeBaseConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
