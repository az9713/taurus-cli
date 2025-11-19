/**
 * Code Indexer
 *
 * Indexes codebase for semantic search and knowledge extraction
 */

import { promises as fs } from 'fs';
import { join, relative } from 'path';
import { glob } from 'glob';
import crypto from 'crypto';
import {
  CodebaseIndex,
  CodeElement,
  CodeChunk,
  FileIndex,
  KnowledgeGraph,
  IndexMetadata,
  IndexingProgress,
  CodeElementType,
} from './types.js';

export class CodeIndexer {
  private projectRoot: string;
  private includePatterns: string[];
  private excludePatterns: string[];

  constructor(
    projectRoot: string,
    includePatterns: string[] = ['**/*.ts', '**/*.js', '**/*.py'],
    excludePatterns: string[] = ['**/node_modules/**', '**/dist/**', '**/.git/**']
  ) {
    this.projectRoot = projectRoot;
    this.includePatterns = includePatterns;
    this.excludePatterns = excludePatterns;
  }

  /**
   * Index the entire codebase
   */
  async index(onProgress?: (progress: IndexingProgress) => void): Promise<CodebaseIndex> {
    const progress: IndexingProgress = {
      phase: 'scanning',
      filesProcessed: 0,
      totalFiles: 0,
      elementsExtracted: 0,
      errors: [],
    };

    // Scan for files
    const files = await this.scanFiles();
    progress.totalFiles = files.length;
    onProgress?.(progress);

    // Create index
    const index: CodebaseIndex = {
      elements: new Map(),
      chunks: new Map(),
      files: new Map(),
      graph: {
        nodes: [],
        edges: [],
        clusters: [],
      },
      metadata: {
        version: '1.0.0',
        createdAt: new Date(),
        updatedAt: new Date(),
        totalElements: 0,
        totalChunks: 0,
        totalFiles: 0,
        languages: new Set(),
      },
    };

    // Parse and index files
    progress.phase = 'parsing';
    onProgress?.(progress);

    for (const file of files) {
      try {
        progress.currentFile = file;
        const fileIndex = await this.indexFile(file);

        if (fileIndex) {
          index.files.set(file, fileIndex);

          // Extract elements
          const elements = await this.extractElements(file);
          elements.forEach(element => {
            index.elements.set(element.id, element);
            progress.elementsExtracted++;
          });

          // Create chunks
          const chunks = await this.createChunks(file);
          chunks.forEach(chunk => {
            index.chunks.set(chunk.id, chunk);
          });

          index.metadata.languages.add(fileIndex.language);
        }

        progress.filesProcessed++;
        onProgress?.(progress);
      } catch (error: any) {
        progress.errors.push(`Error indexing ${file}: ${error.message}`);
      }
    }

    // Build knowledge graph
    progress.phase = 'indexing';
    onProgress?.(progress);

    index.graph = await this.buildKnowledgeGraph(index.elements);

    // Update metadata
    index.metadata.totalElements = index.elements.size;
    index.metadata.totalChunks = index.chunks.size;
    index.metadata.totalFiles = index.files.size;

    progress.phase = 'complete';
    onProgress?.(progress);

    return index;
  }

  /**
   * Scan files matching patterns
   */
  private async scanFiles(): Promise<string[]> {
    const allFiles: string[] = [];

    for (const pattern of this.includePatterns) {
      const files = await glob(pattern, {
        cwd: this.projectRoot,
        ignore: this.excludePatterns,
        absolute: false,
      });
      allFiles.push(...files);
    }

    return [...new Set(allFiles)];
  }

