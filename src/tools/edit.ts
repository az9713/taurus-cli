/**
 * Edit tool - Perform exact string replacements in files
 */

import { BaseTool } from './base.js';
import { promises as fs } from 'fs';

export class EditTool extends BaseTool {
  name = 'Edit';
  description = `Performs exact string replacements in files.

Usage:
- You must use the Read tool at least once before editing
- Preserve exact indentation as it appears in the file
- ALWAYS prefer editing existing files over writing new ones
- Only use emojis if the user explicitly requests it
- The edit will FAIL if old_string is not unique in the file
- Use replace_all for replacing all instances or renaming variables`;

  schema = {
    type: 'object' as const,
    properties: {
      file_path: {
        type: 'string',
        description: 'The absolute path to the file to modify',
      },
      old_string: {
        type: 'string',
        description: 'The text to replace',
      },
      new_string: {
        type: 'string',
        description: 'The text to replace it with (must be different from old_string)',
      },
      replace_all: {
        type: 'boolean',
        description: 'Replace all occurrences of old_string (default false)',
        default: false,
      },
    },
    required: ['file_path', 'old_string', 'new_string'],
  };

  async execute(input: Record<string, any>) {
    const { file_path, old_string, new_string, replace_all = false } = input;

    if (old_string === new_string) {
      return this.error('old_string and new_string must be different');
    }

    try {
      const content = await fs.readFile(file_path, 'utf-8');

      if (!content.includes(old_string)) {
        return this.error('old_string not found in file');
      }

      let newContent: string;
      if (replace_all) {
        newContent = content.split(old_string).join(new_string);
      } else {
        // Check if old_string appears multiple times
        const occurrences = content.split(old_string).length - 1;
        if (occurrences > 1) {
          return this.error(
            `old_string appears ${occurrences} times in the file. Either provide a larger unique string or use replace_all=true`
          );
        }
        newContent = content.replace(old_string, new_string);
      }

      await fs.writeFile(file_path, newContent, 'utf-8');
      return this.success(`File edited successfully: ${file_path}`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return this.error('File does not exist.');
      }
      return this.error(`Error editing file: ${error.message}`);
    }
  }
}
