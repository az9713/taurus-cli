# Tutorial 2: Quick Start Guide

Get up and running with Taurus CLI in 10 minutes. Learn the basics through real-world examples.

## Prerequisites

✅ Completed [Tutorial 1: Installation](./01-installation.md)
✅ Taurus CLI installed and working
✅ API key configured
✅ `taurus --version` works

## Your First Taurus Session

### Starting Taurus

```bash
# Navigate to a project directory
cd ~/my-project

# Start Taurus in chat mode
taurus chat

# You'll see:
# 🐂 Taurus CLI - Claude Code Clone
# Type your message or command. Use Ctrl+C to exit.
#
# taurus>
```

**What just happened?**
- Taurus started a new chat session
- It loaded your configuration from `~/.taurus/config.yaml`
- It initialized all available tools
- It's ready to help you code!

### Example 1: Understanding Your Codebase

Let's say you've just joined a project and want to understand its structure.

```
taurus> Can you analyze the structure of this project and explain what it does?
```

**Taurus will:**
1. Use the `glob` tool to list all files
2. Use the `read` tool to examine key files (package.json, README.md, etc.)
3. Provide a comprehensive analysis

**Real output example:**
```
I'll analyze your project structure.

[Uses glob tool to find files]
[Reads package.json, README.md, main source files]

This is a Node.js web application with the following structure:

- Frontend: React with TypeScript in src/components/
- Backend: Express.js API in src/api/
- Database: PostgreSQL with Prisma ORM
- Main entry: src/index.ts
- Tests: Jest in __tests__/ directories

Key features:
- User authentication (JWT-based)
- Real-time updates (WebSocket)
- File upload system (AWS S3)

Would you like me to explain any specific component?
```

### Example 2: Finding and Fixing a Bug

You have a bug: users can't log in.

```
taurus> Users are reporting they can't log in. Can you help me debug this?
```

**Taurus will:**
1. Search for authentication-related code using `grep`
2. Read the relevant files with `read`
3. Analyze the code
4. Suggest fixes

**Conversation flow:**
```
taurus> Users are reporting they can't log in. Can you help me debug this?

Claude: I'll search for login-related code.
[Uses grep to find authentication code]
[Reads auth files]

I found the login handler in src/api/auth.ts:567

The issue is here:
```typescript
if (user.password === hashedPassword) {  // Wrong comparison!
  return generateToken(user);
}
```

This compares plaintext with hashed password. Should be:
```typescript
if (await bcrypt.compare(password, user.password)) {
  return generateToken(user);
}
```

Shall I fix this for you?

taurus> Yes, please fix it

Claude: [Uses edit tool to fix the bug]
Done! The authentication now properly compares passwords using bcrypt.

Would you like me to:
1. Add tests for this fix?
2. Check for similar issues elsewhere?
```

### Example 3: Adding a New Feature

You need to add email validation to a signup form.

```
taurus> Add email validation to the user signup form. It should check for valid email format and prevent common typos like @gmial.com
```

**Taurus will:**
1. Find the signup form code
2. Implement validation logic
3. Add helpful error messages
4. Update tests

**What you'll see:**
```
Claude: I'll add email validation to the signup form.

[Searches for signup form code]
[Reads src/components/SignupForm.tsx]

I'll implement:
1. Email format validation using regex
2. Common domain typo detection
3. User-friendly error messages

[Uses edit tool to update the form]
[Creates new validation helper function]

Done! Changes made:

1. src/utils/emailValidation.ts - New validation logic
2. src/components/SignupForm.tsx:45 - Added validation
3. src/components/SignupForm.tsx:78 - Added error display

The validation catches:
- Invalid email formats
- Common typos: gmial.com → gmail.com, yahooo.com → yahoo.com
- Suggests corrections to users

Would you like me to add tests for this?
```

## Understanding Taurus's Tools

Taurus has 12 built-in tools. Here's what each does:

### File Operations

**read** - Read files with line numbers
```
taurus> Read the main configuration file

[Taurus uses read tool]
Shows you: config/app.yaml with line numbers
```

**write** - Create new files
```
taurus> Create a new API endpoint for user profiles

[Taurus uses write tool]
Creates: src/api/users/profile.ts
```

**edit** - Modify existing files
```
taurus> Add error handling to the login function

[Taurus uses edit tool]
Updates: src/auth/login.ts with try-catch blocks
```

### Code Discovery

**glob** - Find files by pattern
```
taurus> Find all React components

[Taurus uses glob: **/*.tsx]
Lists: All .tsx files in your project
```

**grep** - Search file contents
```
taurus> Find where we connect to the database

[Taurus uses grep: "database.*connect"]
Shows: All database connection code
```

### Execution

**bash** - Run shell commands
```
taurus> Run the test suite

[Taurus uses bash: npm test]
Shows: Test results
```

### Task Management

