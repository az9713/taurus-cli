/**
 * GitHub Integration
 *
 * Fetch context from GitHub issues and PRs
 */

import { BaseIntegration, IntegrationConfig, ContextItem, IntegrationError } from './base.js';

export class GitHubIntegration extends BaseIntegration {
  private token: string;
  private apiUrl: string = 'https://api.github.com';

  constructor(config: IntegrationConfig) {
    super(config);

    if (!config.token) {
      throw new IntegrationError('GitHub token is required', 'github');
    }

    this.token = config.token;
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.apiUrl}/user`, {
        headers: this.getHeaders()
      });

      return response.ok;
    } catch (error: any) {
      throw new IntegrationError(`Validation failed: ${error.message}`, 'github');
    }
  }

  async fetchContext(identifier: string): Promise<ContextItem[]> {
    // identifier format: "owner/repo#number" or just "#number"
    const match = identifier.match(/(?:([^/]+)\/([^#]+))?#(\d+)/);
    if (!match) {
      return [];
    }

    const [, owner, repo, number] = match;

    if (!owner || !repo) {
      // Try to get from current git repo
      return [];
    }

    const contexts: ContextItem[] = [];

    // Try fetching as issue
    try {
      const issueResponse = await fetch(
        `${this.apiUrl}/repos/${owner}/${repo}/issues/${number}`,
        { headers: this.getHeaders() }
      );

      if (issueResponse.ok) {
        const issue = await issueResponse.json() as any;

        contexts.push({
          id: `${owner}/${repo}#${number}`,
          type: issue.pull_request ? 'github-pr' : 'github-issue',
          title: issue.title,
          content: issue.body || '',
          url: issue.html_url,
          author: issue.user.login,
          created: new Date(issue.created_at),
          updated: new Date(issue.updated_at),
          metadata: {
            state: issue.state,
            labels: issue.labels.map((l: any) => l.name),
            comments: issue.comments
          }
        });

        // Fetch comments
        if (issue.comments > 0) {
          const commentsResponse = await fetch(
            `${this.apiUrl}/repos/${owner}/${repo}/issues/${number}/comments`,
            { headers: this.getHeaders() }
          );

          if (commentsResponse.ok) {
            const comments = await commentsResponse.json() as any;
            for (const comment of comments) {
              contexts.push({
                id: comment.id.toString(),
                type: 'github-comment',
                title: `Comment by ${comment.user.login}`,
                content: comment.body,
                author: comment.user.login,
                created: new Date(comment.created_at),
                updated: new Date(comment.updated_at),
                metadata: { issueNumber: number }
              });
            }
          }
        }
      }
    } catch (error: any) {
      throw new IntegrationError(`Failed to fetch: ${error.message}`, 'github');
    }

    return contexts;
  }

  async search(query: string): Promise<ContextItem[]> {
    try {
      const response = await fetch(
        `${this.apiUrl}/search/issues?q=${encodeURIComponent(query)}&sort=updated&per_page=10`,
        { headers: this.getHeaders() }
      );

      if (!response.ok) {
        throw new IntegrationError('Search failed', 'github');
      }

      const data = await response.json() as any;

      return data.items.map((item: any) => ({
        id: item.html_url,
        type: item.pull_request ? 'github-pr' : 'github-issue',
        title: item.title,
        content: item.body || '',
        url: item.html_url,
        created: new Date(item.created_at),
        updated: new Date(item.updated_at),
        metadata: {
          state: item.state,
          repo: item.repository_url
        }
      }));
    } catch (error: any) {
      throw new IntegrationError(`Search failed: ${error.message}`, 'github');
    }
  }

  async update(identifier: string, data: any): Promise<void> {
    const match = identifier.match(/([^/]+)\/([^#]+)#(\d+)/);
    if (!match) {
      throw new IntegrationError('Invalid identifier format', 'github');
    }

    const [, owner, repo, number] = match;

    try {
      if (data.comment) {
        await fetch(
          `${this.apiUrl}/repos/${owner}/${repo}/issues/${number}/comments`,
          {
            method: 'POST',
            headers: this.getHeaders(),
            body: JSON.stringify({ body: data.comment })
          }
        );
      }

      if (data.state) {
        await fetch(
          `${this.apiUrl}/repos/${owner}/${repo}/issues/${number}`,
          {
            method: 'PATCH',
            headers: this.getHeaders(),
            body: JSON.stringify({ state: data.state })
          }
        );
      }

      if (data.labels) {
        await fetch(
          `${this.apiUrl}/repos/${owner}/${repo}/issues/${number}/labels`,
          {
            method: 'PUT',
            headers: this.getHeaders(),
            body: JSON.stringify({ labels: data.labels })
          }
        );
      }
    } catch (error: any) {
      throw new IntegrationError(`Update failed: ${error.message}`, 'github');
    }
  }

  private getHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json'
    };
  }
}
