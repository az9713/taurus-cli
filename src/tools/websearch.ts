/**
 * WebSearch tool - Search the web
 */

import { BaseTool } from './base.js';

export class WebSearchTool extends BaseTool {
  name = 'WebSearch';
  description = `Allows Claude to search the web and use the results to inform responses.

Usage notes:
- Provides up-to-date information for current events and recent data
- Returns search result information formatted as search result blocks
- Use this tool for accessing information beyond Claude's knowledge cutoff
- Searches are performed automatically within a single API call
- Domain filtering is supported to include or block specific websites
- Web search is only available in the US
- Account for "Today's date" in context. For example, if today is 2025-07-01, and the user wants the latest docs, do not use 2024 in the search query. Use 2025.`;

  schema = {
    type: 'object' as const,
    properties: {
      query: {
        type: 'string',
        description: 'The search query to use',
        minLength: 2,
      },
      allowed_domains: {
        type: 'array',
        description: 'Only include search results from these domains',
        items: {
          type: 'string',
        },
      },
      blocked_domains: {
        type: 'array',
        description: 'Never include search results from these domains',
        items: {
          type: 'string',
        },
      },
    },
    required: ['query'],
  };

  async execute(input: Record<string, any>) {
    const { query, allowed_domains, blocked_domains } = input;

    // In a real implementation, this would call a search API
    // For now, we'll simulate search results
    const result = `Search results for: "${query}"

${allowed_domains ? `Allowed domains: ${allowed_domains.join(', ')}\n` : ''}${blocked_domains ? `Blocked domains: ${blocked_domains.join(', ')}\n` : ''}
[In a full implementation, this would return actual search results from a web search API]

Example results:
1. Result 1 - Relevant content about ${query}
2. Result 2 - More information on ${query}
3. Result 3 - Additional details regarding ${query}
`;

    return this.success(result);
  }
}
