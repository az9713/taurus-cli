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

      case 'rename-table':
        return `ALTER TABLE ${op.oldName} RENAME TO ${op.newName};`;

      case 'add-column':
        return `ALTER TABLE ${op.table} ADD COLUMN ${op.column?.name} ${op.column?.type};`;

      case 'drop-column':
        return `ALTER TABLE ${op.table} DROP COLUMN ${op.column?.name};`;

      case 'rename-column':
        return this.getRenameColumnSQL(op, database);

      case 'alter-column':
        return this.getAlterColumnSQL(op, database);

      case 'add-index':
        return `CREATE INDEX ${op.index?.name} ON ${op.table} (${op.index?.columns.join(', ')});`;

      case 'drop-index':
        return `DROP INDEX ${op.index?.name};`;

      case 'add-constraint':
        return this.getAddConstraintSQL(op, database);

      case 'drop-constraint':
        return `ALTER TABLE ${op.table} DROP CONSTRAINT ${op.constraint?.name};`;

      case 'raw-sql':
        return op.sql || '';

      default:
        return '';
    }
  }

  /**
   * Generate ALTER COLUMN SQL (database-specific)
   */
  private getAlterColumnSQL(op: MigrationOperation, database: DatabaseType): string {
    const column = op.column;
    if (!column) return '';

    switch (database) {
      case 'postgresql':
        // PostgreSQL uses ALTER COLUMN syntax
        const alterations: string[] = [];

        // Change data type
        if (column.type) {
          alterations.push(`ALTER COLUMN ${column.name} TYPE ${column.type}`);
        }

        // Set/drop NOT NULL
        if (column.nullable !== undefined) {
          alterations.push(
            `ALTER COLUMN ${column.name} ${column.nullable ? 'DROP' : 'SET'} NOT NULL`
          );
        }

        // Set/drop DEFAULT
        if (column.default !== undefined) {
          if (column.default === null) {
            alterations.push(`ALTER COLUMN ${column.name} DROP DEFAULT`);
          } else {
            alterations.push(`ALTER COLUMN ${column.name} SET DEFAULT ${column.default}`);
          }
        }

        return alterations.map(alt => `ALTER TABLE ${op.table} ${alt}`).join(';\n    ');

      case 'mysql':
      case 'mariadb':
        // MySQL uses MODIFY COLUMN syntax
        const nullable = column.nullable ? '' : ' NOT NULL';
        const defaultVal = column.default !== undefined ? ` DEFAULT ${column.default}` : '';
        return `ALTER TABLE ${op.table} MODIFY COLUMN ${column.name} ${column.type}${nullable}${defaultVal};`;

      case 'sqlite':
        // SQLite doesn't support ALTER COLUMN directly
        return `-- SQLite does not support ALTER COLUMN. Consider recreating the table.`;

      default:
        return `ALTER TABLE ${op.table} ALTER COLUMN ${column.name} ${column.type};`;
    }
  }

  /**
   * Generate RENAME COLUMN SQL (database-specific)
   */
  private getRenameColumnSQL(op: MigrationOperation, database: DatabaseType): string {
    switch (database) {
      case 'postgresql':
      case 'mysql':
      case 'mariadb':
        return `ALTER TABLE ${op.table} RENAME COLUMN ${op.oldName} TO ${op.newName};`;

      case 'sqlite':
        return `ALTER TABLE ${op.table} RENAME COLUMN ${op.oldName} TO ${op.newName};`;

      default:
        return `ALTER TABLE ${op.table} RENAME COLUMN ${op.oldName} TO ${op.newName};`;
    }
  }

  /**
   * Generate ADD CONSTRAINT SQL
   */
  private getAddConstraintSQL(op: MigrationOperation, database: DatabaseType): string {
    const constraint = op.constraint;
    if (!constraint) return '';

    switch (constraint.type) {
      case 'unique':
        return `ALTER TABLE ${op.table} ADD CONSTRAINT ${constraint.name} UNIQUE (${constraint.columns.join(', ')});`;

      case 'check':
        return `ALTER TABLE ${op.table} ADD CONSTRAINT ${constraint.name} CHECK (${constraint.check});`;

      case 'not-null':
        // NOT NULL is typically handled via ALTER COLUMN
        return constraint.columns
          .map(col => `ALTER TABLE ${op.table} ALTER COLUMN ${col} SET NOT NULL`)
          .join(';\n    ');

      default:
        return '';
    }
  }
}
