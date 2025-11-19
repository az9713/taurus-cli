/**
 * Environment Orchestrator
 *
 * Main orchestrator for development environment management
 */

import { EventEmitter } from 'events';
import { ServiceManager } from './service-manager.js';
import { DatabaseConfigurator } from './database-configurator.js';
import { TemplateRepository } from './template-repository.js';
import {
  DevEnvironmentConfig,
  Environment,
  Service,
  ServiceConfig,
  OrchestrationResult,
  ServiceStatus,
  EnvironmentSnapshot,
} from './types.js';

export class EnvironmentOrchestrator extends EventEmitter {
  private config: DevEnvironmentConfig;
  private serviceManager: ServiceManager;
  private databaseConfigurator: DatabaseConfigurator;
  private templateRepository: TemplateRepository;
  private environment: Environment | null;

  constructor(config: DevEnvironmentConfig) {
    super();
    this.config = config;
    this.serviceManager = new ServiceManager();
    this.databaseConfigurator = new DatabaseConfigurator();
    this.templateRepository = new TemplateRepository();
    this.environment = null;
  }

  /**
   * Initialize and start environment
   */
  async start(): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const result: OrchestrationResult = {
      success: false,
      services: [],
      errors: [],
      warnings: [],
      executionTime: 0,
    };

    try {
      this.emit('environment-start', { name: this.config.projectName });

      // Create environment
      this.environment = {
        name: this.config.projectName,
        services: [],
        networks: [],
        volumes: [],
        status: 'stopped',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Start services in dependency order
      const orderedServices = this.orderServicesByDependencies(this.config.services);

      for (const serviceConfig of orderedServices) {
        try {
          this.emit('service-starting', { service: serviceConfig.name });

          const service = this.createService(serviceConfig);
          await this.serviceManager.startService(service);

          this.environment.services.push(service);
          result.services.push({
            name: service.name,
            status: service.status,
            containerId: service.containerId,
          });

          this.emit('service-started', { service: service.name });
        } catch (error: any) {
          const errorMsg = `Failed to start ${serviceConfig.name}: ${error.message}`;
          result.errors.push(errorMsg);
          result.services.push({
            name: serviceConfig.name,
            status: 'error',
            error: error.message,
          });

          this.emit('service-error', { service: serviceConfig.name, error });

          // Stop on error if not configured to continue
          if (!this.config.autoStart) {
            break;
          }
        }
      }

      // Update environment status
      this.updateEnvironmentStatus();

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.errors.push(error.message);
      this.emit('environment-error', { error });
    }

    result.executionTime = Date.now() - startTime;
    this.emit('environment-started', result);

    return result;
  }

  /**
   * Stop environment
   */
  async stop(): Promise<OrchestrationResult> {
    const startTime = Date.now();
    const result: OrchestrationResult = {
      success: false,
      services: [],
      errors: [],
      warnings: [],
      executionTime: 0,
    };

    if (!this.environment) {
      result.errors.push('No environment running');
      result.executionTime = Date.now() - startTime;
      return result;
    }

    try {
      this.emit('environment-stop', { name: this.environment.name });

      // Stop services in reverse dependency order
      const services = [...this.environment.services].reverse();

      for (const service of services) {
        try {
          this.emit('service-stopping', { service: service.name });

          await this.serviceManager.stopService(service);

          result.services.push({
            name: service.name,
            status: service.status,
          });

          this.emit('service-stopped', { service: service.name });
        } catch (error: any) {
          const errorMsg = `Failed to stop ${service.name}: ${error.message}`;
          result.errors.push(errorMsg);
          result.services.push({
            name: service.name,
            status: 'error',
            error: error.message,
          });

          this.emit('service-error', { service: service.name, error });
        }
      }

      this.environment.status = 'stopped';
      this.environment.updatedAt = new Date();

      result.success = result.errors.length === 0;
    } catch (error: any) {
      result.errors.push(error.message);
      this.emit('environment-error', { error });
    }

    result.executionTime = Date.now() - startTime;
    this.emit('environment-stopped', result);

    return result;
  }

  /**
   * Restart environment
   */
  async restart(): Promise<OrchestrationResult> {
    await this.stop();
    return await this.start();
  }

