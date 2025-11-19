/**
 * Performance Profiler Manager
 *
 * Main orchestrator for performance profiling and optimization
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join } from 'path';
import { ClaudeClient } from '../api/claude.js';
import { CPUProfiler } from './cpu-profiler.js';
import { MemoryProfiler } from './memory-profiler.js';
import { PerformanceOptimizer } from './optimizer.js';
import { Benchmarker } from './benchmarker.js';
import {
  PerformanceProfilerConfig,
  ProfileSession,
  PerformanceMetrics,
  PerformanceReport,
  PerformanceSummary,
  OptimizationSuggestion,
  BenchmarkResult,
  ProfileType,
  ProfilingOptions,
} from './types.js';

export class PerformanceProfilerManager extends EventEmitter {
  private config: PerformanceProfilerConfig;
  private client: ClaudeClient;
  private cpuProfiler: CPUProfiler;
  private memoryProfiler: MemoryProfiler;
  private optimizer: PerformanceOptimizer;
  private benchmarker: Benchmarker;
  private activeProfiles: Map<string, ProfileSession>;
  private sessionCounter: number;

  constructor(config: PerformanceProfilerConfig, client: ClaudeClient) {
    super();
    this.config = config;
    this.client = client;
    this.cpuProfiler = new CPUProfiler(config.samplingInterval);
    this.memoryProfiler = new MemoryProfiler();
    this.optimizer = new PerformanceOptimizer(client, config.optimization.level);
    this.benchmarker = new Benchmarker();
    this.activeProfiles = new Map();
    this.sessionCounter = 0;
  }

  /**
   * Start profiling session
   */
  async startProfile(
    types: ProfileType[] = ['cpu', 'memory'],
    options?: ProfilingOptions
  ): Promise<string> {
    const sessionId = `profile-${++this.sessionCounter}-${Date.now()}`;

    const session: ProfileSession = {
      id: sessionId,
      startTime: new Date(),
      duration: 0,
      type: types[0],
      metrics: {
        cpu: {
          usage: 0,
          userTime: 0,
          systemTime: 0,
          idleTime: 0,
          processes: [],
        },
        memory: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0,
          arrayBuffers: 0,
          gcStats: {
            collections: 0,
            pauseTime: 0,
            totalTime: 0,
            type: 'minor',
          },
        },
        runtime: {
          executionTime: 0,
          functionCalls: 0,
          eventLoopLag: 0,
          asyncOperations: 0,
        },
      },
      samples: [],
      hotspots: [],
    };

    this.activeProfiles.set(sessionId, session);

    // Start profilers based on types
    if (types.includes('cpu')) {
      this.cpuProfiler.start(options);
      this.emit('cpu-profiling-started', { sessionId });
    }

    if (types.includes('memory')) {
      this.memoryProfiler.start(this.config.samplingInterval);
      this.emit('memory-profiling-started', { sessionId });
    }

    this.emit('profiling-started', { sessionId, types });

    return sessionId;
  }

  /**
   * Stop profiling session
   */
  async stopProfile(sessionId: string): Promise<ProfileSession> {
    const session = this.activeProfiles.get(sessionId);
    if (!session) {
      throw new Error(`Profile session not found: ${sessionId}`);
    }

    // Stop profilers
    this.cpuProfiler.stop();
    this.memoryProfiler.stop();

    // Collect metrics
    session.endTime = new Date();
    session.duration = session.endTime.getTime() - session.startTime.getTime();
    session.metrics.cpu = this.cpuProfiler.getMetrics();
    session.metrics.memory = this.memoryProfiler.getMetrics();
    session.samples = this.cpuProfiler.getSamples();
    session.hotspots = this.cpuProfiler.getHotspots();

    this.emit('profiling-stopped', { sessionId, duration: session.duration });

    return session;
  }

  /**
   * Analyze profile and generate optimization suggestions
   */
  async analyzeProfile(sessionId: string): Promise<OptimizationSuggestion[]> {
    const session = this.activeProfiles.get(sessionId);
    if (!session) {
      throw new Error(`Profile session not found: ${sessionId}`);
    }

    this.emit('analysis-started', { sessionId });

    const suggestions = await this.optimizer.analyze(session);

    this.emit('analysis-complete', { sessionId, suggestionsCount: suggestions.length });

    return suggestions;
  }

  /**
   * Run benchmarks
   */
  async runBenchmark(
    name: string,
    fn: () => void | Promise<void>,
    iterations?: number
  ): Promise<BenchmarkResult> {
    this.emit('benchmark-started', { name, iterations });

    const result = await this.benchmarker.benchmark(name, fn, {
      iterations: iterations || this.config.benchmarking.iterations,
      warmupRuns: this.config.benchmarking.warmupRuns,
    });

    this.emit('benchmark-complete', { name, result });

    return result;
  }

  /**
   * Compare multiple implementations
   */
  async compareBenchmarks(
    implementations: Array<{ name: string; fn: () => void | Promise<void> }>
  ): Promise<BenchmarkResult[]> {
    this.emit('comparison-started', { count: implementations.length });

    const results = await this.benchmarker.compare(
      implementations,
      this.config.benchmarking.iterations
    );

    this.emit('comparison-complete', { results });

    return results;
  }

  /**
   * Generate performance report
   */
  async generateReport(sessionIds: string[]): Promise<PerformanceReport> {
    const profiles: ProfileSession[] = [];

    for (const sessionId of sessionIds) {
      const session = this.activeProfiles.get(sessionId);
      if (session) {
        profiles.push(session);
      }
    }

    const allSuggestions: OptimizationSuggestion[] = [];
    for (const profile of profiles) {
      const suggestions = await this.optimizer.analyze(profile);
      allSuggestions.push(...suggestions);
    }

    const summary = this.generateSummary(profiles);
    const recommendations = this.generateRecommendations(allSuggestions);

    const report: PerformanceReport = {
      sessionId: sessionIds.join(','),
      timestamp: new Date(),
      summary,
      profiles,
      optimizations: allSuggestions,
      benchmarks: [],
      recommendations,
    };

    // Save report
    await this.saveReport(report);

    this.emit('report-generated', { sessionIds, summary });

    return report;
  }

  /**
   * Get active profiles
   */
  getActiveProfiles(): ProfileSession[] {
    return Array.from(this.activeProfiles.values());
  }

  /**
   * Detect memory leaks
   */
  detectMemoryLeaks(): any[] {
    return this.memoryProfiler.detectLeaks();
  }

  /**
   * Get peak memory usage
   */
  getPeakMemory(): number {
    return this.memoryProfiler.getPeakMemory();
  }

  /**
   * Clear all profiles
   */
  clearProfiles(): void {
    this.activeProfiles.clear();
    this.cpuProfiler.clear();
    this.memoryProfiler.clear();
    this.sessionCounter = 0;
  }

  /**
   * Generate performance summary
   */
  private generateSummary(profiles: ProfileSession[]): PerformanceSummary {
    const totalDuration = profiles.reduce((sum, p) => sum + p.duration, 0);
    const avgCPU = profiles.reduce((sum, p) => sum + p.metrics.cpu.usage, 0) / profiles.length;
    const peakMemory = Math.max(...profiles.map(p => p.metrics.memory.heapUsed));
    const totalFunctionCalls = profiles.reduce(
      (sum, p) => sum + p.metrics.runtime.functionCalls,
      0
    );

    // Count critical issues
    let criticalIssues = 0;
    for (const profile of profiles) {
      if (profile.metrics.cpu.usage > 80) criticalIssues++;
      if ((profile.metrics.memory.heapUsed / profile.metrics.memory.heapTotal) > 0.9) criticalIssues++;
    }

    return {
      totalDuration,
      averageCPU: avgCPU,
      peakMemory,
      totalFunctionCalls,
      criticalIssues,
      optimizationPotential: criticalIssues > 0 ? 40 : 20,
    };
  }

  /**
   * Generate recommendations
   */
  private generateRecommendations(suggestions: OptimizationSuggestion[]): string[] {
    const recommendations: string[] = [];

    const critical = suggestions.filter(s => s.severity === 'critical');
    const high = suggestions.filter(s => s.severity === 'high');

    if (critical.length > 0) {
      recommendations.push(`Address ${critical.length} critical performance issue(s) immediately`);
    }

    if (high.length > 0) {
      recommendations.push(`Review ${high.length} high-priority optimization(s)`);
    }

    // Add general recommendations
    recommendations.push('Run profiling regularly to track performance trends');
    recommendations.push('Consider implementing performance budgets for key operations');
    recommendations.push('Monitor production performance metrics');

    return recommendations;
  }

  /**
   * Save report to disk
   */
  private async saveReport(report: PerformanceReport): Promise<void> {
    try {
      const reportPath = join(
        this.config.reportPath,
        `performance-report-${Date.now()}.json`
      );

      await fs.mkdir(this.config.reportPath, { recursive: true });
      await fs.writeFile(reportPath, JSON.stringify(report, null, 2));

      this.emit('report-saved', { path: reportPath });
    } catch (error: any) {
      this.emit('report-save-error', { error });
    }
  }

  /**
   * Get configuration
   */
  getConfig(): PerformanceProfilerConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<PerformanceProfilerConfig>): void {
    this.config = { ...this.config, ...config };

    if (config.optimization?.level) {
      this.optimizer.setLevel(config.optimization.level);
    }
  }
}
