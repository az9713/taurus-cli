/**
 * Schema Comparator - Compare schemas and generate diffs
 */

import {
  DatabaseSchema,
  SchemaDiff,
  SchemaChange,
  SchemaComparisonRequest,
  SchemaComparisonResult,
  Migration,
  MigrationOperation,
  Table,
} from './types';

export class SchemaComparator {
  /**
   * Compare two schemas
   */
  async compareSchemas(
    request: SchemaComparisonRequest
  ): Promise<SchemaComparisonResult> {
    const diff = this.generateDiff(request.source, request.target, request);

    const migrations = this.diffToMigrations(diff);

    const report = this.generateComparisonReport(diff);

    return {
      equal: diff.added.length === 0 && diff.modified.length === 0 && diff.removed.length === 0,
      diff,
      migrations,
      report,
    };
  }

  /**
   * Generate schema diff
   */
  private generateDiff(
    source: DatabaseSchema,
    target: DatabaseSchema,
    options: SchemaComparisonRequest
  ): SchemaDiff {
    const added: SchemaChange[] = [];
    const modified: SchemaChange[] = [];
    const removed: SchemaChange[] = [];
    let unchanged = 0;

    // Compare tables
    const sourceTables = new Map(source.tables.map((t) => [t.name, t]));
    const targetTables = new Map(target.tables.map((t) => [t.name, t]));

    // Find added tables
    for (const [name, table] of targetTables) {
      if (!sourceTables.has(name)) {
        added.push({
          type: 'table',
          name,
          after: table,
          description: `Table ${name} added`,
        });
      }
    }

    // Find removed tables
    for (const [name, table] of sourceTables) {
      if (!targetTables.has(name)) {
        removed.push({
          type: 'table',
          name,
          before: table,
          description: `Table ${name} removed`,
        });
      }
    }

    // Find modified tables
    for (const [name, sourceTable] of sourceTables) {
      const targetTable = targetTables.get(name);
      if (targetTable) {
        const tableChanges = this.compareTable(sourceTable, targetTable);
        if (tableChanges.length > 0) {
          modified.push(...tableChanges);
        } else {
          unchanged++;
        }
      }
    }

    return { added, modified, removed, unchanged };
  }

  /**
   * Compare two tables
   */
  private compareTable(source: Table, target: Table): SchemaChange[] {
    const changes: SchemaChange[] = [];

    // Compare columns
    const sourceColumns = new Map(source.columns.map((c: any) => [c.name, c]));
    const targetColumns = new Map(target.columns.map((c: any) => [c.name, c]));

    // Added columns
    for (const [name, col] of targetColumns) {
      if (!sourceColumns.has(name)) {
        changes.push({
          type: 'column',
          name,
          table: target.name as string,
          after: col,
          description: `Column ${target.name}.${name} added`,
        });
      }
    }

    // Removed columns
    for (const [name, col] of sourceColumns) {
      if (!targetColumns.has(name)) {
        changes.push({
          type: 'column',
          name,
          table: source.name as string,
          before: col,
          description: `Column ${source.name}.${name} removed`,
        });
      }
    }

    // Modified columns
    for (const [name, sourceCol] of sourceColumns) {
      const targetCol = targetColumns.get(name);
      if (targetCol && !this.columnsEqual(sourceCol, targetCol)) {
        changes.push({
          type: 'column',
          name,
          table: source.name as string,
          before: sourceCol,
          after: targetCol,
          description: `Column ${source.name}.${name} modified`,
        });
      }
    }

    return changes;
  }

  /**
   * Check if two columns are equal
   */
  private columnsEqual(col1: any, col2: any): boolean {
    return (
      col1.type === col2.type &&
      col1.nullable === col2.nullable &&
      col1.default === col2.default &&
      col1.unique === col2.unique
    );
  }

  /**
   * Convert diff to migrations
   */
  private diffToMigrations(diff: SchemaDiff): Migration[] {
    const operations: MigrationOperation[] = [];

    // Added tables
    for (const change of diff.added) {
      if (change.type === 'table') {
        operations.push({
          type: 'create-table',
          table: change.name,
        });
      }
    }

    // Modified columns
    for (const change of diff.modified) {
      if (change.type === 'column') {
        if (!change.before && change.after) {
          operations.push({
            type: 'add-column',
            table: change.table!,
            column: change.after,
          });
        } else if (change.before && !change.after) {
          operations.push({
            type: 'drop-column',
            table: change.table!,
            column: change.before,
          });
        } else {
          operations.push({
            type: 'alter-column',
            table: change.table!,
            column: change.after,
          });
        }
      }
    }

    // Removed tables
    for (const change of diff.removed) {
      if (change.type === 'table') {
        operations.push({
          type: 'drop-table',
          table: change.name,
        });
      }
    }

    if (operations.length === 0) {
      return [];
    }

    return [
      {
        id: `${Date.now()}_schema_sync`,
        name: 'schema_sync',
        timestamp: Date.now(),
        up: operations,
        down: [],
        description: 'Sync schema changes',
      },
    ];
  }

  /**
   * Generate comparison report
   */
  private generateComparisonReport(diff: SchemaDiff): string {
    const lines: string[] = [];

    lines.push('Schema Comparison Report');
    lines.push('========================\n');

    lines.push(`Added: ${diff.added.length}`);
    lines.push(`Modified: ${diff.modified.length}`);
    lines.push(`Removed: ${diff.removed.length}`);
    lines.push(`Unchanged: ${diff.unchanged}\n`);

    if (diff.added.length > 0) {
      lines.push('Added Items:');
      for (const change of diff.added) {
        lines.push(`  - ${change.description}`);
      }
      lines.push('');
    }

    if (diff.modified.length > 0) {
      lines.push('Modified Items:');
      for (const change of diff.modified) {
        lines.push(`  - ${change.description}`);
      }
      lines.push('');
    }

    if (diff.removed.length > 0) {
      lines.push('Removed Items:');
      for (const change of diff.removed) {
        lines.push(`  - ${change.description}`);
      }
    }

    return lines.join('\n');
  }
}
