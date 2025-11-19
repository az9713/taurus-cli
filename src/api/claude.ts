/**
 * Claude API client
 */

import Anthropic from '@anthropic-ai/sdk';
import { Message, Tool } from '../types/index.js';
import { Config } from '../types/index.js';
import { logger } from '../utils/logger.js';
import { SYSTEM_PROMPT } from '../config/default.js';

export class ClaudeClient {
  private client: Anthropic;
  private config: Config;

  constructor(config: Config) {
    this.config = config;
    this.client = new Anthropic({
      apiKey: config.apiKey,
    });
  }

  async sendMessage(
    messages: Message[],
    tools: Tool[],
    systemPrompt: string = SYSTEM_PROMPT
  ): Promise<Anthropic.Message> {
    try {
      logger.debug(`Sending request to Claude with ${messages.length} messages`);

      const response = await this.client.messages.create({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: messages as any,
        tools: tools as any,
      });

      logger.debug(`Received response from Claude`);
      return response;
    } catch (error: any) {
      logger.error(`Claude API error: ${error.message}`);
      throw error;
    }
  }

  async streamMessage(
    messages: Message[],
    tools: Tool[],
    systemPrompt: string = SYSTEM_PROMPT,
    onText?: (text: string) => void,
    onToolUse?: (toolUse: any) => void
  ): Promise<Anthropic.Message> {
    try {
      logger.debug(`Streaming request to Claude with ${messages.length} messages`);

      const stream = await this.client.messages.stream({
        model: this.config.model,
        max_tokens: this.config.maxTokens,
        temperature: this.config.temperature,
        system: systemPrompt,
        messages: messages as any,
        tools: tools as any,
      });

      // Handle streaming events
      stream.on('text', (text) => {
        if (onText) {
          onText(text);
        }
      });

      stream.on('contentBlock', (block) => {
        if (block.type === 'tool_use' && onToolUse) {
          onToolUse(block);
        }
      });

      const finalMessage = await stream.finalMessage();
      logger.debug(`Stream completed`);

      return finalMessage;
    } catch (error: any) {
      logger.error(`Claude API streaming error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generate text without tools (for simple text generation)
   */
  async generateText(prompt: string): Promise<string> {
    try {
      const messages: Message[] = [
        {
          role: 'user',
          content: prompt,
        },
      ];

      const response = await this.sendMessage(messages, []);

      // Extract text from response
      const textContent = response.content.find((block: any) => block.type === 'text') as any;
      return textContent ? textContent.text : '';
    } catch (error: any) {
      logger.error(`Text generation error: ${error.message}`);
      throw error;
    }
  }
}
