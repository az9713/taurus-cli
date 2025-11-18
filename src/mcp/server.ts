/**
 * MCP Server implementation
 */

import { McpTransport } from './transport.js';
import { StdioTransport } from './stdio-transport.js';
import { HttpTransport } from './http-transport.js';
import {
  IMcpServer,
  McpServerConfig,
  McpServerInfo,
  ConnectionState,
  McpTool,
  McpToolCall,
  McpToolResult,
  McpResource,
  McpResourceContents,
  McpPrompt,
  McpPromptMessage,
  InitializeRequest,
  InitializeResponse,
} from './types.js';
import { logger } from '../utils/logger.js';

export class McpServer implements IMcpServer {
  private transport: McpTransport | null = null;
  private _state: ConnectionState = 'disconnected';
  private _info: McpServerInfo | null = null;

  constructor(private config: McpServerConfig) {}

  get name(): string {
    return this.config.name;
  }

  get state(): ConnectionState {
    return this._state;
  }

  get info(): McpServerInfo | null {
    return this._info;
  }

  async connect(): Promise<void> {
    if (this._state === 'connected') {
      return;
    }

    try {
      this._state = 'connecting';
      logger.debug(`Connecting to MCP server: ${this.name}`);

      // Create transport based on configuration
      if (this.config.transport === 'stdio') {
        if (!this.config.command) {
          throw new Error('Stdio transport requires command');
        }
        this.transport = new StdioTransport(
          this.config.command,
          this.config.args || [],
          this.config.env || {}
        );
      } else if (this.config.transport === 'http') {
        if (!this.config.url) {
          throw new Error('HTTP transport requires url');
        }
        this.transport = new HttpTransport(
          this.config.url,
          this.config.headers || {}
        );
      } else {
        throw new Error(`Unsupported transport: ${this.config.transport}`);
      }

      // Connect transport
      await this.transport.connect();

      // Initialize MCP protocol
      const initRequest: InitializeRequest = {
        protocolVersion: '2024-11-05',
        capabilities: {
          tools: {},
          resources: {},
          prompts: {},
        },
        clientInfo: {
          name: 'taurus-cli',
          version: '1.0.0',
        },
      };

      const initResponse: InitializeResponse = await this.transport.request(
        'initialize',
        initRequest
      );

      this._info = {
        name: initResponse.serverInfo.name,
        version: initResponse.serverInfo.version,
        capabilities: initResponse.capabilities,
        protocolVersion: initResponse.protocolVersion,
      };

      // Send initialized notification
      await this.transport.notify('notifications/initialized');

      this._state = 'connected';
      logger.success(`Connected to MCP server: ${this.name}`);
    } catch (error) {
      this._state = 'error';
      logger.error(`Failed to connect to MCP server ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.transport) {
      await this.transport.disconnect();
      this.transport = null;
    }
    this._state = 'disconnected';
    this._info = null;
    logger.debug(`Disconnected from MCP server: ${this.name}`);
  }

  async listTools(): Promise<McpTool[]> {
    this.ensureConnected();

    try {
      const response = await this.transport!.request('tools/list');
      return response.tools || [];
    } catch (error) {
      logger.error(`Failed to list tools from ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async callTool(call: McpToolCall): Promise<McpToolResult> {
    this.ensureConnected();

    try {
      const response = await this.transport!.request('tools/call', call);
      return response;
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error calling tool: ${error instanceof Error ? error.message : String(error)}`,
        }],
        isError: true,
      };
    }
  }

  async listResources(): Promise<McpResource[]> {
    this.ensureConnected();

    try {
      const response = await this.transport!.request('resources/list');
      return response.resources || [];
    } catch (error) {
      logger.error(`Failed to list resources from ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async readResource(uri: string): Promise<McpResourceContents> {
    this.ensureConnected();

    const response = await this.transport!.request('resources/read', { uri });
    return response.contents || { uri };
  }

  async listPrompts(): Promise<McpPrompt[]> {
    this.ensureConnected();

    try {
      const response = await this.transport!.request('prompts/list');
      return response.prompts || [];
    } catch (error) {
      logger.error(`Failed to list prompts from ${this.name}: ${error instanceof Error ? error.message : String(error)}`);
      return [];
    }
  }

  async getPrompt(name: string, args?: Record<string, string>): Promise<McpPromptMessage[]> {
    this.ensureConnected();

    const response = await this.transport!.request('prompts/get', {
      name,
      arguments: args,
    });
    return response.messages || [];
  }

  private ensureConnected(): void {
    if (this._state !== 'connected' || !this.transport) {
      throw new Error(`MCP server ${this.name} is not connected`);
    }
  }
}
