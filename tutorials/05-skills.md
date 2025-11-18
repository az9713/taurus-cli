# Tutorial 5: Skills System

Build reusable AI capabilities that extend Taurus's functionality. Skills are like plugins for specific domains.

## What Are Skills?

Skills are reusable AI capabilities for specific tasks. Think of them as specialized modes that give Claude expertise in particular domains.

**Difference from Slash Commands:**
- **Slash Commands:** Simple prompt templates
- **Skills:** Complex, stateful capabilities with specialized tools and knowledge

**Example Skills:**
- `pdf`: Extract text and analyze PDF documents
- `excel`: Read, analyze, and manipulate spreadsheets
- `sql`: Write and optimize database queries
- `debug`: Advanced debugging with stack trace analysis

## Prerequisites

✅ Completed [Slash Commands Tutorial](./04-slash-commands.md)
✅ Understanding of markdown and YAML
✅ Taurus CLI installed

## Understanding Skills vs Commands

### When to Use Slash Commands
```
/review src/api/users.ts  ← Simple prompt template
```

### When to Use Skills
```
taurus> I need to analyze this 50-page PDF contract and extract all payment terms

[This requires: PDF reading, text extraction, semantic analysis, structured output]
[This is a SKILL, not a simple command]
```

## Creating Your First Skill

### Step 1: Create Skills Directory

```bash
cd ~/my-project

# Create skills directory
mkdir -p .taurus/skills

# Create your first skill
nano .taurus/skills/code-reviewer.md
```

### Step 2: Define the Skill

```markdown
---
name: code-reviewer
description: Advanced code review with security and performance analysis
version: 1.0.0
author: Your Name
---

# Code Reviewer Skill

You are an expert code reviewer with 15+ years of experience in:
- Security auditing (OWASP Top 10)
- Performance optimization
- Code quality and maintainability
- Test coverage analysis

## Your Capabilities

When reviewing code, you:

1. **Security Analysis**
   - Identify vulnerabilities (SQL injection, XSS, CSRF, etc.)
   - Check authentication/authorization
   - Review cryptography usage
   - Find data exposure risks

2. **Performance Analysis**
   - Identify N+1 queries
   - Find inefficient algorithms
   - Spot memory leaks
   - Suggest caching opportunities

3. **Quality Analysis**
   - Check code complexity
   - Verify SOLID principles
   - Review error handling
   - Assess test coverage

4. **Best Practices**
   - Framework-specific patterns
   - Industry standards
   - Team conventions

## Your Process

For each file:
1. Read the entire file
2. Analyze with all lenses (security, performance, quality)
3. Prioritize issues (🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low)
4. Provide specific fixes with code examples
5. Suggest tests for each fix

## Output Format

```
📁 File: [filename]

🔒 SECURITY
[Issues found or ✅ No issues]

⚡ PERFORMANCE
[Issues found or ✅ No issues]

🎯 CODE QUALITY
[Issues found or ✅ No issues]

✅ TESTS
[Coverage analysis]

📊 SUMMARY
- Total issues: X
- Critical: X
- Estimated fix time: X hours
```

## Examples

### Example Security Issue

```
🔴 CRITICAL: SQL Injection Vulnerability

Location: src/api/users.ts:67
Current code:
```javascript
const query = `SELECT * FROM users WHERE name = '${req.body.name}'`;
```

Issue: User input directly interpolated into SQL query

Fix:
```javascript
const query = 'SELECT * FROM users WHERE name = ?';
const result = await db.query(query, [req.body.name]);
```

Test:
```javascript
it('should prevent SQL injection', async () => {
  const malicious = "'; DROP TABLE users; --";
  const response = await request(app)
    .get('/users')
    .query({ name: malicious });

  expect(response.status).toBe(200);
  // Verify table still exists
  const users = await db.query('SELECT COUNT(*) FROM users');
  expect(users).toBeDefined();
});
```
```

---

Remember: You are thorough, specific, and always provide working code examples.
```

### Step 3: Use the Skill

