/**
 * Tool exports and registry
 */

export * from './base.js';
export * from './bash.js';
export * from './read.js';
export * from './write.js';
export * from './edit.js';
export * from './glob.js';
export * from './grep.js';
export * from './todo.js';
export * from './task.js';
export * from './webfetch.js';
export * from './websearch.js';
export * from './skill.js';
export * from './slashcommand.js';

import { ToolRegistry } from './base.js';
import { BashTool } from './bash.js';
import { ReadTool } from './read.js';
import { WriteTool } from './write.js';
import { EditTool } from './edit.js';
import { GlobTool } from './glob.js';
import { GrepTool } from './grep.js';
import { TodoWriteTool } from './todo.js';
import { TaskTool } from './task.js';
import { WebFetchTool } from './webfetch.js';
import { WebSearchTool } from './websearch.js';
import { SkillTool } from './skill.js';
import { SlashCommandTool } from './slashcommand.js';

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();

  // Register all tools
  registry.register(new BashTool());
  registry.register(new ReadTool());
  registry.register(new WriteTool());
  registry.register(new EditTool());
  registry.register(new GlobTool());
  registry.register(new GrepTool());
  registry.register(new TodoWriteTool());
  registry.register(new TaskTool());
  registry.register(new WebFetchTool());
  registry.register(new WebSearchTool());
  registry.register(new SkillTool());
  registry.register(new SlashCommandTool());

  return registry;
}
