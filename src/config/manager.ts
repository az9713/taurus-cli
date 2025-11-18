/**
 * Configuration manager
 */

import { Config } from '../types/index.js';
import { DEFAULT_CONFIG } from './default.js';
import { promises as fs } from 'fs';
import { join, dirname } from 'path';
import { homedir } from 'os';
import * as yaml from 'yaml';
import { logger } from '../utils/logger.js';

export class ConfigManager {
  private config: Config;
  private configPath: string;

  constructor() {
    const configDir = join(homedir(), '.taurus');
    this.configPath = join(configDir, 'config.yaml');

    // Initialize with defaults
    this.config = {
      ...DEFAULT_CONFIG,
      apiKey: process.env.ANTHROPIC_API_KEY || '',
    } as Config;
  }

  async load(): Promise<void> {
    try {
      const content = await fs.readFile(this.configPath, 'utf-8');
      const userConfig = yaml.parse(content);

      // Merge with defaults
      this.config = {
        ...this.config,
        ...userConfig,
      };

      logger.debug('Configuration loaded');
    } catch (error) {
      // Config file might not exist, use defaults
      logger.debug('Using default configuration');
    }

    // Validate configuration
    this.validate();
  }

  async save(): Promise<void> {
    try {
      await fs.mkdir(dirname(this.configPath), { recursive: true });
      const content = yaml.stringify(this.config);
      await fs.writeFile(this.configPath, content, 'utf-8');
      logger.success('Configuration saved');
    } catch (error) {
      logger.error(`Failed to save configuration: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  get(): Config {
    return this.config;
  }

  set(key: keyof Config, value: any): void {
    (this.config as any)[key] = value;
  }

  private validate(): void {
    if (!this.config.apiKey) {
      throw new Error(
        'ANTHROPIC_API_KEY not found. Please set it in your environment or config file.'
      );
    }

    if (!this.config.model) {
      throw new Error('Model not specified in configuration');
    }
  }

  getConfigDir(): string {
    return dirname(this.configPath);
  }
}