**todo** - Track tasks
```
taurus> Add authentication, write tests, update docs

[Taurus uses todo tool]
Creates task list:
1. [ ] Add authentication
2. [ ] Write tests
3. [ ] Update docs
```

### Advanced Tools

**task** - Launch specialized subagents
**webfetch** - Fetch web content
**websearch** - Search the web
**skill** - Execute reusable skills
**slashcommand** - Run custom commands

We'll cover these in detail in later tutorials.

## Common Workflows

### Workflow 1: Code Review

```
taurus> Review the changes in src/payment/stripe.ts and check for security issues

Claude:
[Reads the file]
[Analyzes code]

Security review of src/payment/stripe.ts:

✅ Good:
- API keys stored in environment variables
- Amount validation before charge
- Error handling present

⚠️  Issues found:
1. Line 45: User input not sanitized before Stripe metadata
2. Line 67: No rate limiting on payment attempts
3. Line 89: Webhook signature not verified

Shall I fix these security issues?
```

### Workflow 2: Refactoring

```
taurus> Refactor the User class to use TypeScript interfaces instead of any types

Claude:
[Reads User class]
[Creates interfaces]
[Refactors code]

Refactoring complete:

Created: src/types/user.interface.ts
- UserProfile interface
- UserSettings interface
- UserPermissions interface

Updated: src/models/User.ts
- Replaced 15 instances of 'any'
- Added proper type checking
- Improved IDE autocomplete

All tests still pass! ✅
```

### Workflow 3: Documentation

```
taurus> Generate JSDoc comments for all functions in src/utils/string.ts

Claude:
[Reads the file]
[Adds JSDoc comments]

Added comprehensive JSDoc to 8 functions:

Example:
/**
 * Converts a string to title case
 * @param str - The input string to convert
 * @returns The string in title case (First Letter Capitalized)
 * @example
 * toTitleCase('hello world') // Returns 'Hello World'
 */
function toTitleCase(str: string): string {
  // ...
}

All functions now have:
- Description
- Parameter docs
- Return value docs
- Usage examples
```

## Built-in Commands

Taurus has special commands that start with `/`:

### /help - Get Help

```
taurus> /help

Shows all available commands and features
```

### /clear - Clear Screen

```
taurus> /clear

Clears the conversation (fresh start)
```

### /exit - Exit Taurus

```
taurus> /exit

Gracefully exits Taurus CLI
```

**Tip:** You can also use `Ctrl+C` to exit

## Working with Sessions

Taurus automatically saves your conversations.

### Resume Last Session

```bash
# Start with the last session
taurus chat --resume

# Or use session ID
taurus chat --session abc123
```

### List Sessions

```bash
# View all saved sessions
taurus config --list-sessions

# Output:
# Sessions in ~/.taurus/sessions:
# - 2025-01-15_abc123.json (3.2 KB) - "Debugging authentication"
# - 2025-01-14_def456.json (1.8 KB) - "Adding email validation"
```

We'll cover sessions in detail in [Tutorial 8: Session Management](./08-sessions.md).

## Real-World Example: End-to-End Feature

Let's add a complete feature: password reset functionality.

### Step 1: Start Taurus

```bash
cd ~/my-app
taurus chat
```

### Step 2: Describe What You Need

```
taurus> I need to add a password reset feature. Users should:
1. Request a reset via email
2. Get a unique reset link (expires in 1 hour)
3. Enter new password
4. Get confirmation email

Please implement this with proper security (rate limiting, token validation, etc.)
```

### Step 3: Watch Taurus Work

```
Claude: I'll implement a secure password reset feature.

[Uses todo tool to create task list]
Tasks:
1. [ ] Create password reset token model
2. [ ] Add reset request API endpoint
3. [ ] Add token validation endpoint
4. [ ] Add password update endpoint
5. [ ] Implement email sending
6. [ ] Add rate limiting
7. [ ] Write tests

Starting with task 1...

[Creates src/models/PasswordResetToken.ts]
[Creates src/api/auth/resetPassword.ts]
[Adds email templates]
[Implements rate limiting with Redis]
[Writes comprehensive tests]

All 7 tasks complete! ✅

Files created/modified:
1. src/models/PasswordResetToken.ts - Token model with expiry
2. src/api/auth/resetPassword.ts - 3 new endpoints
3. src/utils/email.ts - Email sending utility
4. src/middleware/rateLimit.ts - Rate limiting (5 requests/hour)
5. templates/reset-password.html - Email template
6. __tests__/auth/resetPassword.test.ts - 12 new tests

Security features:
- Tokens expire after 1 hour
- One-time use tokens (deleted after use)
- Rate limiting (5 attempts per hour per email)
- Secure random token generation (crypto.randomBytes)
- Email verification before reset
- Password strength validation

Would you like me to:
1. Add admin endpoint to view reset attempts?
2. Add password history to prevent reuse?
3. Deploy this to staging?
```

### Step 4: Test It