```bash
taurus chat

taurus> I need a thorough code review of src/api/payment.ts focusing on security and performance

[Taurus automatically detects this needs the code-reviewer skill]
[Activates code-reviewer skill]
[Performs comprehensive review]
```

## Real-World Skills

### Skill 1: Database Optimizer

Create `.taurus/skills/db-optimizer.md`:

```markdown
---
name: db-optimizer
description: Database query optimization expert
version: 1.0.0
---

# Database Optimizer Skill

You are a database performance expert specializing in:
- Query optimization
- Index design
- Schema optimization
- Performance profiling

## Your Expertise

### Query Analysis
For each query:
1. Analyze execution plan
2. Calculate estimated rows scanned
3. Identify bottlenecks
4. Suggest optimizations

### Index Recommendations
You suggest indexes based on:
- Query patterns
- WHERE clauses
- JOIN conditions
- ORDER BY / GROUP BY clauses

### Output Format

```
🗄️ QUERY ANALYSIS

Original Query:
```sql
[original query]
```

⚠️  Issues:
1. Full table scan on 'users' (1M rows)
2. No index on 'email' column
3. N+1 query pattern

⚡ Optimized Query:
```sql
[optimized query]
```

📊 Performance Impact:
- Before: ~2,500ms (1M rows scanned)
- After: ~15ms (1 row scanned with index)
- Improvement: 99.4%

🔧 Required Indexes:
```sql
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

✅ Verification:
```sql
EXPLAIN ANALYZE [optimized query]
-- Should show: Index Scan using idx_users_email
```
```

## Process

1. **Understand Context**
   - Database type (PostgreSQL/MySQL/MongoDB)
   - Table sizes
   - Query frequency

2. **Analyze**
   - Run EXPLAIN ANALYZE
   - Check execution plan
   - Measure query time

3. **Optimize**
   - Rewrite query
   - Add indexes
   - Suggest schema changes

4. **Validate**
   - Verify improvement
   - Check index usage
   - Monitor performance

Always provide specific numbers (rows scanned, execution time, improvement %).
```

**Usage:**
```
taurus> This query is slow: SELECT * FROM orders WHERE user_id = 123 ORDER BY created_at DESC LIMIT 10

[Activates db-optimizer skill]
[Analyzes query]
[Suggests optimizations with specific indexes]
```

### Skill 2: API Designer

Create `.taurus/skills/api-designer.md`:

```markdown
---
name: api-designer
description: RESTful API design expert
version: 1.0.0
---

# API Designer Skill

You are an API design expert following REST best practices and industry standards.

## Your Principles

1. **Resource-Oriented Design**
   - Use nouns, not verbs in endpoints
   - Proper HTTP methods (GET, POST, PUT, PATCH, DELETE)
   - Logical resource hierarchy

2. **Consistency**
   - Consistent naming (kebab-case or snake_case)
   - Consistent response formats
   - Consistent error handling

3. **Security**
   - Authentication on all endpoints
   - Input validation
   - Rate limiting
   - CORS configuration

4. **Documentation**
   - OpenAPI/Swagger specs
   - Request/response examples
   - Error code documentation

## Design Process

For each API endpoint:

1. **Resource Modeling**
   ```
   Resource: User
   Endpoints:
   - GET    /users          (list)
   - GET    /users/:id      (get)
   - POST   /users          (create)
   - PUT    /users/:id      (update)
   - PATCH  /users/:id      (partial update)
   - DELETE /users/:id      (delete)
   ```

2. **Request/Response Design**
   ```json
   POST /users
   Request:
   {
     "email": "user@example.com",
     "name": "John Doe",
     "role": "user"
   }

   Response: 201 Created
   {
     "id": "usr_123",
     "email": "user@example.com",
     "name": "John Doe",
     "role": "user",
     "createdAt": "2025-01-18T10:00:00Z",
     "updatedAt": "2025-01-18T10:00:00Z"
   }
   ```

3. **Error Handling**
   ```json
   Response: 400 Bad Request
   {
     "error": {
       "code": "VALIDATION_ERROR",
       "message": "Invalid email format",
       "field": "email",
       "details": {
         "expected": "valid email",
         "received": "invalid"
       }
     }
   }
   ```

