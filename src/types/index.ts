/**
 * Core type definitions for Taurus CLI
 */

import type { McpServerConfig as ImportedMcpServerConfig } from '../mcp/types.js';

// Re-export MCP types
export type { McpServerConfig } from '../mcp/types.js';

// Local type alias for use in this file
type McpServerConfig = ImportedMcpServerConfig;

export interface Message {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
}

export type ContentBlock = TextBlock | ToolUseBlock | ToolResultBlock;

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, any>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  tool_use_id: string;
  content: string;
  is_error?: boolean;
}

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
}

export interface ToolExecutor {
  execute(input: Record<string, any>): Promise<ToolResult>;
}

export interface ToolResult {
  content: string;
  is_error?: boolean;
}

export interface Config {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  workingDirectory: string;
  sessionDirectory: string;
  hooksEnabled: boolean;
  mcpServers: McpServerConfig[];

  // Multi-Model Provider Support
  providers?: {
    anthropic?: {
      apiKey: string;
      models: string[];
    };
    openai?: {
      apiKey: string;
      models: string[];
    };
    ollama?: {
      baseUrl: string;
      models: string[];
    };
  };

  // Collaborative Sessions
  collaboration?: {
    enabled: boolean;
    serverPort?: number;
    serverHost?: string;
  };

  // Context-Aware Integrations
  integrations?: {
    jira?: {
      url: string;
      email: string;
      apiToken: string;
    };
    github?: {
      token: string;
    };
    slack?: {
      token: string;
      lookbackDays?: number;
    };
    confluence?: {
      url: string;
      email: string;
      apiToken: string;
    };
  };

  // Time-Travel Replay
  replay?: {
    enabled: boolean;
    snapshotInterval?: number;
    maxSnapshots?: number;
  };

  // AI-Powered Scheduler
  scheduler?: {
    enabled: boolean;
    tasks?: Array<{
      name: string;
      description: string;
      schedule: string;
      type: string;
      enabled: boolean;
    }>;
  };

  // Phase 1 Features

  // Feature 6: AI Code Review Bot
  codeReview?: {
    enabled: boolean;
    autoReview: boolean;
    reviewOn: Array<'pull_request' | 'commit' | 'save'>;
    checks: Array<'style' | 'security' | 'performance' | 'testing' | 'documentation' | 'best-practices'>;
    severity: {
      blockOnCritical: boolean;
      blockOnHigh: boolean;
      warnOnMedium: boolean;
    };
    excludePatterns?: string[];
    includePatterns?: string[];
  };

  // Feature 8: Intelligent Dependency Manager
  dependencyManager?: {
    enabled: boolean;
    packageManager: 'npm' | 'yarn' | 'pnpm';
    autoUpdate: {
      security: 'immediately' | 'daily' | 'weekly' | 'monthly' | 'manual';
      patch: 'immediately' | 'daily' | 'weekly' | 'monthly' | 'manual';
      minor: 'immediately' | 'daily' | 'weekly' | 'monthly' | 'manual';
      major: 'immediately' | 'daily' | 'weekly' | 'monthly' | 'manual';
    };
    policies: {
      allowedLicenses: string[];
      blockedLicenses: string[];
      blockedPackages: string[];
    };
    optimization: {
      bundleSizeLimit?: number;
      suggestAlternatives: boolean;
      detectUnused: boolean;
    };
  };

  // Feature 15: Automated Documentation Writer
  documentation?: {
    enabled: boolean;
    output: string;
    formats: Array<'markdown' | 'html' | 'pdf' | 'json'>;
    features: {
      apiReference: boolean;
      tutorials: boolean;
      examples: boolean;
      diagrams: boolean;
      changelog: boolean;
    };
  };

  // Phase 2 Features

  // Feature 2: Smart Code Generation from Specs
  codeGeneration?: {
    enabled: boolean;
    defaultLanguage: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust';
    quality: 'fast' | 'balanced' | 'thorough';
    templates: {
      enabled: boolean;
      customTemplatesPath?: string;
    };
    validation: {
      syntaxCheck: boolean;
      linting: boolean;
      typeChecking: boolean;
    };
    testing: {
      generateTests: boolean;
      testFramework: string;
      coverageTarget: number;
    };
    documentation: {
      generateDocs: boolean;
      docStyle: 'jsdoc' | 'sphinx' | 'javadoc' | 'godoc' | 'inline';
    };
  };

  // Feature 4: Local Development Environment Orchestrator
  devEnvironment?: {
    enabled: boolean;
    projectName: string;
    services: Array<{
      name: string;
      type: 'database' | 'cache' | 'message-queue' | 'search' | 'storage' | 'api' | 'web' | 'worker' | 'custom';
      image?: string;
      ports?: Array<{ host: number; container: number }>;
      environment?: Record<string, string>;
      volumes?: string[];
      depends_on?: string[];
    }>;
    autoStart: boolean;
    healthCheck: {
      enabled: boolean;
      interval: number;
      timeout: number;
      retries: number;
    };
  };

  // Feature 5: AI Knowledge Base from Codebase
  knowledgeBase?: {
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
  };

  // Phase 3 Features

  // Feature 7: Performance Profiler & Optimizer
  performanceProfiler?: {
    enabled: boolean;
    profileTypes: Array<'cpu' | 'memory' | 'runtime' | 'network' | 'database'>;
    samplingInterval: number;
    reportPath: string;
    optimization: {
      enabled: boolean;
      level: 'aggressive' | 'moderate' | 'conservative';
      autoApply: boolean;
    };
    benchmarking: {
      enabled: boolean;
      iterations: number;
      warmupRuns: number;
    };
    monitoring: {
      realTime: boolean;
      alertThresholds: {
        cpu: number;
        memory: number;
        responseTime: number;
      };
    };
  };

