# Tutorial 13: Test Generation & Coverage Analysis Workflow

Learn how to automatically generate comprehensive test suites and analyze code coverage using Taurus CLI's AI-powered test generation capabilities.

## 📋 What You'll Learn

- How to generate tests for existing code
- Understanding coverage analysis and metrics
- Analyzing test quality
- Identifying and filling coverage gaps
- Best practices for test generation
- Integrating with CI/CD pipelines

## ⏱️ Estimated Time

30-45 minutes

## 🎯 Prerequisites

- Completed [Quick Start Guide](./02-quickstart.md)
- Basic understanding of testing concepts
- A TypeScript/JavaScript project to test (or use our example)

## 📚 Table of Contents

1. [Understanding Test Generation](#understanding-test-generation)
2. [Setting Up Test Generator](#setting-up-test-generator)
3. [Generating Your First Tests](#generating-your-first-tests)
4. [Analyzing Coverage](#analyzing-coverage)
5. [Improving Test Quality](#improving-test-quality)
6. [Filling Coverage Gaps](#filling-coverage-gaps)
7. [CI/CD Integration](#cicd-integration)
8. [Best Practices](#best-practices)

---

## Understanding Test Generation

Taurus CLI's Test Generator analyzes your code to identify testable elements (functions, classes, methods, components) and generates complete test suites with:

- **Unit Tests**: Test individual functions in isolation
- **Integration Tests**: Test component interactions
- **E2E Tests**: Test complete user workflows
- **Mocks & Fixtures**: Automatically generated test data
- **Assertions**: Meaningful checks for expected behavior
- **Edge Cases**: Boundary conditions and error scenarios

### Supported Frameworks

- **JavaScript/TypeScript**: Jest, Mocha, Vitest
- **Python**: Pytest, unittest
- **Java**: JUnit, TestNG
- **Go**: go-test
- **Rust**: rust-test
- **Ruby**: RSpec

---

## Setting Up Test Generator

### Step 1: Configure in `.taurus/config.json`

```json
{
  "testGenerator": {
    "enabled": true,
    "framework": "jest",
    "testTypes": ["unit", "integration"],
    "coverage": {
      "enabled": true,
      "threshold": {
        "statements": 80,
        "branches": 75,
        "functions": 85,
        "lines": 80
      },
      "reportFormats": ["text", "html", "lcov"],
      "includeUntested": true,
      "trackBranches": true
    },
    "generation": {
      "generateMocks": true,
      "generateFixtures": true,
      "generateHelpers": true,
      "edgeCases": true,
      "errorCases": true,
      "asyncTests": true
    },
    "quality": {
      "minAssertions": 3,
      "requireDescriptions": true,
      "isolateTests": true,
      "deterministicTests": true
    }
  }
}
```

### Step 2: Install Testing Framework

```bash
# For Jest (recommended for TypeScript/JavaScript)
npm install --save-dev jest @types/jest ts-jest

# Initialize Jest config
npx jest --init
```

### Step 3: Verify Configuration

Start Taurus CLI and check the test generator is enabled:

```bash
npx taurus
```

```
> /config testGenerator.enabled
true
```

---

## Generating Your First Tests

### Example: Testing a Calculator Module

Let's create a simple calculator to demonstrate test generation.

**Create `src/calculator.ts`:**

```typescript
export class Calculator {
  add(a: number, b: number): number {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('Invalid input: arguments must be numbers');
    }
    return a + b;
  }

  subtract(a: number, b: number): number {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('Invalid input: arguments must be numbers');
    }
    return a - b;
  }

  multiply(a: number, b: number): number {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('Invalid input: arguments must be numbers');
    }
    return a * b;
  }

  divide(a: number, b: number): number {
    if (isNaN(a) || isNaN(b)) {
      throw new Error('Invalid input: arguments must be numbers');
    }
    if (b === 0) {
      throw new Error('Division by zero');
    }
    return a / b;
  }
}
```

### Generate Tests Using Taurus

**In Taurus CLI:**

```
Generate comprehensive tests for src/calculator.ts using Jest. Include unit tests for all methods, test edge cases like division by zero and NaN inputs, and ensure good coverage.
```

**Or use programmatic API:**

```typescript
import { TaurusTestGeneratorManager, ClaudeClient } from 'taurus-cli';

const client = new ClaudeClient({ apiKey: process.env.ANTHROPIC_API_KEY });
const testGenerator = new TaurusTestGeneratorManager(config.testGenerator, client);

const result = await testGenerator.generateTests({
  sourceFile: './src/calculator.ts',
  framework: 'jest',
  testTypes: ['unit'],
  options: {
    includeSetup: true,
    includeTeardown: true,
    mockExternal: false,
    coverageTarget: 90
  }
});

console.log(`Generated ${result.testCases.length} test cases`);
console.log(`Test file: ${result.testFile}`);
```

### Expected Generated Test

**`src/calculator.test.ts`:**

```typescript
import { Calculator } from './calculator';

describe('Calculator', () => {
  let calculator: Calculator;

  beforeEach(() => {
    calculator = new Calculator();
  });

  describe('add', () => {
    test('should add two positive numbers correctly', () => {
      const result = calculator.add(5, 3);
      expect(result).toBe(8);
    });

    test('should add negative numbers', () => {
      const result = calculator.add(-5, -3);
      expect(result).toBe(-8);
    });

    test('should handle zero', () => {
      const result = calculator.add(0, 5);
      expect(result).toBe(5);
    });

    test('should throw error for NaN input', () => {
      expect(() => calculator.add(NaN, 5)).toThrow('Invalid input');
    });
  });

  describe('divide', () => {
    test('should divide two numbers', () => {
      const result = calculator.divide(10, 2);
      expect(result).toBe(5);
    });

    test('should throw error for division by zero', () => {
      expect(() => calculator.divide(10, 0)).toThrow('Division by zero');
    });

    test('should handle negative divisor', () => {
      const result = calculator.divide(10, -2);
      expect(result).toBe(-5);
    });

    test('should throw error for NaN input', () => {
      expect(() => calculator.divide(NaN, 5)).toThrow('Invalid input');
    });
  });

  // Similar tests for subtract and multiply...
});
```

### Run the Generated Tests

```bash
npm test
```

```
 PASS  src/calculator.test.ts
  Calculator
    add
      ✓ should add two positive numbers correctly (2 ms)
      ✓ should add negative numbers (1 ms)
      ✓ should handle zero
      ✓ should throw error for NaN input (3 ms)
    divide
      ✓ should divide two numbers
      ✓ should throw error for division by zero (2 ms)
      ✓ should handle negative divisor
      ✓ should throw error for NaN input (1 ms)

Test Suites: 1 passed, 1 total
Tests:       8 passed, 8 total
```

---

## Analyzing Coverage

### Generate Coverage Report

**In Taurus CLI:**

```
Analyze test coverage for my project and show me the results.
```

**Or programmatically:**

```typescript
const coverage = await testGenerator.analyzeCoverage({
  sourceFiles: ['./src/**/*.ts'],
  testFiles: ['./src/**/*.test.ts'],
  framework: 'jest',
  options: {
    runTests: true,
    includeReport: true,
    reportFormat: ['html', 'text'],
    outputDir: './coverage'
  }
});

console.log(`Overall Coverage: ${coverage.overall.lines.percentage.toFixed(2)}%`);
console.log(`Files with low coverage: ${coverage.gaps.length}`);
```

### Understanding Coverage Metrics

**Example Coverage Report:**

```
Test Coverage Report
===================

Overall Coverage:
  Statements: 92.31% (120/130)
  Branches:   85.71% (30/35)
  Functions:  95.00% (19/20)
  Lines:      91.67% (110/120)

Coverage by File:

  calculator.ts:
    Functions: 100.00% (4/4)
    Lines:     100.00% (24/24)

  user-service.ts:
    Functions: 87.50% (7/8)
    Lines:     82.35% (28/34)
    Uncovered: getUserById, validateEmail

  auth-service.ts:
    Functions: 100.00% (8/8)
    Lines:     95.45% (21/22)
    Uncovered lines: [45]
```

### Coverage Metrics Explained

- **Statements**: Individual code statements executed
- **Branches**: Conditional branches (if/else, switch) taken
- **Functions**: Functions/methods called
- **Lines**: Physical lines of code executed

**What's a Good Coverage Target?**

- **80%+ overall**: Good for most projects
- **90%+ functions**: High confidence in core logic
- **75%+ branches**: Good edge case coverage
- **100%**: Rarely necessary, focus on critical paths

---

## Improving Test Quality

### Analyze Test Quality

**In Taurus CLI:**

```
Analyze the quality of my test suite and give me recommendations.
```

**Programmatically:**

```typescript
const quality = await testGenerator.analyzeTestQuality([
  './src/**/*.test.ts'
]);

console.log(`Test Quality Score: ${quality.score}/100`);
console.log(`Total Tests: ${quality.testCount}`);
console.log(`Issues Found: ${quality.issues.length}`);
console.log('\nRecommendations:');
quality.recommendations.forEach(rec => console.log(`- ${rec}`));
```

### Common Quality Issues

**1. Tests Without Assertions**

```typescript
// ❌ Bad: No assertions
test('should process data', () => {
  const result = processData(input);
  // Missing expect()
});

// ✅ Good: Clear assertions
test('should process data', () => {
  const result = processData(input);
  expect(result).toEqual(expectedOutput);
  expect(result.status).toBe('success');
});
```

**2. Non-Descriptive Test Names**

```typescript
// ❌ Bad: Vague name
test('test1', () => {
  expect(calculator.add(2, 2)).toBe(4);
});

// ✅ Good: Descriptive name
test('should add two positive integers correctly', () => {
  expect(calculator.add(2, 2)).toBe(4);
});
```

**3. Tests with Shared State**

```typescript
// ❌ Bad: Shared mutable state
let user; // Global variable

test('creates user', () => {
  user = createUser();
});

test('updates user', () => {
  updateUser(user); // Depends on previous test
});

// ✅ Good: Isolated tests
describe('User operations', () => {
  let user;

  beforeEach(() => {
    user = createUser(); // Fresh state for each test
  });

  test('creates user with default values', () => {
    expect(user.name).toBe('Guest');
  });

  test('updates user name', () => {
    updateUser(user, { name: 'Alice' });
    expect(user.name).toBe('Alice');
  });
});
```

**4. Weak Assertions**

```typescript
// ❌ Bad: Only checks truthiness
test('should return data', () => {
  const result = fetchData();
  expect(result).toBeTruthy();
});

// ✅ Good: Specific assertions
test('should return user data with expected structure', () => {
  const result = fetchData();
  expect(result).toEqual({
    id: expect.any(Number),
    name: expect.any(String),
    email: expect.stringMatching(/^.+@.+\..+$/),
    createdAt: expect.any(Date)
  });
});
```

---

## Filling Coverage Gaps

### Identify Missing Tests

**In Taurus CLI:**

```
Find coverage gaps in src/auth-service.ts and suggest tests to fill them.
```

**Programmatically:**

```typescript
const gaps = await testGenerator.suggestMissingTests('./src/auth-service.ts');

for (const gap of gaps) {
  console.log(`\n[${gap.severity}] ${gap.reason}`);
  console.log(`Function: ${gap.element.name}`);
  console.log(`Complexity: ${gap.element.complexity}`);
  console.log('Suggested tests:');
  gap.suggestedTests.forEach(test => console.log(`  - ${test}`));
}
```

### Example Coverage Gap Report

```
Coverage Gaps Found:

[CRITICAL] No tests found for function "validateToken"
Function: AuthService.validateToken
Complexity: 12
Suggested tests:
  - Add unit test for validateToken
  - Test edge cases for validateToken
  - Test error handling for validateToken

[HIGH] No tests found for function "refreshSession"
Function: AuthService.refreshSession
Complexity: 8
Suggested tests:
  - Add unit test for refreshSession
  - Test expired session scenario
  - Test invalid token scenario

[MEDIUM] Incomplete branch coverage in "login"
Function: AuthService.login
Current: 60% branch coverage
Suggested tests:
  - Test login with invalid credentials
  - Test login with locked account
  - Test login with expired password
```

### Generate Tests for Gaps

**Ask Taurus to fill specific gaps:**

```
Generate tests for the validateToken function in auth-service.ts, focusing on edge cases and error scenarios.
```

---

## CI/CD Integration

### GitHub Actions Example

Create `.github/workflows/tests.yml`:

```yaml
name: Tests and Coverage

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Generate Missing Tests
        run: |
          npx taurus --non-interactive << 'EOF'
          Generate tests for any files in src/ that don't have corresponding test files.
          Use Jest framework and aim for 80% coverage.
          EOF

      - name: Run Tests with Coverage
        run: npm test -- --coverage

      - name: Check Coverage Threshold
        run: |
          npx taurus --non-interactive << 'EOF'
          Check if test coverage meets our thresholds:
          - Statements: 80%
          - Branches: 75%
          - Functions: 85%
          - Lines: 80%
          If any threshold is not met, exit with error code.
          EOF

      - name: Upload Coverage Report
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info

      - name: Comment PR with Coverage
        if: github.event_name == 'pull_request'
        uses: romeovs/lcov-reporter-action@v0.3.1
        with:
          lcov-file: ./coverage/lcov.info
          github-token: ${{ secrets.GITHUB_TOKEN }}
```

### Pre-commit Hook

Create `.taurus/hooks/pre-commit.sh`:

```bash
#!/bin/bash

echo "Running test coverage check..."

# Get coverage for changed files
CHANGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js)$' | grep -v '\.test\.')

if [ -z "$CHANGED_FILES" ]; then
  echo "No source files changed"
  exit 0
fi

# Check if tests exist for changed files
for file in $CHANGED_FILES; do
  test_file="${file%.ts}.test.ts"
  test_file="${test_file%.js}.test.js"

  if [ ! -f "$test_file" ]; then
    echo "❌ Missing tests for $file"
    echo "Run: npx taurus and ask to generate tests for $file"
    exit 1
  fi
done

# Run tests and check coverage
npm test -- --coverage --collectCoverageFrom="$CHANGED_FILES" > /dev/null 2>&1

if [ $? -ne 0 ]; then
  echo "❌ Tests failed"
  exit 1
fi

echo "✅ All tests passed with good coverage"
exit 0
```

Make it executable:

```bash
chmod +x .taurus/hooks/pre-commit.sh
```

---

## Best Practices

### 1. Start with Critical Code

Focus test generation on:
- Complex business logic (high complexity score)
- Security-critical functions (authentication, authorization)
- Data validation and transformation
- Error-prone areas (based on bug history)

```
Generate comprehensive tests for src/payment-processor.ts, focusing on edge cases and error scenarios. This is critical business logic.
```

### 2. Review Generated Tests

Always review AI-generated tests:

```typescript
// Generated test might be too generic
test('should process payment', () => {
  const result = processPayment(payment);
  expect(result.success).toBe(true); // Too simple!
});

// Improve with specific scenarios
test('should process credit card payment successfully', () => {
  const payment = {
    type: 'credit_card',
    amount: 99.99,
    currency: 'USD',
    card: { number: '4111111111111111', cvv: '123', exp: '12/25' }
  };

  const result = processPayment(payment);

  expect(result.success).toBe(true);
  expect(result.transactionId).toMatch(/^txn_[a-z0-9]+$/);
  expect(result.amount).toBe(99.99);
  expect(result.timestamp).toBeInstanceOf(Date);
});
```

### 3. Maintain Tests as Code Evolves

```
I just added a new parameter to the calculateDiscount function. Update the existing tests and add new ones for the new parameter.
```

### 4. Use Descriptive Test Names

```typescript
// ❌ Bad
test('test getUserById', () => { ... });

// ✅ Good
test('should return user when valid ID is provided', () => { ... });
test('should throw NotFoundError when user does not exist', () => { ... });
test('should throw ValidationError when ID is invalid', () => { ... });
```

### 5. Test One Thing Per Test

```typescript
// ❌ Bad: Testing multiple things
test('user operations', () => {
  const user = createUser();
  expect(user.id).toBeDefined();

  updateUser(user, { name: 'Alice' });
  expect(user.name).toBe('Alice');

  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});

// ✅ Good: Separate tests
test('should assign ID when creating user', () => {
  const user = createUser();
  expect(user.id).toBeDefined();
  expect(user.id).toMatch(/^usr_[a-z0-9]+$/);
});

test('should update user name', () => {
  const user = createUser();
  updateUser(user, { name: 'Alice' });
  expect(user.name).toBe('Alice');
});

test('should delete user by ID', () => {
  const user = createUser();
  deleteUser(user.id);
  expect(getUser(user.id)).toBeNull();
});
```

### 6. Mock External Dependencies

```typescript
// Mock external services
jest.mock('./email-service');
jest.mock('./payment-gateway');

test('should send confirmation email after successful payment', async () => {
  const mockSendEmail = require('./email-service').sendEmail;
  const mockProcessPayment = require('./payment-gateway').processPayment;

  mockProcessPayment.mockResolvedValue({ success: true, txnId: '123' });
  mockSendEmail.mockResolvedValue({ sent: true });

  await processOrder(order);

  expect(mockProcessPayment).toHaveBeenCalledWith(order.payment);
  expect(mockSendEmail).toHaveBeenCalledWith({
    to: order.customerEmail,
    subject: 'Order Confirmation',
    body: expect.stringContaining('123')
  });
});
```

### 7. Coverage is Not Everything

```
Analyze my test suite for src/core/. I have 95% coverage, but are the tests actually meaningful? Check for:
- Weak assertions (only checking truthiness)
- Missing edge cases
- Tests that don't verify behavior, just implementation
```

---

## Common Pitfalls

### ❌ Pitfall 1: Generating Tests Without Understanding

**Problem:**
```
Generate tests for all files in src/
```

The AI might generate tests without context about your domain logic.

**Solution:**
```
Generate tests for src/order-service.ts. This service handles e-commerce orders with the following business rules:
- Orders must have at least one item
- Total must be > 0
- Discounts are applied before tax
- Orders can be in states: pending, confirmed, shipped, delivered, cancelled
Generate tests that verify these business rules.
```

### ❌ Pitfall 2: Ignoring Test Maintenance

Generated tests become outdated as code changes.

**Solution:** Regenerate and review regularly:
```
I updated the User model to include an 'emailVerified' field. Update the tests in user-service.test.ts to account for this new field.
```

### ❌ Pitfall 3: Over-Reliance on Mocks

Too many mocks can make tests brittle and less valuable.

**Balance mocks:**
- Mock I/O: databases, APIs, file system
- Don't mock: domain logic, value objects, pure functions

### ❌ Pitfall 4: Not Testing Error Cases

**Bad:**
```typescript
test('should create user', () => {
  const user = createUser({ name: 'Alice', email: 'alice@example.com' });
  expect(user.name).toBe('Alice');
});
```

**Good:**
```typescript
describe('createUser', () => {
  test('should create user with valid data', () => {
    const user = createUser({ name: 'Alice', email: 'alice@example.com' });
    expect(user.name).toBe('Alice');
    expect(user.email).toBe('alice@example.com');
  });

  test('should throw error when name is missing', () => {
    expect(() => createUser({ email: 'alice@example.com' }))
      .toThrow('Name is required');
  });

  test('should throw error when email is invalid', () => {
    expect(() => createUser({ name: 'Alice', email: 'invalid' }))
      .toThrow('Invalid email format');
  });

  test('should throw error when email already exists', async () => {
    await createUser({ name: 'Alice', email: 'alice@example.com' });
    await expect(createUser({ name: 'Bob', email: 'alice@example.com' }))
      .rejects.toThrow('Email already exists');
  });
});
```

---

## Next Steps

Now that you've mastered test generation and coverage analysis:

1. ✅ **Practice**: Generate tests for your existing codebase
2. ✅ **Integrate**: Set up CI/CD with coverage checks
3. ✅ **Maintain**: Keep tests updated as code changes
4. ✅ **Learn More**:
   - [Security Scanning Workflow](./14-security-scanning-workflow.md)
   - [Database Migration Workflow](./15-database-migration-workflow.md)

---

## Troubleshooting

### Tests Won't Run

**Problem:** `Cannot find module 'jest'`

**Solution:**
```bash
npm install --save-dev jest @types/jest ts-jest
npx jest --init
```

### Low Coverage After Generation

**Problem:** Generated tests have low coverage

**Solution:**
```
The generated tests for user-service.ts only achieve 65% coverage. Analyze the uncovered code and generate additional tests for:
1. Error handling paths
2. Edge cases
3. Async operations
```

### Tests Are Flaky

**Problem:** Tests pass/fail randomly

**Solution:**
- Remove shared state between tests
- Properly mock async operations
- Use `beforeEach` to reset state
- Avoid time-dependent assertions

```
My tests in order-service.test.ts are flaky. Review them and fix any issues with:
- Shared mutable state
- Race conditions in async tests
- Time-dependent assertions
```

### Coverage Not Updating

**Problem:** Coverage report doesn't reflect new tests

**Solution:**
```bash
# Clear Jest cache
npx jest --clearCache

# Run with fresh coverage
npm test -- --coverage --no-cache
```

---

**Ready to secure your code? Continue to [Security Scanning Workflow](./14-security-scanning-workflow.md) →**
