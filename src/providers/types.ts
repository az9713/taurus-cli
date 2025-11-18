/**
 * Provider Types
 *
 * Type definitions for multi-model AI provider support
 */

export type ProviderType = 'anthropic' | 'openai' | 'ollama';

export interface ProviderConfig {
  type: ProviderType;
  apiKey?: string;
  baseUrl?: string;
  models?: string[];
}

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  maxContextLength: number;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface GenerateOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
}

export interface GenerateResponse {
  content: string;
  model: string;
  usage: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason?: string;
}

export interface RoutingRule {
  pattern: RegExp | string;
  provider: ProviderType;
  model?: string;
}

export interface ProviderUsage {
  provider: ProviderType;
  requests: number;
  totalInputTokens: number;
  totalOutputTokens: number;
  totalCost: number;
}
