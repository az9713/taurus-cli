/**
 * Hooks manager - Handle event-based hooks
 */

import { Hook, HookEvent } from '../types/index.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';
import { logger } from '../utils/logger.js';
import * as yaml from 'yaml';

const execAsync = promisify(exec);

export class HooksManager {
  private hooks: Map<HookEvent, Hook[]> = new Map();
  private enabled: boolean = true;

  constructor(private configDir: string) {}

  async loadHooks(): Promise<void> {
    try {
      const hooksFile = join(this.configDir, 'hooks.yaml');
      const content = await fs.readFile(hooksFile, 'utf-8');
      const config = yaml.parse(content);

      if (!config || !config.hooks) {
        return;
      }

      // Clear existing hooks
      this.hooks.clear();

      // Load hooks from config
      for (const hookConfig of config.hooks) {
        const hook: Hook = {
          name: hookConfig.name,
          command: hookConfig.command,
          event: hookConfig.event as HookEvent,
          enabled: hookConfig.enabled !== false,
        };

        if (!this.hooks.has(hook.event)) {
          this.hooks.set(hook.event, []);
        }

        this.hooks.get(hook.event)!.push(hook);
      }

      logger.debug(`Loaded ${config.hooks.length} hooks`);
    } catch (error) {
      // Hooks file might not exist
      logger.debug('No hooks configuration found');
    }
  }

  async trigger(event: HookEvent, context: Record<string, any> = {}): Promise<void> {
    if (!this.enabled) {
      return;
    }

    const eventHooks = this.hooks.get(event) || [];
    const enabledHooks = eventHooks.filter((h) => h.enabled);

    if (enabledHooks.length === 0) {
      return;
    }

    logger.debug(`Triggering ${enabledHooks.length} hooks for event: ${event}`);

    for (const hook of enabledHooks) {
      try {
        await this.executeHook(hook, context);
      } catch (error) {
        logger.error(`Hook "${hook.name}" failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  }

  private async executeHook(hook: Hook, context: Record<string, any>): Promise<void> {
    logger.debug(`Executing hook: ${hook.name}`);

    // Prepare environment variables from context
    const env = { ...process.env };
    for (const [key, value] of Object.entries(context)) {
      env[`TAURUS_${key.toUpperCase()}`] = String(value);
    }

    try {
      const { stdout, stderr } = await execAsync(hook.command, {
        env,
        timeout: 30000, // 30 second timeout
        cwd: process.cwd(),
      });

      if (stdout) {
        logger.info(`Hook "${hook.name}" output: ${stdout}`);
      }
      if (stderr) {
        logger.warn(`Hook "${hook.name}" stderr: ${stderr}`);
      }
    } catch (error: any) {
      throw new Error(`Command failed: ${error.message}`);
    }
  }

  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  getHooks(): Hook[] {
    const allHooks: Hook[] = [];
    for (const hooks of this.hooks.values()) {
      allHooks.push(...hooks);
    }
    return allHooks;
  }
}
