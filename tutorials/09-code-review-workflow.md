# Tutorial 9: Code Review Workflow

Complete end-to-end code review process using Taurus. From automated checks to detailed security audits.

## Overview

This workflow demonstrates how to:
1. **Automate** pre-review checks with hooks
2. **Use slash commands** for standardized reviews
3. **Launch subagents** for comprehensive analysis
4. **Generate** detailed review reports
5. **Track** issues with todos

**Time saved:** ~2 hours per review

## Prerequisites

✅ Completed [Hooks Tutorial](./03-hooks.md)
✅ Completed [Slash Commands Tutorial](./04-slash-commands.md)
✅ Completed [Subagents Tutorial](./07-subagents.md)
✅ Git repository with changes to review

## Workflow Setup

### Step 1: Create Review Slash Command

```bash
mkdir -p .taurus/commands
nano .taurus/commands/review.md
```

```markdown
---
name: review
description: Comprehensive code review
---

Perform a thorough code review checking:

## 1. CODE QUALITY (Weight: 25%)
- Readability and maintainability
- SOLID principles adherence
- Code complexity (cyclomatic complexity < 10)
- Naming conventions
- Code duplication
- Function length (< 50 lines)

## 2. SECURITY (Weight: 30%)
- OWASP Top 10 vulnerabilities
- SQL injection risks
- XSS vulnerabilities
- Authentication/authorization issues
- Sensitive data exposure
- Input validation
- Output encoding

## 3. PERFORMANCE (Weight: 20%)
- Algorithm efficiency (Big O)
- Database queries (N+1 problems)
- Memory leaks
- Unnecessary computations
- Caching opportunities
- Resource cleanup

## 4. ERROR HANDLING (Weight: 10%)
- Try-catch coverage
- Error messages quality
- Graceful degradation
- Error logging

## 5. TESTING (Weight: 15%)
- Test coverage (aim for 80%+)
- Edge cases covered
- Error cases tested
- Test quality and maintainability

## Output Format

For each file reviewed, provide:

```
📁 FILE: [filename]

🎯 CODE QUALITY: [score]/10
Issues:
- [Issue description] (Line X)
  Severity: [Critical/High/Medium/Low]
  Fix: [Specific fix with code example]

🔒 SECURITY: [score]/10
Issues:
- [Issue description] (Line X)
  Severity: [Critical/High/Medium/Low]
  Fix: [Specific fix with code example]

⚡ PERFORMANCE: [score]/10
Issues:
- [Issue description] (Line X)
  Impact: [Estimated performance impact]
  Fix: [Specific fix with code example]

🔧 ERROR HANDLING: [score]/10
Issues:
- [Issue description] (Line X)
  Risk: [What could go wrong]
  Fix: [Specific fix with code example]

✅ TESTING: [score]/10
Missing tests:
- [Test description]
  Example: [Test code]

📊 OVERALL: [weighted average]/10

🔴 CRITICAL ISSUES: [count]
🟠 HIGH PRIORITY: [count]
🟡 MEDIUM PRIORITY: [count]
🟢 LOW PRIORITY: [count]
```

Prioritize issues by severity and provide actionable fixes.
```

### Step 2: Create Pre-Review Hook

```bash
nano .taurus/hooks/user-prompt-submit.yaml
```

```yaml
name: user-prompt-submit
description: Run automated checks before code review
enabled: true

commands:
  # Only run on review commands
  - name: Pre-review checks
    command: |
      if echo "$USER_MESSAGE" | grep -qi "review\|/review"; then
        echo "🔍 Running pre-review checks..."

        # Check for uncommitted changes
        if ! git diff-index --quiet HEAD --; then
          echo "⚠️  Warning: You have uncommitted changes"
          git status --short
        fi

        # Run linter
        echo "Running linter..."
        npm run lint --quiet || echo "⚠️  Linting issues found"

        # Run type check
        echo "Running type check..."
        npx tsc --noEmit || echo "⚠️  Type errors found"

        # Check test coverage
        echo "Checking test coverage..."
        npm test -- --coverage --silent || true

        echo "✅ Pre-review checks complete"
      fi
    continueOnError: true
    timeout: 30000
```

