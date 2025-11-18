# Tutorial 12: Bug Fixing Workflow

Systematic approach to finding and fixing bugs using Taurus. From reproduction to deployment.

## Overview

Complete bug fixing process:
1. **Reproduction** - Recreate the bug
2. **Investigation** - Find root cause
3. **Fix** - Implement solution
4. **Test** - Verify fix works
5. **Regression** - Prevent recurrence
6. **Deploy** - Ship the fix

**Time saved:** ~1-2 hours per bug

## Prerequisites

✅ Completed [Subagents Tutorial](./07-subagents.md)
✅ Project with a bug to fix
✅ Taurus CLI installed

## Workflow Setup

### Create Bug Fix Command

```bash
mkdir -p .taurus/commands
nano .taurus/commands/fix-bug.md
```

```markdown
---
name: fix-bug
description: Systematic bug investigation and fix
---

Fix the bug using this systematic approach:

## Phase 1: REPRODUCTION (15% of time)
1. Understand the bug report
2. Identify steps to reproduce
3. Reproduce locally
4. Verify it's actually a bug (not expected behavior)
5. Document exact reproduction steps

## Phase 2: INVESTIGATION (30% of time)
1. Read error logs/stack traces
2. Identify affected code files
3. Understand the expected behavior
4. Trace execution flow
5. Find the root cause (not just symptoms)
6. Document findings

## Phase 3: FIX (25% of time)
1. Design the solution
2. Implement the fix
3. Ensure fix doesn't break existing functionality
4. Add proper error handling
5. Clean up any related code smells

## Phase 4: TESTING (20% of time)
1. Write test that reproduces the bug (should fail before fix)
2. Verify test passes after fix
3. Test edge cases
4. Run full test suite
5. Manual testing if needed

## Phase 5: PREVENTION (10% of time)
1. Check for similar bugs elsewhere
2. Add validation/checks to prevent recurrence
3. Update documentation if needed
4. Consider architectural improvements

## Output Format

```
🐛 BUG FIX REPORT
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Bug: [Title]
Severity: [Critical/High/Medium/Low]
Reported by: [User/System]

PHASE 1: REPRODUCTION ✓
Steps to reproduce:
1. [Step]
2. [Step]
...

Expected: [What should happen]
Actual: [What actually happens]

PHASE 2: INVESTIGATION ✓
Root cause: [Explanation]
Affected files:
- [File:line]
- [File:line]

PHASE 3: FIX ✓
Solution: [Explanation]
Files modified:
- [File] - [What changed]

Code changes:
```[language]
[Before and after code]
```

PHASE 4: TESTING ✓
Tests added:
- [Test name] (file:line)

Test results:
✓ All tests pass (N/N)
✓ Bug no longer reproduces

PHASE 5: PREVENTION ✓
Additional changes:
- [Change to prevent similar bugs]

Related issues checked:
- [Issue or file checked]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

Be thorough and systematic.
```

## Complete Workflow Example

### Scenario: Login Fails for Some Users

**Bug Report:**
```
Title: Users can't login after password reset
Reporter: support@company.com
Severity: Critical
Description: After using password reset feature,
some users cannot log in with their new password.
Error: "Invalid credentials"
```

### Step 1: Start Bug Fix Session

```bash
taurus chat
```

```
taurus> /fix-bug

Users report they can't login after password reset.
Error message: "Invalid credentials"
Severity: Critical - affects user access
```

### Step 2: Taurus Investigates

```
🐛 BUG FIX: Login fails after password reset
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 PHASE 1: REPRODUCTION

Let me understand this bug first.

[Reading password reset code]
✓ Read src/api/auth/password-reset.ts
✓ Read src/api/auth/login.ts
✓ Read src/utils/password.ts

[Analyzing the flow]

I can see the issue! Let me reproduce it:

Steps to reproduce:
1. User requests password reset
2. Receives reset email
3. Clicks reset link
4. Enters new password
5. Password is updated
6. User tries to login with new password
7. Login fails with "Invalid credentials"

Expected: Login should succeed with new password
Actual: Login fails

✓ Bug confirmed and reproduced locally

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔍 PHASE 2: INVESTIGATION

Root cause found!

Issue location: src/api/auth/password-reset.ts:67

```typescript
// Current code (BUGGY)
export async function resetPassword(token: string, newPassword: string) {
  const user = await validateResetToken(token);

  // BUG: Password is set directly without hashing!
  user.password = newPassword;

  await db.users.update({
    where: { id: user.id },
    data: { password: newPassword }  // Storing plain text!
  });

  await deleteResetToken(token);
}
```

