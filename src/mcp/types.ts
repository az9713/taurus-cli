/**
 * MCP (Model Context Protocol) type definitions
 * Based on MCP specification: https://modelcontextprotocol.io
 */

// JSON-RPC 2.0 types
export interface JsonRpcRequest {
  jsonrpc: '2.0';
  id?: string | number;
  method: string;
  params?: any;
}

export interface JsonRpcResponse {
  jsonrpc: '2.0';
  id: string | number;
  result?: any;
  error?: JsonRpcError;
}

export interface JsonRpcError {
  code: number;
  message: string;
  data?: any;
}

export interface JsonRpcNotification {
  jsonrpc: '2.0';
  method: string;
  params?: any;
}

// MCP Server capabilities
export interface ServerCapabilities {
  tools?: {
    listChanged?: boolean;
  };
  resources?: {
    subscribe?: boolean;
    listChanged?: boolean;
  };
  prompts?: {
    listChanged?: boolean;
  };
  logging?: {};
}

// MCP Tool definitions
export interface McpTool {
  name: string;
  description?: string;
  inputSchema: {
    type: 'object';
    properties?: Record<string, any>;
    required?: string[];
  };
}

export interface McpToolCall {
  name: string;
  arguments?: Record<string, any>;
}

export interface McpToolResult {
  content: Array<{
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  }>;
  isError?: boolean;
}

// MCP Resource definitions
export interface McpResource {
  uri: string;
  name: string;
  description?: string;
  mimeType?: string;
}

export interface McpResourceContents {
  uri: string;
  mimeType?: string;
  text?: string;
  blob?: string;
}

// MCP Prompt definitions
export interface McpPrompt {
  name: string;
  description?: string;
  arguments?: Array<{
    name: string;
    description?: string;
    required?: boolean;
  }>;
}

export interface McpPromptMessage {
  role: 'user' | 'assistant';
  content: {
    type: 'text' | 'image' | 'resource';
    text?: string;
    data?: string;
    mimeType?: string;
  };
}

// MCP Server configuration
export interface McpServerConfig {
  name: string;
  transport: 'stdio' | 'http';
  command?: string;
  args?: string[];
  env?: Record<string, string>;
  url?: string;
  headers?: Record<string, string>;
}

// MCP Server info
export interface McpServerInfo {
  name: string;
  version: string;
  capabilities: ServerCapabilities;
  protocolVersion: string;
}

// MCP Initialize request/response
export interface InitializeRequest {
  protocolVersion: string;
  capabilities: {
    tools?: {};
    resources?: {};
    prompts?: {};
  };
  clientInfo: {
    name: string;
    version: string;
  };
}

export interface InitializeResponse {
  protocolVersion: string;
  capabilities: ServerCapabilities;
  serverInfo: {
    name: string;
    version: string;
  };
}

// Connection state
export type ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';

// MCP Server interface
export interface IMcpServer {
  readonly name: string;
  readonly state: ConnectionState;
  readonly info: McpServerInfo | null;

  connect(): Promise<void>;
  disconnect(): Promise<void>;

  listTools(): Promise<McpTool[]>;
  callTool(call: McpToolCall): Promise<McpToolResult>;

  listResources(): Promise<McpResource[]>;
  readResource(uri: string): Promise<McpResourceContents>;

  listPrompts(): Promise<McpPrompt[]>;
  getPrompt(name: string, args?: Record<string, string>): Promise<McpPromptMessage[]>;
}