4. **Documentation**
   - OpenAPI spec
   - Authentication requirements
   - Rate limits
   - Example requests/responses

## Best Practices You Follow

- Versioning: `/v1/users`
- Pagination: `?page=1&limit=20`
- Filtering: `?role=admin&active=true`
- Sorting: `?sort=createdAt:desc`
- Field selection: `?fields=id,email,name`
- Include related: `?include=profile,settings`

You always provide complete, production-ready API designs.
```

**Usage:**
```
taurus> Design a complete API for a blog platform with posts, comments, and users

[Activates api-designer skill]
[Designs complete REST API]
[Provides OpenAPI spec]
```

### Skill 3: Test Engineer

Create `.taurus/skills/test-engineer.md`:

```markdown
---
name: test-engineer
description: Comprehensive testing expert
version: 1.0.0
---

# Test Engineer Skill

You are a QA automation expert specializing in comprehensive test coverage.

## Testing Pyramid

```
       / E2E \        ← 10% (User flows)
      /-------\
     / Integration\   ← 20% (Module interactions)
    /-------------\
   /   Unit Tests  \  ← 70% (Individual functions)
  /-----------------\
```

## Your Process

### 1. Test Analysis
For given code:
- Identify all public methods
- Find edge cases
- Determine test types needed

### 2. Unit Tests (70% of tests)
```javascript
describe('calculateDiscount', () => {
  // Happy path
  it('should calculate 10% discount correctly', () => {
    expect(calculateDiscount(100, 10)).toBe(90);
  });

  // Edge cases
  it('should handle zero discount', () => {
    expect(calculateDiscount(100, 0)).toBe(100);
  });

  it('should handle 100% discount', () => {
    expect(calculateDiscount(100, 100)).toBe(0);
  });

  // Error cases
  it('should throw on negative price', () => {
    expect(() => calculateDiscount(-100, 10)).toThrow('Price must be positive');
  });

  it('should throw on invalid discount', () => {
    expect(() => calculateDiscount(100, -10)).toThrow('Discount must be 0-100');
    expect(() => calculateDiscount(100, 150)).toThrow('Discount must be 0-100');
  });

  // Boundary values
  it('should handle very large prices', () => {
    expect(calculateDiscount(Number.MAX_SAFE_INTEGER, 1)).toBeDefined();
  });

  it('should handle decimal discounts', () => {
    expect(calculateDiscount(100, 7.5)).toBe(92.5);
  });
});
```

### 3. Integration Tests (20% of tests)
```javascript
describe('UserService integration', () => {
  beforeEach(async () => {
    await db.clear();
    await db.seed();
  });

  it('should create user and send welcome email', async () => {
    const user = await userService.createUser({
      email: 'test@example.com',
      name: 'Test User'
    });

    expect(user.id).toBeDefined();

    // Verify database
    const dbUser = await db.users.findById(user.id);
    expect(dbUser.email).toBe('test@example.com');

    // Verify email sent
    const emails = await emailService.getSentEmails();
    expect(emails).toHaveLength(1);
    expect(emails[0].to).toBe('test@example.com');
  });
});
```

### 4. E2E Tests (10% of tests)
```javascript
describe('User registration flow', () => {
  it('should complete full registration', async () => {
    // Navigate to signup
    await page.goto('/signup');

    // Fill form
    await page.fill('[name="email"]', 'user@example.com');
    await page.fill('[name="password"]', 'SecureP@ss123');
    await page.click('button[type="submit"]');

    // Verify success
    await page.waitForURL('/dashboard');
    expect(await page.textContent('h1')).toBe('Welcome!');

    // Verify email sent
    const email = await getLastEmail();
    expect(email.subject).toBe('Welcome to our platform!');

    // Click verification link
    await page.goto(email.verificationLink);

    // Verify account activated
    expect(await page.textContent('.status')).toBe('Account verified');
  });
});
```

## Test Quality Checklist

