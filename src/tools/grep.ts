/**
 * Grep tool - Search tool built on grep/ripgrep
 */

import { BaseTool } from './base.js';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

export class GrepTool extends BaseTool {
  name = 'Grep';
  description = `A powerful search tool built on ripgrep.

Usage:
- ALWAYS use Grep for search tasks. NEVER invoke grep or rg as a Bash command
- Supports full regex syntax (e.g., "log.*Error", "function\\s+\\w+")
- Filter files with glob parameter (e.g., "*.js", "**/*.tsx")
- Output modes: "content" shows matching lines, "files_with_matches" shows only file paths (default), "count" shows match counts
- Pattern syntax: Uses ripgrep (not grep) - literal braces need escaping`;

  schema = {
    type: 'object' as const,
    properties: {
      pattern: {
        type: 'string',
        description: 'The regular expression pattern to search for in file contents',
      },
      path: {
        type: 'string',
        description: 'File or directory to search in. Defaults to current working directory.',
      },
      glob: {
        type: 'string',
        description: 'Glob pattern to filter files (e.g. "*.js", "*.{ts,tsx}")',
      },
      output_mode: {
        type: 'string',
        enum: ['content', 'files_with_matches', 'count'],
        description:
          'Output mode: "content" shows matching lines, "files_with_matches" shows file paths, "count" shows match counts. Defaults to "files_with_matches".',
      },
      '-i': {
        type: 'boolean',
        description: 'Case insensitive search',
      },
      '-n': {
        type: 'boolean',
        description: 'Show line numbers in output (for content mode). Defaults to true.',
      },
      '-A': {
        type: 'number',
        description: 'Number of lines to show after each match (content mode only)',
      },
      '-B': {
        type: 'number',
        description: 'Number of lines to show before each match (content mode only)',
      },
      '-C': {
        type: 'number',
        description: 'Number of lines to show before and after each match (content mode only)',
      },
      multiline: {
        type: 'boolean',
        description: 'Enable multiline mode where . matches newlines. Default: false.',
      },
      head_limit: {
        type: 'number',
        description: 'Limit output to first N lines/entries',
      },
    },
    required: ['pattern'],
  };

  async execute(input: Record<string, any>) {
    const {
      pattern,
      path = process.cwd(),
      glob: globPattern,
      output_mode = 'files_with_matches',
      '-i': caseInsensitive,
      '-n': lineNumbers = true,
      '-A': after,
      '-B': before,
      '-C': context,
      multiline,
      head_limit,
    } = input;

    try {
      // Check if rg (ripgrep) is available, fallback to grep
      let command = 'rg';
      try {
        await execAsync('which rg');
      } catch {
        command = 'grep';
      }

      const args: string[] = [];

      // Output mode
      if (output_mode === 'files_with_matches') {
        args.push('-l');
      } else if (output_mode === 'count') {
        args.push('-c');
      }

      // Case insensitive
      if (caseInsensitive) {
        args.push('-i');
      }

      // Line numbers (for content mode)
      if (output_mode === 'content' && lineNumbers) {
        args.push('-n');
      }

      // Context lines
      if (context !== undefined) {
        args.push(`-C${context}`);
      } else {
        if (after !== undefined) args.push(`-A${after}`);
        if (before !== undefined) args.push(`-B${before}`);
      }

      // Multiline
      if (multiline && command === 'rg') {
        args.push('-U', '--multiline-dotall');
      }

      // Glob pattern
      if (globPattern) {
        args.push(`--glob=${globPattern}`);
      }

      // Pattern and path
      args.push(JSON.stringify(pattern));
      args.push(path);

      const fullCommand = `${command} ${args.join(' ')}${head_limit ? ` | head -n ${head_limit}` : ''}`;

      const { stdout, stderr } = await execAsync(fullCommand, {
        maxBuffer: 10 * 1024 * 1024,
      });

      if (!stdout && !stderr) {
        return this.success('No matches found');
      }

      return this.success(stdout || stderr);
    } catch (error: any) {
      // Exit code 1 means no matches found
      if (error.code === 1) {
        return this.success('No matches found');
      }
      return this.error(`Error searching: ${error.message}`);
    }
  }
}
