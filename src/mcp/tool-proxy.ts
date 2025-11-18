/**
 * MCP Tool Proxy - Wraps MCP server tools as Taurus tools
 */

import { BaseTool } from '../tools/base.js';
import { McpServer } from './server.js';
import { McpTool } from './types.js';

export class McpToolProxy extends BaseTool {
  name: string;
  description: string;
  schema: any;

  constructor(
    private mcpTool: McpTool,
    private server: McpServer
  ) {
    super();
    this.name = `${server.name}__${mcpTool.name}`;
    this.description = mcpTool.description || `Tool from MCP server: ${server.name}`;
    this.schema = mcpTool.inputSchema;
  }

  async execute(input: Record<string, any>) {
    try {
      const result = await this.server.callTool({
        name: this.mcpTool.name,
        arguments: input,
      });

      if (result.isError) {
        const errorText = result.content
          .filter((c) => c.type === 'text')
          .map((c) => c.text)
          .join('\n');
        return this.error(errorText);
      }

      // Combine all content into a single result
      const textContent = result.content
        .filter((c) => c.type === 'text')
        .map((c) => c.text)
        .join('\n');

      const imageContent = result.content
        .filter((c) => c.type === 'image')
        .map((c) => `[Image: ${c.mimeType}]`)
        .join('\n');

      const resourceContent = result.content
        .filter((c) => c.type === 'resource')
        .map((c) => c.text || '[Resource]')
        .join('\n');

      const combined = [textContent, imageContent, resourceContent]
        .filter((s) => s)
        .join('\n\n');

      return this.success(combined || 'Tool executed successfully');
    } catch (error) {
      return this.error(`MCP tool error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}
