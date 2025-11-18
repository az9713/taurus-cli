# Tutorial 4: Slash Commands

Create custom shortcuts for repetitive tasks. Turn complex workflows into simple `/command` calls.

## What Are Slash Commands?

Slash commands are custom shortcuts that execute predefined prompts. Instead of typing the same instructions repeatedly, create a command once and reuse it.

**Example:**
```
❌ Without slash command:
taurus> Review the code in src/api/users.ts for security vulnerabilities, check for SQL injection, XSS, authentication bypass, and suggest fixes with examples

✅ With slash command:
taurus> /security-review src/api/users.ts
```

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Basic understanding of markdown
✅ Taurus CLI installed

## Creating Your First Slash Command

### Step 1: Create Commands Directory

```bash
# Navigate to your project
cd ~/my-project

# Initialize Taurus if you haven't
taurus init

# Create commands directory
mkdir -p .taurus/commands

# Create your first command
nano .taurus/commands/review.md
```

### Step 2: Write the Command

```markdown
---
name: review
description: Comprehensive code review
---

Please review the code and check for:

1. **Code Quality**
   - Readability and maintainability
   - Proper error handling
   - Code duplication
   - Naming conventions

2. **Security**
   - SQL injection vulnerabilities
   - XSS vulnerabilities
   - Authentication/authorization issues
   - Sensitive data exposure

3. **Performance**
   - Inefficient algorithms
   - Memory leaks
   - N+1 queries
   - Missing indexes

4. **Testing**
   - Missing test cases
   - Edge cases not covered
   - Test quality

Provide specific examples and suggestions for improvement.
```

### Step 3: Use the Command

```bash
# Start Taurus
taurus chat

# Use your command
taurus> /review src/api/users.ts
```

**What happens:**
```
[Taurus reads src/api/users.ts]
[Executes your review template]

Claude: I'll perform a comprehensive code review of src/api/users.ts.

📋 Code Review Results:

1. CODE QUALITY
   ✅ Good naming conventions
   ✅ Proper TypeScript types
   ⚠️  Missing error handling on line 45

   Suggestion:
   try {
     const user = await db.users.findById(id);
   } catch (error) {
     logger.error('Failed to fetch user', error);
     throw new NotFoundError('User not found');
   }

2. SECURITY
   ❌ SQL Injection vulnerability on line 67

   Current code:
   const query = `SELECT * FROM users WHERE name = '${req.body.name}'`;

   Fix:
   const query = 'SELECT * FROM users WHERE name = ?';
   const result = await db.query(query, [req.body.name]);

... [detailed review continues]
```

## Real-World Slash Commands

### Command 1: /test - Generate Tests

Create `.taurus/commands/test.md`:

```markdown
---
name: test
description: Generate comprehensive unit tests
---

Generate unit tests for the specified code that:

1. **Coverage**
   - Cover all public methods/functions
   - Test happy path scenarios
   - Test error cases
   - Test edge cases (null, undefined, empty, etc.)

2. **Quality**
   - Use descriptive test names (should... when...)
   - Follow AAA pattern (Arrange, Act, Assert)
   - Use appropriate assertions
   - Mock external dependencies

3. **Framework**
   - Use Jest/Vitest syntax
   - Include setup/teardown if needed
   - Add test data factories for complex objects

4. **Documentation**
   - Add comments for complex test scenarios
   - Group related tests with describe blocks
   - Use test.each for parameterized tests

Please generate the complete test file.
```

**Usage:**
```
taurus> /test src/utils/validation.ts

[Generates complete test suite with 20+ tests]
```

### Command 2: /refactor - Refactoring Guide

Create `.taurus/commands/refactor.md`:

```markdown
---
name: refactor
description: Refactor code following best practices
---

Please refactor the specified code to improve:

1. **Code Structure**
   - Extract magic numbers to constants
   - Extract complex logic to separate functions
   - Apply Single Responsibility Principle
   - Reduce function complexity (max 20 lines per function)

2. **Naming**
   - Use descriptive variable names (no single letters)
   - Use verbs for functions (get, create, update, delete)
   - Use nouns for classes/objects

3. **Modern Practices**
   - Use async/await instead of callbacks
   - Use const/let instead of var
   - Use template literals instead of string concatenation
   - Use optional chaining (?.) and nullish coalescing (??)

4. **Type Safety**
   - Add TypeScript types
   - Remove any types
   - Use strict null checks

Show before/after comparison and explain each change.
```

**Usage:**
```
taurus> /refactor src/legacy/payment.js

[Provides detailed refactoring with explanations]
```

### Command 3: /fix - Bug Fixer

Create `.taurus/commands/fix.md`:

