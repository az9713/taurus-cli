/**
 * Read tool - Read files from the filesystem
 */

import { BaseTool } from './base.js';
import { promises as fs } from 'fs';

export class ReadTool extends BaseTool {
  name = 'Read';
  description = `Reads a file from the local filesystem.

Usage:
- The file_path parameter must be an absolute path
- By default, reads up to 2000 lines starting from the beginning
- Optionally specify a line offset and limit for long files
- Lines longer than 2000 characters will be truncated
- Results are returned using cat -n format, with line numbers starting at 1
- Can read text files, images, PDFs, and Jupyter notebooks
- Cannot read directories (use Bash ls instead)`;

  schema = {
    type: 'object' as const,
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to read',
      },
      offset: {
        type: 'number',
        description: 'The line number to start reading from',
      },
      limit: {
        type: 'number',
        description: 'The number of lines to read',
      },
    },
    required: ['file_path'],
  };

  async execute(input: Record<string, any>) {
    const { file_path, offset = 0, limit = 2000 } = input;

    try {
      const content = await fs.readFile(file_path, 'utf-8');
      const lines = content.split('\n');

      // Apply offset and limit
      const selectedLines = lines.slice(offset, offset + limit);

      // Format with line numbers
      const formatted = selectedLines
        .map((line, idx) => {
          const lineNum = offset + idx + 1;
          const truncated = line.length > 2000 ? line.substring(0, 2000) + '...' : line;
          return `${lineNum}\t${truncated}`;
        })
        .join('\n');

      if (formatted.trim() === '') {
        return this.success('[File is empty]');
      }

      return this.success(formatted);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return this.error('File does not exist.');
      }
      if (error.code === 'EISDIR') {
        return this.error('Path is a directory, not a file.');
      }
      return this.error(`Error reading file: ${error.message}`);
    }
  }
}
