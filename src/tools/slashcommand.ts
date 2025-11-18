/**
 * SlashCommand tool - Execute custom slash commands
 */

import { BaseTool } from './base.js';
import { SlashCommand } from '../types/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class SlashCommandTool extends BaseTool {
  name = 'SlashCommand';
  description = `Execute a slash command within the main conversation.

How slash commands work:
When you use this tool or when a user types a slash command, you will see "<command-message>{name} is running…</command-message>" followed by the expanded prompt. For example, if .claude/commands/foo.md contains "Print today's date", then /foo expands to that prompt in the next message.

Usage:
- command (required): The slash command to execute, including any arguments
- Example: command: "/review-pr 123"

IMPORTANT: Only use this tool for custom slash commands that appear in the Available Commands list. Do NOT use for:
- Built-in CLI commands (like /help, /clear, etc.)
- Commands not shown in the list
- Commands you think might exist but aren't listed

Notes:
- When a user requests multiple slash commands, execute each one sequentially
- Do not invoke a command that is already running
- Only custom slash commands with descriptions are listed in Available Commands`;

  schema = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: 'The slash command to execute with its arguments, e.g., "/review-pr 123"',
      },
    },
    required: ['command'],
  };

  private commands: Map<string, SlashCommand> = new Map();

  async loadCommands(commandsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(commandsDir);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const commandPath = join(commandsDir, file);
          const content = await fs.readFile(commandPath, 'utf-8');

          // Parse command metadata
          const lines = content.split('\n');
          const name = file.replace('.md', '');
          let description = '';

          // Look for description in frontmatter or first paragraph
          for (const line of lines) {
            if (line.startsWith('# ')) {
              description = line.replace('# ', '').trim();
              break;
            }
          }

          this.commands.set(name, {
            name,
            description,
            content,
          });
        }
      }
    } catch (error) {
      // Commands directory might not exist
    }
  }

  async execute(input: Record<string, any>) {
    const { command } = input;

    // Parse command name and args
    const parts = command.trim().split(/\s+/);
    const commandName = parts[0].replace(/^\//, '');
    const args = parts.slice(1);

    const cmd = this.commands.get(commandName);
    if (!cmd) {
      return this.error(`Command "/${commandName}" not found`);
    }

    const result = `<command-message>${commandName} is running…</command-message>

${cmd.content}

Arguments: ${args.length > 0 ? args.join(' ') : 'none'}
`;

    return this.success(result);
  }

  getCommands(): SlashCommand[] {
    return Array.from(this.commands.values());
  }
}
