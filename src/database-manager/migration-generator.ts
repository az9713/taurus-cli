/**
 * Migration Generator - Generate migration scripts
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  Migration,
  MigrationGenerationRequest,
  MigrationGenerationResult,
  MigrationOperation,
  DatabaseType,
} from './types';

export class MigrationGenerator {
  /**
   * Generate migration
   */
  async generateMigration(
    request: MigrationGenerationRequest,
    database: DatabaseType,
    migrationsDir: string
  ): Promise<MigrationGenerationResult> {
    const timestamp = Date.now();
    const id = `${timestamp}_${request.name}`;

    const migration: Migration = {
      id,
      name: request.name,
      timestamp,
      up: request.operations || [],
      down: this.generateRollbackOperations(request.operations || []),
    };

    // Generate migration file content
    const content = this.generateMigrationFile(migration, database);
    const filePath = path.join(migrationsDir, `${id}.ts`);

    // Write migration file
    if (!fs.existsSync(migrationsDir)) {
      fs.mkdirSync(migrationsDir, { recursive: true });
    }
    fs.writeFileSync(filePath, content);

    return {
      success: true,
      migration,
      filePath,
      preview: content,
      warnings: [],
    };
  }

  /**
   * Generate rollback operations
   */
  private generateRollbackOperations(
    upOperations: MigrationOperation[]
  ): MigrationOperation[] {
    const downOperations: MigrationOperation[] = [];

    for (const op of upOperations) {
      switch (op.type) {
        case 'create-table':
          downOperations.unshift({
            type: 'drop-table',
            table: op.table,
          });
          break;
        case 'drop-table':
          downOperations.unshift({
            type: 'create-table',
            table: op.table,
          });
          break;
        case 'add-column':
          downOperations.unshift({
            type: 'drop-column',
            table: op.table,
            column: op.column,
          });
          break;
        case 'drop-column':
          downOperations.unshift({
            type: 'add-column',
            table: op.table,
            column: op.column,
          });
          break;
        case 'rename-table':
          downOperations.unshift({
            type: 'rename-table',
            table: op.newName,
            oldName: op.table,
            newName: op.oldName,
          });
          break;
      }
    }

    return downOperations;
  }

  /**
   * Generate migration file content
   */
  private generateMigrationFile(
    migration: Migration,
    database: DatabaseType
  ): string {
    const upSQL = migration.up
      .map((op) => this.operationToSQL(op, database))
      .filter((sql) => sql)
      .join('\n    ');

    const downSQL = migration.down
      .map((op) => this.operationToSQL(op, database))
      .filter((sql) => sql)
      .join('\n    ');

    return `/**
 * Migration: ${migration.name}
 * Generated: ${new Date(migration.timestamp).toISOString()}
 */

export async function up(db: any): Promise<void> {
  await db.query(\`
    ${upSQL}
  \`);
}

export async function down(db: any): Promise<void> {
  await db.query(\`
    ${downSQL}
  \`);
}
`;
  }

  /**
   * Convert operation to SQL
   */
  private operationToSQL(
    op: MigrationOperation,
    database: DatabaseType
  ): string {
    switch (op.type) {
      case 'create-table':
        return `CREATE TABLE ${op.table} (...);`;
      case 'drop-table':
        return `DROP TABLE ${op.table};`;
      case 'add-column':
        return `ALTER TABLE ${op.table} ADD COLUMN ${op.column?.name} ${op.column?.type};`;
      case 'drop-column':
        return `ALTER TABLE ${op.table} DROP COLUMN ${op.column?.name};`;
      case 'rename-table':
        return `ALTER TABLE ${op.oldName} RENAME TO ${op.newName};`;
      case 'add-index':
        return `CREATE INDEX ${op.index?.name} ON ${op.table} (${op.index?.columns.join(', ')});`;
      case 'raw-sql':
        return op.sql || '';
      default:
        return '';
    }
  }
}
