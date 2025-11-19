/**
 * Taurus CLI Library Exports
 *
 * Main entry point for programmatic use of Taurus CLI
 */

// Core
export { AgentOrchestrator } from './agent/orchestrator.js';
export { ClaudeClient } from './api/claude.js';
export { ConfigManager } from './config/manager.js';
export { SessionManager } from './session/manager.js';
export { HooksManager } from './hooks/manager.js';
export { createToolRegistry, ToolRegistry } from './tools/index.js';
export { REPL } from './cli/repl.js';

// MCP
export { McpManager } from './mcp/manager.js';
export type { McpServerConfig, McpTool } from './mcp/types.js';

// Types
export type {
  Config,
  Message,
  ContentBlock,
  TextBlock,
  ToolUseBlock,
  ToolResultBlock,
  Tool,
  ToolResult,
  Session,
  Hook,
  HookEvent,
  SlashCommand,
  Skill,
  Todo,
  AgentConfig,
} from './types/index.js';

// Feature 1: Multi-Model Provider Support
export { BaseProvider } from './providers/base.js';
export { AnthropicProvider } from './providers/anthropic.js';
export { OpenAIProvider } from './providers/openai.js';
export { OllamaProvider } from './providers/ollama.js';
export { ProviderManager } from './providers/manager.js';
export type {
  ProviderType,
  ProviderConfig,
  ProviderCapabilities,
  Message as ProviderMessage,
  GenerateOptions,
  GenerateResponse,
  RoutingRule,
  ProviderUsage,
} from './providers/types.js';

// Feature 2: Collaborative Sessions
export { CollaborationServer } from './collaboration/server.js';
export { CollaborationClient } from './collaboration/client.js';
export type {
  CollaborativeUser,
  CollaborativeSession,
  SessionPermissions,
  CollaborativeMessage,
  SyncEvent,
} from './collaboration/types.js';

// Feature 3: Context-Aware Integrations Hub
export { BaseIntegration } from './integrations/base.js';
export { JiraIntegration } from './integrations/jira.js';
export { GitHubIntegration } from './integrations/github.js';
export { SlackIntegration } from './integrations/slack.js';
export { ConfluenceIntegration } from './integrations/confluence.js';
export { IntegrationManager } from './integrations/manager.js';
export type {
  ContextItem,
  ContextSource,
  IntegrationConfig,
  ContextRule,
} from './integrations/types.js';

// Feature 4: Time-Travel Session Replay
export { SnapshotManager } from './replay/snapshot-manager.js';
export { ReplayEngine } from './replay/replay-engine.js';
export type {
  Snapshot,
  FileSnapshot,
  Timeline,
  DiffResult,
} from './replay/types.js';

// Feature 5: AI-Powered Cron Jobs
export { TaskExecutor } from './scheduler/task-executor.js';
export { SchedulerManager } from './scheduler/scheduler-manager.js';
export type {
  ScheduledTask,
  TaskExecution,
  TaskFinding,
  TaskHistory,
  SchedulerConfig,
} from './scheduler/types.js';

// Utilities
export { logger } from './utils/logger.js';

// Default configurations
export { DEFAULT_CONFIG, SYSTEM_PROMPT } from './config/default.js';

// Phase 1 Features

// Feature 6: AI Code Review Bot
export { CodeReviewer } from './code-review/reviewer.js';
export { StyleAnalyzer } from './code-review/analyzers/style-analyzer.js';
export { SecurityAnalyzer } from './code-review/analyzers/security-analyzer.js';
export { PerformanceAnalyzer } from './code-review/analyzers/performance-analyzer.js';
export { TestAnalyzer } from './code-review/analyzers/test-analyzer.js';
export type {
  CodeReviewConfig,
  ReviewFinding,
  ReviewResult,
  ReviewSeverity,
  ReviewCategory,
  PRReviewRequest,
  SecurityVulnerability,
  PerformanceIssue,
} from './code-review/types.js';

// Feature 8: Intelligent Dependency Manager
export { DependencyManager } from './dependency-manager/manager.js';
export { DependencyScanner } from './dependency-manager/scanner.js';
export { SecurityChecker } from './dependency-manager/security-checker.js';
export { UpdateAnalyzer } from './dependency-manager/update-analyzer.js';
export { LicenseChecker } from './dependency-manager/license-checker.js';
export type {
  DependencyManagerConfig,
  DependencyInfo,
  UpdateReport,
  UpdateAnalysis,
  Vulnerability,
  LicenseType,
  UnusedDependency,
} from './dependency-manager/types.js';

// Feature 15: Automated Documentation Writer
export { DocumentationManager } from './documentation/doc-manager.js';
export { CodeExtractor } from './documentation/extractors/code-extractor.js';
export { MarkdownGenerator } from './documentation/generators/markdown-generator.js';
export type {
  DocumentationConfig,
  FunctionDoc,
  ClassDoc,
  InterfaceDoc,
  Tutorial,
  CodeExample,
  APIEndpoint,
  Diagram,
} from './documentation/types.js';

// Phase 2 Features

// Feature 2: Smart Code Generation from Specs
export { GenerationManager } from './code-generation/generation-manager.js';
export { SpecParser } from './code-generation/spec-parser.js';
export { CodeGenerator } from './code-generation/code-generator.js';
export { TestGenerator } from './code-generation/test-generator.js';
export { CodeValidator } from './code-generation/code-validator.js';
export { TemplateManager } from './code-generation/template-manager.js';
export type {
  CodeGenerationConfig,
  GenerationSpec,
  GeneratedCode,
  GenerationResult,
  TargetLanguage,
  CodePattern,
  Template,
  ValidationResult,
} from './code-generation/types.js';

