/**
 * Base tool interface and registry
 */

import { Tool, ToolExecutor, ToolResult } from '../types/index.js';

export abstract class BaseTool implements ToolExecutor {
  abstract name: string;
  abstract description: string;
  abstract schema: Tool['input_schema'];

  getDefinition(): Tool {
    return {
      name: this.name,
      description: this.description,
      input_schema: this.schema,
    };
  }

  abstract execute(input: Record<string, any>): Promise<ToolResult>;

  protected success(content: string): ToolResult {
    return { content, is_error: false };
  }

  protected error(message: string): ToolResult {
    return { content: message, is_error: true };
  }
}

export class ToolRegistry {
  private tools: Map<string, BaseTool> = new Map();

  register(tool: BaseTool): void {
    this.tools.set(tool.name, tool);
  }

  get(name: string): BaseTool | undefined {
    return this.tools.get(name);
  }

  getAll(): BaseTool[] {
    return Array.from(this.tools.values());
  }

  getDefinitions(): Tool[] {
    return this.getAll().map((tool) => tool.getDefinition());
  }

  async execute(name: string, input: Record<string, any>): Promise<ToolResult> {
    const tool = this.get(name);
    if (!tool) {
      return {
        content: `Tool "${name}" not found`,
        is_error: true,
      };
    }

    try {
      return await tool.execute(input);
    } catch (error) {
      return {
        content: `Error executing tool "${name}": ${error instanceof Error ? error.message : String(error)}`,
        is_error: true,
      };
    }
  }
}
