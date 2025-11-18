/**
 * Bash tool - Execute shell commands
 */

import { BaseTool } from './base.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class BashTool extends BaseTool {
  name = 'Bash';
  description = `Executes a given bash command in a persistent shell session with optional timeout.

Usage notes:
- This tool is for terminal operations like git, npm, docker, etc.
- Always quote file paths that contain spaces with double quotes
- The command argument is required
- Optional timeout in milliseconds (up to 600000ms / 10 minutes). Default: 120000ms (2 minutes)
- Avoid using Bash with find, grep, cat, head, tail, sed, awk, or echo commands - use dedicated tools instead`;

  schema = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: 'The command to execute',
      },
      description: {
        type: 'string',
        description: 'Clear, concise description of what this command does in 5-10 words',
      },
      timeout: {
        type: 'number',
        description: 'Optional timeout in milliseconds (max 600000)',
      },
    },
    required: ['command'],
  };

  async execute(input: Record<string, any>) {
    const { command, timeout = 120000 } = input;
    const maxTimeout = 600000;
    const actualTimeout = Math.min(timeout, maxTimeout);

    try {
      const { stdout, stderr } = await execAsync(command, {
        timeout: actualTimeout,
        cwd: process.cwd(),
        maxBuffer: 10 * 1024 * 1024, // 10MB
      });

      const output = stdout + (stderr ? `\n${stderr}` : '');
      return this.success(output || 'Tool ran without output or errors');
    } catch (error: any) {
      if (error.killed) {
        return this.error(`Command timed out after ${actualTimeout}ms`);
      }
      const output = error.stdout || '';
      const errorOutput = error.stderr || error.message;
      return this.error(
        `Exit code ${error.code}\n${output}${errorOutput ? '\n' + errorOutput : ''}`
      );
    }
  }
}
