/**
 * OpenAI (GPT) Provider Implementation
 */

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

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export class OpenAIProvider extends BaseProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);

    if (!config.apiKey) {
      throw new AuthenticationError('openai');
    }

    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });

      if (response.status === 401) {
        throw new AuthenticationError('openai');
      }

      return response.ok;
    } catch (error: any) {
      throw new ProviderError(`Validation failed: ${error.message}`, 'openai');
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: true,
      vision: true, // GPT-4 Vision
      maxContextLength: 128_000, // GPT-4 Turbo
      costPerMillionInputTokens: 10.00, // GPT-4 Turbo pricing
      costPerMillionOutputTokens: 30.00
    };
  }

  async generate(
    messages: Message[],
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    try {
      const openaiMessages: OpenAIMessage[] = messages.map(m => ({
        role: m.role === 'system' ? 'system' : m.role,
        content: m.content
      }));

      // Add system prompt if provided
      if (options.systemPrompt) {
        openaiMessages.unshift({
          role: 'system',
          content: options.systemPrompt
        });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model,
          messages: openaiMessages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
          stream: false
        })
      });

      if (response.status === 429) {
        const retryAfter = response.headers.get('retry-after');
        throw new RateLimitError('openai', retryAfter ? parseInt(retryAfter) : undefined);
      }

      if (!response.ok) {
        const error = await response.json() as any;
        throw new ProviderError(error.error?.message || 'Request failed', 'openai');
      }

      const data = await response.json() as any;

      return {
        content: data.choices[0].message.content,
        model: data.model,
        usage: {
          inputTokens: data.usage.prompt_tokens,
          outputTokens: data.usage.completion_tokens
        },
        finishReason: data.choices[0].finish_reason === 'stop' ? 'stop' : 'length'
      };
    } catch (error: any) {
      if (error instanceof RateLimitError) throw error;
      throw new ProviderError(`Generation failed: ${error.message}`, 'openai');
    }
  }

  async generateStream(
    messages: Message[],
    options: GenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<GenerateResponse> {
    try {
      const openaiMessages: OpenAIMessage[] = messages.map(m => ({
        role: m.role === 'system' ? 'system' : m.role,
        content: m.content
      }));

      if (options.systemPrompt) {
        openaiMessages.unshift({
          role: 'system',
          content: options.systemPrompt
        });
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model,
          messages: openaiMessages,
          max_tokens: options.maxTokens || 4096,
          temperature: options.temperature || 0.7,
          stream: true
        })
      });

      if (!response.ok) {
        throw new ProviderError('Streaming request failed', 'openai');
      }

      let fullContent = '';
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new ProviderError('No response body', 'openai');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content;
              if (content) {
                fullContent += content;
                onChunk(content);
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      return {
        content: fullContent,
        model: options.model,
        usage: {
          inputTokens: 0, // OpenAI doesn't provide this in streaming
          outputTokens: 0
        },
        finishReason: 'stop'
      };
    } catch (error: any) {
      throw new ProviderError(`Streaming failed: ${error.message}`, 'openai');
    }
  }
}