Root cause:
The password reset function stores the new password as plain text
instead of hashing it. When users try to login, the login function
compares the hashed password (from bcrypt.hash) against the plain
text password, which will never match.

Affected files:
- src/api/auth/password-reset.ts:67 (bug location)
- src/api/auth/login.ts:45 (comparison fails here)

Why this wasn't caught:
- No test for password reset → login flow
- Password reset was added recently
- Code review missed this security issue

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔧 PHASE 3: FIX

Implementing solution...

[Modifying src/api/auth/password-reset.ts]

✓ Fix applied

Files modified:
- src/api/auth/password-reset.ts

Changes:

```typescript
// BEFORE (BUGGY)
export async function resetPassword(token: string, newPassword: string) {
  const user = await validateResetToken(token);

  user.password = newPassword;  // Plain text!

  await db.users.update({
    where: { id: user.id },
    data: { password: newPassword }
  });

  await deleteResetToken(token);
}

// AFTER (FIXED)
export async function resetPassword(token: string, newPassword: string) {
  const user = await validateResetToken(token);

  // Hash the new password before storing
  const hashedPassword = await hashPassword(newPassword);

  await db.users.update({
    where: { id: user.id },
    data: { password: hashedPassword }
  });

  await deleteResetToken(token);

  // Log password change for security audit
  logger.info('Password reset completed', {
    userId: user.id,
    timestamp: new Date()
  });
}
```

Why this fix works:
1. Hashes password before storing (matches login flow)
2. Uses existing hashPassword utility (consistent with registration)
3. Adds logging for security audit trail

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 PHASE 4: TESTING

Creating comprehensive tests...

[Creating tests/api/password-reset.test.ts]

✓ Tests created

Tests added:

1. test/api/password-reset.test.ts

```typescript
describe('Password Reset Flow', () => {
  // Test that reproduces the bug
  it('should allow login after password reset', async () => {
    // Arrange: Create user
    const user = await createTestUser({
      email: 'test@example.com',
      password: 'OldPassword123!'
    });

    // Request password reset
    const resetToken = await requestPasswordReset(user.email);

    // Reset password
    await resetPassword(resetToken, 'NewPassword123!');

    // Act: Try to login with new password
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'NewPassword123!'
      });

    // Assert: Login should succeed
    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });

  // Test password is actually hashed
  it('should hash password when resetting', async () => {
    const user = await createTestUser();
    const resetToken = await requestPasswordReset(user.email);

    const newPassword = 'NewPassword123!';
    await resetPassword(resetToken, newPassword);

    // Verify password is hashed in database
    const updatedUser = await db.users.findUnique({
      where: { id: user.id }
    });

    // Password should NOT be plain text
    expect(updatedUser.password).not.toBe(newPassword);

    // Password should be bcrypt hash (starts with $2a$ or $2b$)
    expect(updatedUser.password).toMatch(/^\$2[ab]\$/);
  });

  // Test old password no longer works
  it('should invalidate old password after reset', async () => {
    const oldPassword = 'OldPassword123!';
    const user = await createTestUser({
      email: 'test@example.com',
      password: oldPassword
    });

    const resetToken = await requestPasswordReset(user.email);
    await resetPassword(resetToken, 'NewPassword123!');

    // Try to login with old password
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: oldPassword
      });

    expect(response.status).toBe(401);
    expect(response.body.error).toBe('Invalid credentials');
  });

  // Test reset token is single-use
  it('should invalidate reset token after use', async () => {
    const user = await createTestUser();
    const resetToken = await requestPasswordReset(user.email);

    await resetPassword(resetToken, 'NewPassword123!');

    // Try to use same token again
    await expect(
      resetPassword(resetToken, 'AnotherPassword123!')
    ).rejects.toThrow('Invalid or expired reset token');
  });
});
```

Running tests...

 PASS  tests/api/password-reset.test.ts
  Password Reset Flow
    ✓ should allow login after password reset (145ms)
    ✓ should hash password when resetting (78ms)
    ✓ should invalidate old password after reset (92ms)
    ✓ should invalidate reset token after use (56ms)

Test Suites: 1 passed, 1 total
Tests:       4 passed, 4 total

✓ All new tests pass!

Running full test suite...

 PASS  tests/api/auth.test.ts
 PASS  tests/api/users.test.ts
 PASS  tests/api/tasks.test.ts
 PASS  tests/services/email.test.ts

Test Suites: 12 passed, 12 total
Tests:       87 passed, 87 total

✓ All existing tests still pass!

Manual Testing:
✓ Reset password via email link
✓ Login with new password - SUCCESS
✓ Old password rejected - SUCCESS

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🛡️ PHASE 5: PREVENTION

