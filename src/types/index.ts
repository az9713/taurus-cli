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
