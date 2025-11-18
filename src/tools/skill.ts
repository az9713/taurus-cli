/**
 * Skill tool - Execute skills within the conversation
 */

import { BaseTool } from './base.js';
import { Skill } from '../types/index.js';
import { promises as fs } from 'fs';
import { join } from 'path';

export class SkillTool extends BaseTool {
  name = 'Skill';
  description = `Execute a skill within the main conversation.

Skills provide specialized capabilities and domain knowledge. When users ask you to perform tasks, check if any of the available skills can help complete the task more effectively.

How to use skills:
- Invoke skills using this tool with the skill name only (no arguments)
- When you invoke a skill, you will see "The {name} skill is loading"
- The skill's prompt will expand and provide detailed instructions on how to complete the task
- Examples:
  - command: "pdf" - invoke the pdf skill
  - command: "xlsx" - invoke the xlsx skill
  - command: "ms-office-suite:pdf" - invoke using fully qualified name

Important:
- Only use skills listed in available_skills
- Do not invoke a skill that is already running
- Do not use this tool for built-in CLI commands (like /help, /clear, etc.)`;

  schema = {
    type: 'object' as const,
    properties: {
      command: {
        type: 'string',
        description: 'The skill name (no arguments). E.g., "pdf" or "xlsx"',
      },
    },
    required: ['command'],
  };

  private skills: Map<string, Skill> = new Map();

  async loadSkills(skillsDir: string): Promise<void> {
    try {
      const files = await fs.readdir(skillsDir);

      for (const file of files) {
        if (file.endsWith('.md')) {
          const skillPath = join(skillsDir, file);
          const content = await fs.readFile(skillPath, 'utf-8');

          // Parse skill metadata (simple markdown parsing)
          const lines = content.split('\n');
          const name = file.replace('.md', '');
          let description = '';
          let prompt = content;

          // Look for description in frontmatter or first paragraph
          for (const line of lines) {
            if (line.startsWith('# ')) {
              description = line.replace('# ', '').trim();
              break;
            }
          }

          this.skills.set(name, {
            name,
            description,
            location: 'user',
            prompt,
          });
        }
      }
    } catch (error) {
      // Skills directory might not exist
    }
  }

  async execute(input: Record<string, any>) {
    const { command } = input;

    const skill = this.skills.get(command);
    if (!skill) {
      return this.error(`Skill "${command}" not found`);
    }

    const result = `<command-message>The "${skill.name}" skill is loading</command-message>

${skill.prompt}
`;

    return this.success(result);
  }

  getSkills(): Skill[] {
    return Array.from(this.skills.values());
  }
}
