/**
 * Types for Database Schema Manager & Migration Tool
 */

import { EventEmitter } from 'events';

/**
 * Supported database types
 */
export type DatabaseType =
  | 'postgresql'
  | 'mysql'
  | 'sqlite'
  | 'mongodb'
  | 'mariadb'
  | 'mssql'
  | 'oracle';

/**
 * Schema definition language
 */
export type SchemaLanguage =
  | 'sql'
  | 'typescript'
  | 'prisma'
  | 'sequelize'
  | 'typeorm'
  | 'mongoose';

/**
 * Configuration for database manager
 */
export interface DatabaseManagerConfig {
  enabled: boolean;
  database: DatabaseType;
  schemaLanguage: SchemaLanguage;
  migrations: MigrationConfig;
  schema: SchemaConfig;
  sync: SyncConfig;
}

/**
 * Migration configuration
 */
export interface MigrationConfig {
  directory: string;
  tableName: string;
  generateTimestamp: boolean;
  transactional: boolean;
  lockTable: boolean;
}

/**
 * Schema configuration
 */
export interface SchemaConfig {
  directory: string;
  includeViews: boolean;
  includeIndexes: boolean;
  includeTriggers: boolean;
  namingConvention: NamingConvention;
}

/**
 * Naming convention
 */
export type NamingConvention = 'snake_case' | 'camelCase' | 'PascalCase';

/**
 * Sync configuration
 */
export interface SyncConfig {
  enabled: boolean;
  safe: boolean;
  dropUnused: boolean;
  backupBeforeSync: boolean;
}

/**
 * Database schema
 */
export interface DatabaseSchema {
  name: string;
  version: string;
  tables: Table[];
  views?: View[];
  indexes?: Index[];
  triggers?: Trigger[];
  functions?: StoredFunction[];
}

/**
 * Table definition
 */
export interface Table {
  name: string;
  schema?: string;
  columns: Column[];
  primaryKey?: PrimaryKey;
  foreignKeys?: ForeignKey[];
  indexes?: Index[];
  constraints?: Constraint[];
  comment?: string;
}

/**
 * Column definition
 */
export interface Column {
  name: string;
  type: ColumnType;
  nullable: boolean;
  default?: string | number | boolean | null;
  autoIncrement?: boolean;
  unique?: boolean;
  comment?: string;
  length?: number;
  precision?: number;
  scale?: number;
}

/**
 * Column types
 */
export type ColumnType =
  | 'string'
  | 'text'
  | 'integer'
  | 'bigint'
  | 'float'
  | 'double'
  | 'decimal'
  | 'boolean'
  | 'date'
  | 'datetime'
  | 'timestamp'
  | 'time'
  | 'json'
  | 'jsonb'
  | 'uuid'
  | 'binary'
  | 'enum'
  | 'array';

/**
 * Primary key definition
 */
export interface PrimaryKey {
  name?: string;
  columns: string[];
}

/**
 * Foreign key definition
 */
