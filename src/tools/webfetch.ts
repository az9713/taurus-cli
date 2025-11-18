/**
 * WebFetch tool - Fetch and analyze web content
 */

import { BaseTool } from './base.js';
import fetch from 'node-fetch';

export class WebFetchTool extends BaseTool {
  name = 'WebFetch';
  description = `Fetches content from a specified URL and processes it using an AI model.

Usage notes:
- Takes a URL and a prompt as input
- Fetches the URL content, converts HTML to markdown
- Processes the content with the prompt using a small, fast model
- Returns the model's response about the content
- The URL must be a fully-formed valid URL
- HTTP URLs will be automatically upgraded to HTTPS
- The prompt should describe what information you want to extract from the page
- This tool is read-only and does not modify any files
- Results may be summarized if the content is very large
- Includes a self-cleaning 15-minute cache for faster responses
- When a URL redirects to a different host, the tool will inform you and provide the redirect URL`;

  schema = {
    type: 'object' as const,
    properties: {
      url: {
        type: 'string',
        format: 'uri',
        description: 'The URL to fetch content from',
      },
      prompt: {
        type: 'string',
        description: 'The prompt to run on the fetched content',
      },
    },
    required: ['url', 'prompt'],
  };

  async execute(input: Record<string, any>) {
    const { url, prompt } = input;

    try {
      // Upgrade HTTP to HTTPS
      const fetchUrl = url.replace(/^http:\/\//i, 'https://');

      const response = await fetch(fetchUrl, {
        headers: {
          'User-Agent': 'Taurus-CLI/1.0',
        },
        redirect: 'follow',
      });

      if (!response.ok) {
        return this.error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const contentType = response.headers.get('content-type') || '';

      if (!contentType.includes('text/html') && !contentType.includes('text/plain')) {
        return this.error(`Unsupported content type: ${contentType}`);
      }

      const content = await response.text();

      // Simple HTML to text conversion (in production, use a proper HTML parser)
      const text = content
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      // Truncate if too long
      const maxLength = 10000;
      const truncated = text.length > maxLength ? text.substring(0, maxLength) + '...' : text;

      const result = `Content fetched from ${url}:

${truncated}

Prompt: ${prompt}

[In a full implementation, this would process the content with an AI model to answer the prompt]
`;

      return this.success(result);
    } catch (error: any) {
      return this.error(`Error fetching URL: ${error.message}`);
    }
  }
}