```markdown
---
name: fix
description: Systematic bug investigation and fix
---

Please help debug and fix the issue by:

1. **Investigation**
   - Read relevant code files
   - Identify the root cause
   - Explain why the bug occurs

2. **Fix**
   - Implement the fix
   - Ensure the fix doesn't break existing functionality
   - Add error handling if missing

3. **Testing**
   - Add/update tests to cover the bug
   - Verify tests pass

4. **Prevention**
   - Suggest how to prevent similar bugs
   - Recommend additional checks/validations

Please proceed step-by-step.
```

**Usage:**
```
taurus> /fix Users can't login after password reset

[Systematic debugging and fix]
```

### Command 4: /api - API Endpoint Generator

Create `.taurus/commands/api.md`:

```markdown
---
name: api
description: Generate RESTful API endpoint
---

Create a complete RESTful API endpoint with:

1. **Route Handler**
   - Express.js/Fastify route definition
   - Proper HTTP methods (GET, POST, PUT, DELETE)
   - Request validation (body, params, query)
   - Response formatting

2. **Business Logic**
   - Service layer function
   - Database queries
   - Error handling
   - Transaction management (if needed)

3. **Validation**
   - Input validation using Zod/Joi
   - Type checking
   - Sanitization

4. **Documentation**
   - JSDoc comments
   - Example requests/responses
   - Error codes and messages

5. **Tests**
   - Unit tests for business logic
   - Integration tests for endpoint
   - Test success and error cases

Include authentication middleware if needed.
```

**Usage:**
```
taurus> /api Create a POST /users endpoint to create new users

[Generates complete endpoint with validation, tests, docs]
```

### Command 5: /db - Database Migration

Create `.taurus/commands/db.md`:

```markdown
---
name: db
description: Generate database migration
---

Create a database migration that:

1. **Migration File**
   - Up migration (apply changes)
   - Down migration (rollback changes)
   - Proper naming convention (timestamp_description)

2. **Best Practices**
   - Use transactions for data migrations
   - Add indexes for foreign keys
   - Set NOT NULL constraints where appropriate
   - Add default values where sensible

3. **Data Safety**
   - Preserve existing data
   - Handle null values gracefully
   - Add data transformations if needed

4. **Documentation**
   - Comment complex migrations
   - Explain why changes are needed
   - List affected tables

5. **Validation**
   - Suggest tests to verify migration
   - Check for data integrity

Use Prisma/Knex/TypeORM syntax based on project.
```

**Usage:**
```
taurus> /db Add email_verified column to users table

[Generates migration with up/down, tests, safety checks]
```

### Command 6: /doc - Documentation Generator

Create `.taurus/commands/doc.md`:

```markdown
---
name: doc
description: Generate comprehensive documentation
---

Generate documentation that includes:

1. **Overview**
   - What the code does
   - When to use it
   - Key concepts

2. **API Documentation**
   - Function signatures with types
   - Parameter descriptions
   - Return values
   - Throws/errors

3. **Usage Examples**
   - Basic usage
   - Advanced usage
   - Common patterns
   - Code examples that actually work

4. **Configuration**
   - Available options
   - Default values
   - Environment variables

5. **Troubleshooting**
   - Common issues
   - Solutions
   - FAQs

Use JSDoc format for code comments, Markdown for standalone docs.
```

**Usage:**
```
taurus> /doc src/utils/cache.ts

[Generates comprehensive docs with examples]
```

### Command 7: /optimize - Performance Optimization

Create `.taurus/commands/optimize.md`:

```markdown
---
name: optimize
description: Analyze and optimize performance
---

Analyze code for performance issues and optimize:

1. **Analysis**
   - Identify performance bottlenecks
   - Measure current complexity (Big O)
   - Find inefficient patterns

2. **Database Optimization**
   - Find N+1 queries
   - Suggest proper joins
   - Add missing indexes
   - Optimize query patterns

3. **Algorithm Optimization**
   - Improve time complexity
   - Reduce memory usage
   - Use caching where appropriate
   - Lazy loading

4. **Code Optimization**
   - Remove unnecessary loops
   - Use built-in methods (map, filter, reduce)
   - Avoid blocking operations
   - Debounce/throttle expensive operations

5. **Benchmarking**
   - Suggest benchmark tests
   - Estimate performance improvement

Show before/after with metrics.
```

**Usage:**
```
taurus> /optimize src/services/report-generator.ts

[Detailed performance analysis and optimizations]
```

## Command Arguments

Commands can accept arguments using variables:

### Example: /security-check with File Argument

Create `.taurus/commands/security.md`:

