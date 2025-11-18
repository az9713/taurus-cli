/**
 * Jira Integration
 *
 * Fetch context from Jira tickets
 */

import { BaseIntegration, IntegrationConfig, ContextItem, IntegrationError } from './base.js';

export class JiraIntegration extends BaseIntegration {
  private baseUrl: string;
  private email: string;
  private apiToken: string;

  constructor(config: IntegrationConfig & { email?: string }) {
    super(config);

    if (!config.url) {
      throw new IntegrationError('Jira URL is required', 'jira');
    }

    if (!config.token) {
      throw new IntegrationError('Jira API token is required', 'jira');
    }

    this.baseUrl = config.url;
    this.email = config.email || '';
    this.apiToken = config.token;
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/rest/api/3/myself`, {
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error: any) {
      throw new IntegrationError(`Validation failed: ${error.message}`, 'jira');
    }
  }

  async fetchContext(ticketKey: string): Promise<ContextItem[]> {
    try {
      const contexts: ContextItem[] = [];

      // Fetch ticket details
      const ticketResponse = await fetch(
        `${this.baseUrl}/rest/api/3/issue/${ticketKey}`,
        { headers: this.getHeaders() }
      );

      if (!ticketResponse.ok) {
        throw new IntegrationError(`Ticket ${ticketKey} not found`, 'jira', 'NOT_FOUND');
      }

      const ticket = await ticketResponse.json() as any;

      // Main ticket context
      contexts.push({
        id: ticket.key,
        type: 'jira-ticket',
        title: ticket.fields.summary,
        content: `
**Description:**
${ticket.fields.description || 'No description'}

**Status:** ${ticket.fields.status.name}
**Priority:** ${ticket.fields.priority?.name || 'None'}
**Assignee:** ${ticket.fields.assignee?.displayName || 'Unassigned'}

**Labels:** ${ticket.fields.labels?.join(', ') || 'None'}
        `.trim(),
        url: `${this.baseUrl}/browse/${ticket.key}`,
        author: ticket.fields.creator.displayName,
        created: new Date(ticket.fields.created),
        updated: new Date(ticket.fields.updated),
        metadata: {
          status: ticket.fields.status.name,
          priority: ticket.fields.priority?.name,
          type: ticket.fields.issuetype.name
        }
      });

      // Fetch comments
      if (ticket.fields.comment?.comments) {
        for (const comment of ticket.fields.comment.comments) {
          contexts.push({
            id: comment.id,
            type: 'jira-comment',
            title: `Comment by ${comment.author.displayName}`,
            content: comment.body,
            author: comment.author.displayName,
            created: new Date(comment.created),
            updated: new Date(comment.updated),
            metadata: { ticketKey }
          });
        }
      }

      // Fetch linked issues
      if (ticket.fields.issuelinks) {
        for (const link of ticket.fields.issuelinks) {
          const linkedIssue = link.outwardIssue || link.inwardIssue;
          if (linkedIssue) {
            contexts.push({
              id: linkedIssue.key,
              type: 'jira-linked-ticket',
              title: `${link.type.name}: ${linkedIssue.fields.summary}`,
              content: linkedIssue.fields.summary,
              url: `${this.baseUrl}/browse/${linkedIssue.key}`,
              created: new Date(),
              updated: new Date(),
              metadata: { linkType: link.type.name }
            });
          }
        }
      }

      return contexts;
    } catch (error: any) {
      if (error instanceof IntegrationError) throw error;
      throw new IntegrationError(`Failed to fetch ticket: ${error.message}`, 'jira');
    }
  }

  async search(query: string): Promise<ContextItem[]> {
    try {
      const jql = `text ~ "${query}" ORDER BY updated DESC`;
      const response = await fetch(
        `${this.baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&maxResults=10`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new IntegrationError('Search failed', 'jira');
      }

      const data = await response.json() as any;

      return data.issues.map((issue: any) => ({
        id: issue.key,
        type: 'jira-ticket',
        title: issue.fields.summary,
        content: issue.fields.description || '',
        url: `${this.baseUrl}/browse/${issue.key}`,
        created: new Date(issue.fields.created),
        updated: new Date(issue.fields.updated),
        metadata: {
          status: issue.fields.status.name,
          priority: issue.fields.priority?.name
        }
      }));
    } catch (error: any) {
      throw new IntegrationError(`Search failed: ${error.message}`, 'jira');
    }
  }

  async update(ticketKey: string, data: any): Promise<void> {
    try {
      const updates: any = {};

      if (data.status) {
        // Transition ticket
        const transitionsResponse = await fetch(
          `${this.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`,
          { headers: this.getHeaders() }
        );

        const transitions = await transitionsResponse.json() as any;
        const transition = transitions.transitions.find(
          (t: any) => t.to.name.toLowerCase() === data.status.toLowerCase()
        );

        if (transition) {
          await fetch(`${this.baseUrl}/rest/api/3/issue/${ticketKey}/transitions`, {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ transition: { id: transition.id } })
          });
        }
      }

      if (data.comment) {
        // Add comment
        await fetch(`${this.baseUrl}/rest/api/3/issue/${ticketKey}/comment`, {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({ body: data.comment })
        });
      }

      if (data.assignee) {
        updates.assignee = { name: data.assignee };
      }

      if (Object.keys(updates).length > 0) {
        await fetch(`${this.baseUrl}/rest/api/3/issue/${ticketKey}`, {
          method: 'PUT',
          headers: this.getHeaders(),
          body: JSON.stringify({ fields: updates })
        });
      }
    } catch (error: any) {
      throw new IntegrationError(`Update failed: ${error.message}`, 'jira');
    }
  }

  private getHeaders(): Record<string, string> {
    const auth = Buffer.from(`${this.email}:${this.apiToken}`).toString('base64');
    return {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    };
  }
}
