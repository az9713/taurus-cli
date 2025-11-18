# Tutorial 7: Subagents

Launch specialized AI agents for complex, multi-step tasks. Let subagents work autonomously while you continue with other work.

## What Are Subagents?

Subagents are specialized AI instances that run independently to handle complex tasks. Think of them as team members with specific expertise.

**When to use subagents:**
- 🔍 **Exploring large codebases** - "Find all authentication code"
- 🧪 **Running extensive tests** - "Test all API endpoints and fix failures"
- 📊 **Complex analysis** - "Audit security across entire application"
- 🔨 **Multi-step implementations** - "Implement feature X with tests and docs"

**Key difference from normal conversation:**
- **Normal:** You and Claude work step-by-step together
- **Subagent:** Claude launches a specialist that works autonomously

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Understanding of Taurus tools
✅ Taurus CLI installed

## Available Subagent Types

Taurus provides 3 specialized subagents:

| Subagent | Purpose | Best For |
|----------|---------|----------|
| **general-purpose** | Multi-step tasks, full autonomy | Complex implementations, multi-file changes |
| **Explore** | Fast codebase exploration | Finding code patterns, understanding architecture |
| **Plan** | Task planning and breakdown | Project planning, feature scoping |

## Using Subagents

### Method 1: Ask Claude (Automatic)

Claude automatically launches subagents when needed:

```
taurus> Find all places in the codebase where we make database queries

[Claude recognizes this needs exploration]
[Automatically launches Explore subagent]

🤖 Launching Explore subagent for codebase analysis...

[Subagent works independently:]
- Searches for database patterns
- Reads relevant files
- Analyzes query patterns
- Compiles findings

✅ Subagent completed!

Results: Found 47 database queries across 12 files...
```

### Method 2: Explicit Launch

Use the `/task` command to explicitly launch a subagent:

```
taurus> /task type=Explore "Find all React components that use the useState hook"

🤖 Launching Explore subagent...
```

## Explore Subagent

**Purpose:** Rapidly search and understand codebases

**Thoroughness levels:**
- `quick` - Basic searches (2-3 locations)
- `medium` - Moderate exploration (5-7 locations)
- `very thorough` - Comprehensive analysis (10+ locations)

### Example 1: Finding Code Patterns

```
taurus> Find all error handling code in the API layer and tell me if we're doing it consistently

🤖 Launching Explore subagent (thoroughness: very thorough)...

[Explore subagent working:]
✓ Searching for try-catch blocks
✓ Finding error middleware
✓ Reading API route files (23 files)
✓ Analyzing error patterns

Results:

ERROR HANDLING ANALYSIS

Patterns Found:
1. Try-catch blocks: 45 instances
2. Error middleware: 3 different implementations
3. Custom error classes: 7 types

Consistency Issues:
❌ Inconsistent: 15 routes use try-catch, 8 routes have no error handling
❌ Inconsistent: Some routes return { error: string }, others return { message: string }
❌ Missing: No centralized error logger

Recommendations:
1. Create standard error middleware
2. Standardize error response format
3. Add error logging to all routes

Files affected:
- src/api/users.ts (lines 45, 67, 89)
- src/api/orders.ts (lines 23, 56)
... [22 more files]

Shall I implement standardized error handling?
```

### Example 2: Understanding Architecture

```
taurus> I'm new to this codebase. Explain how user authentication works across the entire application.

🤖 Launching Explore subagent (thoroughness: medium)...

[Explore subagent working:]
✓ Finding authentication files
✓ Reading auth middleware (src/middleware/auth.ts)
✓ Reading login endpoint (src/api/auth/login.ts)
✓ Finding JWT utilities (src/utils/jwt.ts)
✓ Checking frontend auth (src/client/auth/)

Results:

AUTHENTICATION FLOW EXPLAINED

1. LOGIN (POST /api/auth/login)
   src/api/auth/login.ts:23
   - Validates email/password
   - Checks bcrypt hash
   - Generates JWT (valid 24h)
   - Returns { token, user }

2. JWT GENERATION
   src/utils/jwt.ts:15
   - Uses jsonwebtoken library
   - Signs with secret from env (JWT_SECRET)
   - Includes payload: { userId, email, role }

3. MIDDLEWARE PROTECTION
   src/middleware/auth.ts:12
   - Extracts token from Authorization header
   - Verifies JWT signature
   - Attaches user to req.user
   - 401 if invalid/missing

4. FRONTEND USAGE
   src/client/auth/AuthContext.tsx:45
   - Stores token in localStorage
   - Adds Authorization header to all requests
   - Redirects to /login if 401

5. LOGOUT
   src/api/auth/logout.ts:8
   - Blacklists token (Redis)
   - Client clears localStorage

SECURITY NOTES:
✅ Passwords hashed with bcrypt
✅ JWTs have expiration
⚠️  Tokens not rotated
⚠️  No refresh token mechanism

Would you like me to add refresh tokens?
```

