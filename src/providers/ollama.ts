/**
 * Ollama Provider Implementation (Local Models)
 */

import {
  BaseProvider,
  ProviderConfig,
  Message,
  GenerateOptions,
  GenerateResponse,
  ProviderCapabilities,
  ProviderError
} from './base.js';

export class OllamaProvider extends BaseProvider {
  private baseUrl: string;

  constructor(config: ProviderConfig) {
    super(config);
    this.baseUrl = config.baseUrl || 'http://localhost:11434';
  }

  async validate(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      return response.ok;
    } catch (error: any) {
      throw new ProviderError(
        `Cannot connect to Ollama at ${this.baseUrl}. Is Ollama running?`,
        'ollama'
      );
    }
  }

  getCapabilities(): ProviderCapabilities {
    return {
      streaming: true,
      functionCalling: false, // Most Ollama models don't support function calling
      vision: false, // Depends on model (llava supports it)
      maxContextLength: 4096, // Varies by model
      costPerMillionInputTokens: 0, // Local, no cost
      costPerMillionOutputTokens: 0
    };
  }

  async generate(
    messages: Message[],
    options: GenerateOptions
  ): Promise<GenerateResponse> {
    try {
      // Convert messages to Ollama format
      const prompt = this.messagesToPrompt(messages, options.systemPrompt);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model,
          prompt,
          stream: false,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2048
          }
        })
      });

      if (!response.ok) {
        const error = await response.text();
        throw new ProviderError(`Request failed: ${error}`, 'ollama');
      }

      const data = await response.json() as any;

      return {
        content: data.response,
        model: options.model,
        usage: {
          inputTokens: data.prompt_eval_count || 0,
          outputTokens: data.eval_count || 0
        },
        finishReason: data.done ? 'stop' : 'length'
      };
    } catch (error: any) {
      throw new ProviderError(`Generation failed: ${error.message}`, 'ollama');
    }
  }

  async generateStream(
    messages: Message[],
    options: GenerateOptions,
    onChunk: (chunk: string) => void
  ): Promise<GenerateResponse> {
    try {
      const prompt = this.messagesToPrompt(messages, options.systemPrompt);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: options.model,
          prompt,
          stream: true,
          options: {
            temperature: options.temperature || 0.7,
            num_predict: options.maxTokens || 2048
          }
        })
      });

      if (!response.ok) {
        throw new ProviderError('Streaming request failed', 'ollama');
      }

      let fullContent = '';
      let inputTokens = 0;
      let outputTokens = 0;
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();

      if (!reader) {
        throw new ProviderError('No response body', 'ollama');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          try {
            const data = JSON.parse(line) as any;
            if (data.response) {
              fullContent += data.response;
              onChunk(data.response);
            }

            if (data.prompt_eval_count) inputTokens = data.prompt_eval_count;
            if (data.eval_count) outputTokens = data.eval_count;
          } catch (e) {
            // Skip invalid JSON
          }
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
      throw new ProviderError(`Streaming failed: ${error.message}`, 'ollama');
    }
  }

  /**
   * Convert messages array to a single prompt string for Ollama
   */
  private messagesToPrompt(messages: Message[], systemPrompt?: string): string {
    let prompt = '';

    if (systemPrompt) {
      prompt += `System: ${systemPrompt}\n\n`;
    }

    for (const message of messages) {
      if (message.role === 'system') {
        prompt += `System: ${message.content}\n\n`;
      } else if (message.role === 'user') {
        prompt += `User: ${message.content}\n\n`;
      } else if (message.role === 'assistant') {
        prompt += `Assistant: ${message.content}\n\n`;
      }
    }

    prompt += 'Assistant: ';

    return prompt;
  }

  /**
   * List available models from Ollama
   */
  async listAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json() as any;
      return data.models.map((m: any) => m.name);
    } catch (error) {
      return [];
    }
  }
}
