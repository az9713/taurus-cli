/**
 * Tests for MCP Manager
 */

import { McpManager } from '../manager.js';
import { ToolRegistry } from '../../tools/base.js';
import { McpServerConfig } from '../types.js';

describe('McpManager', () => {
  let toolRegistry: ToolRegistry;

  beforeEach(() => {
    toolRegistry = new ToolRegistry();
  });

  it('should initialize with no servers', async () => {
    const manager = new McpManager([], toolRegistry);
    await manager.initialize();

    const servers = manager.getAllServers();
    expect(servers).toHaveLength(0);
  });

  it('should handle server connection failures gracefully', async () => {
    const configs: McpServerConfig[] = [
      {
        name: 'invalid-server',
        transport: 'stdio',
        command: 'nonexistent-command',
        args: [],
      },
    ];

    const manager = new McpManager(configs, toolRegistry);

    // Should not throw even if server fails to connect
    await expect(manager.initialize()).resolves.not.toThrow();
  });

  it('should track server state', () => {
    const manager = new McpManager([], toolRegistry);

    const servers = manager.getAllServers();
    expect(Array.isArray(servers)).toBe(true);
  });

  it('should clean up on shutdown', async () => {
    const manager = new McpManager([], toolRegistry);
    await manager.initialize();
    await manager.shutdown();

    const servers = manager.getAllServers();
    expect(servers).toHaveLength(0);
  });

  it('should get server by name', () => {
    const manager = new McpManager([], toolRegistry);

    const server = manager.getServer('nonexistent');
    expect(server).toBeUndefined();
  });

  it('should list all MCP tools', () => {
    const manager = new McpManager([], toolRegistry);

    const tools = manager.getAllMcpTools();
    expect(Array.isArray(tools)).toBe(true);
  });
});