```markdown
---
name: security
description: Security audit for specified file
---

Perform a security audit of the code, checking for:

1. **OWASP Top 10**
   - Injection vulnerabilities
   - Broken authentication
   - Sensitive data exposure
   - XML external entities (XXE)
   - Broken access control
   - Security misconfiguration
   - Cross-site scripting (XSS)
   - Insecure deserialization
   - Using components with known vulnerabilities
   - Insufficient logging & monitoring

2. **Input Validation**
   - All user inputs validated
   - Whitelist approach used
   - Length limits enforced

3. **Authentication & Authorization**
   - Proper session management
   - Secure password handling
   - Authorization checks on all endpoints

4. **Data Protection**
   - Sensitive data encrypted
   - No secrets in code
   - Proper HTTPS usage

Rate severity: 🔴 Critical, 🟠 High, 🟡 Medium, 🟢 Low

Provide specific fixes with code examples.
```

**Usage:**
```
taurus> /security src/api/payment.ts

# Arguments are automatically included in the context
```

## Advanced Command Patterns

### Pattern 1: Multi-Step Workflow

Create `.taurus/commands/feature.md`:

```markdown
---
name: feature
description: Complete feature implementation workflow
---

Implement a complete feature following this workflow:

**Phase 1: Planning**
1. Break down the feature into tasks
2. Identify affected files
3. List required dependencies
4. Create implementation plan

**Phase 2: Implementation**
5. Create/update database schema
6. Implement business logic
7. Create API endpoints
8. Add input validation

**Phase 3: Testing**
9. Write unit tests
10. Write integration tests
11. Manual test scenarios

**Phase 4: Documentation**
12. Update API documentation
13. Add inline code comments
14. Update user documentation

**Phase 5: Review**
15. Security review
16. Performance review
17. Code quality check

Complete all phases step-by-step. Ask for confirmation before proceeding to next phase.
```

**Usage:**
```
taurus> /feature Implement password reset with email verification

Phase 1: Planning
[Creates task breakdown]

Ready to proceed to Phase 2? (yes/no)

taurus> yes

Phase 2: Implementation
[Implements feature]
...
```

### Pattern 2: Context-Aware Command

Create `.taurus/commands/pr.md`:

```markdown
---
name: pr
description: Prepare pull request
---

Prepare this branch for a pull request:

1. **Code Review**
   - Review all changed files
   - Check for console.logs, debugger statements
   - Verify code quality

2. **Tests**
   - Ensure all tests pass
   - Check test coverage (aim for 80%+)
   - Add missing tests

3. **Documentation**
   - Update README if needed
   - Add/update API docs
   - Update CHANGELOG

4. **Git Hygiene**
   - Check commit messages are descriptive
   - Suggest squashing if needed
   - Ensure no merge conflicts

5. **PR Description**
   - Generate PR title
   - Write detailed description:
     - What changed
     - Why it changed
     - How to test
     - Screenshots (if UI changes)

Then show me the PR description to copy.
```

**Usage:**
```
taurus> /pr

[Performs all checks and generates PR description]

# Suggested PR Description:

## Add User Email Verification

### Changes
- Added email verification on signup
- Implemented verification token system
- Added email templates
- Created verification API endpoints

### Why
Users were creating accounts with invalid emails, causing delivery issues.

### Testing
1. Sign up with new email
2. Check inbox for verification email
3. Click verification link
4. Confirm account is verified

### Technical Details
- Tokens expire after 24 hours
- Rate limited to 3 emails per hour
- Emails sent via SendGrid
- Test coverage: 94%
```

### Pattern 3: Project-Specific Command

Create `.taurus/commands/deploy-staging.md`:

```markdown
---
name: deploy-staging
description: Deploy to staging environment (project-specific)
---

Deploy current branch to staging environment:

1. **Pre-deployment Checks**
   - All tests pass (npm test)
   - No linting errors (npm run lint)
   - Build succeeds (npm run build)
   - No console.logs in production code

2. **Build**
   - Create production build
   - Optimize assets
   - Generate source maps

3. **Database**
   - Run migrations on staging DB
   - Seed test data if needed

4. **Deployment**
   - Deploy to staging server (using configured method)
   - Run health checks
   - Verify deployment

5. **Smoke Tests**
   - Test critical paths
   - Check error monitoring
   - Verify environment variables

6. **Notification**
   - Generate deployment summary
   - Create Slack notification message

Execute these steps and report status at each stage.
```

**Usage:**
```
taurus> /deploy-staging

Pre-deployment Checks
✓ Tests passed (142/142)
✓ No lint errors
✓ Build successful
✓ No debug statements found

Build
✓ Production build created (2.3 MB)
✓ Assets optimized
✓ Source maps generated

...
```

## Command Organization

### Organizing Multiple Commands

```
.taurus/commands/
├── code/
│   ├── review.md
│   ├── refactor.md
│   └── optimize.md
├── testing/
│   ├── unit.md
│   ├── integration.md
│   └── e2e.md
├── database/
│   ├── migration.md
│   └── seed.md
└── deploy/
    ├── staging.md
    └── production.md
```