```
taurus> Run the tests for password reset

[Uses bash tool: npm test -- resetPassword]

Output:
 PASS  __tests__/auth/resetPassword.test.ts
  Password Reset API
    ✓ should send reset email for valid user (145ms)
    ✓ should reject invalid email (23ms)
    ✓ should enforce rate limiting (67ms)
    ✓ should validate reset tokens (34ms)
    ✓ should reject expired tokens (45ms)
    ✓ should update password with valid token (89ms)
    ✓ should delete token after use (28ms)
    ... 5 more tests

Test Suites: 1 passed, 1 total
Tests:       12 passed, 12 total
```

**Complete feature in one session!**

## Tips for Effective Use

### 1. Be Specific

❌ **Vague:** "Fix the bug"
✅ **Specific:** "Users can't upload files larger than 10MB. The error is 'Request Entity Too Large'. Can you fix this?"

### 2. Provide Context

❌ **No context:** "Add validation"
✅ **With context:** "Add validation to the signup form in src/components/Auth/Signup.tsx. Check for email format, password strength (min 8 chars, 1 number, 1 special char), and username uniqueness."

### 3. Ask for Explanations

```
taurus> Can you explain how the authentication flow works in this app?
```

Taurus will analyze the code and explain it step-by-step.

### 4. Request Tests

```
taurus> Add unit tests for the payment processing functions
```

Always ask for tests! Taurus can write comprehensive test suites.

### 5. Iterate

```
taurus> Add a search feature to the user list

[Taurus implements basic search]

taurus> Can you make the search case-insensitive and add fuzzy matching?

[Taurus improves the search]
```

Don't hesitate to refine!

## Common Patterns

### Pattern 1: Explore → Understand → Modify

```
taurus> Where is user data stored?
[Explore codebase]

taurus> Explain how the User model works
[Understand architecture]

taurus> Add a 'lastLogin' field to track user activity
[Modify code]
```

### Pattern 2: Search → Read → Fix

```
taurus> Find all TODO comments in the codebase
[Search with grep]

taurus> Show me the file with the most TODOs
[Read specific files]

taurus> Let's implement the top 3 TODOs
[Fix/implement features]
```

### Pattern 3: Test → Debug → Fix → Verify

```
taurus> Run the test suite
[Run tests with bash]

taurus> The authentication tests are failing. Debug this.
[Read code, find issues]

taurus> Fix the authentication issues
[Apply fixes]

taurus> Run the tests again
[Verify fixes work]
```

## Troubleshooting

### Issue: "I don't see any output"

**Cause:** Taurus might be thinking (API call in progress)

**Solution:** Wait a moment. Complex requests take 5-15 seconds.

### Issue: "Tool execution failed"

**Example error:**
```
Error executing bash tool: Command 'npm test' failed with exit code 1
```

**Solution:** This is normal! The command failed (tests failed). Taurus will show you the output and can help fix the failing tests.

### Issue: "API key not found"

**Solution:**
```bash
# Check your environment variable
echo $ANTHROPIC_API_KEY

# If empty, set it
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Or check config file
cat ~/.taurus/config.yaml
```

### Issue: "Taurus is making changes I don't want"

**Solution:** Be more specific in your requests:
```
❌ taurus> Refactor the code

✅ taurus> Refactor the User class to use dependency injection, but don't change the public API
```

## Keyboard Shortcuts

- **Ctrl+C** - Exit Taurus
- **Ctrl+D** - Exit Taurus (alternative)
- **↑ / ↓** - Navigate command history (in some terminals)

## Next Steps

Now you know the basics! Continue learning:

1. **[Hooks Tutorial](./03-hooks.md)** - Automate repetitive tasks
2. **[Slash Commands Tutorial](./04-slash-commands.md)** - Create custom shortcuts
3. **[MCP Integration](./06-mcp-integration.md)** - Connect external tools

## Quick Reference Card

```
┌─────────────────────────────────────────────────────────────┐
│ Taurus CLI Quick Reference                                  │
├─────────────────────────────────────────────────────────────┤
│ Start Chat       │ taurus chat                              │
│ Resume Session   │ taurus chat --resume                     │
│ Get Help         │ taurus --help                            │
│ Check Version    │ taurus --version                         │
│ Exit             │ /exit or Ctrl+C                          │
├─────────────────────────────────────────────────────────────┤
│ Common Requests                                              │
├─────────────────────────────────────────────────────────────┤
│ Understand code  │ "Explain how [feature] works"           │
│ Find bugs        │ "Debug [issue description]"              │
│ Add features     │ "Implement [feature] with [requirements]"│
│ Refactor         │ "Refactor [file/class] to [goal]"       │
│ Write tests      │ "Add tests for [feature/file]"          │
│ Review code      │ "Review [file] for [security/bugs/etc]" │
└─────────────────────────────────────────────────────────────┘
```

---

**You're ready to be productive with Taurus! 🚀**

**Next:** [Hooks Tutorial](./03-hooks.md) - Automate your workflow
