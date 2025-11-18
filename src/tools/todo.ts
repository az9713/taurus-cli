/**
 * TodoWrite tool - Task list management
 */

import { BaseTool } from './base.js';
import { Todo } from '../types/index.js';

export class TodoWriteTool extends BaseTool {
  name = 'TodoWrite';
  description = `Create and manage a structured task list for your current coding session.

## When to Use This Tool
Use this tool proactively in these scenarios:
1. Complex multi-step tasks - When a task requires 3 or more distinct steps
2. Non-trivial and complex tasks - Tasks requiring careful planning
3. User explicitly requests todo list
4. User provides multiple tasks
5. After receiving new instructions - Capture user requirements as todos
6. When you start working on a task - Mark it as in_progress BEFORE beginning work
7. After completing a task - Mark it as completed and add any new follow-up tasks

## When NOT to Use This Tool
Skip using this tool when:
1. There is only a single, straightforward task
2. The task is trivial and tracking provides no organizational benefit
3. The task can be completed in less than 3 trivial steps
4. The task is purely conversational or informational

## Task States and Management
1. **Task States**: pending, in_progress, completed
2. **Task Management**:
   - Update task status in real-time as you work
   - Mark tasks complete IMMEDIATELY after finishing (don't batch completions)
   - Exactly ONE task must be in_progress at any time
   - Complete current tasks before starting new ones
   - Remove tasks that are no longer relevant from the list entirely`;

  schema = {
    type: 'object' as const,
    properties: {
      todos: {
        type: 'array',
        description: 'The updated todo list',
        items: {
          type: 'object',
          properties: {
            content: {
              type: 'string',
              description: 'The imperative form describing what needs to be done',
            },
            status: {
              type: 'string',
              enum: ['pending', 'in_progress', 'completed'],
              description: 'The current status of the task',
            },
            activeForm: {
              type: 'string',
              description: 'The present continuous form shown during execution',
            },
          },
          required: ['content', 'status', 'activeForm'],
        },
      },
    },
    required: ['todos'],
  };

  private todos: Todo[] = [];

  async execute(input: Record<string, any>) {
    const { todos } = input;

    if (!Array.isArray(todos)) {
      return this.error('todos must be an array');
    }

    // Validate todos
    for (const todo of todos) {
      if (!todo.content || !todo.status || !todo.activeForm) {
        return this.error('Each todo must have content, status, and activeForm');
      }
      if (!['pending', 'in_progress', 'completed'].includes(todo.status)) {
        return this.error('Invalid status. Must be pending, in_progress, or completed');
      }
    }

    this.todos = todos;

    // Format the output
    const formatted = todos
      .map((todo, idx) => {
        const statusIcons: Record<string, string> = {
          pending: '⏸',
          in_progress: '▶',
          completed: '✓',
        };
        const statusIcon = statusIcons[todo.status] || '?';
        return `${idx + 1}. [${todo.status}] ${statusIcon} ${todo.content}`;
      })
      .join('\n');

    return this.success(
      `Todos have been modified successfully. Ensure that you continue to use the todo list to track your progress. Please proceed with the current tasks if applicable\n\n${formatted}`
    );
  }

  getTodos(): Todo[] {
    return this.todos;
  }
}
