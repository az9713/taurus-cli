/**
 * Tests for MCP Tool Proxy
 */

import { McpToolProxy } from '../tool-proxy.js';
import { McpTool, McpServer } from '../types.js';

// Mock MCP Server
class MockMcpServer {
  name = 'test-server';
  state = 'connected' as const;
  info = null;

  async connect() {}
  async disconnect() {}
  async listTools() {
    return [];
  }
  async callTool(call: any) {
    return {
      content: [
        {
          type: 'text' as const,
          text: `Called ${call.name} with args: ${JSON.stringify(call.arguments)}`,
        },
      ],
      isError: false,
    };
  }
  async listResources() {
    return [];
  }
  async readResource(_uri: string) {
    return { uri: '' };
  }
  async listPrompts() {
    return [];
  }
  async getPrompt(_name: string, _args?: Record<string, string>) {
    return [];
  }
}

describe('McpToolProxy', () => {
  const mcpTool: McpTool = {
    name: 'test_tool',
    description: 'A test tool',
    inputSchema: {
      type: 'object',
      properties: {
        param: {
          type: 'string',
        },
      },
      required: ['param'],
    },
  };

  it('should create proxy with prefixed name', () => {
    const server = new MockMcpServer() as any;
    const proxy = new McpToolProxy(mcpTool, server);

    expect(proxy.name).toBe('test-server__test_tool');
  });

  it('should execute tool and return result', async () => {
    const server = new MockMcpServer() as any;
    const proxy = new McpToolProxy(mcpTool, server);

    const result = await proxy.execute({ param: 'value' });

    expect(result.is_error).toBe(false);
    expect(result.content).toContain('Called test_tool');
  });

  it('should handle tool errors', async () => {
    const errorServer = {
      ...new MockMcpServer(),
      async callTool() {
        return {
          content: [
            {
              type: 'text' as const,
              text: 'Tool error occurred',
            },
          ],
          isError: true,
        };
      },
    };

    const proxy = new McpToolProxy(mcpTool, errorServer as any);
    const result = await proxy.execute({ param: 'value' });

    expect(result.is_error).toBe(true);
    expect(result.content).toContain('Tool error occurred');
  });

  it('should use tool description from MCP', () => {
    const server = new MockMcpServer() as any;
    const proxy = new McpToolProxy(mcpTool, server);

    expect(proxy.description).toContain('A test tool');
  });

  it('should preserve input schema', () => {
    const server = new MockMcpServer() as any;
    const proxy = new McpToolProxy(mcpTool, server);

    expect(proxy.schema).toEqual(mcpTool.inputSchema);
  });
});
