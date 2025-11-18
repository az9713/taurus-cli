/**
 * Logging utilities
 */

import chalk from 'chalk';

export class Logger {
  constructor(private prefix: string = '') {}

  info(message: string): void {
    console.log(chalk.blue(`${this.prefix}${message}`));
  }

  success(message: string): void {
    console.log(chalk.green(`${this.prefix}✓ ${message}`));
  }

  error(message: string): void {
    console.error(chalk.red(`${this.prefix}✗ ${message}`));
  }

  warn(message: string): void {
    console.warn(chalk.yellow(`${this.prefix}⚠ ${message}`));
  }

  debug(message: string): void {
    if (process.env.DEBUG) {
      console.log(chalk.gray(`${this.prefix}[DEBUG] ${message}`));
    }
  }

  tool(toolName: string, status: 'start' | 'success' | 'error'): void {
    const icons = {
      start: '⚙',
      success: '✓',
      error: '✗',
    };
    const colors = {
      start: chalk.cyan,
      success: chalk.green,
      error: chalk.red,
    };
    console.log(colors[status](`${icons[status]} ${toolName}`));
  }
}

export const logger = new Logger();
