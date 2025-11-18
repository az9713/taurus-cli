#!/usr/bin/env node

/**
 * Taurus CLI - A complete Claude Code clone
 * Main entry point
 */

import { Command } from 'commander';
import { ConfigManager } from './config/manager.js';
import { SessionManager } from './session/manager.js';
import { HooksManager } from './hooks/manager.js';
import { ClaudeClient } from './api/claude.js';
import { createToolRegistry } from './tools/index.js';
import { AgentOrchestrator } from './agent/orchestrator.js';
import { REPL } from './cli/repl.js';
import { McpManager } from './mcp/manager.js';
import { logger } from './utils/logger.js';
import { join } from 'path';
import { homedir } from 'os';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('taurus')
  .description('A complete Claude Code clone with subagents, skills, slash commands, hooks and all features')
  .version('1.0.0');

program
  .command('chat', { isDefault: true })
  .description('Start interactive chat session (default)')
  .option('-m, --model <model>', 'Claude model to use', 'claude-sonnet-4-5-20250929')
  .option('-s, --session <id>', 'Resume a previous session')
  .option('--no-hooks', 'Disable hooks')
  .action(async (options) => {
    try {
      // Initialize configuration
      const configManager = new ConfigManager();
      await configManager.load();

      if (options.model) {
        configManager.set('model', options.model);
      }

      const config = configManager.get();

      // Initialize managers
      const sessionManager = new SessionManager(config.sessionDirectory);
      await sessionManager.initialize();

      // Create or resume session
      if (options.session) {
        await sessionManager.loadSession(options.session);
      } else {
        sessionManager.createSession();
      }

      // Initialize hooks
      const configDir = join(homedir(), '.taurus');
      const hooksManager = new HooksManager(configDir);
      await hooksManager.loadHooks();

      if (!options.hooks) {
        hooksManager.setEnabled(false);
      }

      // Initialize Claude client
      const claudeClient = new ClaudeClient(config);

      // Initialize tool registry
      const toolRegistry = createToolRegistry();

      // Initialize MCP servers
      const mcpManager = new McpManager(config.mcpServers, toolRegistry);
      await mcpManager.initialize();

      // Create orchestrator
      const orchestrator = new AgentOrchestrator(
        claudeClient,
        toolRegistry,
        sessionManager,
        hooksManager,
        configManager
      );

      // Start REPL
      const repl = new REPL(orchestrator);
      await repl.start();

      // Cleanup on exit
      process.on('SIGINT', async () => {
        await mcpManager.shutdown();
        process.exit(0);
      });
    } catch (error: any) {
      logger.error(`Failed to start: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('init')
  .description('Initialize Taurus configuration in current directory')
  .action(async () => {
    const { promises: fs } = await import('fs');
    const taurusDir = join(process.cwd(), '.taurus');

    try {
      // Create .taurus directory structure
      await fs.mkdir(taurusDir, { recursive: true });
      await fs.mkdir(join(taurusDir, 'commands'), { recursive: true });
      await fs.mkdir(join(taurusDir, 'skills'), { recursive: true });

      // Create example config
      const exampleConfig = `# Taurus CLI Configuration
# Place this file at ~/.taurus/config.yaml for global settings
# or .taurus/config.yaml for project-specific settings

# Claude API settings
model: claude-sonnet-4-5-20250929
maxTokens: 8096
temperature: 1.0

# Enable hooks
hooksEnabled: true
`;

      await fs.writeFile(join(taurusDir, 'config.example.yaml'), exampleConfig);

      // Create example hook
      const exampleHook = `# Taurus Hooks Configuration
# Place this file at ~/.taurus/hooks.yaml or .taurus/hooks.yaml

hooks:
  - name: session-start
    event: session-start
    command: echo "Session started!"
    enabled: true

  - name: before-git-commit
    event: before-tool-call
    command: |
      if [ "$TAURUS_TOOL" = "Bash" ]; then
        echo "Running tool: $TAURUS_TOOL"
      fi
    enabled: false
`;

      await fs.writeFile(join(taurusDir, 'hooks.example.yaml'), exampleHook);

      // Create example slash command
      const exampleCommand = `# Example Slash Command
# File: .taurus/commands/hello.md

Say hello to the user and explain what you can do to help them.
`;

      await fs.writeFile(join(taurusDir, 'commands', 'hello.md'), exampleCommand);

      // Create example skill
      const exampleSkill = `# Example Skill
# File: .taurus/skills/example.md

This is an example skill. Skills provide specialized capabilities and domain knowledge.

When invoked, this skill should demonstrate how to use skills effectively.
`;

      await fs.writeFile(join(taurusDir, 'skills', 'example.md'), exampleSkill);

      logger.success('Taurus initialized successfully!');
      console.log(chalk.gray('\nCreated:'));
      console.log(chalk.gray('  .taurus/config.example.yaml'));
      console.log(chalk.gray('  .taurus/hooks.example.yaml'));
      console.log(chalk.gray('  .taurus/commands/hello.md'));
      console.log(chalk.gray('  .taurus/skills/example.md'));
      console.log(chalk.gray('\nTry running: taurus chat\n'));
    } catch (error: any) {
      logger.error(`Failed to initialize: ${error.message}`);
      process.exit(1);
    }
  });

program
  .command('config')
  .description('Manage configuration')
  .argument('<action>', 'Action: get, set, show')
  .argument('[key]', 'Configuration key')
  .argument('[value]', 'Configuration value')
  .action(async (action, key, value) => {
    const configManager = new ConfigManager();
    await configManager.load();

    if (action === 'show') {
      const config = configManager.get();
      console.log(JSON.stringify(config, null, 2));
    } else if (action === 'get' && key) {
      const config = configManager.get();
      console.log((config as any)[key]);
    } else if (action === 'set' && key && value) {
      configManager.set(key as any, value);
      await configManager.save();
      logger.success(`Set ${key} = ${value}`);
    } else {
      logger.error('Invalid config command');
    }
  });

import chalk from 'chalk';

// ... (rest of imports)

// ... (program setup)

program.parse();
