/**
 * Anthropic (Claude) Provider Implementation
 */

import Anthropic from '@anthropic-ai/sdk';
import {
  BaseProvider,
  ProviderConfig,
  Message,
  GenerateOptions,
  GenerateResponse,
  ProviderCapabilities,
  AuthenticationError,
  RateLimitError,
  ProviderError
} from './base.js';

export class AnthropicProvider extends BaseProvider {
  private client: Anthropic;

  constructor(config: ProviderConfig) {
    super(config);

    if (!config.apiKey) {
      throw new AuthenticationError('anthropic');
    }

    this.client = new Anthropic({
      apiKey: config.apiKey
    });
  }

  async validate(): Promise<boolean> {
    try {
      // Test API key by making a minimal request
      await this.client.messages.create({
        model: this.config.models[0] || 'claude-sonnet-4-5-20250929',
        max_tokens: 1,
        messages: [{ role: 'user', content: 'test' }]
      });
      return true;
    } catch (error: any) {
      if (error.status === 401) {
        throw new AuthenticationError('anthropic');
      }
      throw new ProviderError(`Validation failed: ${error.message}`, 'anthropic');
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      vision: true,
      maxContextLength: 200_000,
      costPerMillionInputTokens: 3.00, // Claude Sonnet pricing
      costPerMillionOutputTokens: 15.00
    };
  }

  async generate(
    messages: Message[],
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    try {
      const response = await this.client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens || 8096,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.content
        }))
      });

      const content = response.content
        .filter(block => block.type === 'text')
        .map((block: any) => block.text)
        .join('\n');

      return {
        content,
        model: response.model,
        usage: {
          inputTokens: response.usage.input_tokens,
          outputTokens: response.usage.output_tokens
        },
        finishReason: response.stop_reason === 'end_turn' ? 'stop' : 'length'
      };
    } catch (error: any) {
      if (error.status === 429) {
        throw new RateLimitError('anthropic', error.headers?.['retry-after']);
      }
      throw new ProviderError(`Generation failed: ${error.message}`, 'anthropic');
    }
  }

  async generateStream(
    messages: Message[],
    options: GenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<GenerateResponse> {
    try {
      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;

      const stream = await this.client.messages.create({
        model: options.model,
        max_tokens: options.maxTokens || 8096,
        temperature: options.temperature,
        system: options.systemPrompt,
        messages: messages.map(m => ({
          role: m.role === 'system' ? 'user' : m.role,
          content: m.content
        })),
        stream: true
      });

      for await (const event of stream) {
        if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
          const chunk = event.delta.text;
          fullContent += chunk;
          onChunk(chunk);
        }

        if (event.type === 'message_start') {
          inputTokens = event.message.usage.input_tokens;
        }

        if (event.type === 'message_delta') {
          outputTokens = event.usage.output_tokens;
        }
      }

      return {
        content: fullContent,
        model: options.model,
        usage: {
          inputTokens,
          outputTokens
        },
        finishReason: 'stop'
      };
    } catch (error: any) {
      if (error.status === 429) {
        throw new RateLimitError('anthropic', error.headers?.['retry-after']);
      }
      throw new ProviderError(`Streaming failed: ${error.message}`, 'anthropic');
    }
  }
}
