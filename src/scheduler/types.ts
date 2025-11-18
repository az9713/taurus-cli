/**
 * Scheduler Types
 *
 * Types for AI-powered scheduled tasks
 */

export interface ScheduledTask {
  name: string;
  schedule: string; // Cron expression
  command: string; // Task command or description
  targets?: string[]; // Files or patterns to target
  enabled: boolean;
  notifications?: {
    slack?: string; // Slack channel
    email?: string; // Email address
  };
  conditions?: {
    onlyIfChanged?: boolean; // Only run if files changed
    severity?: string[]; // Filter by severity levels
  };
  action?: 'create-github-issue' | 'create-pr' | 'notify' | 'auto-fix';
  autoMerge?: {
    if?: Record<string, boolean>; // Conditions for auto-merge
  };
  autoFix?: boolean;
  threshold?: number; // For metrics-based tasks
  assignee?: string;
  labels?: string[];
  integration?: string; // Integration to use (jira, github, etc.)
}

export interface TaskExecution {
  id: string;
  taskName: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed' | 'skipped';
  result?: any;
  error?: string;
  findings?: TaskFinding[];
  duration?: number; // in milliseconds
}

export interface TaskFinding {
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  description: string;
  file?: string;
  line?: number;
  suggestion?: string;
}

export interface TaskHistory {
  taskName: string;
  executions: TaskExecution[];
  lastSuccess?: Date;
  lastFailure?: Date;
  successRate: number;
}

export interface SchedulerConfig {
  enabled: boolean;
  tasks: ScheduledTask[];
  timezone?: string;
  maxConcurrent?: number; // Max concurrent tasks
  historyRetention?: number; // Days to keep history
}
