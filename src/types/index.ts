/**
 * Core type definitions for Taurus CLI
 */

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
  mcpServers: MCPServerConfig[];
}

export interface MCPServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
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
