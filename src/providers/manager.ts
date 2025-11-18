/**
 * Provider Manager
 *
 * Manages multiple AI providers and routes requests to the appropriate provider
 */

import {
  BaseProvider,
  ProviderConfig,
  Message,
  GenerateOptions,
  GenerateResponse,
  ProviderError,
  ModelNotFoundError
} from './base.js';
import { AnthropicProvider } from './anthropic.js';
import { OpenAIProvider } from './openai.js';
import { OllamaProvider } from './ollama.js';

export interface RoutingRule {
  taskPattern?: string; // Regex pattern to match task description
  provider?: string; // Specific provider to use
  model?: string; // Specific model to use
  priority?: number; // Higher priority rules are matched first
}

export interface ProviderManagerConfig {
  providers: ProviderConfig[];
  routing?: {
    rules?: RoutingRule[];
    defaultProvider?: string;
    defaultModel?: string;
    autoRoute?: boolean; // Automatically choose best provider/model
  };
}

export class ProviderManager {
  private providers: Map<string, BaseProvider> = new Map();
  private config: ProviderManagerConfig;
  private requestCount: Map<string, number> = new Map();
  private totalCost: number = 0;

  constructor(config: ProviderManagerConfig) {
    this.config = config;
    this.initializeProviders();
  }

  /**
   * Initialize all configured providers
   */
  private initializeProviders(): void {
    for (const providerConfig of this.config.providers) {
      if (!providerConfig.enabled) continue;

      let provider: BaseProvider;

      switch (providerConfig.type) {
        case 'anthropic':
          provider = new AnthropicProvider(providerConfig);
          break;
        case 'openai':
          provider = new OpenAIProvider(providerConfig);
          break;
        case 'ollama':
          provider = new OllamaProvider(providerConfig);
          break;
        default:
          console.warn(`Unknown provider type: ${providerConfig.type}`);
          continue;
      }

      this.providers.set(providerConfig.name, provider);
      this.requestCount.set(providerConfig.name, 0);
    }
  }

  /**
   * Validate all providers
   */
  async validateAll(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();

    for (const [name, provider] of this.providers) {
      try {
        const isValid = await provider.validate();
        results.set(name, isValid);
      } catch (error) {
        results.set(name, false);
        console.error(`Provider ${name} validation failed:`, error);
      }
    }

    return results;
  }

  /**
   * Generate a response using the best available provider
   */
  async generate(
    messages: Message[],
    options?: Partial<GenerateOptions>,
    taskDescription?: string
  ): Promise<GenerateResponse> {
    const { provider, model } = this.selectProvider(options?.model, taskDescription);

    const generateOptions: GenerateOptions = {
      model,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      systemPrompt: options?.systemPrompt
    };

    try {
      const response = await provider.generate(messages, generateOptions);

      // Track usage
      this.requestCount.set(provider.getName(), (this.requestCount.get(provider.getName()) || 0) + 1);

      if (response.usage) {
        const cost = provider.calculateCost(response.usage.inputTokens, response.usage.outputTokens);
        this.totalCost += cost;
      }

      return response;
    } catch (error: any) {
      // Try fallback provider if available
      if (this.config.routing?.autoRoute) {
        console.warn(`Provider ${provider.getName()} failed, trying fallback...`);
        return this.generateWithFallback(messages, generateOptions, provider.getName());
      }
      throw error;
    }
  }

  /**
   * Stream a response using the best available provider
   */
  async generateStream(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<GenerateOptions>,
    taskDescription?: string
  ): Promise<GenerateResponse> {
    const { provider, model } = this.selectProvider(options?.model, taskDescription);

    const generateOptions: GenerateOptions = {
      model,
      maxTokens: options?.maxTokens,
      temperature: options?.temperature,
      systemPrompt: options?.systemPrompt,
      stream: true
    };

    const response = await provider.generateStream(messages, generateOptions, onChunk);

    // Track usage
    this.requestCount.set(provider.getName(), (this.requestCount.get(provider.getName()) || 0) + 1);

    if (response.usage) {
      const cost = provider.calculateCost(response.usage.inputTokens, response.usage.outputTokens);
      this.totalCost += cost;
    }

    return response;
  }

  /**
   * Select the best provider and model for a request
   */
  private selectProvider(requestedModel?: string, taskDescription?: string): {
    provider: BaseProvider;
    model: string;
  } {
    // If specific model requested, find provider that has it
    if (requestedModel) {
      for (const [name, provider] of this.providers) {
        if (provider.hasModel(requestedModel)) {
          return { provider, model: requestedModel };
        }
      }
      throw new ModelNotFoundError('unknown', requestedModel);
    }

    // Check routing rules
    if (this.config.routing?.rules && taskDescription) {
      const matchedRule = this.findMatchingRule(taskDescription);
      if (matchedRule) {
        const provider = this.providers.get(matchedRule.provider!);
        if (provider) {
          const model = matchedRule.model || provider.getModels()[0];
          return { provider, model };
        }
      }
    }

    // Use default provider/model
    const defaultProviderName = this.config.routing?.defaultProvider || this.providers.keys().next().value || 'anthropic';
    const provider = this.providers.get(defaultProviderName);

    if (!provider) {
      throw new ProviderError('No available providers', 'manager');
    }

    const model = this.config.routing?.defaultModel || provider.getModels()[0];

    return { provider, model };
  }

  /**
   * Find matching routing rule
   */
  private findMatchingRule(taskDescription: string): RoutingRule | null {
    if (!this.config.routing?.rules) return null;

    const sortedRules = [...this.config.routing.rules].sort(
      (a, b) => (b.priority || 0) - (a.priority || 0)
    );

    for (const rule of sortedRules) {
      if (rule.taskPattern) {
        const regex = new RegExp(rule.taskPattern, 'i');
        if (regex.test(taskDescription)) {
          return rule;
        }
      }
    }

    return null;
  }

  /**
   * Try fallback providers
   */
  private async generateWithFallback(
    messages: Message[],
    options: GenerateOptions,
    failedProvider: string
  ): Promise<GenerateResponse> {
    for (const [name, provider] of this.providers) {
      if (name === failedProvider) continue;

      try {
        // Try with first available model from this provider
        const model = provider.getModels()[0];
        return await provider.generate(messages, { ...options, model });
      } catch (error) {
        console.warn(`Fallback provider ${name} also failed`);
      }
    }

    throw new ProviderError('All providers failed', 'manager');
  }

  /**
   * Get usage statistics
   */
  getStats(): {
    requestsByProvider: Record<string, number>;
    totalRequests: number;
    totalCost: number;
    averageCostPerRequest: number;
  } {
    const requestsByProvider: Record<string, number> = {};
    let totalRequests = 0;

    for (const [name, count] of this.requestCount) {
      requestsByProvider[name] = count;
      totalRequests += count;
    }

    return {
      requestsByProvider,
      totalRequests,
      totalCost: this.totalCost,
      averageCostPerRequest: totalRequests > 0 ? this.totalCost / totalRequests : 0
    };
  }

  /**
   * List all available providers
   */
  listProviders(): Array<{
    name: string;
    type: string;
    enabled: boolean;
    models: string[];
  }> {
    return Array.from(this.providers.values()).map(provider => ({
      name: provider.getName(),
      type: this.config.providers.find(p => p.name === provider.getName())?.type || 'unknown',
      enabled: provider.isEnabled(),
      models: provider.getModels()
    }));
  }

  /**
   * Get a specific provider
   */
  getProvider(name: string): BaseProvider | undefined {
    return this.providers.get(name);
  }
}
