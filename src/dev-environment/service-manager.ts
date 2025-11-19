/**
 * Service Manager
 *
 * Manages individual development services
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import {
  Service,
  ServiceConfig,
  ServiceStatus,
  HealthStatus,
  ServiceLogs,
  LogEntry,
  ResourceUsage,
} from './types.js';

const exec = promisify(execCallback);

export class ServiceManager {
  /**
   * Start a service
   */
  async startService(service: Service): Promise<void> {
    service.status = 'starting';

    try {
      const dockerCmd = this.buildDockerRunCommand(service.config);
      const { stdout } = await exec(dockerCmd);

      service.containerId = stdout.trim();
      service.status = 'running';
      service.startedAt = new Date();

      // Wait for health check if configured
      if (service.config.healthCheck) {
        await this.waitForHealthy(service);
      }
    } catch (error: any) {
      service.status = 'error';
      throw new Error(`Failed to start service ${service.name}: ${error.message}`);
    }
  }

  /**
   * Stop a service
   */
  async stopService(service: Service): Promise<void> {
    if (!service.containerId) {
      return;
    }

    service.status = 'stopping';

    try {
      await exec(`docker stop ${service.containerId}`);
      service.status = 'stopped';
      service.stoppedAt = new Date();
    } catch (error: any) {
      service.status = 'error';
      throw new Error(`Failed to stop service ${service.name}: ${error.message}`);
    }
  }

  /**
   * Restart a service
   */
  async restartService(service: Service): Promise<void> {
    await this.stopService(service);
    await this.startService(service);
  }

  /**
   * Get service status
   */
  async getServiceStatus(service: Service): Promise<ServiceStatus> {
    if (!service.containerId) {
      return 'stopped';
    }

    try {
      const { stdout } = await exec(
        `docker inspect --format='{{.State.Status}}' ${service.containerId}`
      );
      const status = stdout.trim();

      if (status === 'running') return 'running';
      if (status === 'exited') return 'stopped';
      if (status === 'paused') return 'stopped';

      return 'error';
    } catch {
      return 'stopped';
    }
  }

  /**
   * Get service logs
   */
  async getServiceLogs(
    service: Service,
    since?: Date,
    tail?: number
  ): Promise<ServiceLogs> {
    if (!service.containerId) {
      return {
        service: service.name,
        logs: [],
      };
    }

    try {
      let cmd = `docker logs ${service.containerId}`;

      if (since) {
        cmd += ` --since ${Math.floor(since.getTime() / 1000)}`;
      }

      if (tail) {
        cmd += ` --tail ${tail}`;
      }

      const { stdout, stderr } = await exec(cmd);

      const logs: LogEntry[] = [];

      stdout.split('\n').forEach(line => {
        if (line.trim()) {
          logs.push({
            timestamp: new Date(),
            stream: 'stdout',
            message: line,
          });
        }
      });

      stderr.split('\n').forEach(line => {
        if (line.trim()) {
          logs.push({
            timestamp: new Date(),
            stream: 'stderr',
            message: line,
          });
        }
      });

      return {
        service: service.name,
        logs,
        since,
      };
    } catch (error: any) {
      throw new Error(`Failed to get logs for ${service.name}: ${error.message}`);
    }
  }

  /**
   * Get service resource usage
   */
  async getResourceUsage(service: Service): Promise<ResourceUsage> {
    if (!service.containerId) {
      throw new Error('Service not running');
    }

    try {
      const { stdout } = await exec(
        `docker stats ${service.containerId} --no-stream --format "{{json .}}"`
      );

      const stats = JSON.parse(stdout);

      return {
        service: service.name,
        cpu: parseFloat(stats.CPUPerc?.replace('%', '') || '0'),
        memory: this.parseMemory(stats.MemUsage?.split('/')[0] || '0B'),
        memoryLimit: this.parseMemory(stats.MemUsage?.split('/')[1] || '0B'),
        network: {
          rx: this.parseMemory(stats.NetIO?.split('/')[0] || '0B'),
          tx: this.parseMemory(stats.NetIO?.split('/')[1] || '0B'),
        },
        block: {
          read: this.parseMemory(stats.BlockIO?.split('/')[0] || '0B'),
          write: this.parseMemory(stats.BlockIO?.split('/')[1] || '0B'),
        },
      };
    } catch (error: any) {
      throw new Error(`Failed to get resource usage for ${service.name}: ${error.message}`);
    }
  }

  /**
   * Check service health
   */
  async checkHealth(service: Service): Promise<HealthStatus> {
    if (!service.containerId) {
      return {
        status: 'unhealthy',
        failingStreak: 0,
        log: [],
      };
    }

    try {
      const { stdout } = await exec(
        `docker inspect --format='{{json .State.Health}}' ${service.containerId}`
      );

      const health = JSON.parse(stdout);

      if (!health) {
        return {
          status: 'healthy',
          failingStreak: 0,
          log: [],
        };
      }

      return {
        status: health.Status || 'starting',
        failingStreak: health.FailingStreak || 0,
        log: (health.Log || []).map((entry: any) => ({
          start: new Date(entry.Start),
          end: new Date(entry.End),
          exitCode: entry.ExitCode,
          output: entry.Output,
        })),
      };
    } catch {
      return {
        status: 'unhealthy',
        failingStreak: 0,
        log: [],
      };
    }
  }

  /**
   * Execute command in service container
   */
  async execCommand(service: Service, command: string): Promise<string> {
    if (!service.containerId) {
      throw new Error('Service not running');
    }

    try {
      const { stdout } = await exec(`docker exec ${service.containerId} ${command}`);
      return stdout;
    } catch (error: any) {
      throw new Error(`Failed to execute command in ${service.name}: ${error.message}`);
    }
  }

  /**
   * Build Docker run command
   */
  private buildDockerRunCommand(config: ServiceConfig): string {
    let cmd = 'docker run -d';

    // Name
    cmd += ` --name ${config.name}`;

    // Ports
    if (config.ports) {
      config.ports.forEach(port => {
        cmd += ` -p ${port.host}:${port.container}`;
        if (port.protocol) {
          cmd += `/${port.protocol}`;
        }
      });
    }

    // Environment variables
    if (config.environment) {
      Object.entries(config.environment).forEach(([key, value]) => {
        cmd += ` -e ${key}="${value}"`;
      });
    }

    // Volumes
    if (config.volumes) {
      config.volumes.forEach(volume => {
        cmd += ` -v ${volume}`;
      });
    }

    // Restart policy
    if (config.restart) {
      cmd += ` --restart ${config.restart}`;
    }

    // Labels
    if (config.labels) {
      Object.entries(config.labels).forEach(([key, value]) => {
        cmd += ` --label ${key}="${value}"`;
      });
    }

    // Health check
    if (config.healthCheck) {
      const test = Array.isArray(config.healthCheck.test)
        ? config.healthCheck.test.join(' ')
        : config.healthCheck.test;
      cmd += ` --health-cmd="${test}"`;

      if (config.healthCheck.interval) {
        cmd += ` --health-interval=${config.healthCheck.interval}`;
      }
      if (config.healthCheck.timeout) {
        cmd += ` --health-timeout=${config.healthCheck.timeout}`;
      }
      if (config.healthCheck.retries) {
        cmd += ` --health-retries=${config.healthCheck.retries}`;
      }
    }

    // Image or build
    if (config.image) {
      cmd += ` ${config.image}`;
    }

    // Command
    if (config.command) {
      cmd += ` ${config.command}`;
    }

    return cmd;
  }

  /**
   * Wait for service to be healthy
   */
  private async waitForHealthy(service: Service, timeout: number = 60000): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const health = await this.checkHealth(service);

      if (health.status === 'healthy') {
        service.health = health;
        return;
      }

      if (health.status === 'unhealthy') {
        throw new Error(`Service ${service.name} is unhealthy`);
      }

      // Wait before checking again
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    throw new Error(`Service ${service.name} health check timeout`);
  }

  /**
   * Parse memory string to bytes
   */
  private parseMemory(str: string): number {
    const match = str.match(/^([\d.]+)([KMGT]?i?B)$/);
    if (!match) return 0;

    const value = parseFloat(match[1]);
    const unit = match[2];

    const multipliers: Record<string, number> = {
      'B': 1,
      'KB': 1000,
      'MB': 1000 * 1000,
      'GB': 1000 * 1000 * 1000,
      'TB': 1000 * 1000 * 1000 * 1000,
      'KiB': 1024,
      'MiB': 1024 * 1024,
      'GiB': 1024 * 1024 * 1024,
      'TiB': 1024 * 1024 * 1024 * 1024,
    };

    return value * (multipliers[unit] || 1);
  }
}
