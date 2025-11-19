/**
 * Integration Manager
 *
 * Manages all external integrations and automatically fetches context
 */

import { BaseIntegration, IntegrationConfig, ContextItem } from './base.js';
import { JiraIntegration } from './jira.js';
import { SlackIntegration } from './slack.js';
import { GitHubIntegration } from './github.js';
import { ConfluenceIntegration } from './confluence.js';

export interface ContextRule {
  trigger: string; // Regex pattern
  actions: string[]; // Actions to perform
  priority?: number;
}

export interface IntegrationManagerConfig {
  integrations: IntegrationConfig[];
  contextRules?: ContextRule[];
  autoFetch?: boolean;
}

export class IntegrationManager {
  private integrations: Map<string, BaseIntegration> = new Map();
  private config: IntegrationManagerConfig;
  private contextCache: Map<string, ContextItem[]> = new Map();

  constructor(config: IntegrationManagerConfig) {
    this.config = config;
    this.initializeIntegrations();
  }

  /**
   * Initialize all configured integrations
   */
  private initializeIntegrations(): void {
    for (const integrationConfig of this.config.integrations) {
      if (!integrationConfig.enabled) continue;

      let integration: BaseIntegration;

      switch (integrationConfig.type) {
        case 'jira':
          integration = new JiraIntegration(integrationConfig);
          break;
        case 'slack':
          integration = new SlackIntegration(integrationConfig);
          break;
        case 'github':
          integration = new GitHubIntegration(integrationConfig);
          break;
        case 'confluence':
          integration = new ConfluenceIntegration(integrationConfig);
          break;
        default:
          console.warn(`Unknown integration type: ${integrationConfig.type}`);
          continue;
      }

      this.integrations.set(integrationConfig.name, integration);
    }
  }

  /**
   * Automatically fetch context based on user message
   */
  async fetchContextForMessage(message: string): Promise<ContextItem[]> {
    const allContext: ContextItem[] = [];

    // Check for patterns in message
    const patterns = {
      jira: /[A-Z]+-\d+/g, // JIRA-1234
      github: /#\d+|\w+\/\w+#\d+/g, // #123 or owner/repo#123
      confluence: /\b\d{8,}\b/g // Confluence page IDs
    };

    // Extract triggers
    const triggers = new Map<string, Set<string>>();

    for (const [type, pattern] of Object.entries(patterns)) {
      const matches = message.match(pattern);
      if (matches) {
        triggers.set(type, new Set(matches));
      }
    }

    // Fetch context from each integration
    for (const [type, triggerSet] of triggers) {
      for (const trigger of triggerSet) {
        const cacheKey = `${type}:${trigger}`;

        // Check cache first
        if (this.contextCache.has(cacheKey)) {
          allContext.push(...this.contextCache.get(cacheKey)!);
          continue;
        }

        // Fetch from integration
        const integration = Array.from(this.integrations.values()).find(
          i => i.getName().includes(type)
        );

        if (integration) {
          try {
            const context = await integration.fetchContext(trigger);
            this.contextCache.set(cacheKey, context);
            allContext.push(...context);
          } catch (error) {
            console.warn(`Failed to fetch context from ${type}:`, error);
          }
        }
      }
    }

    // Apply context rules
    if (this.config.contextRules) {
      for (const rule of this.config.contextRules) {
        const regex = new RegExp(rule.trigger, 'i');
        if (regex.test(message)) {
          for (const action of rule.actions) {
            const context = await this.performAction(action, message);
            allContext.push(...context);
          }
        }
      }
    }

    return allContext;
  }

  /**
   * Alias for fetchContextForMessage
   */
  async autoFetchContext(message: string): Promise<ContextItem[]> {
    return this.fetchContextForMessage(message);
  }

  /**
   * Search across all integrations
   */
  async searchAll(query: string): Promise<ContextItem[]> {
    const results: ContextItem[] = [];

    for (const integration of this.integrations.values()) {
      try {
        const items = await integration.search(query);
        results.push(...items);
      } catch (error) {
        console.warn(`Search failed for ${integration.getName()}:`, error);
      }
    }

    return results;
  }

  /**
   * Update item in specific integration
   */
  async updateItem(integrationType: string, itemId: string, data: any): Promise<void> {
    const integration = Array.from(this.integrations.values()).find(
      i => i.getName().includes(integrationType)
    );

    if (!integration) {
      throw new Error(`Integration ${integrationType} not found`);
    }

    await integration.update(itemId, data);
  }

  /**
   * Perform a context action
   */
  private async performAction(action: string, context: string): Promise<ContextItem[]> {
    const results: ContextItem[] = [];

    if (action === 'fetchRelatedSlackMessages') {
      const slack = Array.from(this.integrations.values()).find(
        i => i.getName().includes('slack')
      );

      if (slack) {
        const items = await slack.search(context);
        results.push(...items);
      }
    }

    if (action === 'fetchRelatedConfluenceDocs') {
      const confluence = Array.from(this.integrations.values()).find(
        i => i.getName().includes('confluence')
      );

      if (confluence) {
        const items = await confluence.search(context);
        results.push(...items);
      }
    }

    return results;
  }

  /**
   * Format context for AI prompt
   */
  formatContextForPrompt(contexts: ContextItem[]): string {
    if (contexts.length === 0) {
      return '';
    }

    let prompt = '\n\n## Retrieved Context\n\n';

    for (const context of contexts) {
      prompt += `### ${context.type.toUpperCase()}: ${context.title}\n`;
      if (context.url) {
        prompt += `**URL:** ${context.url}\n`;
      }
      if (context.author) {
        prompt += `**Author:** ${context.author}\n`;
      }
      prompt += `**Updated:** ${context.updated.toLocaleString()}\n\n`;
      prompt += `${context.content.slice(0, 1000)}${context.content.length > 1000 ? '...' : ''}\n\n`;
      prompt += '---\n\n';
    }

    return prompt;
  }

  /**
   * Clear context cache
   */
  clearCache(): void {
    this.contextCache.clear();
  }

  /**
   * List all integrations
   */
  listIntegrations(): Array<{ name: string; type: string; enabled: boolean }> {
    return Array.from(this.integrations.values()).map(integration => ({
      name: integration.getName(),
      type: this.config.integrations.find(c => c.name === integration.getName())?.type || 'unknown',
      enabled: integration.isEnabled()
    }));
  }
}