Checking for similar issues...

[Scanning codebase for similar patterns]

Found 1 similar issue:
- src/api/admin/reset-user-password.ts:34
  Admin password reset also stores plain text!

✓ Fixed similar issue in admin endpoint

Additional safeguards added:

1. Password validation utility
```typescript
// src/utils/password.ts

/**
 * Validates that a stored password is properly hashed
 * @throws Error if password is not hashed
 */
export function validatePasswordIsHashed(password: string): void {
  if (!password.startsWith('$2a$') && !password.startsWith('$2b$')) {
    throw new Error(
      'Security violation: Attempted to store unhashed password'
    );
  }
}
```

2. Database hook to prevent plain text passwords
```typescript
// prisma/schema.prisma

// Added custom validation in Prisma middleware
prisma.$use(async (params, next) => {
  if (params.model === 'User' && params.action === 'update') {
    if (params.args.data.password) {
      validatePasswordIsHashed(params.args.data.password);
    }
  }
  return next(params);
});
```

3. Added to code review checklist
   ✓ Updated CONTRIBUTING.md with security checklist
   ✓ Added pre-commit hook to warn about password handling

4. Documentation updated
   ✓ Added to SECURITY.md: "Always hash passwords before storing"
   ✓ Updated API docs with security notes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ BUG FIX COMPLETE!

Summary:
- Bug: Password reset stored plain text passwords
- Severity: Critical (security + functionality)
- Root cause: Missing password hashing in reset flow
- Files changed: 3
- Tests added: 4
- Similar issues fixed: 1
- Prevention measures: 3

Time to fix: 45 minutes
Affected users: ~120 users (from logs)

Recommendations:
1. Deploy fix immediately (critical security issue)
2. Force password reset for affected users
3. Audit all users with last password change in past 7 days
4. Send security notification to affected users
5. Add automated security scanning to CI/CD

Would you like me to:
1. Generate deployment checklist?
2. Create user notification email?
3. Generate security audit report?
4. Create post-mortem document?
```

### Step 3: Deploy Fix

```
taurus> Yes, generate deployment checklist and security audit for affected users

✅ Generated deployment checklist

DEPLOYMENT CHECKLIST
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pre-deployment:
☐ All tests passing locally
☐ Code reviewed by senior developer
☐ Security team notified
☐ Runbook prepared for rollback

Deployment steps:
☐ Deploy to staging
☐ Run smoke tests on staging
☐ Deploy to production during low-traffic window
☐ Monitor error rates for 1 hour
☐ Verify fix with test account

Post-deployment:
☐ Identify affected users (last 7 days password resets)
☐ Force password reset for affected users
☐ Send security notification email
☐ Update status page
☐ Write post-mortem

Rollback plan:
If issues occur:
1. Revert to previous version
2. Restore database from pre-deployment backup
3. Investigate issue
4. Redeploy with additional fixes

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Generated security audit query

```sql
-- Find users affected by password reset bug
-- (password reset in last 7 days with plain text password)

SELECT
  u.id,
  u.email,
  u.name,
  u.updated_at as last_password_change,
  CASE
    WHEN u.password LIKE '$2a$%' OR u.password LIKE '$2b$%'
    THEN 'Hashed (OK)'
    ELSE 'Plain Text (AFFECTED)'
  END as password_status
FROM users u
WHERE u.updated_at >= NOW() - INTERVAL '7 days'
  AND EXISTS (
    SELECT 1 FROM password_reset_logs
    WHERE user_id = u.id
      AND created_at >= NOW() - INTERVAL '7 days'
  )
ORDER BY u.updated_at DESC;
```

Expected affected users: ~120
Action required: Force password reset + email notification

Notification email template created in: templates/security-notification.html
```

## Advanced Debugging Techniques

### Technique 1: Binary Search Debugging

```
taurus> The dashboard is slow but I don't know why. Use binary search to find the bottleneck.

[Taurus uses binary search approach]

Testing hypothesis 1: Database queries slow?
→ Add timing logs to all DB queries
→ Run dashboard load
→ Result: DB queries total 45ms (not the issue)

Testing hypothesis 2: API calls slow?
→ Add timing logs to external APIs
→ Result: No external API calls

Testing hypothesis 3: Frontend rendering slow?
→ Profile React components
→ Result: UserList component takes 2,400ms!

Found bottleneck: UserList component
→ Binary search within component...
→ Issue: Rendering 10,000 items without virtualization

Fix: Implement virtual scrolling
Result: Dashboard load time: 2,500ms → 180ms
```

### Technique 2: Time-Travel Debugging

```
taurus> This worked yesterday but broke today. Find what changed.

