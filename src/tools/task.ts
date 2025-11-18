/**
 * Task tool - Launch specialized subagents
 */

import { BaseTool } from './base.js';
import { AGENT_TYPES } from '../types/index.js';

export class TaskTool extends BaseTool {
  name = 'Task';
  description = `Launch a new agent to handle complex, multi-step tasks autonomously.

The Task tool launches specialized agents (subprocesses) that autonomously handle complex tasks. Each agent type has specific capabilities and tools available to it.

Available agent types and the tools they have access to:
- general-purpose: General-purpose agent for researching complex questions, searching for code, and executing multi-step tasks. When you are searching for a keyword or file and are not confident that you will find the right match in the first few tries use this agent to perform the search for you. (Tools: *)
- statusline-setup: Use this agent to configure the user's Claude Code status line setting. (Tools: Read, Edit)
- Explore: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions. (Tools: All tools)
- Plan: Fast agent specialized for exploring codebases. Use this when you need to quickly find files by patterns (eg. "src/components/**/*.tsx"), search code for keywords (eg. "API endpoints"), or answer questions about the codebase (eg. "how do API endpoints work?"). When calling this agent, specify the desired thoroughness level: "quick" for basic searches, "medium" for moderate exploration, or "very thorough" for comprehensive analysis across multiple locations and naming conventions. (Tools: All tools)

When using the Task tool, you must specify a subagent_type parameter to select which agent type to use.

Usage notes:
- Launch multiple agents concurrently whenever possible, to maximize performance
- When the agent is done, it will return a single message back to you
- Each agent invocation is stateless
- Your prompt should contain a highly detailed task description for the agent to perform autonomously
- Agents with "access to current context" can see the full conversation history before the tool call
- The agent's outputs should generally be trusted
- Clearly tell the agent whether you expect it to write code or just to do research`;

  schema = {
    type: 'object' as const,
    properties: {
      subagent_type: {
        type: 'string',
        description: 'The type of specialized agent to use for this task',
      },
      prompt: {
        type: 'string',
        description: 'The task for the agent to perform',
      },
      description: {
        type: 'string',
        description: 'A short (3-5 word) description of the task',
      },
      model: {
        type: 'string',
        enum: ['sonnet', 'opus', 'haiku'],
        description:
          'Optional model to use for this agent. If not specified, inherits from parent. Prefer haiku for quick, straightforward tasks to minimize cost and latency.',
      },
    },
    required: ['subagent_type', 'prompt', 'description'],
  };

  async execute(input: Record<string, any>) {
    const { subagent_type, prompt, description, model } = input;

    // Validate agent type
    if (!AGENT_TYPES[subagent_type]) {
      return this.error(`Unknown agent type: ${subagent_type}`);
    }

    // In a real implementation, this would spawn a subprocess with the agent
    // For now, we'll simulate the agent execution
    const agentConfig = AGENT_TYPES[subagent_type];

    const result = `[SUBAGENT: ${subagent_type}]
Description: ${description}
Model: ${model || 'inherited'}
Task: ${prompt}

Agent executed successfully. In a full implementation, this would:
1. Spawn a new Claude conversation with the specified tools
2. Execute the task autonomously
3. Return the final result

Available tools for this agent: ${agentConfig.tools.join(', ')}
`;

    return this.success(result);
  }
}