  /**
   * Get environment status
   */
  getStatus(): Environment | null {
    if (!this.environment) {
      return null;
    }

    // Update service statuses
    this.updateEnvironmentStatus();

    return this.environment;
  }

  /**
   * Get service by name
   */
  getService(name: string): Service | undefined {
    return this.environment?.services.find(s => s.name === name);
  }

  /**
   * Get service logs
   */
  async getServiceLogs(serviceName: string, tail?: number) {
    const service = this.getService(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    return await this.serviceManager.getServiceLogs(service, undefined, tail);
  }

  /**
   * Execute command in service
   */
  async execInService(serviceName: string, command: string): Promise<string> {
    const service = this.getService(serviceName);
    if (!service) {
      throw new Error(`Service not found: ${serviceName}`);
    }

    return await this.serviceManager.execCommand(service, command);
  }

  /**
   * Scale service (not fully implemented for simplicity)
   */
  async scaleService(serviceName: string, replicas: number): Promise<void> {
    this.emit('service-scaling', { service: serviceName, replicas });
    // Docker Compose or Kubernetes would handle this
    // For now, just emit event
    this.emit('service-scaled', { service: serviceName, replicas });
  }

  /**
   * Create snapshot of current environment
   */
  createSnapshot(description?: string): EnvironmentSnapshot {
    if (!this.environment) {
      throw new Error('No environment running');
    }

    return {
      name: this.environment.name,
      services: this.config.services,
      environment: this.collectEnvironmentVariables(),
      timestamp: new Date(),
      description,
    };
  }

  /**
   * Restore from snapshot
   */
  async restoreSnapshot(snapshot: EnvironmentSnapshot): Promise<OrchestrationResult> {
    // Stop current environment
    if (this.environment) {
      await this.stop();
    }

    // Update configuration with snapshot
    this.config.services = snapshot.services;

    // Start with snapshot configuration
    return await this.start();
  }

  /**
   * Get database configurator
   */
  getDatabaseConfigurator(): DatabaseConfigurator {
    return this.databaseConfigurator;
  }

  /**
   * Get template repository
   */
  getTemplateRepository(): TemplateRepository {
    return this.templateRepository;
  }

  /**
   * Create service from configuration
   */
  private createService(config: ServiceConfig): Service {
    return {
      name: config.name,
      config,
      status: 'stopped',
      ports: config.ports || [],
      logs: [],
    };
  }

  /**
   * Order services by dependencies
   */
  private orderServicesByDependencies(services: ServiceConfig[]): ServiceConfig[] {
    const ordered: ServiceConfig[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (service: ServiceConfig): void => {
      if (visited.has(service.name)) {
        return;
      }

      if (visiting.has(service.name)) {
        throw new Error(`Circular dependency detected for service: ${service.name}`);
      }

      visiting.add(service.name);

      // Visit dependencies first
      if (service.depends_on) {
        for (const depName of service.depends_on) {
          const dep = services.find(s => s.name === depName);
          if (dep) {
            visit(dep);
          }
        }
      }

      visiting.delete(service.name);
      visited.add(service.name);
      ordered.push(service);
    };

    for (const service of services) {
      visit(service);
    }

    return ordered;
  }

  /**
   * Update environment status
   */
  private updateEnvironmentStatus(): void {
    if (!this.environment) {
      return;
    }

    const runningCount = this.environment.services.filter(
      s => s.status === 'running'
    ).length;

    const totalCount = this.environment.services.length;

    if (runningCount === 0) {
      this.environment.status = 'stopped';
    } else if (runningCount === totalCount) {
      this.environment.status = 'running';
    } else {
      this.environment.status = 'partial';
    }

    this.environment.updatedAt = new Date();
  }

  /**
   * Collect all environment variables
   */
  private collectEnvironmentVariables(): Record<string, string> {
    const env: Record<string, string> = {};

    for (const service of this.config.services) {
      if (service.environment) {
        Object.assign(env, service.environment);
      }
    }

    return env;
  }

  /**
   * Get configuration
   */
  getConfig(): DevEnvironmentConfig {
    return this.config;
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<DevEnvironmentConfig>): void {
    this.config = { ...this.config, ...config };
  }
}
