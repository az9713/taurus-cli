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
