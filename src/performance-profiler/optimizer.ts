/**
 * Performance Optimizer
 *
 * Analyzes performance data and generates optimization suggestions
 */

import { ClaudeClient } from '../api/claude.js';
import {
  OptimizationSuggestion,
  ProfileSession,
  Hotspot,
  MemoryLeak,
  OptimizationLevel,
} from './types.js';

export class PerformanceOptimizer {
  private client: ClaudeClient;
  private level: OptimizationLevel;

  constructor(client: ClaudeClient, level: OptimizationLevel = 'moderate') {
    this.client = client;
    this.level = level;
  }

  /**
   * Analyze profile and generate optimization suggestions
   */
  async analyze(profile: ProfileSession): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    // Analyze CPU hotspots
    const cpuSuggestions = await this.analyzeCPUHotspots(profile.hotspots);
    suggestions.push(...cpuSuggestions);

    // Analyze memory issues
    const memorySuggestions = this.analyzeMemoryUsage(profile.metrics.memory);
    suggestions.push(...memorySuggestions);

    // Analyze runtime performance
    const runtimeSuggestions = this.analyzeRuntimeMetrics(profile.metrics.runtime);
    suggestions.push(...runtimeSuggestions);

    // Sort by severity
    return suggestions.sort((a, b) => {
      const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
      return severityOrder[b.severity] - severityOrder[a.severity];
    });
  }

  /**
   * Analyze CPU hotspots
   */
  private async analyzeCPUHotspots(hotspots: Hotspot[]): Promise<OptimizationSuggestion[]> {
    const suggestions: OptimizationSuggestion[] = [];

    for (const hotspot of hotspots.slice(0, 5)) {
      if (hotspot.percentage > 10) {
        // High CPU usage function
        suggestions.push({
          id: `cpu-hotspot-${hotspot.function}`,
          type: 'algorithm',
          severity: hotspot.percentage > 30 ? 'critical' : 'high',
          description: `Function '${hotspot.function}' consumes ${hotspot.percentage.toFixed(1)}% of CPU time`,
          location: {
            file: hotspot.file,
            line: hotspot.line,
            function: hotspot.function,
          },
          impact: {
            estimatedSpeedup: Math.min(hotspot.percentage, 50),
            estimatedMemorySaving: 0,
          },
          suggestion: this.generateCPUSuggestion(hotspot),
          autoFixable: false,
        });
      }

      // Check for excessive function calls
      if (hotspot.calls > 10000) {
        suggestions.push({
          id: `excessive-calls-${hotspot.function}`,
          type: 'caching',
          severity: 'medium',
          description: `Function '${hotspot.function}' called ${hotspot.calls} times`,
          location: {
            file: hotspot.file,
            line: hotspot.line,
            function: hotspot.function,
          },
          impact: {
            estimatedSpeedup: 20,
            estimatedMemorySaving: 0,
          },
          suggestion: 'Consider caching results or reducing function call frequency',
          codeExample: `// Memoize the function\nconst memoized = memoize(${hotspot.function});\n`,
          autoFixable: false,
        });
      }
    }

    return suggestions;
  }

  /**
   * Analyze memory usage
   */
  private analyzeMemoryUsage(memory: any): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check heap usage
    const heapUsagePercent = (memory.heapUsed / memory.heapTotal) * 100;

    if (heapUsagePercent > 80) {
      suggestions.push({
        id: 'high-heap-usage',
        type: 'memory',
        severity: 'critical',
        description: `Heap usage is at ${heapUsagePercent.toFixed(1)}% (${(memory.heapUsed / 1024 / 1024).toFixed(2)} MB)`,
        location: {
          file: 'memory',
          line: 0,
        },
        impact: {
          estimatedSpeedup: 0,
          estimatedMemorySaving: memory.heapUsed * 0.3,
        },
        suggestion: 'Consider implementing memory pooling, reducing object creation, or clearing unused references',
        autoFixable: false,
      });
    }

    // Check for GC pressure
    if (memory.gcStats && memory.gcStats.collections > 100) {
      suggestions.push({
        id: 'gc-pressure',
        type: 'memory',
        severity: 'high',
        description: `High GC pressure: ${memory.gcStats.collections} collections in ${(memory.gcStats.totalTime / 1000).toFixed(2)}s`,
        location: {
          file: 'memory',
          line: 0,
        },
        impact: {
          estimatedSpeedup: 15,
          estimatedMemorySaving: 0,
        },
        suggestion: 'Reduce object allocation rate or use object pooling',
        codeExample: `// Use object pooling\nconst pool = new ObjectPool(() => ({ /* object */ }));\nconst obj = pool.acquire();\n// ... use object\npool.release(obj);`,
        autoFixable: false,
      });
    }

    return suggestions;
  }

  /**
   * Analyze runtime metrics
   */
  private analyzeRuntimeMetrics(runtime: any): OptimizationSuggestion[] {
    const suggestions: OptimizationSuggestion[] = [];

    // Check event loop lag
    if (runtime.eventLoopLag > 100) {
      suggestions.push({
        id: 'event-loop-lag',
        type: 'async',
        severity: 'high',
        description: `Event loop lag detected: ${runtime.eventLoopLag.toFixed(2)}ms`,
        location: {
          file: 'runtime',
          line: 0,
        },
        impact: {
          estimatedSpeedup: 25,
          estimatedMemorySaving: 0,
        },
        suggestion: 'Move CPU-intensive operations to worker threads or break them into smaller chunks',
        codeExample: `// Use setImmediate to yield\nfunction processChunk(data, callback) {\n  // Process chunk\n  setImmediate(() => callback());\n}`,
        autoFixable: false,
      });
    }

    // Check async operations
    if (runtime.asyncOperations > 1000) {
      suggestions.push({
        id: 'excessive-async',
        type: 'async',
        severity: 'medium',
        description: `High number of concurrent async operations: ${runtime.asyncOperations}`,
        location: {
          file: 'runtime',
          line: 0,
        },
        impact: {
          estimatedSpeedup: 10,
          estimatedMemorySaving: 0,
        },
        suggestion: 'Consider batching operations or using connection pooling',
        autoFixable: false,
      });
    }

    return suggestions;
  }

  /**
   * Generate CPU optimization suggestion
   */
  private generateCPUSuggestion(hotspot: Hotspot): string {
    const suggestions = [
      'Review algorithm complexity - consider using more efficient data structures',
      'Check if the function can be memoized or results cached',
      'Consider parallelizing the operation across multiple threads',
      'Look for opportunities to optimize loops or reduce iterations',
      'Profile the function in detail to identify specific bottlenecks',
    ];

    return suggestions[Math.floor(Math.random() * suggestions.length)];
  }

  /**
   * Generate code optimization
   */
  async generateCodeOptimization(
    code: string,
    suggestion: OptimizationSuggestion
  ): Promise<string> {
    const prompt = `Optimize the following code based on this performance issue:\n\n`;
    const fullPrompt = prompt +
      `Issue: ${suggestion.description}\n` +
      `Suggestion: ${suggestion.suggestion}\n\n` +
      `Code:\n\`\`\`\n${code}\n\`\`\`\n\n` +
      `Provide optimized version of the code. Return only the code, no explanations.`;

    return await this.client.generateText(fullPrompt);
  }

  /**
   * Set optimization level
   */
  setLevel(level: OptimizationLevel): void {
    this.level = level;
  }
}