  /**
   * Index a single file
   */
  private async indexFile(relativePath: string): Promise<FileIndex | null> {
    const fullPath = join(this.projectRoot, relativePath);

    try {
      const content = await fs.readFile(fullPath, 'utf-8');
      const stats = await fs.stat(fullPath);

      const language = this.detectLanguage(relativePath);
      const linesOfCode = content.split('\n').length;
      const hash = crypto.createHash('md5').update(content).digest('hex');

      return {
        path: relativePath,
        language,
        elements: [],
        imports: [],
        exports: [],
        linesOfCode,
        lastModified: stats.mtime,
        hash,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Extract code elements from file
   */
  private async extractElements(relativePath: string): Promise<CodeElement[]> {
    const fullPath = join(this.projectRoot, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const language = this.detectLanguage(relativePath);

    const elements: CodeElement[] = [];

    // Simple extraction based on language
    if (language === 'typescript' || language === 'javascript') {
      elements.push(...this.extractTypeScriptElements(content, relativePath));
    } else if (language === 'python') {
      elements.push(...this.extractPythonElements(content, relativePath));
    }

    return elements;
  }

  /**
   * Extract TypeScript/JavaScript elements
   */
  private extractTypeScriptElements(content: string, file: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Functions
      const funcMatch = line.match(/(?:export\s+)?(?:async\s+)?function\s+(\w+)/);
      if (funcMatch) {
        elements.push({
          id: `${file}:${funcMatch[1]}:${i}`,
          type: 'function',
          name: funcMatch[1],
          file,
          line: i + 1,
          endLine: i + 1,
          code: line,
          references: [],
          dependencies: [],
          metadata: {
            language: 'typescript',
            tags: [],
            visibility: 'public',
            isAsync: line.includes('async'),
            isExported: line.includes('export'),
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
      }

      // Classes
      const classMatch = line.match(/(?:export\s+)?class\s+(\w+)/);
      if (classMatch) {
        elements.push({
          id: `${file}:${classMatch[1]}:${i}`,
          type: 'class',
          name: classMatch[1],
          file,
          line: i + 1,
          endLine: i + 1,
          code: line,
          references: [],
          dependencies: [],
          metadata: {
            language: 'typescript',
            tags: [],
            visibility: 'public',
            isAsync: false,
            isExported: line.includes('export'),
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
      }

      // Interfaces
      const interfaceMatch = line.match(/(?:export\s+)?interface\s+(\w+)/);
      if (interfaceMatch) {
        elements.push({
          id: `${file}:${interfaceMatch[1]}:${i}`,
          type: 'interface',
          name: interfaceMatch[1],
          file,
          line: i + 1,
          endLine: i + 1,
          code: line,
          references: [],
          dependencies: [],
          metadata: {
            language: 'typescript',
            tags: [],
            visibility: 'public',
            isAsync: false,
            isExported: line.includes('export'),
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
      }
    }

    return elements;
  }

  /**
   * Extract Python elements
   */
  private extractPythonElements(content: string, file: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = content.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Functions
      const funcMatch = line.match(/^def\s+(\w+)\s*\(/);
      if (funcMatch) {
        elements.push({
          id: `${file}:${funcMatch[1]}:${i}`,
          type: 'function',
          name: funcMatch[1],
          file,
          line: i + 1,
          endLine: i + 1,
          code: line,
          references: [],
          dependencies: [],
          metadata: {
            language: 'python',
            tags: [],
            visibility: funcMatch[1].startsWith('_') ? 'private' : 'public',
            isAsync: line.includes('async def'),
            isExported: !funcMatch[1].startsWith('_'),
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
      }

      // Classes
      const classMatch = line.match(/^class\s+(\w+)/);
      if (classMatch) {
        elements.push({
          id: `${file}:${classMatch[1]}:${i}`,
          type: 'class',
          name: classMatch[1],
          file,
          line: i + 1,
          endLine: i + 1,
          code: line,
          references: [],
          dependencies: [],
          metadata: {
            language: 'python',
            tags: [],
            visibility: classMatch[1].startsWith('_') ? 'private' : 'public',
            isAsync: false,
            isExported: !classMatch[1].startsWith('_'),
            createdAt: new Date(),
            modifiedAt: new Date(),
          },
        });
      }
    }

    return elements;
  }

  /**
   * Create code chunks for embedding
   */
  private async createChunks(
    relativePath: string,
    chunkSize: number = 500,
    overlap: number = 50
  ): Promise<CodeChunk[]> {
    const fullPath = join(this.projectRoot, relativePath);
    const content = await fs.readFile(fullPath, 'utf-8');
    const language = this.detectLanguage(relativePath);
    const lines = content.split('\n');

    const chunks: CodeChunk[] = [];
    let currentChunk = '';
    let startLine = 0;

    for (let i = 0; i < lines.length; i++) {
      currentChunk += lines[i] + '\n';

      if (currentChunk.length >= chunkSize || i === lines.length - 1) {
        chunks.push({
          id: `${relativePath}:chunk:${startLine}`,
          content: currentChunk.trim(),
          file: relativePath,
          startLine: startLine + 1,
          endLine: i + 1,
          keywords: this.extractKeywords(currentChunk),
          language,
        });

        // Start next chunk with overlap
        const overlapLines = Math.min(overlap, i - startLine);
        currentChunk = lines.slice(i - overlapLines + 1, i + 1).join('\n') + '\n';
        startLine = i - overlapLines + 1;
      }
    }

    return chunks;
  }

  /**
   * Build knowledge graph from elements
   */
  private async buildKnowledgeGraph(
    elements: Map<string, CodeElement>
  ): Promise<KnowledgeGraph> {
    const graph: KnowledgeGraph = {
      nodes: [],
      edges: [],
      clusters: [],
    };

    // Create nodes
    elements.forEach(element => {
      graph.nodes.push({
        id: element.id,
        type: element.type,
        name: element.name,
        file: element.file,
        metadata: {
          line: element.line,
          visibility: element.metadata.visibility,
        },
      });
    });

    // Create edges (simplified - would need full AST parsing for accuracy)
    // This is a placeholder for demonstration
    elements.forEach(element => {
      element.references.forEach(ref => {
        const target = Array.from(elements.values()).find(
          e => e.file === ref.file && e.line === ref.line
        );

        if (target) {
          graph.edges.push({
            source: element.id,
            target: target.id,
            type: ref.type as any,
            weight: 1,
          });
        }
      });
    });

    return graph;
  }

  /**
   * Detect programming language from file path
   */
  private detectLanguage(filePath: string): string {
    const ext = filePath.split('.').pop()?.toLowerCase() || '';

    const languageMap: Record<string, string> = {
      'ts': 'typescript',
      'tsx': 'typescript',
      'js': 'javascript',
      'jsx': 'javascript',
      'py': 'python',
      'java': 'java',
      'go': 'go',
      'rs': 'rust',
      'cs': 'csharp',
      'rb': 'ruby',
      'php': 'php',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction - remove common words
    const commonWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'if', 'for', 'while', 'return']);
    const words = text.toLowerCase().match(/\b\w+\b/g) || [];

    return [...new Set(words.filter(word => !commonWords.has(word) && word.length > 2))];
  }
}
