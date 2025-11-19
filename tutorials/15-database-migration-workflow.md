# Tutorial 15: Database Schema Management & Migration Workflow

Learn how to manage database schemas and migrations safely using Taurus CLI's intelligent database manager with multi-database support.

## 📋 What You'll Learn

- How to generate database schemas from code models
- Creating and managing database migrations
- Comparing schemas to detect changes
- Safe database synchronization strategies
- Rolling back migrations safely
- Multi-database and multi-ORM support
- Best practices for database evolution

## ⏱️ Estimated Time

45-60 minutes

## 🎯 Prerequisites

- Completed [Quick Start Guide](./02-quickstart.md)
- Basic understanding of databases and SQL
- A project using an ORM (TypeORM, Sequelize, Prisma, etc.)
- Database server running (PostgreSQL, MySQL, or SQLite)

## 📚 Table of Contents

1. [Understanding Database Management](#understanding-database-management)
2. [Setting Up Database Manager](#setting-up-database-manager)
3. [Generating Schemas from Models](#generating-schemas-from-models)
4. [Creating Migrations](#creating-migrations)
5. [Comparing and Syncing Schemas](#comparing-and-syncing-schemas)
6. [Running Migrations](#running-migrations)
7. [Rolling Back Changes](#rolling-back-changes)
8. [Advanced Workflows](#advanced-workflows)
9. [CI/CD Integration](#cicd-integration)
10. [Best Practices](#best-practices)

---

## Understanding Database Management

Taurus CLI's Database Manager provides intelligent schema management:

### Key Capabilities

- **Schema Generation**: Generate SQL from TypeORM, Sequelize, Prisma models
- **Migration Creation**: Auto-generate migrations from code changes
- **Schema Comparison**: Detect differences between current and target schemas
- **Safe Migrations**: Transactional migrations with rollback support
- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, MongoDB, MSSQL, Oracle
- **Multi-ORM Support**: TypeORM, Sequelize, Prisma, Mongoose, Knex.js

### Supported Databases

| Database | Support Level | Features |
|----------|--------------|----------|
| PostgreSQL | Full | All features |
| MySQL/MariaDB | Full | All features |
| SQLite | Full | All features |
| MongoDB | Partial | Schema validation only |
| MSSQL | Full | All features |
| Oracle | Full | All features |

### Supported ORMs

- **TypeORM** - Full support with decorators
- **Sequelize** - Model definitions
- **Prisma** - Schema file parsing
- **Mongoose** - MongoDB schemas
- **Knex.js** - Migration support
- **Raw SQL** - Direct SQL migrations

---

## Setting Up Database Manager

### Step 1: Configure in `.taurus/config.json`

```json
{
  "databaseManager": {
    "enabled": true,
    "database": "postgresql",
    "schemaLanguage": "typeorm",
    "migrations": {
      "directory": "./migrations",
      "tableName": "_migrations",
      "generateTimestamp": true,
      "transactional": true,
      "lockTable": true
    },
    "schema": {
      "directory": "./schema",
      "includeViews": true,
      "includeIndexes": true,
      "includeTriggers": false,
      "namingConvention": "snake_case"
    },
    "sync": {
      "enabled": false,
      "safe": true,
      "dropUnused": false,
      "backupBeforeSync": true
    }
  }
}
```

### Step 2: Install ORM Dependencies

**For TypeORM:**

```bash
npm install typeorm pg reflect-metadata
```

**For Sequelize:**

```bash
npm install sequelize pg pg-hstore
```

**For Prisma:**

```bash
npm install prisma @prisma/client
npx prisma init
```

### Step 3: Set Up Database Connection

**Create `.env`:**

```bash
DB_HOST=localhost
DB_PORT=5432
DB_NAME=myapp_dev
DB_USER=postgres
DB_PASSWORD=yourpassword
```

---

## Generating Schemas from Models

### Example: TypeORM Models

**Create `src/models/User.ts`:**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password_hash: string;

  @Column({ nullable: true })
  first_name: string;

  @Column({ nullable: true })
  last_name: string;

  @Column({ default: false })
  email_verified: boolean;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
```

**Create `src/models/Post.ts`:**

```typescript
import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column('text')
  content: string;

  @Column({ default: 'draft' })
  status: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'author_id' })
  author: User;

  @Column()
  author_id: number;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  created_at: Date;
}
```

### Generate Schema from Models

**In Taurus CLI:**

```
Generate a PostgreSQL schema from my TypeORM models in src/models/. Save the output to schema/database.sql
```

**Or programmatically:**

```typescript
import { TaurusDatabaseManager } from 'taurus-cli';

const dbManager = new TaurusDatabaseManager(config.databaseManager);

const result = await dbManager.generateSchema({
  modelPaths: ['./src/models/**/*.ts'],
  outputPath: './schema/database.sql',
  language: 'sql',
  database: 'postgresql'
});

console.log(`Generated schema with ${result.schema.tables.length} tables`);
```

### Generated Schema Output

**`schema/database.sql`:**

```sql
-- Auto-generated schema from TypeORM models
-- Generated: 2025-11-19T10:30:00.000Z

CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX idx_users_email ON users (email);

CREATE TABLE posts (
  id SERIAL PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  status VARCHAR(50) DEFAULT 'draft',
  author_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (author_id) REFERENCES users (id) ON DELETE CASCADE
);

CREATE INDEX idx_posts_author_id ON posts (author_id);
CREATE INDEX idx_posts_status ON posts (status);
```

---

## Creating Migrations

### Auto-Generate Migration from Code Changes

**Scenario:** You add a new field to the User model

**Update `src/models/User.ts`:**

```typescript
@Entity('users')
export class User {
  // ... existing fields ...

  @Column({ nullable: true })
  avatar_url: string;  // NEW FIELD

  @Column({ default: true })
  is_active: boolean;  // NEW FIELD
}
```

**Generate Migration:**

```
I added avatar_url and is_active fields to the User model. Generate a migration to add these columns to the users table.
```

**Generated Migration:**

**`migrations/1700000000000_add_user_fields.ts`:**

```typescript
/**
 * Migration: add_user_fields
 * Generated: 2025-11-19T10:35:00.000Z
 */

export async function up(db: any): Promise<void> {
  await db.query(`
    ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(255),
    ADD COLUMN is_active BOOLEAN DEFAULT true;
  `);
}

export async function down(db: any): Promise<void> {
  await db.query(`
    ALTER TABLE users
    DROP COLUMN IF EXISTS is_active,
    DROP COLUMN IF EXISTS avatar_url;
  `);
}
```

### Manual Migration Creation

**Create Complex Migration:**

```
Create a migration to:
1. Add a 'categories' table with id, name, and slug columns
2. Add a category_id foreign key to posts table
3. Create an index on posts.category_id
4. Populate default category for existing posts
```

**Generated Migration:**

```typescript
/**
 * Migration: add_categories
 * Generated: 2025-11-19T10:40:00.000Z
 */

export async function up(db: any): Promise<void> {
  await db.query(`
    -- Create categories table
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Insert default category
    INSERT INTO categories (name, slug) VALUES ('Uncategorized', 'uncategorized');

    -- Add category_id to posts
    ALTER TABLE posts
    ADD COLUMN category_id INTEGER,
    ADD CONSTRAINT fk_posts_category
      FOREIGN KEY (category_id)
      REFERENCES categories (id)
      ON DELETE SET NULL;

    -- Set default category for existing posts
    UPDATE posts
    SET category_id = (SELECT id FROM categories WHERE slug = 'uncategorized')
    WHERE category_id IS NULL;

    -- Create index
    CREATE INDEX idx_posts_category_id ON posts (category_id);
  `);
}

export async function down(db: any): Promise<void> {
  await db.query(`
    DROP INDEX IF EXISTS idx_posts_category_id;
    ALTER TABLE posts DROP COLUMN IF EXISTS category_id;
    DROP TABLE IF EXISTS categories;
  `);
}
```

---

## Comparing and Syncing Schemas

### Compare Current vs Target Schema

**Scenario:** You want to see what changed between production and your local models

```
Compare my local TypeORM models against the production database schema and show me the differences.
```

**Output:**

```
Schema Comparison Report
========================

Current Schema: Production Database
Target Schema: Local TypeORM Models

Changes Found:

Added: 2 items
  - Table: categories
  - Column: users.avatar_url

Modified: 1 item
  - Column: posts.status
    Before: VARCHAR(50) DEFAULT 'draft'
    After: VARCHAR(50) DEFAULT 'draft' NOT NULL

Removed: 0 items

Unchanged: 12 items

Summary:
The local models have 2 new additions and 1 modification.
A migration is required to sync the database.
```

### Generate Migration from Schema Diff

```
Generate a migration to sync the production database with my local models based on the comparison above.
```

**Generated Migration:**

```typescript
/**
 * Migration: schema_sync
 * Generated: 2025-11-19T10:45:00.000Z
 */

export async function up(db: any): Promise<void> {
  await db.query(`
    -- Add new table
    CREATE TABLE categories (
      id SERIAL PRIMARY KEY,
      name VARCHAR(100) NOT NULL UNIQUE,
      slug VARCHAR(100) NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    -- Add new column
    ALTER TABLE users
    ADD COLUMN avatar_url VARCHAR(255);

    -- Modify existing column
    ALTER TABLE posts
    ALTER COLUMN status SET NOT NULL;
  `);
}

export async function down(db: any): Promise<void> {
  await db.query(`
    ALTER TABLE posts ALTER COLUMN status DROP NOT NULL;
    ALTER TABLE users DROP COLUMN IF EXISTS avatar_url;
    DROP TABLE IF EXISTS categories;
  `);
}
```

---

## Running Migrations

### Check Migration Status

```
Check the status of my database migrations. Show me which migrations have been applied and which are pending.
```

**Output:**

```
Migration Status
================

Applied Migrations:
  ✅ 1699000000000_initial_schema.ts (2025-11-15 14:20:30)
  ✅ 1699100000000_add_user_fields.ts (2025-11-16 09:15:45)

Pending Migrations:
  ⏳ 1700000000000_add_categories.ts
  ⏳ 1700100000000_schema_sync.ts

Database is 2 migrations behind.
```

### Run Pending Migrations

```
Run all pending database migrations in production. Make sure to backup the database first and run migrations in a transaction.
```

**Taurus will:**

1. Create database backup
2. Start transaction
3. Run each migration
4. Verify success
5. Commit transaction
6. Report results

**Output:**

```
Migration Execution
===================

Creating backup...
✅ Backup created: db_backup_2025-11-19_103000.sql

Running migrations in transaction...

⏳ Running: 1700000000000_add_categories.ts
   - Creating categories table
   - Adding category_id to posts
   - Creating indexes
✅ Completed in 0.234s

⏳ Running: 1700100000000_schema_sync.ts
   - Adding users.avatar_url column
   - Modifying posts.status column
✅ Completed in 0.156s

Transaction committed successfully.

Summary:
  Migrations Run: 2
  Duration: 0.390s
  Status: ✅ SUCCESS
```

### Run Specific Migration

```
Run only the add_categories migration without running other pending migrations.
```

---

## Rolling Back Changes

### Rollback Last Migration

```
The last migration caused issues. Roll it back safely.
```

**Output:**

```
Migration Rollback
==================

Rolling back: 1700100000000_schema_sync.ts

Executing down migration...
  - Reverting posts.status column change
  - Dropping users.avatar_url column

✅ Rollback completed successfully

Current migration state:
  Last Applied: 1700000000000_add_categories.ts
  Status: Database rolled back 1 migration
```

### Rollback Multiple Migrations

```
Roll back the last 3 migrations.
```

### Test Rollback First

```
Test the rollback of the last migration without actually executing it. Show me what would happen.
```

**Output:**

```
Rollback Test (Dry Run)
=======================

This rollback would:

1. Drop users.avatar_url column
   WARNING: This will permanently delete data in this column

2. Revert posts.status NOT NULL constraint
   Impact: Posts can now have null status values

3. Drop categories table
   WARNING: This will delete all data in categories table
   WARNING: Foreign key from posts.category_id will be dropped

Affected Rows: ~1,250 posts would lose category assignment

Recommendation:
  Before rolling back, consider:
  - Exporting category data
  - Updating posts to remove category_id references
  - Creating a data migration to preserve information
```

---

## Advanced Workflows

### Schema Versioning

**Track schema versions alongside code:**

```typescript
// migrations/version.ts
export const SCHEMA_VERSION = '2.1.0';

export const CHANGES = {
  '2.1.0': [
    'Added categories table',
    'Added user avatar support',
    'Made post status required'
  ],
  '2.0.0': [
    'Initial production schema',
    'Users and posts tables'
  ]
};
```

### Data Migrations

**Migrate data alongside schema changes:**

```typescript
/**
 * Migration: migrate_user_names
 * Data migration to split full_name into first_name and last_name
 */

export async function up(db: any): Promise<void> {
  // Add new columns
  await db.query(`
    ALTER TABLE users
    ADD COLUMN first_name VARCHAR(100),
    ADD COLUMN last_name VARCHAR(100);
  `);

  // Migrate existing data
  const users = await db.query('SELECT id, full_name FROM users');

  for (const user of users.rows) {
    const names = user.full_name.split(' ');
    const firstName = names[0];
    const lastName = names.slice(1).join(' ');

    await db.query(
      'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
      [firstName, lastName, user.id]
    );
  }

  // Drop old column
  await db.query('ALTER TABLE users DROP COLUMN full_name');
}

export async function down(db: any): Promise<void> {
  // Add back old column
  await db.query('ALTER TABLE users ADD COLUMN full_name VARCHAR(200)');

  // Migrate data back
  const users = await db.query('SELECT id, first_name, last_name FROM users');

  for (const user of users.rows) {
    const fullName = `${user.first_name} ${user.last_name}`.trim();
    await db.query(
      'UPDATE users SET full_name = $1 WHERE id = $2',
      [fullName, user.id]
    );
  }

  // Drop new columns
  await db.query(`
    ALTER TABLE users
    DROP COLUMN first_name,
    DROP COLUMN last_name;
  `);
}
```

### Blue-Green Migrations

**Zero-downtime schema changes:**

```
I need to rename the 'status' column to 'state' in the posts table, but the application is running in production. Generate a blue-green migration strategy with zero downtime.
```

**Generated Strategy:**

```typescript
// Phase 1: Add new column (safe, backward compatible)
export async function up_phase1(db: any): Promise<void> {
  await db.query(`
    ALTER TABLE posts ADD COLUMN state VARCHAR(50) DEFAULT 'draft';

    -- Trigger to keep columns in sync
    CREATE OR REPLACE FUNCTION sync_post_status()
    RETURNS TRIGGER AS $$
    BEGIN
      IF NEW.status IS NOT NULL THEN
        NEW.state = NEW.status;
      END IF;
      IF NEW.state IS NOT NULL THEN
        NEW.status = NEW.state;
      END IF;
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER post_status_sync
    BEFORE INSERT OR UPDATE ON posts
    FOR EACH ROW EXECUTE FUNCTION sync_post_status();
  `);
}

// Phase 2: Migrate existing data
export async function up_phase2(db: any): Promise<void> {
  await db.query(`
    UPDATE posts SET state = status WHERE state IS NULL;
  `);
}

// Phase 3: Drop old column (after application updated)
export async function up_phase3(db: any): Promise<void> {
  await db.query(`
    DROP TRIGGER IF EXISTS post_status_sync ON posts;
    DROP FUNCTION IF EXISTS sync_post_status;
    ALTER TABLE posts DROP COLUMN status;
  `);
}
```

### Multi-Tenancy Migrations

**Run migrations across multiple tenant databases:**

```
I have a multi-tenant application with separate databases per tenant. Run the latest migration across all tenant databases safely.
```

---

## CI/CD Integration

### GitHub Actions Workflow

**`.github/workflows/database.yml`:**

```yaml
name: Database Migrations

on:
  push:
    branches: [main]
    paths:
      - 'migrations/**'
      - 'src/models/**'

jobs:
  test-migrations:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: testpassword
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Test Migrations
        env:
          DB_HOST: localhost
          DB_PORT: 5432
          DB_NAME: test_db
          DB_USER: postgres
          DB_PASSWORD: testpassword
        run: |
          # Run migrations up
          npm run migrate:up

          # Test rollback
          npm run migrate:down

          # Run up again to ensure idempotency
          npm run migrate:up

      - name: Verify Schema
        run: |
          npx taurus --non-interactive << 'EOF'
          Generate schema from TypeORM models and compare it against the current database.
          Fail if there are any differences (schema and migrations are out of sync).
          EOF

  deploy-production:
    runs-on: ubuntu-latest
    needs: test-migrations
    if: github.ref == 'refs/heads/main'

    steps:
      - uses: actions/checkout@v3

      - name: Backup Production Database
        run: |
          # Create backup before migration
          TIMESTAMP=$(date +%Y%m%d_%H%M%S)
          pg_dump $DB_URL > backup_${TIMESTAMP}.sql

      - name: Run Production Migrations
        run: |
          npx taurus --non-interactive << 'EOF'
          Run all pending migrations on the production database.
          Use transactional migrations.
          If any migration fails, rollback the entire transaction.
          EOF

      - name: Verify Production Schema
        run: |
          npx taurus --non-interactive << 'EOF'
          Verify that the production database schema matches the expected schema from our models.
          Alert if there are any discrepancies.
          EOF
```

---

## Best Practices

### 1. Never Modify Existing Migrations

```
❌ DON'T: Edit migration after it's been run in production
✅ DO: Create a new migration to fix issues
```

### 2. Always Test Rollbacks

```
Before deploying a migration to production, test both up and down migrations in staging.
```

### 3. Use Transactional Migrations

```typescript
// All DDL in single transaction
export async function up(db: any): Promise<void> {
  await db.transaction(async (trx) => {
    await trx.query('ALTER TABLE users ADD COLUMN ...');
    await trx.query('CREATE INDEX ...');
    await trx.query('UPDATE users SET ...');
  });
}
```

### 4. Backup Before Migrations

```bash
# Always backup before running migrations
pg_dump $DB_NAME > backup_$(date +%Y%m%d).sql

# Then run migrations
npm run migrate
```

### 5. Keep Migrations Small and Focused

```
❌ DON'T: One massive migration with 50 changes
✅ DO: Multiple focused migrations, each doing one thing
```

### 6. Document Complex Migrations

```typescript
/**
 * Migration: refactor_user_permissions
 *
 * BREAKING CHANGE: This migration restructures the permissions system
 *
 * Before running:
 * 1. Export current permissions: SELECT * FROM user_permissions
 * 2. Notify users of downtime window
 * 3. Deploy new application code first
 *
 * This migration:
 * 1. Creates new role-based permissions table
 * 2. Migrates existing permissions to new structure
 * 3. Drops old permissions table
 *
 * Rollback plan:
 * 1. Run down migration
 * 2. Restore from backup if data corruption
 * 3. Revert application code
 *
 * Estimated downtime: 5-10 minutes
 */
```

### 7. Use Naming Conventions

```
Good migration names:
  ✅ 20231119_create_users_table.ts
  ✅ 20231119_add_email_verification.ts
  ✅ 20231119_index_posts_by_category.ts

Bad migration names:
  ❌ migration1.ts
  ❌ fix.ts
  ❌ update.ts
```

---

## Common Pitfalls

### ❌ Pitfall 1: Auto-Sync in Production

**Problem:** Enabling `sync: { enabled: true }` in production

**Why it's dangerous:** Can drop tables and lose data

**Solution:** Never enable auto-sync in production. Always use migrations.

### ❌ Pitfall 2: Not Testing Rollbacks

**Problem:** Deploying migrations without testing the down migration

**Why it's dangerous:** If something goes wrong, you can't rollback

**Solution:** Always test both up and down migrations in staging first.

### ❌ Pitfall 3: Dropping Columns with Data

**Problem:**
```sql
ALTER TABLE users DROP COLUMN phone_number;
```

**Why it's dangerous:** Permanently deletes data

**Solution:** Use a multi-phase migration:
1. Mark column as deprecated
2. Update application to stop using it
3. After monitoring, drop the column

### ❌ Pitfall 4: Ignoring Migration Order

**Problem:** Running migrations out of order

**Solution:** Use timestamp-based naming: `YYYYMMDDHHMMSS_name.ts`

---

## Next Steps

Congratulations! You've completed all Phase 4 tutorials. You now know how to:

- ✅ Generate comprehensive test suites
- ✅ Scan for security vulnerabilities
- ✅ Manage database schemas and migrations

### Continue Learning:

1. **Practice**: Apply these workflows to your projects
2. **Automate**: Set up CI/CD pipelines
3. **Review**: Go back to earlier tutorials as needed
4. **Explore**: Check out the [main documentation](../README.md)

---

**Need help?** See the [Troubleshooting Guide](./README.md#-getting-help) or ask in [Discussions](https://github.com/az9713/taurus-cli/discussions)
