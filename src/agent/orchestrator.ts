/**
 * Agent orchestrator - Coordinates tools, Claude API, and conversation flow
 */

import { ClaudeClient } from '../api/claude.js';
import { ToolRegistry } from '../tools/index.js';
import { SessionManager } from '../session/manager.js';
import { HooksManager } from '../hooks/manager.js';
import { ConfigManager } from '../config/manager.js';
import { Message, ContentBlock, ToolUseBlock, ToolResultBlock } from '../types/index.js';
import { logger } from '../utils/logger.js';
import chalk from 'chalk';

export class AgentOrchestrator {
  private claudeClient: ClaudeClient;
  private toolRegistry: ToolRegistry;
  private sessionManager: SessionManager;
  private hooksManager: HooksManager;

  constructor(
    claudeClient: ClaudeClient,
    toolRegistry: ToolRegistry,
    sessionManager: SessionManager,
    hooksManager: HooksManager,
    _configManager: ConfigManager
  ) {
    this.claudeClient = claudeClient;
    this.toolRegistry = toolRegistry;
    this.sessionManager = sessionManager;
    this.hooksManager = hooksManager;
  }

  async processUserMessage(userInput: string): Promise<void> {
    // Trigger user-prompt-submit hook
    await this.hooksManager.trigger('user-prompt-submit', {
      input: userInput,
    });

    // Add user message to session
    const userMessage: Message = {
      role: 'user',
      content: userInput,
    };
    this.sessionManager.addMessage(userMessage);

    // Process the conversation
    await this.processConversation();

    // Save session
    await this.sessionManager.saveSession();
  }

  private async processConversation(): Promise<void> {
    let continueProcessing = true;
    let iterationCount = 0;
    const maxIterations = 50; // Prevent infinite loops

    while (continueProcessing && iterationCount < maxIterations) {
      iterationCount++;

      const messages = this.sessionManager.getMessages();
      const tools = this.toolRegistry.getDefinitions();

      try {
        // Call Claude API
        const response = await this.claudeClient.sendMessage(messages, tools);

        // Process response
        const assistantMessage: Message = {
          role: 'assistant',
          content: response.content as ContentBlock[],
        };
        this.sessionManager.addMessage(assistantMessage);

        // Check stop reason
        if (response.stop_reason === 'end_turn') {
          // Display text content
          this.displayAssistantMessage(assistantMessage);
          continueProcessing = false;
        } else if (response.stop_reason === 'tool_use') {
          // Process tool calls
          await this.processToolCalls(response.content as ContentBlock[]);
          // Continue to next iteration
        } else if (response.stop_reason === 'max_tokens') {
          logger.warn('Response reached max tokens limit');
          continueProcessing = false;
        }
      } catch (error: any) {
        logger.error(`Error in conversation processing: ${error.message}`);
        continueProcessing = false;
      }
    }

    if (iterationCount >= maxIterations) {
      logger.warn('Reached maximum iteration limit');
    }
  }

  private async processToolCalls(content: ContentBlock[]): Promise<void> {
    const toolUses = content.filter((block) => block.type === 'tool_use') as ToolUseBlock[];

    if (toolUses.length === 0) {
      return;
    }

    logger.info(`\n${chalk.cyan('⚙ Executing')} ${toolUses.length} tool(s)...`);

    // Execute tools in parallel
    const toolResults = await Promise.all(
      toolUses.map(async (toolUse) => {
        await this.hooksManager.trigger('before-tool-call', {
          tool: toolUse.name,
        });

        logger.info(`  ${chalk.gray('→')} ${toolUse.name}`);

        const result = await this.toolRegistry.execute(toolUse.name, toolUse.input);

        await this.hooksManager.trigger('after-tool-call', {
          tool: toolUse.name,
          success: !result.is_error,
        });

        const resultBlock: ToolResultBlock = {
          type: 'tool_result',
          tool_use_id: toolUse.id,
          content: result.content,
          is_error: result.is_error,
        };

        if (result.is_error) {
          logger.error(`  ${chalk.red('✗')} ${toolUse.name}: ${result.content.substring(0, 100)}`);
        } else {
          logger.success(`  ${chalk.green('✓')} ${toolUse.name}`);
        }

        return resultBlock;
      })
    );

    // Add tool results to session
    const toolResultMessage: Message = {
      role: 'user',
      content: toolResults,
    };
    this.sessionManager.addMessage(toolResultMessage);
  }

  private displayAssistantMessage(message: Message): void {
    const content = Array.isArray(message.content) ? message.content : [message.content];

    for (const block of content) {
      if (typeof block === 'string') {
        console.log(chalk.white(block));
      } else if (block.type === 'text') {
        console.log(chalk.white(block.text));
      }
    }
  }

  async initialize(): Promise<void> {
    // Trigger session-start hook
    await this.hooksManager.trigger('session-start', {
      sessionId: this.sessionManager.getCurrentSession()?.id,
    });
  }

  async shutdown(): Promise<void> {
    // Trigger session-end hook
    await this.hooksManager.trigger('session-end', {
      sessionId: this.sessionManager.getCurrentSession()?.id,
    });

    // Save final session
    await this.sessionManager.saveSession();
  }
}
