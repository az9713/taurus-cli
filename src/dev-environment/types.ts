/**
 * Development Environment Types
 *
 * Type definitions for local development environment orchestration
 */

export type ServiceType =
  | 'database'
  | 'cache'
  | 'message-queue'
  | 'search'
  | 'storage'
  | 'api'
  | 'web'
  | 'worker'
  | 'custom';

export type ServiceStatus = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export type DatabaseEngine =
  | 'postgresql'
  | 'mysql'
  | 'mongodb'
  | 'redis'
  | 'elasticsearch'
  | 'sqlite';

export interface DevEnvironmentConfig {
  enabled: boolean;
  projectName: string;
  services: ServiceConfig[];
  networks?: NetworkConfig[];
  volumes?: VolumeConfig[];
  secrets?: SecretConfig[];
  autoStart: boolean;
  healthCheck: {
    enabled: boolean;
    interval: number;
    timeout: number;
    retries: number;
  };
}

export interface ServiceConfig {
  name: string;
  type: ServiceType;
  image?: string;
  build?: BuildConfig;
  ports?: PortMapping[];
  environment?: Record<string, string>;
  volumes?: string[];
  depends_on?: string[];
  healthCheck?: HealthCheckConfig;
  restart?: 'no' | 'always' | 'on-failure' | 'unless-stopped';
  command?: string;
  labels?: Record<string, string>;
}

export interface BuildConfig {
  context: string;
  dockerfile?: string;
  args?: Record<string, string>;
  target?: string;
}

export interface PortMapping {
  host: number;
  container: number;
  protocol?: 'tcp' | 'udp';
}

export interface NetworkConfig {
  name: string;
  driver?: 'bridge' | 'host' | 'overlay' | 'none';
  internal?: boolean;
  attachable?: boolean;
}

export interface VolumeConfig {
  name: string;
  driver?: string;
  driverOpts?: Record<string, string>;
}

export interface SecretConfig {
  name: string;
  file?: string;
  environment?: string;
  external?: boolean;
}

export interface HealthCheckConfig {
  test: string | string[];
  interval?: string;
  timeout?: string;
  retries?: number;
  startPeriod?: string;
}

export interface Service {
  name: string;
  config: ServiceConfig;
  status: ServiceStatus;
  containerId?: string;
  ports: PortMapping[];
  logs: string[];
  health?: HealthStatus;
  startedAt?: Date;
  stoppedAt?: Date;
}

export interface HealthStatus {
  status: 'healthy' | 'unhealthy' | 'starting';
  failingStreak: number;
  log: HealthCheckLog[];
}

export interface HealthCheckLog {
  start: Date;
  end: Date;
  exitCode: number;
  output: string;
}

export interface Environment {
  name: string;
  services: Service[];
  networks: string[];
  volumes: string[];
  status: 'stopped' | 'partial' | 'running';
  createdAt: Date;
  updatedAt: Date;
}

export interface DatabaseConnection {
  engine: DatabaseEngine;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  options?: Record<string, any>;
}

export interface ServiceTemplate {
  name: string;
  type: ServiceType;
  description: string;
  config: Partial<ServiceConfig>;
  requiredEnv: string[];
  optionalEnv?: string[];
  ports: PortMapping[];
  volumes?: string[];
}

export interface EnvironmentVariable {
  key: string;
  value: string;
  description?: string;
  required: boolean;
  sensitive: boolean;
}

export interface ServiceDependency {
  service: string;
  condition: 'started' | 'healthy' | 'completed';
}

export interface OrchestrationResult {
  success: boolean;
  services: {
    name: string;
    status: ServiceStatus;
    containerId?: string;
    error?: string;
  }[];
  errors: string[];
  warnings: string[];
  executionTime: number;
}

export interface ServiceLogs {
  service: string;
  logs: LogEntry[];
  since?: Date;
  until?: Date;
}

export interface LogEntry {
  timestamp: Date;
  stream: 'stdout' | 'stderr';
  message: string;
}

export interface ResourceUsage {
  service: string;
  cpu: number; // Percentage
  memory: number; // Bytes
  memoryLimit: number; // Bytes
  network: {
    rx: number; // Bytes received
    tx: number; // Bytes transmitted
  };
  block: {
    read: number; // Bytes read
    write: number; // Bytes written
  };
}

export interface EnvironmentSnapshot {
  name: string;
  services: ServiceConfig[];
  environment: Record<string, string>;
  timestamp: Date;
  description?: string;
}