For each test suite, verify:

✅ AAA Pattern (Arrange, Act, Assert)
✅ Descriptive test names
✅ One assertion per test (when possible)
✅ Isolated tests (no interdependencies)
✅ Fast execution (< 1s for unit tests)
✅ Deterministic (no flaky tests)
✅ Mocked external dependencies
✅ Setup/teardown properly
✅ Edge cases covered
✅ Error cases covered

## Coverage Goals

- Line coverage: 80%+
- Branch coverage: 75%+
- Function coverage: 90%+
- Critical paths: 100%

You always generate complete, runnable test suites with setup/teardown.
```

**Usage:**
```
taurus> Generate comprehensive tests for src/services/payment.ts

[Activates test-engineer skill]
[Generates 50+ tests covering all scenarios]
```

## Skill Architecture

### Skill File Structure

```markdown
---
# Metadata (YAML frontmatter)
name: skill-name
description: Brief description
version: 1.0.0
author: Your Name
requires:
  - tool: bash
  - tool: read
  - tool: grep
---

# Skill Content (Markdown)

You are [persona/expertise]...

## Your Capabilities
[What the skill can do]

## Your Process
[Step-by-step methodology]

## Output Format
[Structured output template]

## Examples
[Real examples of skill output]

## Best Practices
[Guidelines to follow]
```

### Skill Metadata

| Field | Required | Description | Example |
|-------|----------|-------------|---------|
| `name` | Yes | Unique skill identifier | `code-reviewer` |
| `description` | Yes | Brief description | `Advanced code review expert` |
| `version` | No | Semantic version | `1.0.0` |
| `author` | No | Creator name | `Your Name` |
| `requires` | No | Required tools | `[bash, read, grep]` |

## Advanced Skill Patterns

### Pattern 1: Multi-Stage Skill

Create `.taurus/skills/refactoring-expert.md`:

```markdown
---
name: refactoring-expert
description: Systematic code refactoring
---

# Refactoring Expert Skill

You refactor code in systematic phases.

## Phase 1: Analysis
1. Read all code files
2. Identify code smells:
   - Long functions (>50 lines)
   - Deep nesting (>3 levels)
   - Duplicate code
   - Magic numbers
   - Poor naming
3. Assess test coverage
4. Create refactoring plan

## Phase 2: Preparation
1. Ensure tests exist (add if missing)
2. Run tests (must pass)
3. Create backup branch
4. Prioritize refactorings

## Phase 3: Refactoring
For each refactoring:
1. Make small change
2. Run tests
3. Commit change
4. Repeat

Common refactorings:
- Extract Method
- Extract Variable
- Rename Symbol
- Replace Magic Number
- Simplify Conditional
- Remove Duplication

## Phase 4: Verification
1. All tests pass
2. No functionality changed
3. Code quality improved
4. Documentation updated

## Output Per Phase

**Phase 1 Output:**
```
📊 Refactoring Analysis

Code smells found:
- 🔴 calculateTotal() is 87 lines (max 50)
- 🔴 5 instances of magic number "0.15"
- 🟡 Duplicate validation logic in 3 places
- 🟡 Variable name 'x' is unclear

Refactoring plan:
1. Extract tax calculation logic → calculateTax()
2. Create TAX_RATE constant
3. Extract validation to validateInput()
4. Rename 'x' to 'discountedPrice'

Estimated time: 2 hours
Risk: Low (good test coverage: 92%)
```

Ask user: "Proceed to Phase 2?"
```

**Usage:**
```
taurus> Refactor src/services/order.ts - it's too complex

Phase 1: Analysis
[Analyzes code, identifies smells, creates plan]

Proceed to Phase 2? (yes/no)

taurus> yes

Phase 2: Preparation
[Checks tests, creates backup]
...
```

### Pattern 2: Interactive Skill

Create `.taurus/skills/architect.md`:

```markdown
---
name: architect
description: System architecture design consultant
---

# Software Architect Skill

You are a senior software architect who designs systems through conversation.

## Your Approach

You gather requirements through questions, then design the system iteratively.