export interface ForeignKey {
  name?: string;
  columns: string[];
  referencedTable: string;
  referencedColumns: string[];
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

/**
 * Referential actions
 */
export type ReferentialAction =
  | 'CASCADE'
  | 'SET NULL'
  | 'SET DEFAULT'
  | 'RESTRICT'
  | 'NO ACTION';

/**
 * Index definition
 */
export interface Index {
  name: string;
  table: string;
  columns: string[];
  unique: boolean;
  type?: IndexType;
}

/**
 * Index types
 */
export type IndexType = 'btree' | 'hash' | 'gist' | 'gin' | 'fulltext';

/**
 * Constraint definition
 */
export interface Constraint {
  name: string;
  type: ConstraintType;
  columns: string[];
  check?: string;
}

/**
 * Constraint types
 */
export type ConstraintType = 'unique' | 'check' | 'not-null';

/**
 * View definition
 */
export interface View {
  name: string;
  schema?: string;
  definition: string;
  columns?: string[];
}

/**
 * Trigger definition
 */
export interface Trigger {
  name: string;
  table: string;
  timing: TriggerTiming;
  event: TriggerEvent;
  definition: string;
}

/**
 * Trigger timing
 */
export type TriggerTiming = 'BEFORE' | 'AFTER' | 'INSTEAD OF';

/**
 * Trigger event
 */
export type TriggerEvent = 'INSERT' | 'UPDATE' | 'DELETE';

/**
 * Stored function definition
 */
export interface StoredFunction {
  name: string;
  parameters: FunctionParameter[];
  returnType: string;
  language: string;
  definition: string;
}

/**
 * Function parameter
 */
export interface FunctionParameter {
  name: string;
  type: string;
  mode: 'IN' | 'OUT' | 'INOUT';
}

/**
 * Migration
 */
export interface Migration {
  id: string;
  name: string;
  timestamp: number;
  up: MigrationOperation[];
  down: MigrationOperation[];
  description?: string;
}

/**
 * Migration operation
 */
export interface MigrationOperation {
  type: MigrationOperationType;
  table?: string;
  column?: Column;
  index?: Index;
  constraint?: Constraint;
  sql?: string;
  oldName?: string;
  newName?: string;
}

/**
 * Migration operation types
 */
export type MigrationOperationType =
  | 'create-table'
  | 'drop-table'
  | 'rename-table'
  | 'add-column'
  | 'drop-column'
  | 'rename-column'
  | 'alter-column'
  | 'add-index'
  | 'drop-index'
  | 'add-constraint'
  | 'drop-constraint'
  | 'raw-sql';

/**
 * Schema diff
 */
export interface SchemaDiff {
  added: SchemaChange[];
  modified: SchemaChange[];
  removed: SchemaChange[];
  unchanged: number;
}

/**
 * Schema change
 */
export interface SchemaChange {
  type: 'table' | 'column' | 'index' | 'constraint';
  name: string;
  table?: string;
  before?: any;
  after?: any;
  description: string;
}

/**
 * Migration generation request
 */
export interface MigrationGenerationRequest {
  name: string;
  sourcePath?: string;
  targetSchema?: DatabaseSchema;
  operations?: MigrationOperation[];
}

/**
 * Migration generation result
 */
export interface MigrationGenerationResult {
  success: boolean;
  migration: Migration;
  filePath: string;
  preview: string;
  warnings: string[];
}

/**
 * Schema generation request
 */
export interface SchemaGenerationRequest {
  modelPaths: string[];
  outputPath?: string;
  language: SchemaLanguage;
  database: DatabaseType;
}

/**
 * Schema generation result
 */
export interface SchemaGenerationResult {
  success: boolean;
  schema: DatabaseSchema;
  output: string;
  warnings: string[];
}

/**
 * Schema comparison request
 */
export interface SchemaComparisonRequest {
  source: DatabaseSchema;
  target: DatabaseSchema;
  ignoreComments?: boolean;
  ignoreIndexes?: boolean;
}

/**
 * Schema comparison result
 */
export interface SchemaComparisonResult {
  equal: boolean;
  diff: SchemaDiff;
  migrations: Migration[];
  report: string;
}

/**
 * Model definition (from code)
 */
export interface ModelDefinition {
  name: string;
  tableName: string;
  columns: ColumnDefinition[];
  relations: RelationDefinition[];
  indexes: IndexDefinition[];
}

/**
 * Column definition from code
 */
export interface ColumnDefinition {
  name: string;
  type: string;
  nullable: boolean;
  default?: any;
  unique?: boolean;
  primaryKey?: boolean;
  autoIncrement?: boolean;
  length?: number;
}

/**
 * Relation definition
 */
export interface RelationDefinition {
  type: RelationType;
  model: string;
  foreignKey?: string;
  references?: string;
  onDelete?: ReferentialAction;
  onUpdate?: ReferentialAction;
}

/**
 * Relation types
 */
export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

/**
 * Index definition from code
 */
export interface IndexDefinition {
  name?: string;
  columns: string[];
  unique: boolean;
}

/**
 * Database connection info
 */
export interface DatabaseConnection {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

/**
 * Migration execution result
 */
export interface MigrationExecutionResult {
  success: boolean;
  migrationsRun: string[];
  errors: MigrationError[];
  duration: number;
}

/**
 * Migration error
 */
export interface MigrationError {
  migration: string;
  error: string;
  sql?: string;
}

/**
 * Rollback result
 */
export interface RollbackResult {
  success: boolean;
  migrationsRolledBack: string[];
  errors: MigrationError[];
}

/**
 * Base manager interface
 */
export interface DatabaseManager extends EventEmitter {
  generateSchema(
    request: SchemaGenerationRequest
  ): Promise<SchemaGenerationResult>;
  generateMigration(
    request: MigrationGenerationRequest
  ): Promise<MigrationGenerationResult>;
  compareSchemas(
    request: SchemaComparisonRequest
  ): Promise<SchemaComparisonResult>;
  executeMigrations(migrations: string[]): Promise<MigrationExecutionResult>;
  rollback(steps?: number): Promise<RollbackResult>;
}
