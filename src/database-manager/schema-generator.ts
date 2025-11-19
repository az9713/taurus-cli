/**
 * Schema Generator - Generate database schemas from code models
 */

import * as fs from 'fs';
import {
  DatabaseSchema,
  Table,
  Column,
  SchemaGenerationRequest,
  SchemaGenerationResult,
  DatabaseType,
  ModelDefinition,
  ColumnType,
} from './types';

export class SchemaGenerator {
  /**
   * Generate database schema from code models
   */
  async generateSchema(
    request: SchemaGenerationRequest
  ): Promise<SchemaGenerationResult> {
    const warnings: string[] = [];

    try {
      // Parse model files
      const models = this.parseModels(request.modelPaths);

      // Convert models to schema
      const schema = this.convertModelsToSchema(models, request.database);

      // Generate output (SQL, Prisma, etc.)
      const output = this.generateOutput(schema, request.language, request.database);

      // Write output file if specified
      if (request.outputPath) {
        fs.writeFileSync(request.outputPath, output);
      }

      return {
        success: true,
        schema,
        output,
        warnings,
      };
    } catch (error) {
      throw new Error(`Schema generation failed: ${error}`);
    }
  }

  /**
   * Parse model files to extract definitions
   */
  private parseModels(modelPaths: string[]): ModelDefinition[] {
    const models: ModelDefinition[] = [];

    for (const path of modelPaths) {
      const code = fs.readFileSync(path, 'utf-8');
      const fileModels = this.parseModelFile(code, path);
      models.push(...fileModels);
    }

    return models;
  }

