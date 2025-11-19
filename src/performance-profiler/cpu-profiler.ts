/**
 * CPU Profiler
 *
 * Profiles CPU usage and identifies performance hotspots
 */

import { cpus } from 'os';
import {
  CPUMetrics,
  Hotspot,
  ProfileSample,
  StackFrame,
  ProfilingOptions,
} from './types.js';

export class CPUProfiler {
  private samples: ProfileSample[];
  private startTime: number;
  private interval: NodeJS.Timeout | null;
  private sampleRate: number;

  constructor(sampleRate: number = 10) {
    this.samples = [];
    this.startTime = 0;
    this.interval = null;
    this.sampleRate = sampleRate;
  }

  /**
   * Start CPU profiling
   */
  start(options?: ProfilingOptions): void {
    this.startTime = Date.now();
    this.samples = [];

    const rate = options?.sampleRate || this.sampleRate;

    // Sample CPU usage at intervals
    this.interval = setInterval(() => {
      const sample = this.takeSample();
      this.samples.push(sample);

      if (options?.maxSamples && this.samples.length >= options.maxSamples) {
        this.stop();
      }
    }, rate);

    // Auto-stop after duration
    if (options?.duration) {
      setTimeout(() => this.stop(), options.duration);
    }
  }

  /**
   * Stop CPU profiling
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
  }

  /**
   * Get CPU metrics
   */
  getMetrics(): CPUMetrics {
    const cpuInfo = cpus();
    const totalUsage = this.calculateCPUUsage(cpuInfo);

    return {
      usage: totalUsage,
      userTime: this.samples.reduce((sum, s) => sum + (s.metrics.cpu?.userTime || 0), 0),
      systemTime: this.samples.reduce((sum, s) => sum + (s.metrics.cpu?.systemTime || 0), 0),
      idleTime: this.samples.reduce((sum, s) => sum + (s.metrics.cpu?.idleTime || 0), 0),
      processes: [],
    };
  }

  /**
   * Identify performance hotspots
   */
  getHotspots(topN: number = 10): Hotspot[] {
    const functionStats = new Map<string, {
      calls: number;
      totalTime: number;
      selfTime: number;
      locations: Array<{ file: string; line: number }>;
    }>();

    // Analyze stack traces
    for (const sample of this.samples) {
      for (const frame of sample.stackTrace) {
        const key = `${frame.function}@${frame.file}:${frame.line}`;

        if (!functionStats.has(key)) {
          functionStats.set(key, {
            calls: 0,
            totalTime: 0,
            selfTime: 0,
            locations: [],
          });
        }

        const stats = functionStats.get(key)!;
        stats.calls++;
        stats.selfTime += this.sampleRate;
        stats.totalTime += this.sampleRate;
        stats.locations.push({ file: frame.file, line: frame.line });
      }
    }

    // Convert to hotspots
    const hotspots: Hotspot[] = [];
    const totalTime = Date.now() - this.startTime;

    for (const [key, stats] of functionStats.entries()) {
      const [funcInfo, location] = key.split('@');
      const [file, line] = location.split(':');

      hotspots.push({
        function: funcInfo,
        file,
        line: parseInt(line, 10),
        selfTime: stats.selfTime,
        totalTime: stats.totalTime,
        calls: stats.calls,
        percentage: (stats.selfTime / totalTime) * 100,
      });
    }

    // Sort by self time and return top N
    return hotspots
      .sort((a, b) => b.selfTime - a.selfTime)
      .slice(0, topN);
  }

  /**
   * Get all samples
   */
  getSamples(): ProfileSample[] {
    return this.samples;
  }

  /**
   * Take a CPU sample
   */
  private takeSample(): ProfileSample {
    const stackTrace = this.captureStackTrace();
    const cpuInfo = cpus();

    return {
      timestamp: new Date(),
      stackTrace,
      metrics: {
        cpu: {
          usage: this.calculateCPUUsage(cpuInfo),
          userTime: 0,
          systemTime: 0,
          idleTime: 0,
          processes: [],
        },
      },
    };
  }

  /**
   * Capture current stack trace
   */
  private captureStackTrace(): StackFrame[] {
    const stack: StackFrame[] = [];

    try {
      const error = new Error();
      const stackLines = (error.stack || '').split('\n').slice(2); // Skip first 2 lines

      for (const line of stackLines) {
        const match = line.match(/at\s+(.+?)\s+\((.+?):(\d+):(\d+)\)/);
        if (match) {
          stack.push({
            function: match[1] || 'anonymous',
            file: match[2],
            line: parseInt(match[3], 10),
            column: parseInt(match[4], 10),
            isNative: false,
          });
        }
      }
    } catch {
      // Failed to capture stack trace
    }

    return stack;
  }

  /**
   * Calculate CPU usage from CPU info
   */
  private calculateCPUUsage(cpuInfo: any[]): number {
    let totalIdle = 0;
    let totalTick = 0;

    cpuInfo.forEach(cpu => {
      for (const type in cpu.times) {
        totalTick += (cpu.times as any)[type];
      }
      totalIdle += cpu.times.idle;
    });

    const idle = totalIdle / cpuInfo.length;
    const total = totalTick / cpuInfo.length;
    const usage = 100 - (100 * idle) / total;

    return Math.max(0, Math.min(100, usage));
  }

  /**
   * Clear all samples
   */
  clear(): void {
    this.samples = [];
    this.startTime = 0;
  }
}