### Step 3: Create Review Skill (Optional)

```bash
mkdir -p .taurus/skills
nano .taurus/skills/security-auditor.md
```

```markdown
---
name: security-auditor
description: Security-focused code review expert
---

# Security Auditor Skill

You are a senior security engineer with CISSP certification specializing in application security.

## Your Expertise

### OWASP Top 10 (2021)
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable and Outdated Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery (SSRF)

## Your Process

For each file:
1. Read code carefully
2. Identify attack vectors
3. Assess risk severity
4. Provide specific exploits (if safe)
5. Suggest concrete fixes
6. Recommend tests

## Example Output

```
🔒 SECURITY AUDIT: payment.ts

🔴 CRITICAL: SQL Injection Vulnerability
Line: 45
Code: `SELECT * FROM orders WHERE id = '${req.params.id}'`

Attack Vector:
GET /orders/1' OR '1'='1
→ Returns all orders, exposing sensitive data

Fix:
```typescript
const order = await db.query(
  'SELECT * FROM orders WHERE id = ? AND user_id = ?',
  [req.params.id, req.user.id]
);
```

Test:
```typescript
it('should prevent SQL injection', async () => {
  const maliciousId = "1' OR '1'='1";
  const response = await request(app)
    .get(`/orders/${encodeURIComponent(maliciousId)}`)
    .set('Authorization', `Bearer ${userToken}`);

  expect(response.status).toBe(400);
  expect(response.body.error).toBe('Invalid order ID');
});
```
```

Always provide working exploit examples and complete fixes.
```

## Complete Workflow Example

### Scenario: Review Pull Request

You have a pull request with changes to the authentication system.

### Step 1: Start Review Session

```bash
cd ~/my-project
git checkout feature/oauth-login
taurus chat
```

### Step 2: Initiate Review

```
taurus> /review

I need to review the OAuth login implementation in this branch.
Changed files:
- src/auth/oauth.ts (new file, 245 lines)
- src/auth/middleware.ts (modified, +67 lines)
- src/models/User.ts (modified, +12 lines)
- tests/auth/oauth.test.ts (new file, 189 lines)

Please perform a comprehensive security-focused review.
```

**Pre-review hook runs:**
```
🔍 Running pre-review checks...
Running linter...
✓ No linting issues

Running type check...
✓ No type errors

Checking test coverage...
Coverage: 87% (target: 80%)
✓ Coverage acceptable

✅ Pre-review checks complete
```

### Step 3: Taurus Performs Review