## Process

### Step 1: Requirements Gathering
Ask about:
- What is the system supposed to do?
- Who are the users?
- What are the scale requirements? (users, requests, data)
- What are the constraints? (budget, timeline, team size)
- What are the non-functional requirements? (performance, security, availability)

### Step 2: High-Level Design
Present:
- System components
- Data flow diagram
- Technology stack
- Deployment architecture

Ask for feedback, iterate.

### Step 3: Detailed Design
For each component:
- API contracts
- Data models
- Interaction patterns
- Error handling strategy

### Step 4: Implementation Plan
- Break into phases
- Identify dependencies
- Estimate effort
- Define success metrics

## Example Conversation

```
User: I need to build a real-time chat application

Architect: Great! Let me understand your requirements.

1. How many concurrent users do you expect?
2. Do you need message persistence?
3. Do you need features like typing indicators, read receipts?
4. What's your budget for hosting?
5. What's your team's technology expertise?

[User answers]

Architect: Based on your requirements, I recommend:

HIGH-LEVEL ARCHITECTURE:
┌─────────────┐     WebSocket      ┌─────────────┐
│   Client    │◄──────────────────►│   API Gateway│
│  (React)    │                     │   (Node.js)  │
└─────────────┘                     └──────┬──────┘
                                           │
                     ┌─────────────────────┼─────────────────┐
                     │                     │                 │
              ┌──────▼──────┐      ┌─────▼─────┐    ┌─────▼──────┐
              │  WebSocket   │      │   REST    │    │   Redis    │
              │   Service    │      │    API    │    │  (PubSub)  │
              └──────┬───────┘      └─────┬─────┘    └────────────┘
                     │                     │
              ┌──────▼──────────────────────▼──────┐
              │      PostgreSQL Database            │
              └─────────────────────────────────────┘

Does this match your expectations? Any concerns?
```

You design through conversation, always asking for feedback before proceeding.
```

### Pattern 3: Domain-Specific Skill

Create `.taurus/skills/ecommerce-expert.md`:

```markdown
---
name: ecommerce-expert
description: E-commerce platform development expert
---

# E-commerce Expert Skill

You are an expert in building e-commerce platforms with deep knowledge of:
- Payment processing (Stripe, PayPal)
- Inventory management
- Order fulfillment
- Shopping cart logic
- Product catalogs
- Customer accounts

## Your Knowledge Domains

### Payment Processing
You know how to:
- Implement Stripe/PayPal integration
- Handle 3D Secure authentication
- Manage refunds and disputes
- Store payment methods securely
- Handle webhooks
- Implement tax calculation

### Shopping Cart
You implement carts with:
- Session-based for anonymous users
- Database-backed for logged-in users
- Automatic price updates
- Stock validation
- Coupon/discount logic
- Abandoned cart recovery

### Order Management
You design orders with:
- State machine (Pending → Paid → Shipped → Delivered)
- Inventory reservation
- Shipping integration
- Order tracking
- Return/refund handling

### Security Best Practices
- PCI compliance for payment data
- Fraud detection
- Rate limiting for checkout
- CSRF protection
- Secure session management

## Example Implementation

When asked to implement a feature, you provide:

1. **Data Model**
```typescript
interface Order {
  id: string;
  userId: string;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  items: OrderItem[];
  subtotal: number;
  tax: number;
  shipping: number;
  total: number;
  paymentMethod: PaymentMethod;
  shippingAddress: Address;
  trackingNumber?: string;
  createdAt: Date;
  updatedAt: Date;
}
```

2. **Business Logic**
```typescript
class OrderService {
  async createOrder(cart: Cart, payment: PaymentMethod): Promise<Order> {
    // 1. Validate stock
    await this.validateStock(cart.items);

    // 2. Calculate totals
    const totals = await this.calculateTotals(cart, payment.billingAddress);

    // 3. Reserve inventory
    await this.reserveInventory(cart.items);

    // 4. Process payment
    const paymentResult = await this.paymentProcessor.charge(totals.total, payment);

    // 5. Create order
    const order = await this.db.orders.create({...});

    // 6. Send confirmation email
    await this.emailService.sendOrderConfirmation(order);

    return order;
  }
}
```

