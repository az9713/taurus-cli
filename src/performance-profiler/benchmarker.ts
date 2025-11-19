/**
 * Benchmarker
 *
 * Benchmarks code performance
 */

import { performance } from 'perf_hooks';
import { memoryUsage } from 'process';
import { BenchmarkResult } from './types.js';

export class Benchmarker {
  /**
   * Benchmark a function
   */
  async benchmark(
    name: string,
    fn: () => void | Promise<void>,
    options: {
      iterations?: number;
      warmupRuns?: number;
    } = {}
  ): Promise<BenchmarkResult> {
    const iterations = options.iterations || 1000;
    const warmupRuns = options.warmupRuns || 10;

    // Warmup
    for (let i = 0; i < warmupRuns; i++) {
      await fn();
    }

    // Force GC if available
    if (typeof global.gc === 'function') {
      global.gc();
    }

    // Measure memory before
    const memoryBefore = memoryUsage().heapUsed;

    // Run benchmarks
    const times: number[] = [];

    for (let i = 0; i < iterations; i++) {
      const start = performance.now();
      await fn();
      const end = performance.now();
      times.push(end - start);
    }

    // Measure memory after
    const memoryAfter = memoryUsage().heapUsed;

    // Calculate statistics
    const averageTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const variance = times.reduce((sum, time) => sum + Math.pow(time - averageTime, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);
    const operationsPerSecond = 1000 / averageTime;
    const memoryUsed = Math.max(0, memoryAfter - memoryBefore);

    return {
      name,
      iterations,
      averageTime,
      minTime,
      maxTime,
      standardDeviation,
      operationsPerSecond,
      memoryUsed,
    };
  }

  /**
   * Compare multiple implementations
   */
  async compare(
    implementations: Array<{ name: string; fn: () => void | Promise<void> }>,
    iterations: number = 1000
  ): Promise<BenchmarkResult[]> {
    const results: BenchmarkResult[] = [];

    for (const impl of implementations) {
      const result = await this.benchmark(impl.name, impl.fn, { iterations });
      results.push(result);
    }

    // Sort by average time (fastest first)
    return results.sort((a, b) => a.averageTime - b.averageTime);
  }

  /**
   * Generate benchmark report
   */
  generateReport(results: BenchmarkResult[]): string {
    let report = '# Benchmark Results\n\n';

    for (const result of results) {
      report += `## ${result.name}\n\n`;
      report += `- Iterations: ${result.iterations}\n`;
      report += `- Average: ${result.averageTime.toFixed(3)} ms\n`;
      report += `- Min: ${result.minTime.toFixed(3)} ms\n`;
      report += `- Max: ${result.maxTime.toFixed(3)} ms\n`;
      report += `- Std Dev: ${result.standardDeviation.toFixed(3)} ms\n`;
      report += `- Ops/sec: ${result.operationsPerSecond.toFixed(0)}\n`;
      report += `- Memory: ${(result.memoryUsed / 1024).toFixed(2)} KB\n`;
      report += '\n';
    }

    // Add comparison
    if (results.length > 1) {
      report += '## Comparison\n\n';
      const baseline = results[0];

      for (let i = 1; i < results.length; i++) {
        const result = results[i];
        const speedup = result.averageTime / baseline.averageTime;
        const percentage = ((speedup - 1) * 100).toFixed(1);

        if (speedup > 1) {
          report += `- ${result.name} is ${percentage}% slower than ${baseline.name}\n`;
        } else {
          report += `- ${result.name} is ${(100 - speedup * 100).toFixed(1)}% faster than ${baseline.name}\n`;
        }
      }
      report += '\n';
    }

    return report;
  }

  /**
   * Measure async performance
   */
  async measureAsync<T>(fn: () => Promise<T>): Promise<{
    result: T;
    duration: number;
    memory: number;
  }> {
    const memoryBefore = memoryUsage().heapUsed;
    const start = performance.now();

    const result = await fn();

    const end = performance.now();
    const memoryAfter = memoryUsage().heapUsed;

    return {
      result,
      duration: end - start,
      memory: memoryAfter - memoryBefore,
    };
  }

  /**
   * Measure sync performance
   */
  measureSync<T>(fn: () => T): {
    result: T;
    duration: number;
    memory: number;
  } {
    const memoryBefore = memoryUsage().heapUsed;
    const start = performance.now();

    const result = fn();

    const end = performance.now();
    const memoryAfter = memoryUsage().heapUsed;

    return {
      result,
      duration: end - start,
      memory: memoryAfter - memoryBefore,
    };
  }
}
