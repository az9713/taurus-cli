/**
 * Semantic Search
 *
 * Semantic search over indexed codebase using embeddings
 */

import { ClaudeClient } from '../api/claude.js';
import {
  CodebaseIndex,
  SearchQuery,
  SearchResult,
  SearchFilters,
  ContextLines,
  CodeChunk,
  CodeElement,
} from './types.js';

export class SemanticSearch {
  private client: ClaudeClient;
  private index: CodebaseIndex | null;

  constructor(client: ClaudeClient) {
    this.client = client;
    this.index = null;
  }

  /**
   * Set the codebase index
   */
  setIndex(index: CodebaseIndex): void {
    this.index = index;
  }

  /**
   * Search the codebase
   */
  async search(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    switch (query.type) {
      case 'semantic':
        return await this.semanticSearch(query);
      case 'keyword':
        return this.keywordSearch(query);
      case 'hybrid':
        return await this.hybridSearch(query);
      default:
        return await this.semanticSearch(query);
    }
  }

  /**
   * Semantic search using embeddings
   */
  private async semanticSearch(query: SearchQuery): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    const results: SearchResult[] = [];

    // For demonstration, using keyword matching
    // In production, would use actual embeddings and vector similarity
    const queryKeywords = this.extractKeywords(query.query.toLowerCase());

    for (const [id, chunk] of this.index.chunks.entries()) {
      // Apply filters
      if (!this.matchesFilters(chunk, query.filters)) {
        continue;
      }

      // Calculate similarity score (simplified)
      const score = this.calculateSimilarity(queryKeywords, chunk.keywords);

      if (score >= (query.threshold || 0.5)) {
        const element = Array.from(this.index.elements.values()).find(
          e => e.id === chunk.elementId
        );

        if (element) {
          results.push({
            element,
            chunk,
            score,
            highlights: this.findHighlights(query.query, chunk.content),
            context: await this.getContext(chunk),
          });
        }
      }
    }