**Note:** Taurus searches recursively, so you can organize commands in subdirectories.

### Command Naming Conventions

✅ **Good names:**
- `/review` - Clear, concise
- `/test-api` - Descriptive
- `/fix-bug` - Action-oriented
- `/deploy-staging` - Specific

❌ **Avoid:**
- `/r` - Too cryptic
- `/do-the-thing` - Vague
- `/super-long-command-name-that-is-hard-to-type` - Too long

## Best Practices

### 1. Make Commands Reusable

❌ **Too specific:**
```markdown
Review src/api/users.ts for SQL injection on line 67
```

✅ **Reusable:**
```markdown
Review the specified code for security vulnerabilities including SQL injection, XSS, and authentication issues.
```

### 2. Provide Clear Instructions

❌ **Vague:**
```markdown
Make the code better.
```

✅ **Specific:**
```markdown
Refactor the code to:
1. Extract magic numbers to constants
2. Improve naming
3. Add error handling
4. Reduce function complexity
```

### 3. Include Examples

```markdown
---
name: component
description: Generate React component
---

Create a React component with TypeScript.

Example structure:
```tsx
interface Props {
  // Props here
}

export const ComponentName: React.FC<Props> = ({ props }) => {
  // Implementation
};
```

Include:
- TypeScript interfaces for props
- Proper event handlers
- Accessibility attributes (aria-*)
- Error boundaries if needed
```

### 4. Version Control Your Commands

```bash
# Commands are project-specific, commit them!
git add .taurus/commands/
git commit -m "Add custom Taurus commands"

# Share with your team
git push
```

## Combining Commands with Hooks

Use commands in hooks for powerful automation:

```yaml
# .taurus/hooks/user-prompt-submit.yaml
commands:
  - name: Auto-review before implementing
    command: |
      # If user message mentions "implement", auto-review first
      if echo "$USER_MESSAGE" | grep -iq "implement"; then
        echo "💡 Tip: Run /review first to understand existing code"
      fi
```

## Troubleshooting

### Command Not Found

**Check 1: File location**
```bash
# Commands must be in .taurus/commands/
ls -la .taurus/commands/

# Should show your .md files
```

**Check 2: File extension**
```
✅ review.md
❌ review.txt
❌ review.markdown
```

**Check 3: Command name in frontmatter**
```markdown
---
name: review  # Must match filename (without .md)
---
```

### Command Doesn't Do What I Want

Commands are prompts, not scripts. Claude interprets them.

❌ **Expecting:** Command runs exact steps
✅ **Reality:** Command guides Claude's response

**Make commands specific and detailed for better results.**

### Listing Available Commands

```bash
# Start Taurus
taurus chat

# Type /help
taurus> /help

# Shows all available commands:
# Built-in commands:
#   /help  - Show help
#   /clear - Clear conversation
#   /exit  - Exit Taurus
#
# Custom commands:
#   /review - Comprehensive code review
#   /test   - Generate unit tests
#   /fix    - Bug investigation and fix
#   ...
```

## Real-World Team Commands

Share these with your team for consistent workflows:

### /onboarding - New Developer Setup

```markdown
---
name: onboarding
description: Help new developers understand the codebase
---

Welcome! I'll help you understand this codebase.

1. **Project Overview**
   - Read package.json and README
   - Explain project structure
   - List main technologies used

2. **Getting Started**
   - Show how to run the project
   - Explain environment setup
   - List required dependencies

3. **Architecture**
   - Explain folder structure
   - Describe main modules
   - Show how components interact

4. **Common Tasks**
   - How to add a new feature
   - How to run tests
   - How to deploy

5. **Resources**
   - Link to documentation
   - Point to examples
   - Show where to ask questions

Please ask questions as we go!
```

### /standup - Generate Standup Summary

```markdown
---
name: standup
description: Generate standup summary
---

Generate a standup summary based on recent git commits and current work:

1. **Yesterday**
   - List commits from yesterday
   - Summarize what was accomplished

2. **Today**
   - Check current branch
   - List uncommitted changes
   - Infer what's being worked on

3. **Blockers**
   - Check for failing tests
   - Check for unresolved merge conflicts
   - Check for TODO/FIXME comments in recent changes

Format as:
```
YESTERDAY:
- [Summary of commits]

TODAY:
- [Current work based on branch/changes]

BLOCKERS:
- [Any issues found] or "None"
```
```

## Next Steps

Master custom commands! Continue learning:

1. **[Skills System Tutorial](./05-skills.md)** - Reusable AI capabilities
2. **[MCP Integration](./06-mcp-integration.md)** - Connect external tools
3. **[Code Review Workflow](./09-code-review-workflow.md)** - See commands in action

---

**Create shortcuts for everything! ⚡**

**Next:** [Skills System Tutorial](./05-skills.md)
