/**
 * Scheduler Manager
 *
 * Manages scheduled AI tasks using cron-like scheduling
 */

import { EventEmitter } from 'events';
import { SchedulerConfig, ScheduledTask, TaskExecution, TaskHistory } from './types.js';
import { TaskExecutor } from './task-executor.js';

export class SchedulerManager extends EventEmitter {
  private config: SchedulerConfig;
  private executor: TaskExecutor;
  private intervals: Map<string, NodeJS.Timeout> = new Map();
  private history: Map<string, TaskHistory> = new Map();
  private running: boolean = false;

  constructor(config: SchedulerConfig) {
    super();
    this.config = config;
    this.executor = new TaskExecutor();

    // Forward executor events
    this.executor.on('execution-started', (exec) => this.emit('task-started', exec));
    this.executor.on('execution-completed', (exec) => this.handleTaskCompleted(exec));
    this.executor.on('execution-failed', (exec) => this.handleTaskFailed(exec));
    this.executor.on('execution-skipped', (exec) => this.emit('task-skipped', exec));
  }

  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }

    this.running = true;

    for (const task of this.config.tasks) {
      if (task.enabled) {
        this.scheduleTask(task);
      }
    }

    this.emit('scheduler-started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      return;
    }

    this.running = false;

    for (const [taskName, interval] of this.intervals) {
      clearInterval(interval);
    }

    this.intervals.clear();

    this.emit('scheduler-stopped');
  }

  /**
   * Schedule a task
   */
  private scheduleTask(task: ScheduledTask): void {
    // Parse cron expression and convert to interval
    const intervalMs = this.parseCronToInterval(task.schedule);

    if (intervalMs === null) {
      console.warn(`Invalid schedule for task ${task.name}: ${task.schedule}`);
      return;
    }

    // Schedule the task
    const interval = setInterval(async () => {
      await this.runTask(task);
    }, intervalMs);

    this.intervals.set(task.name, interval);

    // Run immediately if needed
    if (task.schedule.includes('immediately')) {
      this.runTask(task);
    }
  }

  /**
   * Run a task
   */
  async runTask(task: ScheduledTask): Promise<TaskExecution> {
    const execution = await this.executor.execute(task);

    // Update history
    this.updateHistory(task.name, execution);

    return execution;
  }

  /**
   * Run task by name (manual trigger)
   */
  async runTaskByName(taskName: string): Promise<TaskExecution | null> {
    const task = this.config.tasks.find(t => t.name === taskName);

    if (!task) {
      return null;
    }

    return await this.runTask(task);
  }

  /**
   * Handle task completion
   */
  private handleTaskCompleted(execution: TaskExecution): void {
    this.emit('task-completed', execution);

    // Send notifications if configured
    const task = this.config.tasks.find(t => t.name === execution.taskName);
    if (task?.notifications && execution.findings && execution.findings.length > 0) {
      this.sendNotifications(task, execution);
    }
  }

  /**
   * Handle task failure
   */
  private handleTaskFailed(execution: TaskExecution): void {
    this.emit('task-failed', execution);

    // Always notify on failure
    const task = this.config.tasks.find(t => t.name === execution.taskName);
    if (task?.notifications) {
      this.sendNotifications(task, execution);
    }
  }

  /**
   * Send notifications
   */
  private sendNotifications(task: ScheduledTask, execution: TaskExecution): void {
    // In reality, this would send actual notifications
    console.log(`Notifications would be sent for task: ${task.name}`);
  }

  /**
   * Update task history
   */
  private updateHistory(taskName: string, execution: TaskExecution): void {
    let history = this.history.get(taskName);

    if (!history) {
      history = {
        taskName,
        executions: [],
        successRate: 0
      };
      this.history.set(taskName, history);
    }

    history.executions.push(execution);

    // Keep only recent executions
    if (history.executions.length > 100) {
      history.executions = history.executions.slice(-100);
    }

    // Update success rate
    const successCount = history.executions.filter(e => e.status === 'completed').length;
    history.successRate = (successCount / history.executions.length) * 100;

    // Update last success/failure
    if (execution.status === 'completed') {
      history.lastSuccess = execution.endTime;
    } else if (execution.status === 'failed') {
      history.lastFailure = execution.endTime;
    }
  }

  /**
   * Parse cron expression to interval (simplified)
   */
  private parseCronToInterval(cron: string): number | null {
    // Simplified cron parser
    // Format: "0 9 * * *" (minute hour day month weekday)

    if (cron.includes('*/5 * * * *')) {
      return 5 * 60 * 1000; // 5 minutes
    }

    if (cron.includes('0 * * * *')) {
      return 60 * 60 * 1000; // Hourly
    }

    if (cron.includes('0 */6 * * *')) {
      return 6 * 60 * 60 * 1000; // Every 6 hours
    }

    if (cron.match(/0 \d+ \* \* \*/)) {
      return 24 * 60 * 60 * 1000; // Daily
    }

    if (cron.match(/0 \d+ \* \* (MON|TUE|WED|THU|FRI|SAT|SUN)/i)) {
      return 7 * 24 * 60 * 60 * 1000; // Weekly
    }

    // Default to hourly if can't parse
    return 60 * 60 * 1000;
  }

  /**
   * Get task history
   */
  getTaskHistory(taskName: string): TaskHistory | undefined {
    return this.history.get(taskName);
  }

  /**
   * List all tasks
   */
  listTasks(): ScheduledTask[] {
    return this.config.tasks;
  }

  /**
   * Get task by name
   */
  getTask(taskName: string): ScheduledTask | undefined {
    return this.config.tasks.find(t => t.name === taskName);
  }

  /**
   * Enable/disable task
   */
  setTaskEnabled(taskName: string, enabled: boolean): boolean {
    const task = this.config.tasks.find(t => t.name === taskName);

    if (!task) {
      return false;
    }

    task.enabled = enabled;

    if (enabled && this.running) {
      this.scheduleTask(task);
    } else if (!enabled) {
      const interval = this.intervals.get(taskName);
      if (interval) {
        clearInterval(interval);
        this.intervals.delete(taskName);
      }
    }

    return true;
  }

  /**
   * Get scheduler statistics
   */
  getStats(): {
    tasksTotal: number;
    tasksEnabled: number;
    tasksRunning: number;
    executionsToday: number;
    averageSuccessRate: number;
  } {
    const tasksTotal = this.config.tasks.length;
    const tasksEnabled = this.config.tasks.filter(t => t.enabled).length;
    const tasksRunning = this.intervals.size;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let executionsToday = 0;
    let totalSuccessRate = 0;
    let tasksWithHistory = 0;

    for (const history of this.history.values()) {
      totalSuccessRate += history.successRate;
      tasksWithHistory++;

      executionsToday += history.executions.filter(
        e => e.startTime >= today
      ).length;
    }

    return {
      tasksTotal,
      tasksEnabled,
      tasksRunning,
      executionsToday,
      averageSuccessRate: tasksWithHistory > 0 ? totalSuccessRate / tasksWithHistory : 0
    };
  }
}