### Example 3: Finding All Uses of a Function

```
taurus> Find every place we call the sendEmail function and check if we're handling failures properly

🤖 Launching Explore subagent (thoroughness: very thorough)...

Results:

SEND EMAIL USAGE ANALYSIS

Found 23 calls to sendEmail():

✅ PROPER ERROR HANDLING (12 calls):
1. src/api/users/register.ts:67
   try {
     await sendEmail(welcomeEmail);
   } catch (error) {
     logger.error('Welcome email failed', error);
   }

2. src/api/password-reset.ts:45
   [Similar proper handling]

❌ MISSING ERROR HANDLING (11 calls):
1. src/api/orders/complete.ts:89
   await sendEmail(orderConfirmation);  // No try-catch!

2. src/api/invites/send.ts:34
   await sendEmail(inviteEmail);  // No try-catch!

... [9 more unsafe calls]

RISK ASSESSMENT:
🔴 HIGH RISK: Order completion could fail silently
🟡 MEDIUM RISK: User invites might not be sent

RECOMMENDED FIX:
Add try-catch to all sendEmail calls with proper logging.

Shall I fix the 11 missing error handlers?
```

## General-Purpose Subagent

**Purpose:** Autonomous task completion with full tool access

**Best for:**
- Implementing complete features
- Multi-file refactoring
- Complex debugging
- Test generation

### Example 1: Feature Implementation

```
taurus> Implement a complete password reset feature with email verification, expiring tokens, and rate limiting

🤖 Launching general-purpose subagent...

[Subagent working autonomously:]
✓ Breaking down task into steps
✓ Creating database migration for reset tokens
✓ Implementing token generation (crypto.randomBytes)
✓ Creating email template
✓ Adding rate limiting middleware (5 attempts/hour)
✓ Implementing reset request endpoint
✓ Implementing reset confirmation endpoint
✓ Writing 12 unit tests
✓ Writing 3 integration tests
✓ Updating API documentation

✅ Subagent completed!

IMPLEMENTED:

Files Created:
1. src/api/auth/password-reset.ts - Reset endpoints
2. src/middleware/rateLimit.ts - Rate limiting
3. migrations/add-reset-tokens.sql - Database schema
4. templates/email/password-reset.html - Email template
5. tests/api/password-reset.test.ts - Tests

Files Modified:
1. src/api/routes.ts - Added new routes
2. src/models/User.ts - Added resetToken fields
3. README.md - Updated API documentation

Features:
✅ Tokens expire after 1 hour
✅ Rate limited (5 requests/hour per email)
✅ Tokens are single-use (deleted after reset)
✅ Secure random token generation
✅ Email verification before reset
✅ Tests cover all edge cases

All tests passing (15/15) ✓

Would you like me to:
1. Add admin endpoint to view reset attempts?
2. Add password history (prevent reuse)?
3. Deploy to staging?
```

### Example 2: Comprehensive Refactoring

```
taurus> Refactor the entire API layer to use async/await instead of callbacks

🤖 Launching general-purpose subagent...

[Subagent working:]
✓ Finding all callback-based code (32 files)
✓ Converting to async/await (file 1/32)
✓ Converting to async/await (file 2/32)
...
✓ Converting to async/await (file 32/32)
✓ Updating error handling
✓ Running tests after each file
✓ Fixing test failures (3 tests updated)

✅ Refactoring complete!

SUMMARY:
- Files modified: 32
- Functions converted: 147
- Lines changed: +1,203 / -1,456
- Tests updated: 3
- Tests passing: 245/245 ✓

Example conversion:
// Before
function getUserOrders(userId, callback) {
  db.query('SELECT * FROM orders WHERE user_id = ?', [userId], (err, results) => {
    if (err) return callback(err);
    callback(null, results);
  });
}

// After
async function getUserOrders(userId) {
  const results = await db.query('SELECT * FROM orders WHERE user_id = ?', [userId]);
  return results;
}

All tests still passing!
```

### Example 3: Bug Hunt and Fix

