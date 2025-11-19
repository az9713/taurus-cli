/**
 * Database Configurator
 *
 * Configures and manages databases in development environment
 */

import { ServiceConfig, DatabaseEngine, DatabaseConnection, ServiceType } from './types.js';

export class DatabaseConfigurator {
  /**
   * Create database service configuration
   */
  createDatabaseService(
    name: string,
    engine: DatabaseEngine,
    options?: {
      port?: number;
      database?: string;
      username?: string;
      password?: string;
      version?: string;
      persistent?: boolean;
    }
  ): ServiceConfig {
    const config = this.getDefaultConfig(engine);
    const defaults = this.getDefaultOptions(engine);

    const port = options?.port || defaults.port;
    const database = options?.database || defaults.database;
    const username = options?.username || defaults.username;
    const password = options?.password || defaults.password;
    const version = options?.version || defaults.version;

    return {
      name,
      type: 'database' as ServiceType,
      image: `${engine}:${version}`,
      ports: [
        {
          host: port,
          container: defaults.port,
        },
      ],
      environment: {
        ...this.getEnvironmentVariables(engine, {
          database,
          username,
          password,
        }),
      },
      volumes: options?.persistent
        ? [`${name}-data:${defaults.dataPath}`]
        : [],
      healthCheck: {
        test: this.getHealthCheckCommand(engine),
        interval: '10s',
        timeout: '5s',
        retries: 5,
      },
      restart: 'unless-stopped',
      labels: {
        'taurus.service.type': 'database',
        'taurus.database.engine': engine,
      },
    };
  }

  /**
   * Get database connection info
   */
  getConnectionInfo(config: ServiceConfig, engine: DatabaseEngine): DatabaseConnection {
    const env = config.environment || {};
    const port = config.ports?.[0]?.host || this.getDefaultOptions(engine).port;

    return {
      engine,
      host: 'localhost',
      port,
      database: this.extractDatabaseName(env, engine),
      username: this.extractUsername(env, engine),
      password: this.extractPassword(env, engine),
    };
  }

  /**
   * Generate connection string
   */
  generateConnectionString(connection: DatabaseConnection): string {
    switch (connection.engine) {
      case 'postgresql':
        return `postgresql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;

      case 'mysql':
        return `mysql://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;

      case 'mongodb':
        return `mongodb://${connection.username}:${connection.password}@${connection.host}:${connection.port}/${connection.database}`;

      case 'redis':
        return `redis://:${connection.password}@${connection.host}:${connection.port}`;

      case 'elasticsearch':
        return `http://${connection.host}:${connection.port}`;

      case 'sqlite':
        return `sqlite://${connection.database}`;

      default:
        return '';
    }
  }

  /**
   * Get default configuration for database engine
   */
  private getDefaultConfig(engine: DatabaseEngine): Partial<ServiceConfig> {
    const configs: Record<DatabaseEngine, Partial<ServiceConfig>> = {
      postgresql: {
        restart: 'unless-stopped',
      },
      mysql: {
        restart: 'unless-stopped',
      },
      mongodb: {
        restart: 'unless-stopped',
      },
      redis: {
        restart: 'unless-stopped',
      },
      elasticsearch: {
        restart: 'unless-stopped',
        environment: {
          'discovery.type': 'single-node',
        },
      },
      sqlite: {
        restart: 'no',
      },
    };

    return configs[engine] || {};
  }

  /**
   * Get default options for database engine
   */
  private getDefaultOptions(engine: DatabaseEngine): {
    port: number;
    database: string;
    username: string;
    password: string;
    version: string;
    dataPath: string;
  } {
    const options: Record<DatabaseEngine, any> = {
      postgresql: {
        port: 5432,
        database: 'postgres',
        username: 'postgres',
        password: 'postgres',
        version: '15-alpine',
        dataPath: '/var/lib/postgresql/data',
      },
      mysql: {
        port: 3306,
        database: 'mysql',
        username: 'root',
        password: 'mysql',
        version: '8',
        dataPath: '/var/lib/mysql',
      },
      mongodb: {
        port: 27017,
        database: 'admin',
        username: 'mongo',
        password: 'mongo',
        version: '6',
        dataPath: '/data/db',
      },
      redis: {
        port: 6379,
        database: '0',
        username: '',
        password: 'redis',
        version: '7-alpine',
        dataPath: '/data',
      },
      elasticsearch: {
        port: 9200,
        database: '',
        username: 'elastic',
        password: 'elastic',
        version: '8.11.0',
        dataPath: '/usr/share/elasticsearch/data',
      },
      sqlite: {
        port: 0,
        database: 'database.db',
        username: '',
        password: '',
        version: 'latest',
        dataPath: '/data',
      },
    };

    return options[engine];
  }

