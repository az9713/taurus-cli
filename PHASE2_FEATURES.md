# Phase 2 Features Documentation

This document covers the three major Phase 2 features implemented in Taurus CLI.

## Table of Contents

- [Feature 2: Smart Code Generation from Specs](#feature-2-smart-code-generation-from-specs)
- [Feature 4: Local Development Environment Orchestrator](#feature-4-local-development-environment-orchestrator)
- [Feature 5: AI Knowledge Base from Codebase](#feature-5-ai-knowledge-base-from-codebase)

---

## Feature 2: Smart Code Generation from Specs

AI-powered code generation from natural language specifications with support for multiple languages, testing, and validation.

### Overview

Generate production-ready code from natural language descriptions in TypeScript, JavaScript, Python, Java, Go, Rust, and more. Automatically creates tests, documentation, and validates syntax.

### Configuration

```yaml
codeGeneration:
  enabled: true
  defaultLanguage: typescript
  quality: balanced  # fast, balanced, or thorough
  templates:
    enabled: true
    customTemplatesPath: ./templates
  validation:
    syntaxCheck: true
    linting: true
    typeChecking: true
  testing:
    generateTests: true
    testFramework: jest
    coverageTarget: 80
  documentation:
    generateDocs: true
    docStyle: jsdoc
```

### Usage Examples

#### CLI Usage

```bash
# Generate code from spec file
taurus generate spec.txt --language typescript

# Generate with tests
taurus generate spec.txt --with-tests

# Generate using template
taurus generate --template typescript-class --name UserService
```

#### Programmatic Usage

```typescript
import { GenerationManager } from 'taurus-cli';

const manager = new GenerationManager(config, client);

// Generate from specification text
const specText = `
Name: UserRepository
Language: TypeScript
Pattern: class

Requirements:
- Create user in database
- Find user by ID
- Update user information
- Delete user
`;

const result = await manager.generateFromText(specText);
console.log('Generated code:', result.generated[0].code);
console.log('Generated tests:', result.generated[0].tests);
```

### Supported Languages

- TypeScript/JavaScript
- Python
- Java
- Go
- Rust
- C#
- Ruby
- PHP

### Templates

Built-in templates available:
- `typescript-class`: TypeScript class with properties and methods
- `typescript-function`: Standalone TypeScript function
- `python-class`: Python class with initialization
- `express-endpoint`: Express.js API endpoint

Create custom templates:

```json
{
  "name": "my-template",
  "language": "typescript",
  "pattern": "function",
  "template": "export function {{functionName}}() { ... }",
  "variables": [
    { "name": "functionName", "type": "string", "required": true }
  ]
}
```

---

## Feature 4: Local Development Environment Orchestrator

Automated setup and management of local development environments using Docker containers.

### Overview

Orchestrate databases, caches, message queues, and services for local development. Automatically handles dependencies, health checks, and service lifecycle.

### Configuration

```yaml
devEnvironment:
  enabled: true
  projectName: my-app
  autoStart: true
  services:
    - name: postgres
      type: database
      image: postgres:15-alpine
      ports:
        - host: 5432
          container: 5432
      environment:
        POSTGRES_DB: myapp
        POSTGRES_USER: admin
        POSTGRES_PASSWORD: secret
      volumes:
        - postgres-data:/var/lib/postgresql/data

    - name: redis
      type: cache
      image: redis:7-alpine
      ports:
        - host: 6379
          container: 6379
      depends_on:
        - postgres

  healthCheck:
    enabled: true
    interval: 10000
    timeout: 5000
    retries: 3
```

### Usage Examples

#### CLI Usage

```bash
# Start environment
taurus env start

# Stop environment
taurus env stop

# Get status
taurus env status

# View logs
taurus env logs postgres

# Execute command in service
taurus env exec postgres psql -U admin -d myapp
```

#### Programmatic Usage

```typescript
import { EnvironmentOrchestrator, DatabaseConfigurator } from 'taurus-cli';

const orchestrator = new EnvironmentOrchestrator(config);

// Start environment
await orchestrator.start();

// Create database from template
const dbConfig = configurator.createDatabaseService(
  'postgres',
  'postgresql',
  { database: 'myapp', port: 5432 }
);

// Get connection info
const connection = configurator.getConnectionInfo(dbConfig, 'postgresql');
const connectionString = configurator.generateConnectionString(connection);
```

### Built-in Service Templates

- **Databases**: PostgreSQL, MySQL, MongoDB, Redis, Elasticsearch
- **Message Queues**: RabbitMQ, Kafka
- **Web Servers**: Nginx
- **Storage**: MinIO (S3-compatible)
- **Development Tools**: MailHog, LocalStack, Grafana, Prometheus, Jaeger

### Database Quick Start

```typescript
import { DatabaseConfigurator } from 'taurus-cli';

const configurator = new DatabaseConfigurator();

// PostgreSQL
const pgConfig = configurator.createDatabaseService('postgres', 'postgresql', {
  port: 5432,
  database: 'myapp',
  username: 'admin',
  password: 'secret',
  persistent: true
});

// MongoDB
const mongoConfig = configurator.createDatabaseService('mongo', 'mongodb', {
  port: 27017,
  database: 'myapp'
});

// Connection strings
const pgConnection = configurator.getConnectionInfo(pgConfig, 'postgresql');
// postgresql://admin:secret@localhost:5432/myapp
```

---

## Feature 5: AI Knowledge Base from Codebase

Build a searchable, AI-powered knowledge base from your codebase for semantic search and Q&A.

### Overview

Automatically index your codebase, enable semantic search, answer questions about code, find similar implementations, and detect patterns.

### Configuration

```yaml
knowledgeBase:
  enabled: true
  indexPath: ./.taurus/index
  embeddingProvider: anthropic
  chunkSize: 500
  chunkOverlap: 50
  maxResults: 10
  similarityThreshold: 0.5
  indexing:
    includePatterns:
      - '**/*.ts'
      - '**/*.js'
      - '**/*.py'
    excludePatterns:
      - '**/node_modules/**'
      - '**/dist/**'
      - '**/.git/**'
    languages:
      - typescript
      - javascript
      - python
    parseComments: true
    parseDocstrings: true
```

### Usage Examples

#### CLI Usage

```bash
# Build index
taurus kb index

# Search codebase
taurus kb search "user authentication"

# Ask a question
taurus kb ask "How does the authentication system work?"

# Find similar code
taurus kb similar --file src/auth.ts --function login

# Find usage examples
taurus kb usage AuthService

# Detect patterns
taurus kb patterns

# Find documentation gaps
taurus kb doc-gaps
```

#### Programmatic Usage

```typescript
import { KnowledgeBaseManager } from 'taurus-cli';

const kb = new KnowledgeBaseManager(config, client);

// Initialize (builds or loads index)
await kb.initialize();

// Search codebase
const results = await kb.search({
  query: 'user authentication',
  type: 'hybrid',  // semantic, keyword, or hybrid
  maxResults: 10
});

// Ask questions
const answer = await kb.ask(
  'How is user authentication implemented?',
  ['Check JWT tokens', 'Look at middleware']
);

console.log(answer.text);
console.log('Confidence:', answer.confidence);
console.log('Sources:', answer.sources);

// Find similar code
const similar = await kb.findSimilar(codeSnippet);

// Explain code
const explanation = await kb.explainCode(code, 'typescript');

// Suggest improvements
const suggestions = await kb.suggestImprovements(code, 'typescript');

// Find usage examples
const usage = await kb.findUsageExamples('createUser');

// Analyze codebase
const patterns = await kb.detectPatterns();
const insights = await kb.analyzeInsights();
const gaps = await kb.findDocumentationGaps();

// Get statistics
const stats = kb.getStatistics();
```

### Search Types

- **Semantic**: Uses AI embeddings to find conceptually similar code
- **Keyword**: Traditional text matching on function/class names
- **Hybrid**: Combines both for best results

### Advanced Features

#### Pattern Detection

Automatically detects design patterns in your code:
- Singleton Pattern
- Factory Pattern
- Observer Pattern
- And more...

#### Codebase Insights

Analyzes code quality metrics:
- Complexity analysis
- Coupling detection
- Cohesion measurement
- Duplication detection

#### Documentation Gaps

Finds public APIs without documentation:

```typescript
const gaps = await kb.findDocumentationGaps();

gaps.forEach(gap => {
  console.log(`${gap.element.name} (${gap.severity})`);
  console.log(`  Reason: ${gap.reason}`);
  console.log(`  Suggestion: ${gap.suggestion}`);
});
```

#### Knowledge Graph

Visualize code relationships:

```typescript
const graph = kb.getKnowledgeGraph();

console.log('Nodes:', graph.nodes.length);
console.log('Edges:', graph.edges.length);
console.log('Clusters:', graph.clusters);
```

---

## Best Practices

### Code Generation

1. **Write clear specifications**: Detailed requirements lead to better code
2. **Use examples**: Include input/output examples in specs
3. **Validate generated code**: Always review and test generated code
4. **Iterative refinement**: Generate multiple variants and choose the best

### Development Environment

1. **Use health checks**: Ensure services are ready before use
2. **Persist data**: Use volumes for databases and stateful services
3. **Manage dependencies**: Define `depends_on` for proper startup order
4. **Monitor resources**: Check resource usage regularly

### Knowledge Base

1. **Keep index updated**: Rebuild index after major code changes
2. **Curate include patterns**: Index only relevant files
3. **Use hybrid search**: Combines semantic and keyword for best results
4. **Provide context**: Include context when asking questions

---

## Troubleshooting

### Code Generation

**Problem**: Generated code has syntax errors
- **Solution**: Enable validation in config, check spec clarity

**Problem**: Tests fail to compile
- **Solution**: Verify test framework is installed, check generated test syntax

### Development Environment

**Problem**: Service won't start
- **Solution**: Check Docker is running, verify image exists, check ports aren't in use

**Problem**: Health check fails
- **Solution**: Increase timeout, check service logs, verify health check command

### Knowledge Base

**Problem**: Search returns no results
- **Solution**: Rebuild index, check include/exclude patterns, lower similarity threshold

**Problem**: Indexing is slow
- **Solution**: Reduce chunk size, exclude test/build files, use smaller file patterns

---

## Performance Tips

### Code Generation
- Use `fast` quality for prototyping
- Use `thorough` quality for production code
- Cache frequently used templates

### Development Environment
- Use Alpine-based images for faster startup
- Mount volumes for persistent data
- Use networks to isolate services

### Knowledge Base
- Index incrementally for large codebases
- Use appropriate chunk sizes (500-1000 chars)
- Cache search results for common queries

---

## Migration from Phase 1

Phase 2 features integrate seamlessly with Phase 1:

```yaml
# Combine code review + generation
codeReview:
  enabled: true
  autoReview: true

codeGeneration:
  enabled: true
  validation:
    syntaxCheck: true

# Use dependency manager with dev environment
dependencyManager:
  enabled: true

devEnvironment:
  enabled: true
  services:
    - name: postgres
      type: database

# Enhance documentation with knowledge base
documentation:
  enabled: true

knowledgeBase:
  enabled: true
  indexing:
    parseDocstrings: true
```

---

## API Reference

See TypeScript type definitions in:
- `src/code-generation/types.ts`
- `src/dev-environment/types.ts`
- `src/knowledge-base/types.ts`

For full API documentation, see generated docs in `/docs`.
