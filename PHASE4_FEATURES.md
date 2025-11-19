# Phase 4 Features Documentation

This document provides comprehensive documentation for the three major Phase 4 features implemented in Taurus CLI.

## Table of Contents

1. [Feature 8: Test Generation & Coverage Analysis](#feature-8-test-generation--coverage-analysis)
2. [Feature 10: Security Vulnerability Scanner](#feature-10-security-vulnerability-scanner)
3. [Feature 12: Database Schema Manager & Migration Tool](#feature-12-database-schema-manager--migration-tool)
4. [Configuration Examples](#configuration-examples)
5. [Best Practices](#best-practices)
6. [Troubleshooting](#troubleshooting)

---

## Feature 8: Test Generation & Coverage Analysis

Automatically generate comprehensive test suites with AI-powered test case generation and detailed coverage analysis.

### Overview

The Test Generator analyzes your code to identify testable elements (functions, classes, methods, components) and generates complete test suites with mocks, fixtures, and assertions. It supports multiple testing frameworks and provides detailed coverage reports.

### Key Capabilities

- **Automatic Test Generation**: Generate unit, integration, E2E, and other test types
- **Multi-Framework Support**: Jest, Mocha, Vitest, Pytest, JUnit, and more
- **Coverage Analysis**: Track statement, branch, function, and line coverage
- **Quality Scoring**: Analyze test quality with actionable recommendations
- **Gap Detection**: Identify untested code and suggest missing tests
- **Mock Generation**: Automatically generate mocks for dependencies

### Supported Testing Frameworks

- **JavaScript/TypeScript**: Jest, Mocha, Vitest
- **Python**: Pytest, unittest
- **Java**: JUnit, TestNG
- **Go**: go-test
- **Rust**: rust-test
- **Ruby**: RSpec

### Configuration

```typescript
{
  testGenerator: {
    enabled: true,
    framework: 'jest',
    testTypes: ['unit', 'integration', 'e2e'],
    coverage: {
      enabled: true,
      threshold: {
        statements: 80,
        branches: 75,
        functions: 85,
        lines: 80
      },
      reportFormats: ['text', 'html', 'json', 'lcov'],
      includeUntested: true,
      trackBranches: true
    },
    generation: {
      generateMocks: true,
      generateFixtures: true,
      generateHelpers: true,
      edgeCases: true,
      errorCases: true,
      asyncTests: true
    },
    quality: {
      minAssertions: 3,
      requireDescriptions: true,
      isolateTests: true,
      deterministicTests: true
    }
  }
}
```

### Programmatic Usage

#### Generate Tests for a File

```typescript
import { TaurusTestGeneratorManager } from 'taurus-cli';

const testGenerator = new TaurusTestGeneratorManager(config, claudeClient);

const result = await testGenerator.generateTests({
  sourceFile: './src/utils/calculator.ts',
  framework: 'jest',
  testTypes: ['unit'],
  options: {
    includeSetup: true,
    includeTeardown: true,
    mockExternal: true,
    coverageTarget: 90
  }
});

console.log(`Generated ${result.testCases.length} test cases`);
console.log(`Test file: ${result.testFile}`);
console.log(`Expected coverage: ${result.coverage.functions}%`);
```

#### Analyze Coverage

```typescript
const coverage = await testGenerator.analyzeCoverage({
  sourceFiles: ['./src/**/*.ts'],
  testFiles: ['./tests/**/*.test.ts'],
  framework: 'jest',
  options: {
    runTests: true,
    includeReport: true,
    reportFormat: ['html', 'json'],
    outputDir: './coverage'
  }
});

console.log(`Overall coverage: ${coverage.overall.lines.percentage}%`);
console.log(`Coverage gaps: ${coverage.gaps.length}`);
```

#### Analyze Test Quality

```typescript
const quality = await testGenerator.analyzeTestQuality([
  './tests/**/*.test.ts'
]);

console.log(`Test quality score: ${quality.score}/100`);
console.log(`Issues found: ${quality.issues.length}`);
console.log(`Recommendations:`, quality.recommendations);
```

#### Suggest Missing Tests

```typescript
const gaps = await testGenerator.suggestMissingTests('./src/auth/auth.ts');

for (const gap of gaps) {
  console.log(`${gap.severity}: ${gap.reason}`);
  console.log(`Suggested tests:`, gap.suggestedTests);
}
```

### CLI Usage

```bash
# Generate tests for a file
taurus test generate --file src/calculator.ts --framework jest

# Analyze coverage
taurus test coverage --source "src/**/*.ts" --tests "tests/**/*.test.ts"

# Check test quality
taurus test quality --tests "tests/**/*.test.ts"

# Find missing tests
taurus test gaps --file src/auth.ts
```

### Example Generated Test

```typescript
import { Calculator } from '../src/calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  test('should add two positive numbers correctly', () => {
    const result = calculator.add(5, 3);
    expect(result).toBe(8);
  });

  test('should handle negative numbers in addition', () => {
    const result = calculator.add(-5, 3);
    expect(result).toBe(-2);
  });

  test('should throw error for invalid inputs', () => {
    expect(() => calculator.add(NaN, 5)).toThrow('Invalid input');
  });

  test('should handle edge case: zero addition', () => {
    const result = calculator.add(0, 0);
    expect(result).toBe(0);
  });
});
```

### Coverage Report Example

```
Test Coverage Report
===================

Overall Coverage:
  Statements: 85.42% (164/192)
  Branches:   78.33% (47/60)
  Functions:  90.00% (27/30)
  Lines:      84.21% (160/190)

Coverage by File:
  calculator.ts:
    Functions: 100.00%
    Lines:     95.24%

  auth.ts:
    Functions: 75.00%
    Lines:     80.00%
    Uncovered: login, validateToken
```

---

## Feature 10: Security Vulnerability Scanner

Comprehensive security scanning with static analysis, dependency checking, and secret detection using OWASP standards.

### Overview

The Security Scanner performs multiple types of security analysis to identify vulnerabilities, insecure code patterns, exposed secrets, and vulnerable dependencies. It provides detailed remediation advice and integrates with CI/CD pipelines.

### Key Capabilities

- **Static Code Analysis**: Detect SQL injection, XSS, command injection, and more
- **Dependency Scanning**: Find vulnerabilities in npm packages and dependencies
- **Secret Detection**: Identify hardcoded passwords, API keys, and tokens
- **OWASP Top 10**: Coverage for all OWASP Top 10 vulnerabilities
- **Multi-Format Reports**: JSON, HTML, Markdown, SARIF, CSV
- **Remediation Guidance**: Step-by-step fixes for each vulnerability

### Vulnerability Types Detected

**Injection Attacks:**
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- XML External Entities (XXE)
- LDAP Injection

**Authentication & Access:**
- Broken Authentication
- Broken Access Control
- CSRF (Cross-Site Request Forgery)
- Insecure Session Management

**Data Security:**
- Sensitive Data Exposure
- Hardcoded Secrets
- Weak Cryptography
- Insecure Deserialization

**Other Vulnerabilities:**
- Path Traversal
- Open Redirects
- Security Misconfiguration
- Server-Side Request Forgery (SSRF)

### Configuration

```typescript
{
  securityScanner: {
    enabled: true,
    scanTypes: [
      'static-analysis',
      'dependency-scan',
      'secret-detection',
      'configuration-audit',
      'best-practices'
    ],
    severity: {
      minimum: 'medium',
      failOnSeverity: ['critical', 'high']
    },
    staticAnalysis: {
      enabled: true,
      rules: [
        'sql-injection',
        'xss',
        'command-injection',
        'hardcoded-secrets',
        'weak-crypto',
        'broken-access-control'
      ],
      customRules: ['./custom-security-rules.json'],
      excludePatterns: ['node_modules/**', 'dist/**', '**/*.test.ts']
    },
    dependencyScanning: {
      enabled: true,
      sources: ['npm-audit', 'github-advisory'],
      autoUpdate: false,
      excludePackages: ['legacy-package']
    },
    secretDetection: {
      enabled: true,
      patterns: [
        'aws-key',
        'github-token',
        'stripe-key',
        'generic-api-key',
        'private-key',
        'password'
      ],
      excludeFiles: ['**/*.test.ts', '**/*.example.*']
    },
    reporting: {
      formats: ['json', 'html', 'markdown'],
      outputDir: './security-reports',
      includeRemediation: true,
      groupBy: 'severity'
    }
  }
}
```

### Programmatic Usage

#### Perform Complete Security Scan

```typescript
import { TaurusSecurityScannerManager } from 'taurus-cli';

const scanner = new TaurusSecurityScannerManager(config);

const result = await scanner.scan({
  paths: ['./src'],
  scanTypes: ['static-analysis', 'dependency-scan', 'secret-detection'],
  options: {
    includeTests: false,
    severity: 'medium',
    failFast: false
  }
});

console.log(`Total issues: ${result.summary.totalIssues}`);
console.log(`Critical: ${result.summary.bySeverity.critical}`);
console.log(`High: ${result.summary.bySeverity.high}`);
console.log(`Status: ${result.summary.passed ? 'PASSED' : 'FAILED'}`);
```

#### Scan Single File

```typescript
const vulnerabilities = await scanner.scanFile('./src/auth/login.ts');

for (const vuln of vulnerabilities) {
  console.log(`[${vuln.severity}] ${vuln.title}`);
  console.log(`Location: ${vuln.file}:${vuln.location.startLine}`);
  console.log(`Description: ${vuln.description}`);
  console.log(`Remediation: ${vuln.remediation.description}`);
  console.log('---');
}
```

#### Scan Dependencies

```typescript
const depVulns = await scanner.scanDependencies();

for (const dep of depVulns) {
  console.log(`${dep.package}@${dep.version}`);
  console.log(`Vulnerability: ${dep.vulnerability.title}`);
  console.log(`Severity: ${dep.vulnerability.severity}`);
  if (dep.fixedIn) {
    console.log(`Fix: Update to ${dep.fixedIn}`);
  }
}
```

#### Detect Secrets

```typescript
const secrets = await scanner.detectSecrets(['./src', './config']);

for (const secret of secrets) {
  console.log(`[${secret.severity}] ${secret.type} found`);
  console.log(`File: ${secret.file}:${secret.line}`);
  console.log(`Masked: ${secret.masked}`);
  console.log(`Remediation: ${secret.remediation}`);
}
```

#### Perform Security Audit

```typescript
const audit = await scanner.auditSecurity();

console.log(`Security Score: ${audit.score}/100`);
console.log(`Status: ${audit.passed ? 'PASSED' : 'FAILED'}`);
console.log(`Checks passed: ${audit.checks.filter(c => c.passed).length}/${audit.checks.length}`);
```

### CLI Usage

```bash
# Full security scan
taurus security scan --path ./src --all

# Scan for specific vulnerabilities
taurus security scan --path ./src --type static-analysis

# Scan dependencies
taurus security scan --type dependency-scan

# Detect secrets
taurus security scan --type secret-detection --path .

# Generate security report
taurus security scan --path ./src --report html --output ./security-reports

# Run security audit
taurus security audit
```

### Example Vulnerability Report

```
Security Scan Report
===================

Summary:
- Total Issues: 8
- Critical: 2
- High: 3
- Medium: 2
- Low: 1
- Status: ❌ FAILED

Critical Vulnerabilities:

1. SQL Injection via String Concatenation
   Severity: CRITICAL
   File: src/database/users.ts:45
   Description: SQL query constructed using string concatenation with user input
   OWASP: A03-Injection
   CWE: CWE-89

   Remediation:
   - Replace string concatenation with parameterized queries
   - Use ORM or query builder with parameterization
   - Validate and sanitize all user inputs
   - Apply principle of least privilege to database user

   References:
   - https://owasp.org/www-community/vulnerabilities/sql-injection
   - https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet

2. Hardcoded AWS Access Key
   Severity: CRITICAL
   File: src/config/aws.ts:12
   Masked: AKIA***************ER45

   Remediation:
   - Immediately rotate this AWS access key
   - Store in environment variables or AWS Secrets Manager
   - Add pre-commit hooks to prevent secret commits
   - Scan git history for exposed credentials

Dependency Vulnerabilities:

1. lodash@4.17.15
   Vulnerability: Prototype Pollution
   Severity: HIGH
   CVE: CVE-2020-8203
   CVSS: 7.4
   Fix Available: Update to 4.17.21

   Remediation: Run `npm install lodash@4.17.21`

Recommendations:
1. [CRITICAL] Fix 2 critical vulnerabilities immediately
2. [HIGH] Update 3 vulnerable dependencies
3. [HIGH] Remove 5 hardcoded secrets from source code
4. [MEDIUM] Implement CSRF token validation for state-changing operations
```

---

## Feature 12: Database Schema Manager & Migration Tool

Intelligent database schema management with automatic migration generation, schema comparison, and multi-database support.

### Overview

The Database Manager analyzes your code models (TypeORM, Sequelize, Prisma, etc.) to generate database schemas and migrations. It compares schemas to detect changes and generates migration scripts automatically.

### Key Capabilities

- **Schema Generation**: Generate SQL, Prisma, TypeORM schemas from code models
- **Migration Generation**: Auto-generate migration scripts from code changes
- **Schema Comparison**: Compare schemas and identify differences
- **Multi-Database Support**: PostgreSQL, MySQL, SQLite, MongoDB, and more
- **Rollback Support**: Generate rollback scripts for all migrations
- **Safe Sync**: Optionally sync schemas with safety checks

### Supported Databases

- PostgreSQL
- MySQL / MariaDB
- SQLite
- MongoDB
- Microsoft SQL Server
- Oracle

### Supported ORMs

- TypeORM
- Sequelize
- Prisma
- Mongoose
- Knex.js
- Raw SQL

### Configuration

```typescript
{
  databaseManager: {
    enabled: true,
    database: 'postgresql',
    schemaLanguage: 'typeorm',
    migrations: {
      directory: './migrations',
      tableName: '_migrations',
      generateTimestamp: true,
      transactional: true,
      lockTable: true
    },
    schema: {
      directory: './schema',
      includeViews: true,
      includeIndexes: true,
      includeTriggers: false,
      namingConvention: 'snake_case'
    },
    sync: {
      enabled: false,  // Only enable in development!
      safe: true,
      dropUnused: false,
      backupBeforeSync: true
    }
  }
}
```

### Programmatic Usage

#### Generate Schema from Code Models

```typescript
import { TaurusDatabaseManager } from 'taurus-cli';

const dbManager = new TaurusDatabaseManager(config);

const schemaResult = await dbManager.generateSchema({
  modelPaths: ['./src/models/**/*.ts'],
  outputPath: './schema/schema.sql',
  language: 'sql',
  database: 'postgresql'
});

console.log(`Generated schema with ${schemaResult.schema.tables.length} tables`);
console.log(`Output: ${schemaResult.output}`);
```

#### Generate Migration

```typescript
const migrationResult = await dbManager.generateMigration({
  name: 'add_user_table',
  operations: [
    {
      type: 'create-table',
      table: 'users',
    },
    {
      type: 'add-column',
      table: 'users',
      column: {
        name: 'email',
        type: 'string',
        nullable: false,
        unique: true
      }
    },
    {
      type: 'add-index',
      table: 'users',
      index: {
        name: 'idx_users_email',
        table: 'users',
        columns: ['email'],
        unique: true
      }
    }
  ]
});

console.log(`Migration created: ${migrationResult.filePath}`);
console.log(`Migration ID: ${migrationResult.migration.id}`);
```

#### Compare Schemas

```typescript
const comparison = await dbManager.compareSchemas({
  source: currentSchema,
  target: newSchema,
  ignoreComments: true,
  ignoreIndexes: false
});

if (!comparison.equal) {
  console.log(`Found ${comparison.diff.added.length} additions`);
  console.log(`Found ${comparison.diff.modified.length} modifications`);
  console.log(`Found ${comparison.diff.removed.length} deletions`);

  // Auto-generate migration from diff
  const migrations = comparison.migrations;
  console.log(`Generated ${migrations.length} migration(s)`);
}

console.log(comparison.report);
```

#### Execute Migrations

```typescript
const result = await dbManager.executeMigrations([
  'migrations/1234567890_create_users.ts',
  'migrations/1234567891_add_posts.ts'
]);

if (result.success) {
  console.log(`Ran ${result.migrationsRun.length} migrations successfully`);
} else {
  console.error(`Migration failed:`, result.errors);
}
```

#### Rollback Migrations

```typescript
const rollback = await dbManager.rollback(2); // Rollback last 2 migrations

if (rollback.success) {
  console.log(`Rolled back: ${rollback.migrationsRolledBack.join(', ')}`);
} else {
  console.error(`Rollback failed:`, rollback.errors);
}
```

### CLI Usage

```bash
# Generate schema from models
taurus db schema generate --models "src/models/**/*.ts" --output schema.sql

# Generate migration
taurus db migration generate --name add_user_table

# Compare schemas
taurus db schema compare --source current.sql --target new.sql

# Run migrations
taurus db migrate up

# Rollback migrations
taurus db migrate down --steps 1

# Check migration status
taurus db migrate status

# Sync schema (development only!)
taurus db schema sync --safe
```

### Example Generated Migration

```typescript
/**
 * Migration: add_user_table
 * Generated: 2025-11-19T10:30:00.000Z
 */

export async function up(db: any): Promise<void> {
  await db.query(`
    CREATE TABLE users (
      id SERIAL PRIMARY KEY,
      email VARCHAR(255) NOT NULL UNIQUE,
      password_hash VARCHAR(255) NOT NULL,
      first_name VARCHAR(100),
      last_name VARCHAR(100),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE UNIQUE INDEX idx_users_email ON users (email);

    CREATE INDEX idx_users_created_at ON users (created_at);
  `);
}

export async function down(db: any): Promise<void> {
  await db.query(`
    DROP INDEX IF EXISTS idx_users_created_at;
    DROP INDEX IF EXISTS idx_users_email;
    DROP TABLE IF EXISTS users;
  `);
}
```

### Example Schema Comparison Report

```
Schema Comparison Report
========================

Added: 2
Modified: 1
Removed: 0
Unchanged: 5

Added Items:
  - Table posts added
  - Column users.avatar_url added

Modified Items:
  - Column users.email modified (added unique constraint)

Changes will require 1 migration to sync schemas.
```

---

## Configuration Examples

### Minimal Configuration

```typescript
// .taurus/config.json
{
  "testGenerator": {
    "enabled": true,
    "framework": "jest",
    "testTypes": ["unit"]
  },
  "securityScanner": {
    "enabled": true,
    "scanTypes": ["static-analysis", "secret-detection"]
  },
  "databaseManager": {
    "enabled": true,
    "database": "postgresql",
    "schemaLanguage": "typeorm"
  }
}
```

### Production Configuration

```typescript
// .taurus/config.json
{
  "testGenerator": {
    "enabled": true,
    "framework": "jest",
    "testTypes": ["unit", "integration", "e2e"],
    "coverage": {
      "enabled": true,
      "threshold": {
        "statements": 85,
        "branches": 80,
        "functions": 90,
        "lines": 85
      },
      "reportFormats": ["html", "json", "lcov"],
      "includeUntested": true,
      "trackBranches": true
    },
    "generation": {
      "generateMocks": true,
      "generateFixtures": true,
      "edgeCases": true,
      "errorCases": true,
      "asyncTests": true
    },
    "quality": {
      "minAssertions": 3,
      "requireDescriptions": true,
      "isolateTests": true
    }
  },
  "securityScanner": {
    "enabled": true,
    "scanTypes": [
      "static-analysis",
      "dependency-scan",
      "secret-detection",
      "best-practices"
    ],
    "severity": {
      "minimum": "low",
      "failOnSeverity": ["critical", "high"]
    },
    "staticAnalysis": {
      "enabled": true,
      "rules": [],  // Empty = all rules
      "excludePatterns": ["node_modules/**", "dist/**"]
    },
    "dependencyScanning": {
      "enabled": true,
      "sources": ["npm-audit", "github-advisory"],
      "autoUpdate": false
    },
    "secretDetection": {
      "enabled": true,
      "patterns": [],  // Empty = all patterns
      "excludeFiles": ["**/*.test.ts", "**/*.example.*"]
    },
    "reporting": {
      "formats": ["json", "html", "markdown", "sarif"],
      "outputDir": "./security-reports",
      "includeRemediation": true,
      "groupBy": "severity"
    }
  },
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

---

## Best Practices

### Test Generation

1. **Start Small**: Generate tests for small, focused modules first
2. **Review Generated Tests**: Always review AI-generated tests before committing
3. **Customize Templates**: Create custom test templates for your project patterns
4. **Set Realistic Targets**: Aim for 80% coverage, not 100%
5. **Test Quality Over Quantity**: Focus on meaningful tests, not just coverage numbers
6. **Use Type Safety**: Leverage TypeScript for better test reliability
7. **Mock External Dependencies**: Isolate unit tests from external services
8. **Test Edge Cases**: Ensure generated tests cover boundary conditions

### Security Scanning

1. **Run Early and Often**: Integrate security scans into your CI/CD pipeline
2. **Fix Critical Issues First**: Prioritize by severity (Critical > High > Medium)
3. **Rotate Exposed Secrets**: Immediately rotate any found credentials
4. **Keep Dependencies Updated**: Regularly update to patched versions
5. **Use Safe Defaults**: Configure to fail builds on critical/high severity
6. **Review Custom Rules**: Tailor rules to your application's security needs
7. **Document Exceptions**: If you suppress findings, document why
8. **Regular Audits**: Run full security audits monthly

### Database Management

1. **Never Auto-Sync in Production**: Disable sync in production environments
2. **Review Migrations**: Always review generated migrations before running
3. **Test Migrations**: Test migrations in staging before production
4. **Backup First**: Always backup before running migrations
5. **Use Transactions**: Keep transactional migrations enabled
6. **Version Control**: Commit all migration files to version control
7. **Naming Convention**: Use descriptive migration names (not just timestamps)
8. **Rollback Testing**: Test rollback scripts before deploying

---

## Troubleshooting

### Test Generator Issues

**Problem**: Generated tests fail to compile
- **Solution**: Check that your tsconfig includes test files, ensure all imports are correct

**Problem**: Low coverage despite many tests
- **Solution**: Check for untested branches and edge cases, use coverage report to identify gaps

**Problem**: Tests are flaky
- **Solution**: Ensure tests are isolated, avoid shared state, use proper async/await

### Security Scanner Issues

**Problem**: Too many false positives
- **Solution**: Tune severity threshold, add exclusion patterns, customize rules

**Problem**: Secrets detected in test files
- **Solution**: Add test files to excludeFiles pattern, use example values in tests

**Problem**: npm audit fails
- **Solution**: Ensure package.json exists, run npm install first, check network connection

### Database Manager Issues

**Problem**: Migration generation fails
- **Solution**: Ensure models are properly annotated, check database connection

**Problem**: Schema comparison shows unexpected differences
- **Solution**: Check naming convention settings, verify database type matches

**Problem**: Migration execution fails
- **Solution**: Check database permissions, ensure transactional mode is appropriate, review SQL syntax

---

## Integration with CI/CD

### GitHub Actions Example

```yaml
name: Phase 4 Checks

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      # Generate tests
      - name: Generate Tests
        run: npx taurus test generate --all

      # Run tests with coverage
      - name: Run Tests
        run: npm test -- --coverage

      # Check coverage threshold
      - name: Coverage Check
        run: npx taurus test coverage --threshold 80

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      # Run security scan
      - name: Security Scan
        run: npx taurus security scan --all --fail-on critical high

      # Upload SARIF to GitHub
      - name: Upload SARIF
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: security-reports/scan.sarif

  database:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3

      # Check for pending migrations
      - name: Migration Check
        run: npx taurus db migrate status

      # Validate schema
      - name: Schema Validation
        run: npx taurus db schema validate
```

---

## Performance Tips

### Test Generator
- Use `quick` quality mode for faster generation during development
- Generate tests in parallel for multiple files
- Cache coverage reports for faster subsequent runs

### Security Scanner
- Exclude large directories (node_modules, dist) from scans
- Run dependency scans separately from static analysis
- Use specific scan types instead of `--all` when possible

### Database Manager
- Use schema comparison before generating migrations
- Keep model files organized for faster parsing
- Run migrations in batches with proper error handling

---

## Conclusion

Phase 4 features provide enterprise-grade testing, security, and database management capabilities. These tools work together to create a comprehensive development and security workflow:

1. **Test Generator** ensures code quality and coverage
2. **Security Scanner** identifies vulnerabilities early
3. **Database Manager** handles schema evolution safely

For additional support or questions, please refer to the main Taurus CLI documentation or open an issue on GitHub.
