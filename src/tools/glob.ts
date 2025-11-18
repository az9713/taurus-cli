/**
 * Glob tool - Fast file pattern matching
 */

import { BaseTool } from './base.js';
import { glob } from 'glob';
import { stat } from 'fs/promises';

export class GlobTool extends BaseTool {
  name = 'Glob';
  description = `Fast file pattern matching tool that works with any codebase size.

Usage:
- Supports glob patterns like "**/*.js" or "src/**/*.ts"
- Returns matching file paths sorted by modification time
- Use this tool when you need to find files by name patterns
- When doing an open-ended search that may require multiple rounds, use the Task tool instead`;

  schema = {
    type: 'object' as const,
    properties: {
      pattern: {
        type: 'string',
        description: 'The glob pattern to match files against',
      },
      path: {
        type: 'string',
        description:
          'The directory to search in. If not specified, the current working directory will be used.',
      },
    },
    required: ['pattern'],
  };

  async execute(input: Record<string, any>) {
    const { pattern, path = process.cwd() } = input;

    try {
      const files = await glob(pattern, {
        cwd: path,
        nodir: true,
        absolute: true,
      });

      if (files.length === 0) {
        return this.success('No files matched the pattern');
      }

      // Sort by modification time (newest first)
      const filesWithStats = await Promise.all(
        files.map(async (file) => {
          const stats = await stat(file);
          return { file, mtime: stats.mtime };
        })
      );

      filesWithStats.sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

      const result = filesWithStats.map((f) => f.file).join('\n');
      return this.success(`Found ${files.length} files:\n${result}`);
    } catch (error: any) {
      return this.error(`Error globbing files: ${error.message}`);
    }
  }
}
