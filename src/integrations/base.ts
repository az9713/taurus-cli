/**
 * Base Integration Interface
 *
 * All external integrations (Jira, Slack, GitHub, etc.) implement this interface
 */

export interface IntegrationConfig {
  enabled: boolean;
  name: string;
  type: 'jira' | 'slack' | 'github' | 'confluence';
  apiKey?: string;
  token?: string;
  url?: string;
  autoFetch?: string[]; // What to automatically fetch
  lookbackDays?: number; // How many days of history to fetch
}

export interface ContextItem {
  id: string;
  type: string;
  title: string;
  content: string;
  url?: string;
  author?: string;
  created: Date;
  updated: Date;
  metadata?: Record<string, any>;
}

export abstract class BaseIntegration {
  protected config: IntegrationConfig;

  constructor(config: IntegrationConfig) {
    this.config = config;
  }

  /**
   * Validate integration configuration
   */
  abstract validate(): Promise<boolean>;

  /**
   * Fetch context based on a trigger (e.g., JIRA-1234)
   */
  abstract fetchContext(trigger: string): Promise<ContextItem[]>;

  /**
   * Search for related items
   */
  abstract search(query: string): Promise<ContextItem[]>;

  /**
   * Update or create item
   */
  abstract update(itemId: string, data: any): Promise<void>;

  /**
   * Get integration name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Check if enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }
}

export class IntegrationError extends Error {
  constructor(
    message: string,
    public integration: string,
    public code?: string
  ) {
    super(message);
    this.name = 'IntegrationError';
  }
}