    // Sort by score and limit results
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.maxResults || 10);
  }

  /**
   * Keyword search
   */
  private keywordSearch(query: SearchQuery): SearchResult[] {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    const results: SearchResult[] = [];
    const queryLower = query.query.toLowerCase();

    for (const [id, element] of this.index.elements.entries()) {
      // Apply filters
      if (query.filters && !this.matchesElementFilters(element, query.filters)) {
        continue;
      }

      // Check if query matches element
      const matches =
        element.name.toLowerCase().includes(queryLower) ||
        element.code.toLowerCase().includes(queryLower) ||
        (element.documentation && element.documentation.toLowerCase().includes(queryLower));

      if (matches) {
        results.push({
          element,
          score: this.calculateKeywordScore(queryLower, element),
          highlights: this.findHighlights(query.query, element.code),
          context: this.getElementContext(element),
        });
      }
    }

    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, query.maxResults || 10);
  }

  /**
   * Hybrid search (combination of semantic and keyword)
   */
  private async hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
    const semanticResults = await this.semanticSearch({ ...query, maxResults: 20 });
    const keywordResults = this.keywordSearch({ ...query, maxResults: 20 });

    // Merge and deduplicate results
    const merged = new Map<string, SearchResult>();

    semanticResults.forEach(result => {
      merged.set(result.element.id, result);
    });

    keywordResults.forEach(result => {
      if (merged.has(result.element.id)) {
        // Boost score for results in both
        const existing = merged.get(result.element.id)!;
        existing.score = (existing.score + result.score) / 2 * 1.5;
      } else {
        merged.set(result.element.id, result);
      }
    });

    return Array.from(merged.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, query.maxResults || 10);
  }

  /**
   * Find similar code
   */
  async findSimilar(element: CodeElement, limit: number = 5): Promise<SearchResult[]> {
    if (!this.index) {
      throw new Error('Index not loaded');
    }

    const results: SearchResult[] = [];
    const sourceKeywords = this.extractKeywords(element.code.toLowerCase());

    for (const [id, candidate] of this.index.elements.entries()) {
      if (candidate.id === element.id) {
        continue;
      }

      const targetKeywords = this.extractKeywords(candidate.code.toLowerCase());
      const score = this.calculateSimilarity(sourceKeywords, targetKeywords);

      if (score > 0.3) {
        results.push({
          element: candidate,
          score,
          highlights: [],
          context: this.getElementContext(candidate),
        });
      }
    }

    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  }

  /**
   * Calculate similarity between keyword sets
   */
  private calculateSimilarity(keywords1: string[], keywords2: string[]): number {
    const set1 = new Set(keywords1);
    const set2 = new Set(keywords2);

    const intersection = new Set([...set1].filter(x => set2.has(x)));
    const union = new Set([...set1, ...set2]);

    return union.size > 0 ? intersection.size / union.size : 0;
  }

  /**
   * Calculate keyword score for element
   */
  private calculateKeywordScore(query: string, element: CodeElement): number {
    let score = 0;

    // Exact name match
    if (element.name.toLowerCase() === query) {
      score += 1.0;
    } else if (element.name.toLowerCase().includes(query)) {
      score += 0.8;
    }

    // Documentation match
    if (element.documentation && element.documentation.toLowerCase().includes(query)) {
      score += 0.5;
    }

    // Code match
    if (element.code.toLowerCase().includes(query)) {
      score += 0.3;
    }

    return Math.min(score, 1.0);
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'if', 'for', 'while', 'return']);
    const words = text.match(/\b\w+\b/g) || [];

    return [...new Set(words.filter(word => !commonWords.has(word) && word.length > 2))];
  }

  /**
   * Find highlights in text
   */
  private findHighlights(query: string, text: string, maxHighlights: number = 3): string[] {
    const highlights: string[] = [];
    const queryLower = query.toLowerCase();
    const lines = text.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes(queryLower) && highlights.length < maxHighlights) {
        highlights.push(line.trim());
      }
    }

    return highlights;
  }

  /**
   * Get context lines for chunk
   */
  private async getContext(chunk: CodeChunk): Promise<ContextLines> {
    const lines = chunk.content.split('\n');
    const contextSize = 3;

    return {
      before: lines.slice(0, Math.min(contextSize, lines.length)),
      match: lines[Math.min(contextSize, lines.length)] || '',
      after: lines.slice(-Math.min(contextSize, lines.length)),
    };
  }

  /**
   * Get context for element
   */
  private getElementContext(element: CodeElement): ContextLines {
    const lines = element.code.split('\n');

    return {
      before: [],
      match: lines[0] || '',
      after: lines.slice(1),
    };
  }

  /**
   * Check if chunk matches filters
   */
  private matchesFilters(chunk: CodeChunk, filters?: SearchFilters): boolean {
    if (!filters) {
      return true;
    }

    if (filters.languages && !filters.languages.includes(chunk.language)) {
      return false;
    }

    if (filters.filePatterns) {
      const matches = filters.filePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(chunk.file);
      });

      if (!matches) {
        return false;
      }
    }

    return true;
  }

  /**
   * Check if element matches filters
   */
  private matchesElementFilters(element: CodeElement, filters: SearchFilters): boolean {
    if (filters.languages && !filters.languages.includes(element.metadata.language)) {
      return false;
    }

    if (filters.elementTypes && !filters.elementTypes.includes(element.type)) {
      return false;
    }

    if (filters.tags && !filters.tags.some(tag => element.metadata.tags.includes(tag))) {
      return false;
    }

    if (filters.filePatterns) {
      const matches = filters.filePatterns.some(pattern => {
        const regex = new RegExp(pattern.replace(/\*/g, '.*'));
        return regex.test(element.file);
      });

      if (!matches) {
        return false;
      }
    }

    return true;
  }
}
