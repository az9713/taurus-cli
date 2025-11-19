/**
 * Knowledge Base Types
 *
 * Type definitions for AI-powered codebase knowledge base
 */

export type CodeElementType =
  | 'function'
  | 'class'
  | 'method'
  | 'interface'
  | 'type'
  | 'variable'
  | 'constant'
  | 'module'
  | 'file';

export type QueryType = 'semantic' | 'keyword' | 'hybrid';

export interface KnowledgeBaseConfig {
  enabled: boolean;
  indexPath: string;
  embeddingProvider: 'anthropic' | 'openai' | 'local';
  chunkSize: number;
  chunkOverlap: number;
  maxResults: number;
  similarityThreshold: number;
  indexing: {
    includePatterns: string[];
    excludePatterns: string[];
    languages: string[];
    parseComments: boolean;
    parseDocstrings: boolean;
  };
}

export interface CodeElement {
  id: string;
  type: CodeElementType;
  name: string;
  file: string;
  line: number;
  endLine: number;
  code: string;
  documentation?: string;
  signature?: string;
  parameters?: Parameter[];
  returnType?: string;
  references: Reference[];
  dependencies: string[];
  complexity?: number;
  metadata: ElementMetadata;
}

export interface Parameter {
  name: string;
  type: string;
  optional: boolean;
  defaultValue?: string;
  description?: string;
}

export interface Reference {
  file: string;
  line: number;
  type: 'import' | 'call' | 'usage' | 'inheritance' | 'implementation';
}

export interface ElementMetadata {
  language: string;
  tags: string[];
  visibility: 'public' | 'private' | 'protected';
  isAsync: boolean;
  isExported: boolean;
  createdAt: Date;
  modifiedAt: Date;
}

export interface CodeChunk {
  id: string;
  content: string;
  elementId?: string;
  file: string;
  startLine: number;
  endLine: number;
  embedding?: number[];
  keywords: string[];
  language: string;
}

export interface SearchQuery {
  query: string;
  type: QueryType;
  filters?: SearchFilters;
  maxResults?: number;
  threshold?: number;
}

export interface SearchFilters {
  filePatterns?: string[];
  languages?: string[];
  elementTypes?: CodeElementType[];
  tags?: string[];
}

export interface SearchResult {
  element: CodeElement;
  chunk?: CodeChunk;
  score: number;
  highlights: string[];
  context: ContextLines;
}

export interface ContextLines {
  before: string[];
  match: string;
  after: string[];
}

export interface KnowledgeGraph {
  nodes: GraphNode[];
  edges: GraphEdge[];
  clusters: Cluster[];
}

export interface GraphNode {
  id: string;
  type: CodeElementType;
  name: string;
  file: string;
  metadata: Record<string, any>;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'uses';
  weight: number;
}

export interface Cluster {
  id: string;
  name: string;
  nodes: string[];
  description?: string;
}

export interface CodebaseIndex {
  elements: Map<string, CodeElement>;
  chunks: Map<string, CodeChunk>;
  files: Map<string, FileIndex>;
  graph: KnowledgeGraph;
  metadata: IndexMetadata;
}

export interface FileIndex {
  path: string;
  language: string;
  elements: string[];
  imports: string[];
  exports: string[];
  linesOfCode: number;
  lastModified: Date;
  hash: string;
}

export interface IndexMetadata {
  version: string;
  createdAt: Date;
  updatedAt: Date;
  totalElements: number;
  totalChunks: number;
  totalFiles: number;
  languages: Set<string>;
}

export interface Question {
  text: string;
  context?: string[];
  requiresCode: boolean;
}

export interface Answer {
  text: string;
  confidence: number;
  sources: SearchResult[];
  code?: string;
  explanation?: string;
}

export interface IndexingProgress {
  phase: 'scanning' | 'parsing' | 'embedding' | 'indexing' | 'complete';
  filesProcessed: number;
  totalFiles: number;
  elementsExtracted: number;
  currentFile?: string;
  errors: string[];
}

export interface CodeRelationship {
  from: CodeElement;
  to: CodeElement;
  type: 'calls' | 'imports' | 'extends' | 'implements' | 'references';
  locations: Array<{ file: string; line: number }>;
}

export interface CodePattern {
  pattern: string;
  description: string;
  examples: CodeElement[];
  occurrences: number;
  category: 'design-pattern' | 'anti-pattern' | 'idiom' | 'architecture';
}

export interface CodebaseInsight {
  type: 'complexity' | 'coupling' | 'cohesion' | 'duplication' | 'coverage';
  score: number;
  description: string;
  affectedElements: CodeElement[];
  recommendations: string[];
}

export interface DocumentationGap {
  element: CodeElement;
  severity: 'high' | 'medium' | 'low';
  reason: string;
  suggestion: string;
}
