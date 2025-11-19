/**
 * Base AI Provider Interface
 *
 * All AI providers (Anthropic, OpenAI, Ollama, etc.) must implement this interface
 */

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ProviderConfig {
  name: string;
  type: 'anthropic' | 'openai' | 'ollama' | 'gemini';
  apiKey?: string;
  baseUrl?: string;
  models: string[];
  enabled: boolean;
}

export interface GenerateOptions {
  model: string;
  maxTokens?: number;
  temperature?: number;
  stream?: boolean;
  systemPrompt?: string;
}

export interface GenerateResponse {
  content: string;
  model: string;
  usage?: {
    inputTokens: number;
    outputTokens: number;
  };
  finishReason?: 'stop' | 'length' | 'error';
}

export interface ProviderCapabilities {
  streaming: boolean;
  functionCalling: boolean;
  vision: boolean;
  maxContextLength: number;
  costPerMillionInputTokens: number;
  costPerMillionOutputTokens: number;
}

/**
 * Base Provider Abstract Class
 */
export abstract class BaseProvider {
  protected config: ProviderConfig;
  protected capabilities: ProviderCapabilities;

  constructor(config: ProviderConfig) {
    this.config = config;
    this.capabilities = this.getCapabilities();
  }

  /**
   * Generate a response from the AI provider
   */
  abstract generate(
    messages: Message[],
    options: GenerateOptions
  ): Promise<GenerateResponse>;

  /**
   * Stream a response from the AI provider
   */
  abstract generateStream(
    messages: Message[],
    options: GenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<GenerateResponse>;

  /**
   * Validate the provider configuration
   */
  abstract validate(): Promise<boolean>;

  /**
   * Get provider capabilities
   */
  abstract getCapabilities(): ProviderCapabilities;

  /**
   * List available models
   */
  getModels(): string[] {
    return this.config.models;
  }

  /**
   * Check if a model is available
   */
  hasModel(model: string): boolean {
    return this.config.models.includes(model);
  }

  /**
   * Get provider name
   */
  getName(): string {
    return this.config.name;
  }

  /**
   * Check if provider is enabled
   */
  isEnabled(): boolean {
    return this.config.enabled;
  }

  /**
   * Calculate cost for a request
   */
  calculateCost(inputTokens: number, outputTokens: number): number {
    const inputCost = (inputTokens / 1_000_000) * this.capabilities.costPerMillionInputTokens;
    const outputCost = (outputTokens / 1_000_000) * this.capabilities.costPerMillionOutputTokens;
    return inputCost + outputCost;
  }
}

/**
 * Provider Error Types
 */
export class ProviderError extends Error {
  constructor(
    message: string,
    public provider: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ProviderError';
  }
}

export class AuthenticationError extends ProviderError {
  constructor(provider: string) {
    super(`Authentication failed for provider: ${provider}`, provider, 'AUTH_ERROR');
    this.name = 'AuthenticationError';
  }
}

export class RateLimitError extends ProviderError {
  constructor(provider: string, public retryAfter?: number) {
    super(`Rate limit exceeded for provider: ${provider}`, provider, 'RATE_LIMIT');
    this.name = 'RateLimitError';
  }
}

export class ModelNotFoundError extends ProviderError {
  constructor(provider: string, model: string) {
    super(`Model '${model}' not found for provider: ${provider}`, provider, 'MODEL_NOT_FOUND');
    this.name = 'ModelNotFoundError';
  }
}