```
taurus> Users report random crashes when uploading large files. Find and fix all related issues.

🤖 Launching general-purpose subagent...

[Subagent investigating:]
✓ Reading error logs
✓ Finding file upload code
✓ Analyzing memory usage patterns
✓ Checking file size limits
✓ Reading timeout configurations

ISSUES FOUND:

1. 🔴 CRITICAL: No file size limit
   src/api/upload.ts:23
   Current: No limit (allows multi-GB uploads)
   Fix: Add 50MB limit

2. 🔴 CRITICAL: Files loaded entirely into memory
   src/api/upload.ts:45
   Current: fs.readFileSync() (blocks event loop)
   Fix: Use streaming with multer

3. 🟠 HIGH: No timeout on uploads
   src/server.ts:12
   Current: Default timeout (2 minutes)
   Fix: Increase to 10 minutes for large files

4. 🟡 MEDIUM: No cleanup of temp files
   src/api/upload.ts:78
   Fix: Add cleanup on error

APPLYING FIXES:

✓ Added file size limit (50MB)
✓ Implemented streaming with multer
✓ Increased timeout to 10 minutes
✓ Added temp file cleanup
✓ Added tests for large file uploads
✓ Added error handling for disk space

TESTING:

✓ Tested 1MB file - Success (0.2s)
✓ Tested 25MB file - Success (2.1s)
✓ Tested 50MB file - Success (4.3s)
✓ Tested 100MB file - Rejected with clear error
✓ Tested upload failure - Temp files cleaned up

All tests passing! Crashes should be fixed.
```

## Plan Subagent

**Purpose:** Break down complex tasks into actionable plans

**Best for:**
- Project planning
- Feature scoping
- Architecture design
- Estimation

### Example: Feature Planning

```
taurus> I want to add real-time notifications to our app. Create a detailed implementation plan.

🤖 Launching Plan subagent...

[Plan subagent working:]
✓ Analyzing current architecture
✓ Identifying requirements
✓ Breaking down into phases
✓ Estimating effort

REAL-TIME NOTIFICATIONS - IMPLEMENTATION PLAN

REQUIREMENTS ANALYSIS:
- Technology: Web application (React + Node.js)
- Scale: 10,000 concurrent users
- Notification types: In-app, email, push
- Real-time: Yes (< 1 second delivery)

RECOMMENDED ARCHITECTURE:

  Client (React)
       ↕ WebSocket
  API Gateway (Socket.io)
       ↕
  Notification Service
       ↕
  Message Queue (Redis PubSub)
       ↕
  Worker Processes

IMPLEMENTATION PHASES:

PHASE 1: Foundation (5 days)
✓ Set up WebSocket server (Socket.io)
✓ Implement authentication for WebSocket
✓ Create notification data model
✓ Add database tables for notifications
  Files: src/websocket/server.ts, migrations/notifications.sql
  Effort: 2 developer-days

PHASE 2: Backend (8 days)
✓ Create notification service
✓ Implement Redis PubSub
✓ Add worker processes for delivery
✓ Create REST API endpoints (mark as read, get history)
  Files: src/services/notification.ts, src/api/notifications.ts
  Effort: 5 developer-days

PHASE 3: Frontend (7 days)
✓ Create React notification component
✓ Implement WebSocket connection
✓ Add notification bell icon
✓ Build notification history panel
✓ Add toast/popup for new notifications
  Files: src/components/Notifications/, src/contexts/NotificationContext.tsx
  Effort: 4 developer-days

PHASE 4: Email Integration (3 days)
✓ Email notification worker
✓ Configurable email preferences
✓ Email templates
  Files: src/workers/email-notification.ts, templates/email/
  Effort: 2 developer-days

PHASE 5: Testing & Optimization (5 days)
✓ Unit tests
✓ Integration tests
✓ Load testing (10K concurrent users)
✓ Optimize WebSocket connections
✓ Add connection pooling
  Effort: 3 developer-days

TOTAL ESTIMATE: 28 days (5.6 weeks) for 1 developer

DEPENDENCIES:
- Redis server (for PubSub)
- Socket.io library
- Email service (SendGrid/Mailgun)

RISKS:
🟡 WebSocket scaling (mitigation: use Socket.io with Redis adapter)
🟡 Notification spam (mitigation: rate limiting + user preferences)

NEXT STEPS:
1. Approve architecture
2. Set up Redis server
3. Begin Phase 1 implementation

Shall I begin implementing Phase 1?
```

## Subagent Best Practices

### 1. Be Specific with Instructions

❌ **Vague:**
```
taurus> Find the authentication code
```

✅ **Specific:**
```
taurus> Find all authentication and authorization code including JWT generation, password hashing, session management, and middleware that protects routes. Check for security vulnerabilities.
```

### 2. Specify Thoroughness for Explore

```
taurus> Find all database queries (quick search)

vs.

taurus> Find all database queries and analyze for performance issues (very thorough search)
```