```
[Taurus reads all changed files]
[Applies review criteria]
[Generates detailed report]

📋 CODE REVIEW REPORT
Branch: feature/oauth-login
Files: 4 changed
Lines: +513 / -0

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 FILE: src/auth/oauth.ts (245 lines)

🎯 CODE QUALITY: 7/10
Issues:
- Function `handleOAuthCallback` is 78 lines (max 50)
  Line: 45-123
  Severity: Medium
  Fix: Extract token validation and user creation into separate functions

  ```typescript
  // Extract to:
  async function validateOAuthToken(token: string): Promise<TokenPayload> {
    // Token validation logic
  }

  async function createOrUpdateUser(profile: OAuthProfile): Promise<User> {
    // User creation logic
  }
  ```

- Variable name 'cfg' is unclear
  Line: 12
  Severity: Low
  Fix: Rename to 'oauthConfig'

🔒 SECURITY: 6/10
Issues:
- 🔴 CRITICAL: State parameter not validated
  Line: 67
  Code: `const state = req.query.state;`

  Attack Vector:
  An attacker can forge the state parameter, leading to CSRF attacks.

  Fix:
  ```typescript
  const expectedState = req.session.oauthState;
  const receivedState = req.query.state;

  if (!expectedState || expectedState !== receivedState) {
    throw new UnauthorizedError('Invalid OAuth state');
  }

  // Clear state after validation
  delete req.session.oauthState;
  ```

  Test:
  ```typescript
  it('should reject invalid OAuth state', async () => {
    const response = await request(app)
      .get('/auth/callback')
      .query({
        code: 'valid-code',
        state: 'invalid-state'
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid OAuth state');
  });
  ```

- 🟠 HIGH: Redirect URI not validated
  Line: 89
  Risk: Open redirect vulnerability

  Fix: Validate redirect_uri against whitelist

⚡ PERFORMANCE: 8/10
Issues:
- Database query in loop
  Line: 145-152
  Impact: N+1 query problem when fetching user permissions

  Fix: Use JOIN or batch query
  ```typescript
  // Instead of:
  for (const roleId of user.roles) {
    permissions.push(await db.getPermissions(roleId));
  }

  // Use:
  const permissions = await db.query(`
    SELECT p.* FROM permissions p
    JOIN user_roles ur ON ur.role_id = p.role_id
    WHERE ur.user_id = ?
  `, [user.id]);
  ```

🔧 ERROR HANDLING: 6/10
Issues:
- Missing error handling for OAuth provider failure
  Line: 78
  Risk: Unhandled promise rejection crashes server

  Fix:
  ```typescript
  try {
    const profile = await oauthProvider.getProfile(token);
  } catch (error) {
    logger.error('OAuth provider error', { error, provider: 'google' });
    throw new ServiceUnavailableError('Authentication service unavailable');
  }
  ```

✅ TESTING: 9/10
Excellent test coverage! Minor gaps:
- Missing test for OAuth provider timeout
  Example:
  ```typescript
  it('should handle OAuth provider timeout', async () => {
    nock('https://oauth.provider.com')
      .get('/profile')
      .delayConnection(5000)
      .reply(200);

    const promise = oauthService.getProfile('token');

    await expect(promise).rejects.toThrow('Timeout');
  });
  ```

📊 OVERALL: 7.2/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 FILE: src/auth/middleware.ts (+67 lines)

🎯 CODE QUALITY: 8/10
✅ Good separation of concerns
✅ Clear naming
⚠️  Minor: Could extract magic string 'Bearer ' to constant

🔒 SECURITY: 8/10
✅ Proper JWT verification
✅ Token expiration checked
⚠️  Missing: Rate limiting on auth endpoints

⚡ PERFORMANCE: 9/10
✅ Efficient token validation
✅ No unnecessary database queries

🔧 ERROR HANDLING: 9/10
✅ Comprehensive error handling
✅ Proper error messages

✅ TESTING: 8/10
✅ Good coverage
⚠️  Missing: Test for malformed Authorization header

📊 OVERALL: 8.4/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 FILE: src/models/User.ts (+12 lines)

🎯 CODE QUALITY: 9/10
✅ Clean model definition

🔒 SECURITY: 9/10
✅ Sensitive fields (oauthToken) not exposed in toJSON

⚡ PERFORMANCE: 9/10
✅ Efficient schema

🔧 ERROR HANDLING: N/A
No error handling logic in model

✅ TESTING: 8/10
✅ Model tests present

📊 OVERALL: 8.8/10

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 FILE: tests/auth/oauth.test.ts (189 lines)

✅ Excellent test suite!
- 23 tests covering happy path, edge cases, and errors
- Good use of mocking
- Clear test names

Minor suggestion: Add test for concurrent OAuth requests

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## SUMMARY

🔴 CRITICAL ISSUES: 1
1. OAuth state parameter not validated (CSRF risk)

🟠 HIGH PRIORITY: 1
1. Redirect URI not validated (open redirect risk)

🟡 MEDIUM PRIORITY: 3
1. Function too long (refactor)
2. N+1 query problem
3. Missing rate limiting

🟢 LOW PRIORITY: 4
1. Unclear variable name
2. Missing timeout test
3. Missing malformed header test
4. Magic string could be constant

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

## RECOMMENDATION

⚠️  **DO NOT MERGE** until critical and high-priority issues are fixed.

Estimated fix time: 3 hours

Priority order:
1. Fix CSRF vulnerability (state validation)
2. Fix open redirect vulnerability
3. Add rate limiting
4. Refactor long function
5. Fix N+1 query
6. Address low-priority items

Would you like me to:
1. Generate fixes for critical issues?
2. Create GitHub issue with this report?
3. Update tests for security fixes?
```

### Step 4: Fix Critical Issues

```
taurus> Yes, please fix the two critical security issues (state validation and redirect URI)

[Taurus implements fixes]

✅ Fixed CSRF vulnerability

Modified: src/auth/oauth.ts

Added state validation (lines 34-42):
```typescript
// Generate and store state before redirect
export async function initiateOAuth(req: Request, res: Response) {
  const state = crypto.randomBytes(32).toString('hex');
  req.session.oauthState = state;

  const authUrl = buildAuthUrl(state);
  res.redirect(authUrl);
}

// Validate state in callback
export async function handleOAuthCallback(req: Request, res: Response) {
  const expectedState = req.session.oauthState;
  const receivedState = req.query.state as string;

  if (!expectedState || expectedState !== receivedState) {
    throw new UnauthorizedError('Invalid OAuth state - possible CSRF attack');
  }

  delete req.session.oauthState; // Clear after use

  // Continue with OAuth flow...
}
```

✅ Fixed open redirect vulnerability

Modified: src/auth/oauth.ts

Added redirect URI validation (lines 67-75):
```typescript
const ALLOWED_REDIRECTS = [
  '/dashboard',
  '/profile',
  '/app'
];

export function validateRedirect(uri: string): string {
  const parsedUri = new URL(uri, 'http://localhost');

  if (!ALLOWED_REDIRECTS.includes(parsedUri.pathname)) {
    return '/dashboard'; // Safe default
  }

  return parsedUri.pathname;
}
```

✅ Added tests for security fixes

Created: tests/auth/oauth-security.test.ts
- Test for state validation
- Test for CSRF attack prevention
- Test for redirect validation
- Test for open redirect prevention

All tests passing (27/27) ✓

Would you like me to fix the other issues as well?
```

### Step 5: Generate Review Report

```
taurus> Generate a complete review report in markdown format and save it to REVIEW_REPORT.md

✅ Review report generated!

Saved to: REVIEW_REPORT.md

The report includes:
- Executive summary
- Detailed findings for each file
- Security assessment
- Performance analysis
- Test coverage report
- Recommended actions
- Priority fixes

You can share this with your team or attach to the pull request.
```

### Step 6: Create GitHub Issue for Remaining Work

```
taurus> Create a GitHub issue checklist for the remaining medium and low priority issues

✅ GitHub issue created!

Title: Code Review Follow-ups for OAuth Login (PR #123)

Body:
## Medium Priority

- [ ] Refactor `handleOAuthCallback` function (currently 78 lines)
  - Extract `validateOAuthToken()`
  - Extract `createOrUpdateUser()`

- [ ] Fix N+1 query in permission loading (src/auth/oauth.ts:145)
  - Use JOIN query instead of loop

- [ ] Add rate limiting to OAuth endpoints
  - Limit: 5 attempts per 15 minutes
  - Return 429 Too Many Requests

## Low Priority

- [ ] Rename variable `cfg` to `oauthConfig` (src/auth/oauth.ts:12)
- [ ] Extract magic string 'Bearer ' to constant
- [ ] Add test for OAuth provider timeout
- [ ] Add test for malformed Authorization header

## Notes

Critical security issues (CSRF, open redirect) have been fixed in commit abc123.

Estimated time: 2 hours
```

## Advanced Review Workflows

### Workflow A: Security-Focused Review

```
taurus> Perform a security audit using the security-auditor skill. Focus exclusively on security vulnerabilities, not code style.

[Activates security-auditor skill]
[Performs deep security analysis]

🔒 SECURITY AUDIT REPORT
━━━━━━━━━━━━━━━━━━━━━━

Threat Model:
- Public-facing OAuth endpoint
- Handles sensitive user data
- Integrates with third-party services

Attack Surface Analysis:
1. OAuth callback endpoint (external input)
2. Token storage and validation
3. User data handling
4. Third-party API integration

... [Detailed security report]
```

### Workflow B: Performance-Focused Review

```
taurus> Review src/api/orders.ts focusing only on performance. Identify all inefficiencies and provide benchmarks.

[Performance analysis]

⚡ PERFORMANCE REVIEW
━━━━━━━━━━━━━━━━━━━━

Current Performance:
- Endpoint: GET /orders
- Average response time: 2,450ms
- 95th percentile: 4,100ms
- Bottlenecks identified: 3

Issue 1: N+1 Query (Line 45)
Impact: +2,000ms per request
Current: 1 query + N queries (N = avg 50 orders)
Fix: Single JOIN query
Estimated improvement: -80% response time

... [Detailed analysis with benchmarks]
```

### Workflow C: Automated Review on Git Hook

Set up automatic review when creating pull requests:

```bash
# .git/hooks/pre-push
#!/bin/bash

echo "Running automated code review..."

# Get changed files
CHANGED_FILES=$(git diff --name-only origin/main...HEAD)

# Run Taurus review
taurus chat <<EOF
Review these files that changed in this branch:
$CHANGED_FILES

Quick review focusing on:
1. Security vulnerabilities
2. Obvious bugs
3. Missing error handling

Generate a brief summary (max 10 lines).
EOF
```

## Best Practices

### 1. Review in Focused Sessions

```bash
# Separate reviews by concern
taurus chat  # Session 1: Security review
taurus chat  # Session 2: Performance review
taurus chat  # Session 3: Code quality review
```

### 2. Use Subagents for Large Reviews

```
taurus> Launch an Explore subagent to review all 47 files in the src/api/ directory for consistent error handling

[Subagent works autonomously]
[Reviews all files]
[Generates comprehensive report]
```

### 3. Combine with CI/CD

```yaml
# .github/workflows/taurus-review.yml
name: Automated Code Review

on: [pull_request]

jobs:
  review:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install Taurus
        run: npm install -g taurus-cli
      - name: Run automated review
        run: |
          taurus chat --non-interactive <<EOF
          Review changed files in this PR.
          Focus on security and performance.
          Output results to review.md
          EOF
      - name: Comment on PR
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const review = fs.readFileSync('review.md', 'utf8');
            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: review
            });
```

### 4. Create Review Templates

```bash
# .taurus/templates/security-review.md
Template for consistent security reviews

# .taurus/templates/performance-review.md
Template for performance reviews
```

### 5. Track Review Metrics

```bash
# Count reviews performed
grep -r "review" ~/.taurus/sessions/*.json | wc -l

# Average issues found per review
jq '.messages[] | select(.content | contains("CRITICAL ISSUES")) | .content' \
   ~/.taurus/sessions/*.json | grep "CRITICAL" | wc -l
```

## Next Steps

Master code reviews! Continue with:

1. **[Project Setup Workflow](./10-project-setup-workflow.md)** - Automate project initialization
2. **[Documentation Workflow](./11-documentation-workflow.md)** - Generate comprehensive docs
3. **[Bug Fixing Workflow](./12-bug-fixing-workflow.md)** - Systematic debugging

---

**Never miss a bug again! 🔍**

**Next:** [Project Setup Workflow](./10-project-setup-workflow.md)
