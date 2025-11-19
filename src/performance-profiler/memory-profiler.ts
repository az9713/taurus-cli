/**
 * Memory Profiler
 *
 * Profiles memory usage and detects memory leaks
 */

import { memoryUsage } from 'process';
import {
  MemoryMetrics,
  MemorySnapshot,
  MemoryLeak,
  ObjectAllocation,
  GCStats,
} from './types.js';

export class MemoryProfiler {
  private snapshots: MemorySnapshot[];
  private startMemory: MemoryMetrics;
  private interval: NodeJS.Timeout | null;
  private gcObserver: any;

  constructor() {
    this.snapshots = [];
    this.startMemory = this.captureMetrics();
    this.interval = null;
    this.gcObserver = null;
  }

  /**
   * Start memory profiling
   */
  start(intervalMs: number = 1000): void {
    this.startMemory = this.captureMetrics();
    this.snapshots = [];

    // Take snapshots at intervals
    this.interval = setInterval(() => {
      const snapshot = this.takeSnapshot();
      this.snapshots.push(snapshot);
    }, intervalMs);

    // Observe GC if available
    this.observeGC();
  }

  /**
   * Stop memory profiling
   */
  stop(): void {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }

    if (this.gcObserver) {
      this.gcObserver = null;
    }
  }

  /**
   * Get current memory metrics
   */
  getMetrics(): MemoryMetrics {
    return this.captureMetrics();
  }

  /**
   * Detect memory leaks
   */
  detectLeaks(): MemoryLeak[] {
    if (this.snapshots.length < 2) {
      return [];
    }

    const leaks: MemoryLeak[] = [];
    const recentSnapshots = this.snapshots.slice(-10);

    // Analyze growth trends
    const heapGrowth = this.analyzeHeapGrowth(recentSnapshots);

    if (heapGrowth.rate > 1024 * 1024) {
      // Growing > 1MB/s
      leaks.push({
        type: 'heap-growth',
        size: heapGrowth.total,
        allocations: recentSnapshots.length,
        growthRate: heapGrowth.rate,
      });
    }

    // Analyze object allocations
    const lastSnapshot = recentSnapshots[recentSnapshots.length - 1];
    const firstSnapshot = recentSnapshots[0];

    for (const obj of lastSnapshot.objects) {
      const initial = firstSnapshot.objects.find(o => o.type === obj.type);
      if (initial) {
        const growth = obj.count - initial.count;
        const timeSpan = (lastSnapshot.timestamp.getTime() - firstSnapshot.timestamp.getTime()) / 1000;
        const growthRate = (obj.size - initial.size) / timeSpan;

        if (growth > 1000 && growthRate > 10000) {
          // More than 1000 new objects and growing > 10KB/s
          leaks.push({
            type: obj.type,
            size: obj.size,
            allocations: obj.count,
            growthRate,
          });
        }
      }
    }

    return leaks;
  }

  /**
   * Get memory snapshots
   */
  getSnapshots(): MemorySnapshot[] {
    return this.snapshots;
  }

  /**
   * Get peak memory usage
   */
  getPeakMemory(): number {
    if (this.snapshots.length === 0) {
      return this.startMemory.heapUsed;
    }

    return Math.max(...this.snapshots.map(s => s.heapUsed));
  }

  /**
   * Take memory snapshot
   */
  private takeSnapshot(): MemorySnapshot {
    const memory = memoryUsage();

    return {
      timestamp: new Date(),
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      objects: this.captureObjectAllocations(),
      leaks: [],
    };
  }

  /**
   * Capture current memory metrics
   */
  private captureMetrics(): MemoryMetrics {
    const memory = memoryUsage();

    return {
      heapUsed: memory.heapUsed,
      heapTotal: memory.heapTotal,
      external: memory.external,
      rss: memory.rss,
      arrayBuffers: memory.arrayBuffers || 0,
      gcStats: {
        collections: 0,
        pauseTime: 0,
        totalTime: 0,
        type: 'minor',
      },
    };
  }

  /**
   * Capture object allocations
   */
  private captureObjectAllocations(): ObjectAllocation[] {
    // Simplified object allocation tracking
    // In a real implementation, would use v8.getHeapStatistics or heap snapshots
    const allocations: ObjectAllocation[] = [];

    try {
      if (typeof global.gc === 'function') {
        global.gc();
      }

      const memory = memoryUsage();

      allocations.push({
        type: 'total-heap',
        count: 1,
        size: memory.heapUsed,
        retainedSize: memory.heapUsed,
      });
    } catch {
      // Cannot get detailed allocations
    }

    return allocations;
  }

  /**
   * Analyze heap growth
   */
  private analyzeHeapGrowth(snapshots: MemorySnapshot[]): {
    total: number;
    rate: number;
  } {
    if (snapshots.length < 2) {
      return { total: 0, rate: 0 };
    }

    const first = snapshots[0];
    const last = snapshots[snapshots.length - 1];

    const totalGrowth = last.heapUsed - first.heapUsed;
    const timeSpan = (last.timestamp.getTime() - first.timestamp.getTime()) / 1000;
    const rate = totalGrowth / timeSpan;

    return {
      total: totalGrowth,
      rate,
    };
  }

  /**
   * Observe garbage collection
   */
  private observeGC(): void {
    try {
      // Would use PerformanceObserver for GC events in Node.js
      // This is a simplified version
      if (typeof (performance as any).gc === 'function') {
        this.gcObserver = {
          // Placeholder for GC observation
        };
      }
    } catch {
      // GC observation not available
    }
  }

  /**
   * Force garbage collection (for testing)
   */
  forceGC(): void {
    if (typeof global.gc === 'function') {
      global.gc();
    }
  }

  /**
   * Clear snapshots
   */
  clear(): void {
    this.snapshots = [];
    this.startMemory = this.captureMetrics();
  }
}
