/**
 * Database Manager - Schema management and migrations
 */

export { TaurusDatabaseManager } from './database-manager';
export { SchemaGenerator } from './schema-generator';
export { MigrationGenerator } from './migration-generator';
export { SchemaComparator } from './schema-comparator';

export type {
  DatabaseManagerConfig,
  DatabaseManager,
  DatabaseType,
  DatabaseSchema,
  Table,
  Column,
  Migration,
  SchemaGenerationRequest,
  SchemaGenerationResult,
  MigrationGenerationRequest,
  MigrationGenerationResult,
  SchemaComparisonRequest,
  SchemaComparisonResult,
  SchemaDiff,
  MigrationExecutionResult,
  RollbackResult,
} from './types';