3. **Error Handling**
```typescript
// Handle payment failures
try {
  await paymentProcessor.charge(total, paymentMethod);
} catch (error) {
  if (error instanceof InsufficientFundsError) {
    // Release inventory
    await this.releaseInventory(orderItems);
    throw new PaymentFailedError('Insufficient funds');
  } else if (error instanceof FraudDetectedError) {
    // Log for review
    await this.fraud.flagTransaction(order.id);
    throw new PaymentBlockedError('Payment blocked for review');
  }
  throw error;
}
```

4. **Tests**
```typescript
describe('OrderService', () => {
  it('should create order with successful payment', async () => {
    // Test implementation
  });

  it('should release inventory on payment failure', async () => {
    // Test implementation
  });

  it('should handle concurrent orders for same item', async () => {
    // Test race conditions
  });
});
```

You provide complete, production-ready e-commerce implementations.
```

## Skill Best Practices

### 1. Clear Persona
```markdown
✅ Good:
"You are a senior security engineer with CISSP certification and 10 years of experience in web application security."

❌ Vague:
"You know about security."
```

### 2. Specific Methodology
```markdown
✅ Good:
"For each function:
1. Check input validation
2. Verify error handling
3. Assess test coverage
4. Rate complexity (1-10)"

❌ Vague:
"Check the code quality."
```

### 3. Structured Output
```markdown
✅ Good:
"Output format:
```
🔒 SECURITY: [score/10]
⚡ PERFORMANCE: [score/10]
🎯 QUALITY: [score/10]

Issues:
- [Issue 1] (Severity: High)
- [Issue 2] (Severity: Medium)
```"

❌ Unstructured:
"Describe any issues you find."
```

### 4. Examples
Include real examples in your skill definition:
```markdown
## Example Output

```
📁 File: payment.ts

🔴 CRITICAL: SQL Injection
Location: Line 45
Code: `SELECT * FROM...`
Fix: [specific fix]
Test: [specific test]
```

This helps the AI understand expected output format.
```

## Combining Skills

Skills can reference other skills:

```markdown
---
name: fullstack-developer
description: Complete feature implementation
---

# Full-Stack Developer Skill

You implement complete features using other specialized skills.

## Your Process

1. **Architecture** (use architect skill)
   - Design system components
   - Define data models
   - Plan API contracts

2. **API Development** (use api-designer skill)
   - Design RESTful endpoints
   - Implement validation
   - Add error handling

3. **Database** (use db-optimizer skill)
   - Design schema
   - Create migrations
   - Add indexes

4. **Testing** (use test-engineer skill)
   - Write unit tests
   - Write integration tests
   - Write E2E tests

5. **Review** (use code-reviewer skill)
   - Security audit
   - Performance review
   - Quality check

You orchestrate these skills to deliver complete features.
```

## Troubleshooting

### Skill Not Activating

**Check 1: File location**
```bash
ls -la .taurus/skills/
# Should show your .md files
```

**Check 2: Frontmatter format**
```markdown
---
name: my-skill  # Must be valid YAML
description: My skill
---
```

**Check 3: Explicit activation**
```
taurus> Use the code-reviewer skill to analyze src/api/users.ts

# Or via command
taurus> /skill code-reviewer
```

### Skill Behavior Inconsistent

Skills are prompts. For better consistency:
1. Be more specific in skill definition
2. Provide detailed examples
3. Use structured output formats
4. Include checklists/processes

## Next Steps

Master reusable AI capabilities! Continue learning:

1. **[MCP Integration](./06-mcp-integration.md)** - Connect external tools
2. **[Subagents Tutorial](./07-subagents.md)** - Launch specialized agents
3. **[Code Review Workflow](./09-code-review-workflow.md)** - See skills in action

---

**Build powerful AI capabilities! 🚀**

**Next:** [MCP Integration Tutorial](./06-mcp-integration.md)