  // Feature 9: Multi-Language Code Translation
  codeTranslator?: {
    enabled: boolean;
    quality: 'fast' | 'balanced' | 'accurate';
    preserveComments: boolean;
    preserveStyles: boolean;
    validation: {
      enabled: boolean;
      compileCheck: boolean;
    };
    optimization: {
      idiomaticCode: boolean;
      modernSyntax: boolean;
    };
  };

  // Feature 11: API Client Generator & Testing Suite
  apiGenerator?: {
    enabled: boolean;
    defaultLanguage: 'typescript' | 'javascript' | 'python' | 'java' | 'go' | 'rust';
    generateTests: boolean;
    generateDocs: boolean;
    authentication: {
      type: 'none' | 'basic' | 'bearer' | 'api-key' | 'oauth2';
      location?: 'header' | 'query' | 'cookie';
      name?: string;
    };
    client: {
      includeTypes: boolean;
      includeValidation: boolean;
      includeRetry: boolean;
      timeout: number;
    };
    testing: {
      framework: string;
      includeMocks: boolean;
      coverageTarget: number;
    };
  };

  // Phase 4 Features

  // Feature 8: Test Generation & Coverage Analysis
  testGenerator?: {
    enabled: boolean;
    framework: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'unittest' | 'junit' | 'testng' | 'go-test' | 'rust-test' | 'rspec';
    testTypes: Array<'unit' | 'integration' | 'e2e' | 'functional' | 'performance' | 'security' | 'snapshot'>;
    coverage: {
      enabled: boolean;
      threshold: {
        statements: number;
        branches: number;
        functions: number;
        lines: number;
      };
      reportFormats: Array<'text' | 'html' | 'json' | 'lcov' | 'cobertura' | 'clover'>;
      includeUntested: boolean;
      trackBranches: boolean;
    };
    generation: {
      generateMocks: boolean;
      generateFixtures: boolean;
      generateHelpers: boolean;
      edgeCases: boolean;
      errorCases: boolean;
      asyncTests: boolean;
    };
    quality: {
      minAssertions: number;
      requireDescriptions: boolean;
      isolateTests: boolean;
      deterministicTests: boolean;
    };
  };

  // Feature 10: Security Vulnerability Scanner
  securityScanner?: {
    enabled: boolean;
    scanTypes: Array<'static-analysis' | 'dependency-scan' | 'secret-detection' | 'configuration-audit' | 'best-practices'>;
    severity: {
      minimum: 'critical' | 'high' | 'medium' | 'low' | 'info';
      failOnSeverity: Array<'critical' | 'high' | 'medium' | 'low'>;
    };
    staticAnalysis: {
      enabled: boolean;
      rules: Array<string>;
      customRules?: string[];
      excludePatterns?: string[];
    };
    dependencyScanning: {
      enabled: boolean;
      sources: Array<'npm-audit' | 'snyk' | 'osv' | 'github-advisory'>;
      autoUpdate: boolean;
      excludePackages?: string[];
    };
    secretDetection: {
      enabled: boolean;
      patterns: Array<string>;
      excludeFiles?: string[];
    };
    reporting: {
      formats: Array<'json' | 'html' | 'markdown' | 'sarif' | 'csv'>;
      outputDir: string;
      includeRemediation: boolean;
      groupBy: 'severity' | 'type' | 'file';
    };
  };

  // Feature 12: Database Schema Manager & Migration Tool
  databaseManager?: {
    enabled: boolean;
    database: 'postgresql' | 'mysql' | 'sqlite' | 'mongodb' | 'mariadb' | 'mssql' | 'oracle';
    schemaLanguage: 'sql' | 'typescript' | 'prisma' | 'sequelize' | 'typeorm' | 'mongoose';
    migrations: {
      directory: string;
      tableName: string;
      generateTimestamp: boolean;
      transactional: boolean;
      lockTable: boolean;
    };
    schema: {
      directory: string;
      includeViews: boolean;
      includeIndexes: boolean;
      includeTriggers: boolean;
      namingConvention: 'snake_case' | 'camelCase' | 'PascalCase';
    };
    sync: {
      enabled: boolean;
      safe: boolean;
      dropUnused: boolean;
      backupBeforeSync: boolean;
    };
  };
}

export interface Session {
  id: string;
  messages: Message[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Hook {
  name: string;
  command: string;
  event: HookEvent;
  enabled: boolean;
}

export type HookEvent =
  | 'session-start'
  | 'session-end'
  | 'user-prompt-submit'
  | 'before-tool-call'
  | 'after-tool-call';

export interface SlashCommand {
  name: string;
  description: string;
  content: string;
  args?: string[];
}

export interface Skill {
  name: string;
  description: string;
  location: 'user' | 'system';
  prompt: string;
}

export interface Todo {
  content: string;
  status: 'pending' | 'in_progress' | 'completed';
  activeForm: string;
}

export interface AgentConfig {
  type: string;
  description: string;
  model?: 'sonnet' | 'opus' | 'haiku';
  tools: string[];
}

export const AGENT_TYPES: Record<string, AgentConfig> = {
  'general-purpose': {
    type: 'general-purpose',
    description: 'General-purpose agent for complex multi-step tasks',
    tools: ['*']
  },
  'Explore': {
    type: 'Explore',
    description: 'Fast agent specialized for exploring codebases',
    tools: ['Bash', 'Glob', 'Grep', 'Read', 'WebFetch']
  },
  'Plan': {
    type: 'Plan',
    description: 'Fast agent for planning and analysis',
    tools: ['Bash', 'Glob', 'Grep', 'Read', 'WebFetch']
  }
};