// Feature 4: Local Development Environment Orchestrator
export { EnvironmentOrchestrator } from './dev-environment/environment-orchestrator.js';
export { ServiceManager } from './dev-environment/service-manager.js';
export { DatabaseConfigurator } from './dev-environment/database-configurator.js';
export { TemplateRepository } from './dev-environment/template-repository.js';
export type {
  DevEnvironmentConfig,
  ServiceConfig,
  Environment,
  Service,
  OrchestrationResult,
  DatabaseEngine,
  DatabaseConnection,
  ServiceTemplate,
} from './dev-environment/types.js';

// Feature 5: AI Knowledge Base from Codebase
export { KnowledgeBaseManager } from './knowledge-base/knowledge-base-manager.js';
export { CodeIndexer } from './knowledge-base/code-indexer.js';
export { SemanticSearch } from './knowledge-base/semantic-search.js';
export { QAEngine } from './knowledge-base/qa-engine.js';
export type {
  KnowledgeBaseConfig,
  CodebaseIndex,
  CodeElement,
  SearchQuery,
  SearchResult,
  Question,
  Answer,
  KnowledgeGraph,
  CodePattern as KBCodePattern,
  CodebaseInsight,
} from './knowledge-base/types.js';

// Phase 3 Features

// Feature 7: Performance Profiler & Optimizer
export { PerformanceProfilerManager } from './performance-profiler/performance-profiler.js';
export { CPUProfiler } from './performance-profiler/cpu-profiler.js';
export { MemoryProfiler } from './performance-profiler/memory-profiler.js';
export { PerformanceOptimizer } from './performance-profiler/optimizer.js';
export { Benchmarker } from './performance-profiler/benchmarker.js';
export type {
  PerformanceProfilerConfig,
  ProfileSession,
  PerformanceMetrics,
  PerformanceReport,
  OptimizationSuggestion,
  BenchmarkResult,
  Hotspot,
  MemoryLeak,
} from './performance-profiler/types.js';

// Feature 9: Multi-Language Code Translation
export { TranslationManager } from './code-translator/translation-manager.js';
export { CodeTranslator } from './code-translator/translator.js';
export { CodeParser } from './code-translator/code-parser.js';
export type {
  CodeTranslatorConfig,
  TranslationRequest,
  TranslationResult,
  SupportedLanguage,
  TranslationWarning,
  CodeStructure,
} from './code-translator/types.js';

// Feature 11: API Client Generator & Testing Suite
export { APIGeneratorManager } from './api-generator/api-generator-manager.js';
export { APIClientGenerator } from './api-generator/client-generator.js';
export { APITestGenerator } from './api-generator/test-generator.js';
export { APISpecParser } from './api-generator/spec-parser.js';
export type {
  APIGeneratorConfig,
  APISpecification,
  GeneratedClient,
  TestSuite,
  TestCase,
  ClientLanguage,
  HTTPMethod,
} from './api-generator/types.js';

// Phase 4 Features

// Feature 8: Test Generation & Coverage Analysis
export { TaurusTestGeneratorManager } from './test-generator/test-generator-manager.js';
export { TestAnalyzer as TaurusTestAnalyzer } from './test-generator/test-analyzer.js';
export { TestCaseGenerator } from './test-generator/test-case-generator.js';
export { CoverageAnalyzer } from './test-generator/coverage-analyzer.js';
export type {
  TestGeneratorConfig,
  TestGeneratorManager,
  TestFramework,
  TestType,
  TestGenerationRequest,
  TestGenerationResult,
  GeneratedTestCase,
  CodeElement as TestCodeElement,
  CoverageAnalysisRequest,
  CoverageAnalysisResult,
  CoverageMetrics,
  CoverageGap,
  CoverageSuggestion,
  TestQualityAnalysis,
} from './test-generator/types.js';

// Feature 10: Security Vulnerability Scanner
export { TaurusSecurityScannerManager } from './security-scanner/security-scanner-manager.js';
export { VulnerabilityDetector } from './security-scanner/vulnerability-detector.js';
export { DependencyScanner as SecurityDependencyScanner } from './security-scanner/dependency-scanner.js';
export { SecretDetector } from './security-scanner/secret-detector.js';
export type {
  SecurityScannerConfig,
  SecurityScannerManager,
  SecurityScanRequest,
  SecurityScanResult,
  Vulnerability as SecurityScanVulnerability,
  VulnerabilityType,
  VulnerabilitySeverity,
  DependencyVulnerability,
  SecretFinding,
  SecurityRecommendation,
  SecurityReport,
  SecurityAuditResult,
  OWASPCategory,
} from './security-scanner/types.js';

// Feature 12: Database Schema Manager & Migration Tool
export { TaurusDatabaseManager } from './database-manager/database-manager.js';
export { SchemaGenerator } from './database-manager/schema-generator.js';
export { MigrationGenerator } from './database-manager/migration-generator.js';
export { SchemaComparator } from './database-manager/schema-comparator.js';
export type {
  DatabaseManagerConfig,
  DatabaseManager,
  DatabaseType,
  DatabaseSchema,
  Table,
  Column,
  Migration,
  SchemaGenerationRequest,
  SchemaGenerationResult,
  MigrationGenerationRequest,
  MigrationGenerationResult,
  SchemaComparisonRequest,
  SchemaComparisonResult,
  SchemaDiff,
  MigrationExecutionResult,
} from './database-manager/types.js';
