/**
 * Slack Integration
 *
 * Fetch context from Slack conversations
 */

import { BaseIntegration, IntegrationConfig, ContextItem, IntegrationError } from './base.js';

export class SlackIntegration extends BaseIntegration {
  private token: string;
  private channels: string[];
  private lookbackDays: number;

  constructor(config: IntegrationConfig & { channels?: string[] }) {
    super(config);

    if (!config.token) {
      throw new IntegrationError('Slack token is required', 'slack');
    }

    this.token = config.token;
    this.channels = config.channels || [];
    this.lookbackDays = config.lookbackDays || 7;
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch('https://slack.com/api/auth.test', {
        headers: this.getHeaders()
      });

      const data = await response.json() as any;
      return data.ok;
    } catch (error: any) {
      throw new IntegrationError(`Validation failed: ${error.message}`, 'slack');
    }
  }

  async fetchContext(trigger: string): Promise<ContextItem[]> {
    // Search for messages containing the trigger
    return this.search(trigger);
  }

  async search(query: string): Promise<ContextItem[]> {
    try {
      const contexts: ContextItem[] = [];
      const oldestTimestamp = Math.floor(Date.now() / 1000) - (this.lookbackDays * 24 * 60 * 60);

      const response = await fetch(
        `https://slack.com/api/search.messages?query=${encodeURIComponent(query)}&count=20`,
        { headers: this.getHeaders() }
      );

      const data = await response.json() as any;

      if (!data.ok) {
        throw new IntegrationError(data.error || 'Search failed', 'slack');
      }

      if (data.messages?.matches) {
        for (const message of data.messages.matches) {
          if (parseFloat(message.ts) < oldestTimestamp) continue;

          contexts.push({
            id: message.ts,
            type: 'slack-message',
            title: `Message in #${message.channel?.name || 'unknown'}`,
            content: message.text,
            author: message.username,
            created: new Date(parseFloat(message.ts) * 1000),
            updated: new Date(parseFloat(message.ts) * 1000),
            url: message.permalink,
            metadata: {
              channel: message.channel?.name,
              channelId: message.channel?.id
            }
          });

          // Get thread replies if exists
          if (message.thread_ts) {
            const threadContexts = await this.fetchThread(
              message.channel.id,
              message.thread_ts
            );
            contexts.push(...threadContexts);
          }
        }
      }

      return contexts;
    } catch (error: any) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(`Search failed: ${error.message}`, 'slack');
    }
  }

  async update(channelId: string, data: any): Promise<void> {
    try {
      if (data.message) {
        await fetch('https://slack.com/api/chat.postMessage', {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            channel: channelId,
            text: data.message
          })
        });
      }
    } catch (error: any) {
      throw new IntegrationError(`Failed to post message: ${error.message}`, 'slack');
    }
  }

  private async fetchThread(channelId: string, threadTs: string): Promise<ContextItem[]> {
    try {
      const response = await fetch(
        `https://slack.com/api/conversations.replies?channel=${channelId}&ts=${threadTs}`,
        { headers: this.getHeaders() }
      );

      const data = await response.json() as any;

      if (!data.ok || !data.messages) {
        return [];
      }

      return data.messages.slice(1).map((msg: any) => ({ // Skip first (parent) message
        id: msg.ts,
        type: 'slack-thread-reply',
        title: `Thread reply`,
        content: msg.text,
        author: msg.user,
        created: new Date(parseFloat(msg.ts) * 1000),
        updated: new Date(parseFloat(msg.ts) * 1000),
        metadata: { channelId, threadTs }
      }));
    } catch (error) {
      return [];
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Content-Type': 'application/json'
    };
  }
}
