/**
 * Template Repository
 *
 * Provides templates for common development services
 */

import { ServiceTemplate, ServiceConfig } from './types.js';

export class TemplateRepository {
  private templates: Map<string, ServiceTemplate>;

  constructor() {
    this.templates = new Map();
    this.loadBuiltInTemplates();
  }

  /**
   * Load built-in service templates
   */
  private loadBuiltInTemplates(): void {
    // Redis Cache
    this.registerTemplate({
      name: 'redis',
      type: 'cache',
      description: 'Redis in-memory cache',
      config: {
        name: 'redis',
        type: 'cache',
        image: 'redis:7-alpine',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: ['REDIS_PASSWORD'],
      ports: [{ host: 6379, container: 6379 }],
      volumes: ['redis-data:/data'],
    });

    // RabbitMQ Message Queue
    this.registerTemplate({
      name: 'rabbitmq',
      type: 'message-queue',
      description: 'RabbitMQ message broker',
      config: {
        name: 'rabbitmq',
        type: 'message-queue',
        image: 'rabbitmq:3-management-alpine',
        restart: 'unless-stopped',
      },
      requiredEnv: ['RABBITMQ_DEFAULT_USER', 'RABBITMQ_DEFAULT_PASS'],
      optionalEnv: [],
      ports: [
        { host: 5672, container: 5672 },
        { host: 15672, container: 15672 }, // Management UI
      ],
      volumes: ['rabbitmq-data:/var/lib/rabbitmq'],
    });

    // Kafka Message Queue
    this.registerTemplate({
      name: 'kafka',
      type: 'message-queue',
      description: 'Apache Kafka message streaming',
      config: {
        name: 'kafka',
        type: 'message-queue',
        image: 'confluentinc/cp-kafka:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [
        'KAFKA_ZOOKEEPER_CONNECT',
        'KAFKA_ADVERTISED_LISTENERS',
        'KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR',
      ],
      optionalEnv: ['KAFKA_AUTO_CREATE_TOPICS_ENABLE'],
      ports: [{ host: 9092, container: 9092 }],
    });

    // Nginx Web Server
    this.registerTemplate({
      name: 'nginx',
      type: 'web',
      description: 'Nginx web server',
      config: {
        name: 'nginx',
        type: 'web',
        image: 'nginx:alpine',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: [],
      ports: [
        { host: 80, container: 80 },
        { host: 443, container: 443 },
      ],
      volumes: [
        './nginx.conf:/etc/nginx/nginx.conf:ro',
        './html:/usr/share/nginx/html:ro',
      ],
    });

    // MinIO Object Storage
    this.registerTemplate({
      name: 'minio',
      type: 'storage',
      description: 'MinIO S3-compatible object storage',
      config: {
        name: 'minio',
        type: 'storage',
        image: 'minio/minio:latest',
        command: 'server /data --console-address ":9001"',
        restart: 'unless-stopped',
      },
      requiredEnv: ['MINIO_ROOT_USER', 'MINIO_ROOT_PASSWORD'],
      optionalEnv: [],
      ports: [
        { host: 9000, container: 9000 },
        { host: 9001, container: 9001 }, // Console
      ],
      volumes: ['minio-data:/data'],
    });

    // Mailhog Email Testing
    this.registerTemplate({
      name: 'mailhog',
      type: 'custom',
      description: 'MailHog email testing tool',
      config: {
        name: 'mailhog',
        type: 'custom',
        image: 'mailhog/mailhog:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: [],
      ports: [
        { host: 1025, container: 1025 }, // SMTP
        { host: 8025, container: 8025 }, // Web UI
      ],
    });

    // Localstack AWS Services
    this.registerTemplate({
      name: 'localstack',
      type: 'custom',
      description: 'LocalStack - Local AWS cloud stack',
      config: {
        name: 'localstack',
        type: 'custom',
        image: 'localstack/localstack:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: ['SERVICES', 'DEBUG'],
      ports: [{ host: 4566, container: 4566 }],
      volumes: [
        '/var/run/docker.sock:/var/run/docker.sock',
        'localstack-data:/tmp/localstack',
      ],
    });

    // Grafana Monitoring
    this.registerTemplate({
      name: 'grafana',
      type: 'custom',
      description: 'Grafana monitoring and visualization',
      config: {
        name: 'grafana',
        type: 'custom',
        image: 'grafana/grafana:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: ['GF_SECURITY_ADMIN_PASSWORD'],
      ports: [{ host: 3000, container: 3000 }],
      volumes: ['grafana-data:/var/lib/grafana'],
    });

    // Prometheus Metrics
    this.registerTemplate({
      name: 'prometheus',
      type: 'custom',
      description: 'Prometheus metrics collection',
      config: {
        name: 'prometheus',
        type: 'custom',
        image: 'prom/prometheus:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: [],
      ports: [{ host: 9090, container: 9090 }],
      volumes: [
        './prometheus.yml:/etc/prometheus/prometheus.yml:ro',
        'prometheus-data:/prometheus',
      ],
    });

    // Jaeger Distributed Tracing
    this.registerTemplate({
      name: 'jaeger',
      type: 'custom',
      description: 'Jaeger distributed tracing',
      config: {
        name: 'jaeger',
        type: 'custom',
        image: 'jaegertracing/all-in-one:latest',
        restart: 'unless-stopped',
      },
      requiredEnv: [],
      optionalEnv: ['COLLECTOR_ZIPKIN_HOST_PORT'],
      ports: [
        { host: 5775, container: 5775, protocol: 'udp' },
        { host: 6831, container: 6831, protocol: 'udp' },
        { host: 6832, container: 6832, protocol: 'udp' },
        { host: 5778, container: 5778 },
        { host: 16686, container: 16686 }, // UI
        { host: 14268, container: 14268 },
        { host: 14250, container: 14250 },
        { host: 9411, container: 9411 },
      ],
    });
  }

  /**
   * Register a service template
   */
  registerTemplate(template: ServiceTemplate): void {
    this.templates.set(template.name, template);
  }

  /**
   * Get template by name
   */
  getTemplate(name: string): ServiceTemplate | undefined {
    return this.templates.get(name);
  }

  /**
   * List all templates
   */
  listTemplates(): ServiceTemplate[] {
    return Array.from(this.templates.values());
  }

  /**
   * Get templates by type
   */
  getTemplatesByType(type: string): ServiceTemplate[] {
    return this.listTemplates().filter(t => t.type === type);
  }

  /**
   * Create service config from template
   */
  createServiceFromTemplate(
    templateName: string,
    overrides?: Partial<ServiceConfig>
  ): ServiceConfig {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const config: ServiceConfig = {
      ...template.config,
      ...overrides,
      name: overrides?.name || template.config.name || templateName,
      type: template.type,
      ports: overrides?.ports || template.ports,
      volumes: overrides?.volumes || template.volumes,
    };

    return config;
  }

  /**
   * Validate template environment variables
   */
  validateTemplateEnvironment(
    templateName: string,
    environment: Record<string, string>
  ): string[] {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    const errors: string[] = [];

    for (const envVar of template.requiredEnv) {
      if (!environment[envVar]) {
        errors.push(`Required environment variable missing: ${envVar}`);
      }
    }

    return errors;
  }

  /**
   * Get template documentation
   */
  getTemplateDocumentation(templateName: string): string {
    const template = this.getTemplate(templateName);
    if (!template) {
      throw new Error(`Template not found: ${templateName}`);
    }

    let doc = `# ${template.name}\n\n`;
    doc += `${template.description}\n\n`;
    doc += `**Type:** ${template.type}\n\n`;

    if (template.requiredEnv.length > 0) {
      doc += `## Required Environment Variables\n`;
      template.requiredEnv.forEach(env => {
        doc += `- ${env}\n`;
      });
      doc += '\n';
    }

    if (template.optionalEnv && template.optionalEnv.length > 0) {
      doc += `## Optional Environment Variables\n`;
      template.optionalEnv.forEach(env => {
        doc += `- ${env}\n`;
      });
      doc += '\n';
    }

    if (template.ports.length > 0) {
      doc += `## Ports\n`;
      template.ports.forEach(port => {
        doc += `- ${port.host}:${port.container}`;
        if (port.protocol) {
          doc += ` (${port.protocol})`;
        }
        doc += '\n';
      });
      doc += '\n';
    }

    if (template.volumes && template.volumes.length > 0) {
      doc += `## Volumes\n`;
      template.volumes.forEach(volume => {
        doc += `- ${volume}\n`;
      });
      doc += '\n';
    }

    return doc;
  }
}
