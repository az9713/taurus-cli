/**
 * Confluence Integration
 *
 * Fetch context from Confluence pages
 */

import { BaseIntegration, IntegrationConfig, ContextItem, IntegrationError } from './base.js';

export class ConfluenceIntegration extends BaseIntegration {
  private baseUrl: string;
  private email: string;
  private apiToken: string;

  constructor(config: IntegrationConfig & { email?: string }) {
    super(config);

    if (!config.url) {
      throw new IntegrationError('Confluence URL is required', 'confluence');
    }

    if (!config.token) {
      throw new IntegrationError('Confluence API token is required', 'confluence');
    }

    this.baseUrl = config.url;
    this.email = config.email || '';
    this.apiToken = config.token;
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/user/current`, {
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error: any) {
      throw new IntegrationError(`Validation failed: ${error.message}`, 'confluence');
    }
  }

  async fetchContext(pageId: string): Promise<ContextItem[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/api/content/${pageId}?expand=body.storage,version,history`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new IntegrationError(`Page ${pageId} not found`, 'confluence');
      }

      const page = await response.json() as any;

      return [{
        id: page.id,
        type: 'confluence-page',
        title: page.title,
        content: this.stripHtml(page.body.storage.value),
        url: `${this.baseUrl}${page._links.webui}`,
        author: page.history.createdBy.displayName,
        created: new Date(page.history.createdDate),
        updated: new Date(page.version.when),
        metadata: {
          spaceKey: page.space.key,
          version: page.version.number
        }
      }];
    } catch (error: any) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(`Failed to fetch page: ${error.message}`, 'confluence');
    }
  }

  async search(query: string): Promise<ContextItem[]> {
    try {
      const response = await fetch(
        `${this.baseUrl}/rest/api/content/search?cql=${encodeURIComponent(`text ~ "${query}"`)}`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new IntegrationError('Search failed', 'confluence');
      }

      const data = await response.json() as any;

      return data.results.map((page: any) => ({
        id: page.id,
        type: 'confluence-page',
        title: page.title,
        content: page.excerpt || '',
        url: `${this.baseUrl}${page._links.webui}`,
        created: new Date(),
        updated: new Date(),
        metadata: { spaceKey: page.space.key }
      }));
    } catch (error: any) {
      throw new IntegrationError(`Search failed: ${error.message}`, 'confluence');
    }
  }

  async update(pageId: string, data: any): Promise<void> {
    // Confluence updates require full page content, simplified for demo
    throw new IntegrationError('Update not implemented', 'confluence');
  }

  private getHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }

  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim();
  }
}