### 3. Let Subagents Finish

Subagents work autonomously. Don't interrupt:

```
🤖 Subagent working...
✓ Reading file 1/45
✓ Reading file 2/45
...

[Wait for completion - don't send new messages]
```

### 4. Review Subagent Output

Subagents are powerful but review their work:

```
✅ Subagent completed!

[Review the changes]

taurus> Show me the diff of changes made

[Verify before committing]
```

## Combining Subagents with Hooks

Automatically launch subagents in hooks:

```yaml
# .taurus/hooks/session-start.yaml
commands:
  - name: Launch security audit
    command: |
      # This would need custom integration
      echo "Consider running: /task type=Explore 'Audit codebase for security issues'"
```

## Real-World Workflow Examples

### Workflow 1: New Developer Onboarding

```
New Developer: I just joined. Can you help me understand this codebase?

taurus> Launch an Explore subagent to analyze the codebase structure, identify main components, explain architecture, and create a getting-started guide

🤖 Launching Explore subagent (very thorough)...

[45 minutes later]

✅ Codebase analysis complete!

GETTING STARTED GUIDE

PROJECT: E-commerce Platform
STACK: React + Node.js + PostgreSQL
ARCHITECTURE: Monorepo with 3 packages

MAIN COMPONENTS:
1. Frontend (packages/web/)
   - React 18 with TypeScript
   - State management: Zustand
   - Routing: React Router v6
   - Main pages: Home, Product, Cart, Checkout

2. Backend (packages/api/)
   - Express.js REST API
   - Authentication: JWT
   - Database: PostgreSQL with Prisma ORM
   - 12 main endpoints

3. Shared (packages/shared/)
   - TypeScript types
   - Utilities
   - Constants

DEVELOPMENT WORKFLOW:
1. Run: npm install (root)
2. Start DB: docker-compose up
3. Run migrations: npm run migrate
4. Start dev: npm run dev
5. Tests: npm test

KEY FILES TO READ:
1. packages/api/src/server.ts - Main server setup
2. packages/web/src/App.tsx - React app entry
3. packages/shared/src/types.ts - Shared types

COMMON TASKS:
- Add API endpoint: See packages/api/src/api/users.ts
- Add React page: See packages/web/src/pages/Home.tsx
- Database migration: npm run migration:create

[Full 20-page guide generated]

Guide saved to: GETTING_STARTED.md
```

### Workflow 2: Pre-Deployment Audit

```
taurus> Before we deploy to production, launch a subagent to:
1. Find all console.logs and debug statements
2. Check for hardcoded secrets
3. Verify all API endpoints have error handling
4. Check test coverage is > 80%
5. Find TODO/FIXME comments

🤖 Launching general-purpose subagent...

[Subagent performs comprehensive audit]

✅ Pre-deployment audit complete!

FINDINGS:

❌ BLOCKERS (must fix before deploy):
1. Hardcoded API key in src/services/payment.ts:12
2. 5 API endpoints missing error handling
3. Test coverage: 67% (target: 80%)

⚠️  WARNINGS (should fix):
1. 23 console.log statements found
2. 8 TODO comments in production code
3. 2 FIXME comments about security

✅ PASSED:
- No exposed secrets in environment files
- All database queries use parameterized queries
- CORS configured correctly
- Rate limiting enabled

RECOMMENDED ACTIONS:
1. Move API key to environment variable
2. Add error handling to endpoints (list attached)
3. Write tests to reach 80% coverage (47 tests needed)
4. Remove console.logs before deploy

Block deployment until blockers are fixed!
```

## Troubleshooting

### Subagent Doesn't Launch

**Check:** Are you being specific enough?

```
❌ Vague: "Check the code"
✅ Specific: "Launch an Explore subagent to find all database queries and check for N+1 query problems"
```

### Subagent Takes Too Long

Subagents can run for several minutes on large tasks.

**For faster results:**
1. Be more specific to narrow scope
2. Use `quick` thoroughness for Explore
3. Break into smaller sub-tasks

### Subagent Results Incomplete

**Check thoroughness level:**
```
taurus> Find all React components (quick)
[Finds 10 components]

vs.

taurus> Find all React components (very thorough)
[Finds 50 components]
```

## Next Steps

Master autonomous AI agents! Continue learning:

1. **[Session Management](./08-sessions.md)** - Save and resume work
2. **[Code Review Workflow](./09-code-review-workflow.md)** - See subagents in action
3. **[Project Setup Workflow](./10-project-setup-workflow.md)** - Full automation

---

**Let agents do the work! 🤖**

**Next:** [Session Management Tutorial](./08-sessions.md)
