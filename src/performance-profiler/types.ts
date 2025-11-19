/**
 * Performance Profiler Types
 *
 * Type definitions for performance profiling and optimization
 */

export type ProfileType = 'cpu' | 'memory' | 'runtime' | 'network' | 'database';

export type OptimizationLevel = 'aggressive' | 'moderate' | 'conservative';

export interface PerformanceProfilerConfig {
  enabled: boolean;
  profileTypes: ProfileType[];
  samplingInterval: number; // milliseconds
  reportPath: string;
  optimization: {
    enabled: boolean;
    level: OptimizationLevel;
    autoApply: boolean;
  };
  benchmarking: {
    enabled: boolean;
    iterations: number;
    warmupRuns: number;
  };
  monitoring: {
    realTime: boolean;
    alertThresholds: {
      cpu: number; // percentage
      memory: number; // MB
      responseTime: number; // ms
    };
  };
}

export interface ProfileSession {
  id: string;
  startTime: Date;
  endTime?: Date;
  duration: number;
  type: ProfileType;
  metrics: PerformanceMetrics;
  samples: ProfileSample[];
  hotspots: Hotspot[];
}

export interface PerformanceMetrics {
  cpu: CPUMetrics;
  memory: MemoryMetrics;
  runtime: RuntimeMetrics;
  network?: NetworkMetrics;
  database?: DatabaseMetrics;
}

export interface CPUMetrics {
  usage: number; // percentage
  userTime: number; // ms
  systemTime: number; // ms
  idleTime: number; // ms
  processes: ProcessMetrics[];
}

export interface ProcessMetrics {
  pid: number;
  name: string;
  cpuUsage: number;
  threads: number;
}

export interface MemoryMetrics {
  heapUsed: number; // bytes
  heapTotal: number; // bytes
  external: number; // bytes
  rss: number; // bytes (Resident Set Size)
  arrayBuffers: number; // bytes
  gcStats: GCStats;
}

export interface GCStats {
  collections: number;
  pauseTime: number; // ms
  totalTime: number; // ms
  type: 'minor' | 'major' | 'incremental';
}

export interface RuntimeMetrics {
  executionTime: number; // ms
  functionCalls: number;
  eventLoopLag: number; // ms
  asyncOperations: number;
}

export interface NetworkMetrics {
  requests: number;
  bytesReceived: number;
  bytesSent: number;
  averageLatency: number; // ms
  errors: number;
}

export interface DatabaseMetrics {
  queries: number;
  averageQueryTime: number; // ms
  slowQueries: SlowQuery[];
  connectionPoolSize: number;
  activeConnections: number;
}

export interface SlowQuery {
  query: string;
  duration: number;
  timestamp: Date;
  stackTrace?: string;
}

export interface ProfileSample {
  timestamp: Date;
  stackTrace: StackFrame[];
  metrics: Partial<PerformanceMetrics>;
}

export interface StackFrame {
  function: string;
  file: string;
  line: number;
  column: number;
  isNative: boolean;
}

export interface Hotspot {
  function: string;
  file: string;
  line: number;
  selfTime: number; // ms
  totalTime: number; // ms
  calls: number;
  percentage: number;
}

export interface OptimizationSuggestion {
  id: string;
  type: 'algorithm' | 'memory' | 'io' | 'caching' | 'async' | 'query';
  severity: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  location: {
    file: string;
    line: number;
    function?: string;
  };
  impact: {
    estimatedSpeedup: number; // percentage
    estimatedMemorySaving: number; // bytes
  };
  suggestion: string;
  codeExample?: string;
  autoFixable: boolean;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  averageTime: number; // ms
  minTime: number;
  maxTime: number;
  standardDeviation: number;
  operationsPerSecond: number;
  memoryUsed: number;
}

export interface PerformanceReport {
  sessionId: string;
  timestamp: Date;
  summary: PerformanceSummary;
  profiles: ProfileSession[];
  optimizations: OptimizationSuggestion[];
  benchmarks: BenchmarkResult[];
  recommendations: string[];
}

export interface PerformanceSummary {
  totalDuration: number;
  averageCPU: number;
  peakMemory: number;
  totalFunctionCalls: number;
  criticalIssues: number;
  optimizationPotential: number; // percentage
}

export interface PerformanceAlert {
  type: 'cpu' | 'memory' | 'response-time';
  severity: 'warning' | 'critical';
  message: string;
  value: number;
  threshold: number;
  timestamp: Date;
}

export interface FlameGraphNode {
  name: string;
  value: number;
  children: FlameGraphNode[];
  color?: string;
}

export interface MemorySnapshot {
  timestamp: Date;
  heapUsed: number;
  heapTotal: number;
  objects: ObjectAllocation[];
  leaks: MemoryLeak[];
}

export interface ObjectAllocation {
  type: string;
  count: number;
  size: number;
  retainedSize: number;
}

export interface MemoryLeak {
  type: string;
  size: number;
  allocations: number;
  growthRate: number; // bytes per second
  suspectedLocation?: string;
}

export interface ProfilingOptions {
  duration?: number;
  sampleRate?: number;
  includeNative?: boolean;
  captureStackTraces?: boolean;
  maxSamples?: number;
}