[Analyzes git history]

Commits from last 24 hours:
1. feat: Add user preferences (abc123)
2. fix: Update dependencies (def456)
3. refactor: Clean up imports (ghi789)

Testing each commit:
→ abc123: Works ✓
→ def456: Works ✓
→ ghi789: FAILS ✗

Found breaking commit: ghi789

[Analyzes commit]
Issue: Refactor accidentally removed required import
Fix: Re-add missing import
```

### Technique 3: Rubber Duck Debugging

```
taurus> I don't understand why this function returns undefined. Walk me through it step by step.

Let's trace through line by line:

Line 23: function getUserData(userId) {
→ Parameter: userId = "123"

Line 24: const user = users.find(u => u.id === userId);
→ users array has 10 items
→ Searching for id === "123"
→ Found: { id: "123", name: "John" }
→ user = { id: "123", name: "John" }

Line 25: if (user) {
→ user is truthy
→ Entering if block

Line 26: return user.data;
→ user.data = undefined
→ Ah! user object doesn't have a 'data' property!

Found the issue:
- Function returns user.data but should return user
- Or user object structure is wrong

Which is correct:
1. Return user instead of user.data?
2. Fix user object to include data property?
```

## Bug Patterns and Solutions

### Pattern 1: Race Condition

```javascript
// Bug: Race condition in order processing
async function processOrder(orderId) {
  const order = await getOrder(orderId);

  // Problem: Order could be modified here by another request
  await chargeCustomer(order.total);
  await updateOrder(orderId, { status: 'paid' });
}

// Fix: Use database transaction or locking
async function processOrder(orderId) {
  return await db.transaction(async (tx) => {
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      lock: true  // Prevents concurrent modifications
    });

    await chargeCustomer(order.total);

    await tx.orders.update({
      where: { id: orderId },
      data: { status: 'paid' }
    });
  });
}
```

### Pattern 2: Memory Leak

```javascript
// Bug: Event listeners not cleaned up
class DataFetcher {
  constructor() {
    this.cache = new Map();

    // Memory leak: listener never removed
    eventEmitter.on('data', (data) => {
      this.cache.set(data.id, data);
    });
  }
}

// Fix: Clean up listeners
class DataFetcher {
  constructor() {
    this.cache = new Map();
    this.dataHandler = (data) => {
      this.cache.set(data.id, data);
    };

    eventEmitter.on('data', this.dataHandler);
  }

  destroy() {
    eventEmitter.off('data', this.dataHandler);
    this.cache.clear();
  }
}
```

### Pattern 3: Off-by-One Error

```javascript
// Bug: Off-by-one in pagination
function getPaginatedResults(page, pageSize) {
  const start = page * pageSize;  // Wrong!
  const end = start + pageSize;
  return items.slice(start, end);
}

// Page 1: items[10:20] (skips first 10 items)
// Page 2: items[20:30]

// Fix: Adjust offset
function getPaginatedResults(page, pageSize) {
  const start = (page - 1) * pageSize;  // Correct!
  const end = start + pageSize;
  return items.slice(start, end);
}

// Page 1: items[0:10] (first 10 items)
// Page 2: items[10:20]
```

## Best Practices

### 1. Reproduce First

Never fix a bug you can't reproduce:
```
✅ Good: "I can reproduce the bug with these exact steps"
❌ Bad: "I think this might fix it"
```

### 2. Find Root Cause

Fix the disease, not the symptom:
```
✅ Good: "Passwords weren't being hashed" (root cause)
❌ Bad: "Add special case for reset passwords" (symptom)
```

### 3. Add Tests

Every bug fix needs a test:
```
✅ Good: "Test that reproduces bug + verifies fix"
❌ Bad: "Fixed bug, no test added"
```

### 4. Document Everything

```
✅ Good: Detailed bug report with reproduction, root cause, fix
❌ Bad: "Fixed login bug" (commit message)
```

### 5. Check for Similar Issues

```
✅ Good: "Found and fixed 3 similar issues"
❌ Bad: "Fixed this one instance"
```

## Conclusion

You've completed all Taurus tutorials! You now know:

✅ Installation and setup
✅ Basic usage and tools
✅ Hooks for automation
✅ Slash commands for shortcuts
✅ Skills for specialized tasks
✅ MCP integration for external tools
✅ Subagents for complex work
✅ Session management
✅ Complete workflows (review, setup, docs, debugging)

**Keep learning:**
- Experiment with different combinations
- Create your own hooks and commands
- Share workflows with your team
- Contribute to Taurus development

---

**Fix bugs systematically! 🐛**

**Congratulations on completing all tutorials! 🎉**
