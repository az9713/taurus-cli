/**
 * REPL - Read-Eval-Print Loop for interactive CLI
 */

import * as readline from 'readline/promises';
import { stdin as input, stdout as output } from 'process';
import { AgentOrchestrator } from '../agent/orchestrator.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export class REPL {
  private rl: readline.Interface;
  private orchestrator: AgentOrchestrator;
  private running: boolean = false;

  constructor(orchestrator: AgentOrchestrator) {
    this.orchestrator = orchestrator;
    this.rl = readline.createInterface({
      input,
      output,
      prompt: chalk.cyan('taurus> '),
    });
  }

  async start(): Promise<void> {
    this.running = true;

    console.log(chalk.bold.cyan('\n🐂 Taurus CLI - Claude Code Clone'));
    console.log(chalk.gray('Type your message or command. Use Ctrl+C to exit.\n'));

    await this.orchestrator.initialize();

    this.rl.prompt();

    this.rl.on('line', async (line) => {
      const input = line.trim();

      if (!input) {
        this.rl.prompt();
        return;
      }

      // Handle built-in commands
      if (input.startsWith('/')) {
        await this.handleCommand(input);
      } else {
        // Process as user message
        try {
          await this.orchestrator.processUserMessage(input);
        } catch (error: any) {
          logger.error(`Error: ${error.message}`);
        }
      }

      console.log(); // Empty line for spacing
      this.rl.prompt();
    });

    this.rl.on('close', async () => {
      await this.stop();
    });

    // Handle Ctrl+C
    process.on('SIGINT', async () => {
      await this.stop();
      process.exit(0);
    });
  }

  async stop(): Promise<void> {
    if (!this.running) {
      return;
    }

    this.running = false;
    console.log(chalk.yellow('\n\nShutting down...'));

    await this.orchestrator.shutdown();

    this.rl.close();
    console.log(chalk.gray('Goodbye! 👋\n'));
  }

  private async handleCommand(command: string): Promise<void> {
    const [cmd] = command.slice(1).split(/\s+/);

    switch (cmd) {
      case 'help':
        this.showHelp();
        break;

      case 'clear':
        console.clear();
        console.log(chalk.bold.cyan('🐂 Taurus CLI - Claude Code Clone\n'));
        break;

      case 'exit':
      case 'quit':
        await this.stop();
        process.exit(0);
        break;

      case 'version':
        console.log(chalk.gray('Taurus CLI v1.0.0'));
        break;

      default:
        // Try to execute as slash command via the orchestrator
        await this.orchestrator.processUserMessage(command);
        break;
    }
  }

  private showHelp(): void {
    console.log(chalk.bold('\nAvailable Commands:\n'));
    console.log(chalk.cyan('  /help') + '     - Show this help message');
    console.log(chalk.cyan('  /clear') + '    - Clear the screen');
    console.log(chalk.cyan('  /exit') + '     - Exit Taurus CLI');
    console.log(chalk.cyan('  /version') + '  - Show version information');
    console.log(chalk.gray('\nFor feedback, visit: https://github.com/az9713/taurus-cli/issues\n'));
  }
}
