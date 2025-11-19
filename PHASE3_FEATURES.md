# Phase 3 Features Documentation

This document covers the three major Phase 3 features implemented in Taurus CLI.

## Table of Contents

- [Feature 7: Performance Profiler & Optimizer](#feature-7-performance-profiler--optimizer)
- [Feature 9: Multi-Language Code Translation](#feature-9-multi-language-code-translation)
- [Feature 11: API Client Generator & Testing Suite](#feature-11-api-client-generator--testing-suite)

---

## Feature 7: Performance Profiler & Optimizer

Profile your application's performance, identify bottlenecks, and get AI-powered optimization suggestions.

### Overview

Comprehensive performance profiling with CPU, memory, and runtime analysis. Includes benchmarking, hotspot detection, memory leak identification, and automated optimization suggestions.

### Configuration

```yaml
performanceProfiler:
  enabled: true
  profileTypes:
    - cpu
    - memory
    - runtime
  samplingInterval: 10  # milliseconds
  reportPath: ./performance-reports
  optimization:
    enabled: true
    level: moderate  # aggressive, moderate, or conservative
    autoApply: false
  benchmarking:
    enabled: true
    iterations: 1000
    warmupRuns: 10
  monitoring:
    realTime: true
    alertThresholds:
      cpu: 80  # percentage
      memory: 1024  # MB
      responseTime: 1000  # ms
```

### Usage Examples

#### Programmatic Usage

```typescript
import { PerformanceProfilerManager } from 'taurus-cli';

const profiler = new PerformanceProfilerManager(config, client);

// Start profiling
const sessionId = await profiler.startProfile(['cpu', 'memory']);

// Run your code
await myApplication();

// Stop profiling
const session = await profiler.stopProfile(sessionId);

// Analyze and get optimization suggestions
const suggestions = await profiler.analyzeProfile(sessionId);

suggestions.forEach(s => {
  console.log(`${s.severity}: ${s.description}`);
  console.log(`  Location: ${s.location.file}:${s.location.line}`);
  console.log(`  Suggestion: ${s.suggestion}`);
});

// Run benchmarks
const result = await profiler.runBenchmark('myFunction', () => {
  // Function to benchmark
});

console.log(`Average: ${result.averageTime}ms`);
console.log(`Ops/sec: ${result.operationsPerSecond}`);

// Compare implementations
const results = await profiler.compareBenchmarks([
  { name: 'Implementation A', fn: implA },
  { name: 'Implementation B', fn: implB },
]);

// Generate performance report
const report = await profiler.generateReport([sessionId]);
```

### Features

- **CPU Profiling**: Identify CPU-intensive functions and hotspots
- **Memory Profiling**: Track heap usage, detect memory leaks
- **Benchmarking**: Compare performance of different implementations
- **Optimization Suggestions**: AI-powered recommendations for performance improvements
- **Hotspot Detection**: Find functions consuming the most CPU time
- **Memory Leak Detection**: Identify growing memory allocations

---

## Feature 9: Multi-Language Code Translation

Translate code between programming languages with AI-powered accuracy.

### Overview

Automatically translate code between TypeScript, JavaScript, Python, Java, Go, Rust, C#, Ruby, PHP, Kotlin, Swift, and C++. Preserves functionality, handles language-specific features, and provides confidence scores.

### Configuration

```yaml
codeTranslator:
  enabled: true
  quality: balanced  # fast, balanced, or accurate
  preserveComments: true
  preserveStyles: true
  validation:
    enabled: true
    compileCheck: true
  optimization:
    idiomaticCode: true
    modernSyntax: true
```

### Usage Examples

#### CLI Usage

```bash
# Translate code
taurus translate code.ts --from typescript --to python

# Translate with options
taurus translate code.js --from javascript --to go --preserve-comments

# Batch translate
taurus translate src/**/*.ts --from typescript --to python --output dist/
```

#### Programmatic Usage

```typescript
import { TranslationManager } from 'taurus-cli';

const manager = new TranslationManager(config, client);

// Translate code
const result = await manager.translate({
  sourceCode: `
    function fibonacci(n: number): number {
      if (n <= 1) return n;
      return fibonacci(n - 1) + fibonacci(n - 2);
    }
  `,
  sourceLanguage: 'typescript',
  targetLanguage: 'python',
  options: {
    preserveComments: true,
    optimizeForPerformance: true,
  }
});

console.log('Translated code:');
console.log(result.translatedCode);
console.log(`Confidence: ${result.metadata.confidence}%`);

// Handle warnings
result.warnings.forEach(w => {
  console.log(`${w.severity}: ${w.message}`);
  if (w.suggestion) {
    console.log(`  Suggestion: ${w.suggestion}`);
  }
});

// Quick translation
const pythonCode = await manager.translateCode(
  tsCode,
  'typescript',
  'python'
);
```

### Supported Languages

- TypeScript
- JavaScript
- Python
- Java
- Go
- Rust
- C#
- Ruby
- PHP
- Kotlin
- Swift
- C++

### Features

- **Syntax Preservation**: Maintains code structure and logic
- **Idiomatic Translation**: Uses target language best practices
- **Feature Detection**: Identifies language-specific features
- **Confidence Scoring**: Provides translation quality confidence
- **Warning System**: Highlights potential translation issues
- **Validation**: Optional syntax checking of translated code

---

## Feature 11: API Client Generator & Testing Suite

Generate API clients and test suites from OpenAPI/Swagger specifications.

### Overview

Automatically generate type-safe API clients in multiple languages from OpenAPI specs. Includes test generation, authentication handling, retry logic, and comprehensive documentation.

### Configuration

```yaml
apiGenerator:
  enabled: true
  defaultLanguage: typescript
  generateTests: true
  generateDocs: true
  authentication:
    type: bearer  # none, basic, bearer, api-key, oauth2
    location: header
    name: Authorization
  client:
    includeTypes: true
    includeValidation: true
    includeRetry: true
    timeout: 30000
  testing:
    framework: jest
    includeMocks: true
    coverageTarget: 80
```

### Usage Examples

#### CLI Usage

```bash
# Generate client from OpenAPI spec
taurus api-gen generate openapi.json --language typescript

# Generate with tests
taurus api-gen generate openapi.yaml --language python --tests

# Generate for multiple languages
taurus api-gen generate api-spec.json --languages typescript,python,go
```

#### Programmatic Usage

```typescript
import { APIGeneratorManager } from 'taurus-cli';

const manager = new APIGeneratorManager(config, client);

// Load OpenAPI specification
const spec = {
  openapi: '3.0.0',
  info: {
    title: 'My API',
    version: '1.0.0'
  },
  servers: [{ url: 'https://api.example.com' }],
  paths: {
    '/users': {
      get: {
        operationId: 'getUsers',
        summary: 'Get all users',
        responses: {
          '200': {
            description: 'Success',
            content: {
              'application/json': {
                schema: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/User' }
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      User: {
        type: 'object',
        properties: {
          id: { type: 'number' },
          name: { type: 'string' },
          email: { type: 'string' }
        }
      }
    }
  }
};

// Generate client
const client = await manager.generateClient(spec, 'typescript', {
  includeAuth: true,
  includeRetry: true,
  includeValidation: true,
});

// Save generated files
for (const file of client.files) {
  await fs.writeFile(file.path, file.content);
}

// Access test files
if (client.tests) {
  for (const test of client.tests) {
    await fs.writeFile(test.path, test.content);
  }
}

console.log(`Generated client with ${client.metadata.endpoints} endpoints`);
console.log(`Types: ${client.metadata.types}`);
```

### Features

- **Multi-Language Support**: TypeScript, JavaScript, Python, Java, Go, Rust
- **Type Generation**: Automatic TypeScript/type definitions from schemas
- **Authentication**: Built-in support for Bearer, API Key, OAuth2, Basic Auth
- **Retry Logic**: Configurable retry with exponential backoff
- **Request Validation**: Validate requests against OpenAPI schema
- **Test Generation**: Automatic test suite generation with Jest/Pytest
- **Mock Servers**: Generate mock server implementations
- **Documentation**: Auto-generated API client documentation

---

## Best Practices

### Performance Profiling

1. **Profile in production-like environments**: Results vary by environment
2. **Use adequate sample sizes**: More samples = more accurate hotspot detection
3. **Focus on high-impact optimizations**: Address critical issues first
4. **Benchmark before and after**: Validate optimization improvements
5. **Monitor continuously**: Track performance trends over time

### Code Translation

1. **Review translated code**: Always manually review critical translations
2. **Test thoroughly**: Run comprehensive tests on translated code
3. **Handle warnings**: Address high-severity translation warnings
4. **Preserve tests**: Translate tests along with implementation
5. **Use idiomatic code**: Enable idiomaticCode option for better results

### API Client Generation

1. **Keep specs updated**: Regenerate clients when API changes
2. **Version your specs**: Track API specification versions
3. **Test generated clients**: Validate against real API endpoints
4. **Handle errors gracefully**: Implement proper error handling
5. **Use TypeScript**: Leverage type safety in generated clients

---

## Troubleshooting

### Performance Profiler

**Problem**: Profiling overhead is too high
- **Solution**: Increase sampling interval, disable some profile types

**Problem**: Hotspots not detected
- **Solution**: Increase profiling duration, lower sample rate

### Code Translator

**Problem**: Translation produces errors
- **Solution**: Enable validation, review warnings, check source code quality

**Problem**: Low confidence score
- **Solution**: Manually review translation, check for language feature mismatches

### API Generator

**Problem**: Generated client doesn't compile
- **Solution**: Validate OpenAPI spec, check for unsupported features

**Problem**: Tests fail
- **Solution**: Ensure API is accessible, check authentication configuration

---

## Performance Tips

- **Profiler**: Use background profiling for production monitoring
- **Translator**: Cache translations for frequently used code snippets
- **API Generator**: Generate once, reuse clients across projects

---

## Migration from Phase 2

Phase 3 features complement Phase 2:

```yaml
# Combine knowledge base + performance profiling
knowledgeBase:
  enabled: true

performanceProfiler:
  enabled: true

# Use code generation + translation together
codeGeneration:
  enabled: true

codeTranslator:
  enabled: true

# Generate API clients + tests
apiGenerator:
  enabled: true
  generateTests: true
```

---

## API Reference

See TypeScript type definitions in:
- `src/performance-profiler/types.ts`
- `src/code-translator/types.ts`
- `src/api-generator/types.ts`

For full API documentation, see generated docs in `/docs`.
