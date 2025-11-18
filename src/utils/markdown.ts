/**
 * Markdown rendering utilities
 */

import { marked } from 'marked';

// Simple markdown renderer for terminal
export function renderMarkdown(markdown: string): string {
  try {
    // Basic markdown to text conversion for terminal
    return marked(markdown) as string;
  } catch (error) {
    return markdown;
  }
}
