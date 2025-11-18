/**
 * Integration Types
 *
 * Type definitions for context-aware integrations
 */

export type ContextSource = 'jira' | 'github' | 'slack' | 'confluence';

export interface ContextItem {
  source: ContextSource;
  id: string;
  title: string;
  content: string;
  url?: string;
  metadata?: Record<string, any>;
  fetchedAt: Date;
}

export interface IntegrationConfig {
  jira?: {
    url: string;
    email: string;
    apiToken: string;
  };
  github?: {
    token: string;
  };
  slack?: {
    token: string;
    lookbackDays?: number;
  };
  confluence?: {
    url: string;
    email: string;
    apiToken: string;
  };
}

export interface ContextRule {
  pattern: RegExp | string;
  integration: ContextSource;
  enabled: boolean;
}