  /**
   * Parse a single model file
   */
  private parseModelFile(code: string, filePath: string): ModelDefinition[] {
    const models: ModelDefinition[] = [];

    // TypeORM entity pattern
    const typeormPattern = /@Entity\(['"](\w+)['"]\)\s*export class (\w+)/g;
    let match;

    while ((match = typeormPattern.exec(code)) !== null) {
      const tableName = match[1];
      const className = match[2];

      const model: ModelDefinition = {
        name: className,
        tableName,
        columns: this.extractTypeORMColumns(code, className),
        relations: this.extractTypeORMRelations(code, className),
        indexes: [],
      };

      models.push(model);
    }

    // Sequelize model pattern
    const sequelizePattern = /class (\w+) extends Model/g;
    while ((match = sequelizePattern.exec(code)) !== null) {
      const className = match[1];
      const model: ModelDefinition = {
        name: className,
        tableName: this.camelToSnakeCase(className),
        columns: this.extractSequelizeColumns(code, className),
        relations: [],
        indexes: [],
      };
      models.push(model);
    }

    return models;
  }

  /**
   * Extract TypeORM columns from class
   */
  private extractTypeORMColumns(code: string, className: string): any[] {
    const columns: any[] = [];

    // Extract class body
    const classMatch = new RegExp(
      `class ${className}[^{]*{([^}]+)}`,
      's'
    ).exec(code);
    if (!classMatch) return columns;

    const classBody = classMatch[1];

    // Find @Column decorators
    const columnPattern =
      /@Column\(([^)]*)\)?\s*(\w+)(?:!|:|\?:)\s*([\w<>[\]]+)/g;
    let match;

    while ((match = columnPattern.exec(classBody)) !== null) {
      const options = match[1] || '';
      const name = match[2];
      const type = match[3];

      columns.push({
        name,
        type: this.mapTypeScriptToColumnType(type),
        nullable: code.includes(`${name}?:`) || options.includes('nullable: true'),
        unique: options.includes('unique: true'),
        default: this.extractDefault(options),
        primaryKey: false,
        autoIncrement: false,
      });
    }

    // Find @PrimaryGeneratedColumn
    const pkPattern = /@PrimaryGeneratedColumn\(\)\s*(\w+)/g;
    while ((match = pkPattern.exec(classBody)) !== null) {
      const name = match[1];
      columns.push({
        name,
        type: 'integer',
        nullable: false,
        primaryKey: true,
        autoIncrement: true,
      });
    }

    return columns;
  }

  /**
   * Extract TypeORM relations
   */
  private extractTypeORMRelations(code: string, className: string): any[] {
    const relations: any[] = [];

    const relationPatterns = [
      /@OneToOne\(\(\) => (\w+)/g,
      /@OneToMany\(\(\) => (\w+)/g,
      /@ManyToOne\(\(\) => (\w+)/g,
      /@ManyToMany\(\(\) => (\w+)/g,
    ];

    const types = ['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many'];

    for (let i = 0; i < relationPatterns.length; i++) {
      const pattern = relationPatterns[i];
      let match;

      while ((match = pattern.exec(code)) !== null) {
        relations.push({
          type: types[i],
          model: match[1],
        });
      }
    }

    return relations;
  }

  /**
   * Extract Sequelize columns
   */
  private extractSequelizeColumns(code: string, className: string): any[] {
    // Simplified - would need more robust parsing
    return [];
  }

  /**
   * Convert models to database schema
   */
  private convertModelsToSchema(
    models: ModelDefinition[],
    database: DatabaseType
  ): DatabaseSchema {
    const tables: Table[] = models.map((model) =>
      this.convertModelToTable(model, database)
    );

    return {
      name: 'generated',
      version: '1.0.0',
      tables,
    };
  }

  /**
   * Convert model to table definition
   */
  private convertModelToTable(
    model: ModelDefinition,
    database: DatabaseType
  ): Table {
    const columns: Column[] = model.columns.map((col) =>
      this.convertColumnDefinition(col, database)
    );

    const primaryKey = model.columns.find((c) => c.primaryKey);

    return {
      name: model.tableName,
      columns,
      primaryKey: primaryKey
        ? { columns: [primaryKey.name] }
        : undefined,
      foreignKeys: this.generateForeignKeys(model),
      indexes: this.generateIndexes(model),
    };
  }

  /**
   * Convert column definition
   */
  private convertColumnDefinition(col: any, database: DatabaseType): Column {
    return {
      name: col.name,
      type: col.type as ColumnType,
      nullable: col.nullable,
      default: col.default,
      unique: col.unique,
      autoIncrement: col.autoIncrement,
      length: col.length,
    };
  }

  /**
   * Generate foreign keys from relations
   */
  private generateForeignKeys(model: ModelDefinition): any[] {
    return model.relations
      .filter((r) => r.foreignKey)
      .map((r) => ({
        columns: [r.foreignKey!],
        referencedTable: this.camelToSnakeCase(r.model),
        referencedColumns: [r.references || 'id'],
        onDelete: r.onDelete,
        onUpdate: r.onUpdate,
      }));
  }

  /**
   * Generate indexes
   */
  private generateIndexes(model: ModelDefinition): any[] {
    return model.indexes.map((idx) => ({
      name: idx.name || `idx_${model.tableName}_${idx.columns.join('_')}`,
      table: model.tableName,
      columns: idx.columns,
      unique: idx.unique,
    }));
  }

  /**
   * Generate output in specified language
   */
  private generateOutput(
    schema: DatabaseSchema,
    language: string,
    database: DatabaseType
  ): string {
    switch (language) {
      case 'sql':
        return this.generateSQL(schema, database);
      case 'prisma':
        return this.generatePrisma(schema);
      case 'typeorm':
        return this.generateTypeORM(schema);
      default:
        return this.generateSQL(schema, database);
    }
  }

  /**
   * Generate SQL
   */
  private generateSQL(schema: DatabaseSchema, database: DatabaseType): string {
    const lines: string[] = [];

    for (const table of schema.tables) {
      lines.push(`CREATE TABLE ${table.name} (`);

      const columnDefs = table.columns.map((col) =>
        this.generateColumnSQL(col, database)
      );

      if (table.primaryKey) {
        columnDefs.push(
          `  PRIMARY KEY (${table.primaryKey.columns.join(', ')})`
        );
      }

      lines.push(columnDefs.join(',\n'));
      lines.push(');\n');

      // Indexes
      if (table.indexes) {
        for (const index of table.indexes) {
          const unique = index.unique ? 'UNIQUE ' : '';
          lines.push(
            `CREATE ${unique}INDEX ${index.name} ON ${table.name} (${index.columns.join(', ')});\n`
          );
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate column SQL
   */
  private generateColumnSQL(col: Column, database: DatabaseType): string {
    const type = this.mapColumnTypeToSQL(col.type, database);
    const nullable = col.nullable ? '' : ' NOT NULL';
    const defaultVal = col.default ? ` DEFAULT ${col.default}` : '';
    const unique = col.unique ? ' UNIQUE' : '';
    const autoInc = col.autoIncrement ? this.getAutoIncrementSQL(database) : '';

    return `  ${col.name} ${type}${nullable}${defaultVal}${unique}${autoInc}`;
  }

  /**
   * Map column type to SQL type
   */
  private mapColumnTypeToSQL(type: ColumnType, database: DatabaseType): string {
    const mapping: Record<DatabaseType, Record<ColumnType, string>> = {
      postgresql: {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INTEGER',
        bigint: 'BIGINT',
        float: 'REAL',
        double: 'DOUBLE PRECISION',
        decimal: 'DECIMAL',
        boolean: 'BOOLEAN',
        date: 'DATE',
        datetime: 'TIMESTAMP',
        timestamp: 'TIMESTAMP',
        time: 'TIME',
        json: 'JSON',
        jsonb: 'JSONB',
        uuid: 'UUID',
        binary: 'BYTEA',
        enum: 'VARCHAR(50)',
        array: 'ARRAY',
      },
      mysql: {
        string: 'VARCHAR(255)',
        text: 'TEXT',
        integer: 'INT',
        bigint: 'BIGINT',
        float: 'FLOAT',
        double: 'DOUBLE',
        decimal: 'DECIMAL',
        boolean: 'TINYINT(1)',
        date: 'DATE',
        datetime: 'DATETIME',
        timestamp: 'TIMESTAMP',
        time: 'TIME',
        json: 'JSON',
        jsonb: 'JSON',
        uuid: 'CHAR(36)',
        binary: 'BLOB',
        enum: 'ENUM',
        array: 'JSON',
      },
      sqlite: {
        string: 'TEXT',
        text: 'TEXT',
        integer: 'INTEGER',
        bigint: 'INTEGER',
        float: 'REAL',
        double: 'REAL',
        decimal: 'REAL',
        boolean: 'INTEGER',
        date: 'TEXT',
        datetime: 'TEXT',
        timestamp: 'TEXT',
        time: 'TEXT',
        json: 'TEXT',
        jsonb: 'TEXT',
        uuid: 'TEXT',
        binary: 'BLOB',
        enum: 'TEXT',
        array: 'TEXT',
      },
      mongodb: {} as any, // NoSQL - different approach
      mariadb: {} as any, // Similar to MySQL
      mssql: {} as any,
      oracle: {} as any,
    };

    return mapping[database]?.[type] || 'TEXT';
  }

  /**
   * Get auto increment SQL for database
   */
  private getAutoIncrementSQL(database: DatabaseType): string {
    const mapping: Record<DatabaseType, string> = {
      postgresql: ' SERIAL',
      mysql: ' AUTO_INCREMENT',
      sqlite: ' AUTOINCREMENT',
      mongodb: '',
      mariadb: ' AUTO_INCREMENT',
      mssql: ' IDENTITY(1,1)',
      oracle: '',
    };

    return mapping[database] || '';
  }

  /**
   * Generate Prisma schema
   */
  private generatePrisma(schema: DatabaseSchema): string {
    const lines: string[] = [];

    lines.push('// Auto-generated Prisma schema\n');

    for (const table of schema.tables) {
      lines.push(`model ${this.snakeToPascalCase(table.name)} {`);

      for (const col of table.columns) {
        const optional = col.nullable ? '?' : '';
        const prismaType = this.mapColumnTypeToPrisma(col.type);
        const decorators: string[] = [];

        if (col.default) decorators.push(`@default(${col.default})`);
        if (col.unique) decorators.push('@unique');
        if (col.autoIncrement) decorators.push('@default(autoincrement())');

        const decorator = decorators.length > 0 ? ` ${decorators.join(' ')}` : '';
        lines.push(`  ${col.name} ${prismaType}${optional}${decorator}`);
      }

      lines.push('}\n');
    }

    return lines.join('\n');
  }

  /**
   * Map column type to Prisma type
   */
  private mapColumnTypeToPrisma(type: ColumnType): string {
    const mapping: Record<ColumnType, string> = {
      string: 'String',
      text: 'String',
      integer: 'Int',
      bigint: 'BigInt',
      float: 'Float',
      double: 'Float',
      decimal: 'Decimal',
      boolean: 'Boolean',
      date: 'DateTime',
      datetime: 'DateTime',
      timestamp: 'DateTime',
      time: 'DateTime',
      json: 'Json',
      jsonb: 'Json',
      uuid: 'String',
      binary: 'Bytes',
      enum: 'String',
      array: 'String[]',
    };

    return mapping[type] || 'String';
  }

  /**
   * Generate TypeORM entities
   */
  private generateTypeORM(schema: DatabaseSchema): string {
    // Similar to Prisma generation
    return '// TypeORM entities';
  }

  /**
   * Map TypeScript type to column type
   */
  private mapTypeScriptToColumnType(tsType: string): ColumnType {
    const mapping: Record<string, ColumnType> = {
      string: 'string',
      number: 'integer',
      boolean: 'boolean',
      Date: 'datetime',
      'string[]': 'array',
      'number[]': 'array',
    };

    return mapping[tsType] || 'string';
  }

  /**
   * Extract default value from decorator options
   */
  private extractDefault(options: string): any {
    const match = /default:\s*['"]?([^'",}]+)['"]?/.exec(options);
    return match ? match[1] : undefined;
  }

  /**
   * Convert camelCase to snake_case
   */
  private camelToSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`).replace(/^_/, '');
  }

  /**
   * Convert snake_case to PascalCase
   */
  private snakeToPascalCase(str: string): string {
    return str
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }
}
