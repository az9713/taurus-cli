/**
 * MCP Manager - Manages MCP server lifecycle and tool registration
 */

import { McpServer } from './server.js';
import { McpServerConfig } from './types.js';
import { McpToolProxy } from './tool-proxy.js';
import { ToolRegistry } from '../tools/base.js';
import { logger } from '../utils/logger.js';

export class McpManager {
  private servers: Map<string, McpServer> = new Map();
  private toolProxies: Map<string, McpToolProxy[]> = new Map();

  constructor(
    private configs: McpServerConfig[],
    private toolRegistry: ToolRegistry
  ) {}

  async initialize(): Promise<void> {
    logger.info(`Initializing ${this.configs.length} MCP server(s)...`);

    for (const config of this.configs) {
      try {
        await this.connectServer(config);
      } catch (error) {
        logger.error(`Failed to initialize MCP server ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
        // Continue with other servers
      }
    }

    const connectedCount = Array.from(this.servers.values()).filter(
      (s) => s.state === 'connected'
    ).length;

    logger.success(`MCP: ${connectedCount}/${this.configs.length} servers connected`);
  }

  async connectServer(config: McpServerConfig): Promise<void> {
    const server = new McpServer(config);

    try {
      // Connect to server
      await server.connect();
      this.servers.set(config.name, server);

      // Discover and register tools
      await this.registerServerTools(server);

      logger.debug(`MCP server ${config.name} initialized with ${this.toolProxies.get(config.name)?.length || 0} tools`);
    } catch (error) {
      logger.error(`Failed to connect to MCP server ${config.name}: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  private async registerServerTools(server: McpServer): Promise<void> {
    try {
      const tools = await server.listTools();
      const proxies: McpToolProxy[] = [];

      for (const mcpTool of tools) {
        const proxy = new McpToolProxy(mcpTool, server);
        this.toolRegistry.register(proxy);
        proxies.push(proxy);
        logger.debug(`Registered MCP tool: ${proxy.name}`);
      }

      this.toolProxies.set(server.name, proxies);
    } catch (error) {
      logger.error(`Failed to register tools from ${server.name}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  async disconnectServer(name: string): Promise<void> {
    const server = this.servers.get(name);
    if (server) {
      await server.disconnect();
      this.servers.delete(name);
      this.toolProxies.delete(name);
      logger.debug(`Disconnected MCP server: ${name}`);
    }
  }

  async shutdown(): Promise<void> {
    logger.debug('Shutting down MCP servers...');

    for (const [name, server] of this.servers.entries()) {
      try {
        await server.disconnect();
      } catch (error) {
        logger.error(`Error disconnecting ${name}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    this.servers.clear();
    this.toolProxies.clear();
    logger.debug('All MCP servers disconnected');
  }

  getServer(name: string): McpServer | undefined {
    return this.servers.get(name);
  }

  getAllServers(): McpServer[] {
    return Array.from(this.servers.values());
  }

  getServerTools(serverName: string): McpToolProxy[] {
    return this.toolProxies.get(serverName) || [];
  }

  getAllMcpTools(): McpToolProxy[] {
    const allTools: McpToolProxy[] = [];
    for (const tools of this.toolProxies.values()) {
      allTools.push(...tools);
    }
    return allTools;
  }
}
