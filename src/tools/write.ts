/**
 * Write tool - Write files to the filesystem
 */

import { BaseTool } from './base.js';
import { promises as fs } from 'fs';
import { dirname } from 'path';

export class WriteTool extends BaseTool {
  name = 'Write';
  description = `Writes a file to the local filesystem.

Usage:
- This tool will overwrite the existing file if there is one at the provided path
- If this is an existing file, you MUST use the Read tool first
- ALWAYS prefer editing existing files in the codebase
- NEVER write new files unless explicitly required
- NEVER proactively create documentation files (*.md) or README files
- Only use emojis if the user explicitly requests it`;

  schema = {
    type: 'object' as const,
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to write (must be absolute, not relative)',
      },
      content: {
        type: 'string',
        description: 'The content to write to the file',
      },
    },
    required: ['file_path', 'content'],
  };

  async execute(input: Record<string, any>) {
    const { file_path, content } = input;

    try {
      // Ensure parent directory exists
      const dir = dirname(file_path);
      await fs.mkdir(dir, { recursive: true });

      await fs.writeFile(file_path, content, 'utf-8');
      return this.success(`File created successfully at: ${file_path}`);
    } catch (error: any) {
      return this.error(`Error writing file: ${error.message}`);
    }
  }
}