  /**
   * Get environment variables for database
   */
  private getEnvironmentVariables(
    engine: DatabaseEngine,
    options: { database: string; username: string; password: string }
  ): Record<string, string> {
    const env: Record<DatabaseEngine, Record<string, string>> = {
      postgresql: {
        'POSTGRES_DB': options.database,
        'POSTGRES_USER': options.username,
        'POSTGRES_PASSWORD': options.password,
      },
      mysql: {
        'MYSQL_DATABASE': options.database,
        'MYSQL_ROOT_PASSWORD': options.password,
      },
      mongodb: {
        'MONGO_INITDB_ROOT_USERNAME': options.username,
        'MONGO_INITDB_ROOT_PASSWORD': options.password,
        'MONGO_INITDB_DATABASE': options.database,
      },
      redis: {
        'REDIS_PASSWORD': options.password,
      },
      elasticsearch: {
        'ELASTIC_PASSWORD': options.password,
        'xpack.security.enabled': 'false',
      },
      sqlite: {},
    };

    return env[engine] || {};
  }

  /**
   * Get health check command for database
   */
  private getHealthCheckCommand(engine: DatabaseEngine): string[] {
    const commands: Record<DatabaseEngine, string[]> = {
      postgresql: ['CMD-SHELL', 'pg_isready -U postgres'],
      mysql: ['CMD', 'mysqladmin', 'ping', '-h', 'localhost'],
      mongodb: ['CMD', 'mongosh', '--eval', 'db.adminCommand("ping")'],
      redis: ['CMD', 'redis-cli', 'ping'],
      elasticsearch: ['CMD-SHELL', 'curl -f http://localhost:9200/_cluster/health || exit 1'],
      sqlite: ['CMD', 'test', '-f', '/data/database.db'],
    };

    return commands[engine] || ['CMD', 'echo', 'ok'];
  }

  /**
   * Extract database name from environment
   */
  private extractDatabaseName(env: Record<string, string>, engine: DatabaseEngine): string {
    const keys: Record<DatabaseEngine, string> = {
      postgresql: 'POSTGRES_DB',
      mysql: 'MYSQL_DATABASE',
      mongodb: 'MONGO_INITDB_DATABASE',
      redis: '0',
      elasticsearch: '',
      sqlite: '',
    };

    return env[keys[engine]] || this.getDefaultOptions(engine).database;
  }

  /**
   * Extract username from environment
   */
  private extractUsername(env: Record<string, string>, engine: DatabaseEngine): string {
    const keys: Record<DatabaseEngine, string> = {
      postgresql: 'POSTGRES_USER',
      mysql: 'MYSQL_USER',
      mongodb: 'MONGO_INITDB_ROOT_USERNAME',
      redis: '',
      elasticsearch: 'ELASTIC_USER',
      sqlite: '',
    };

    return env[keys[engine]] || this.getDefaultOptions(engine).username;
  }

  /**
   * Extract password from environment
   */
  private extractPassword(env: Record<string, string>, engine: DatabaseEngine): string {
    const keys: Record<DatabaseEngine, string> = {
      postgresql: 'POSTGRES_PASSWORD',
      mysql: 'MYSQL_ROOT_PASSWORD',
      mongodb: 'MONGO_INITDB_ROOT_PASSWORD',
      redis: 'REDIS_PASSWORD',
      elasticsearch: 'ELASTIC_PASSWORD',
      sqlite: '',
    };

    return env[keys[engine]] || this.getDefaultOptions(engine).password;
  }

  /**
   * Create database initialization script
   */
  createInitScript(engine: DatabaseEngine, database: string, schema?: string): string {
    switch (engine) {
      case 'postgresql':
        return `
-- Create database
CREATE DATABASE ${database};

-- Connect to database
\\c ${database}

${schema || '-- Add your schema here'}
        `.trim();

      case 'mysql':
        return `
-- Create database
CREATE DATABASE IF NOT EXISTS ${database};

-- Use database
USE ${database};

${schema || '-- Add your schema here'}
        `.trim();

      case 'mongodb':
        return `
// Create database and collection
use ${database}

${schema || '// Add your collections here'}
        `.trim();

      default:
        return '';
    }
  }
}
