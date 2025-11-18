# Tutorial 3: Hooks System

Learn to automate your workflow with event-driven hooks. Save time by running scripts automatically at key moments.

## What Are Hooks?

Hooks are scripts that run automatically when specific events happen in Taurus. They're like GitHub Actions, but for your local development workflow.

**Real-world use case:** Every time you start a coding session, automatically:
- Pull latest code from git
- Install any new dependencies
- Run database migrations
- Start your development server

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Basic understanding of shell scripts
✅ Taurus CLI installed and working

## Available Hook Events

Taurus supports 5 hook events:

| Event | When It Triggers | Common Uses |
|-------|------------------|-------------|
| `session-start` | When you start `taurus chat` | Setup: pull code, install deps, start servers |
| `session-end` | When you exit Taurus | Cleanup: stop servers, commit changes |
| `user-prompt-submit` | Before each message you send | Validation: check code style, run linters |
| `before-tool-call` | Before Taurus uses any tool | Logging: track tool usage |
| `after-tool-call` | After a tool finishes | Verification: run tests after code changes |

## Setting Up Hooks

### Step 1: Initialize Hooks in Your Project

```bash
# Navigate to your project
cd ~/my-project

# Initialize Taurus (creates .taurus/ directory)
taurus init

# You'll see:
# ✅ Created .taurus/ directory
# ✅ Created .taurus/hooks/ directory
# ✅ Created example hook files
```

**What was created:**
```
my-project/
└── .taurus/
    ├── hooks/
    │   ├── session-start.yaml
    │   ├── session-end.yaml
    │   ├── user-prompt-submit.yaml
    │   ├── before-tool-call.yaml
    │   └── after-tool-call.yaml
    └── config.yaml
```

### Step 2: Configure a Hook

Let's create a practical `session-start` hook:

```bash
# Edit the session-start hook
nano .taurus/hooks/session-start.yaml
```

**Example: Pull Latest Code and Install Dependencies**

```yaml
# .taurus/hooks/session-start.yaml
name: session-start
description: Setup development environment
enabled: true

commands:
  # Pull latest code from main branch
  - name: Pull latest code
    command: git pull origin main
    continueOnError: true  # Don't fail if already up-to-date

  # Install new dependencies
  - name: Install dependencies
    command: npm install
    continueOnError: false  # Fail if this doesn't work

  # Run database migrations
  - name: Run migrations
    command: npm run migrate
    continueOnError: true

  # Start development server in background
  - name: Start dev server
    command: npm run dev
    background: true  # Don't block Taurus startup

  # Show project status
  - name: Show git status
    command: git status --short
```

### Step 3: Test Your Hook

```bash
# Start Taurus (hook will run automatically)
taurus chat

# You'll see hook output:
# 🔧 Running session-start hook...
# ✓ Pull latest code (0.3s)
# ✓ Install dependencies (2.1s)
# ✓ Run migrations (0.5s)
# ✓ Start dev server (background)
# ✓ Show git status (0.1s)
#
# 🐂 Taurus CLI ready!
# taurus>
```

**Your environment is now ready to code!**

## Real-World Hook Examples

### Example 1: Code Quality Gate (user-prompt-submit)

Automatically lint and type-check code before submitting requests to Claude.

```yaml
# .taurus/hooks/user-prompt-submit.yaml
name: user-prompt-submit
description: Run linting and type checking before each request
enabled: true

commands:
  # Run ESLint on changed files
  - name: Lint code
    command: npm run lint -- --quiet
    continueOnError: true

  # Run TypeScript compiler in check mode
  - name: Type check
    command: npx tsc --noEmit
    continueOnError: true

  # Check for console.logs in production code
  - name: Check for debug statements
    command: |
      if grep -r "console\\.log" src/ --exclude-dir=node_modules; then
        echo "⚠️  Found console.log statements. Please remove them."
        exit 1
      fi
    continueOnError: true
```

**What happens:**
```
taurus> Add a new user endpoint

🔧 Running user-prompt-submit hook...
✓ Lint code (0.8s)
✓ Type check (1.2s)
✓ Check for debug statements (0.2s)

[Now Taurus processes your request]
```

### Example 2: Auto-Test After Code Changes (after-tool-call)

Run tests automatically whenever Taurus modifies code.

```yaml
# .taurus/hooks/after-tool-call.yaml
name: after-tool-call
description: Run tests after code modifications
enabled: true

# Only run for specific tools
toolFilter:
  - edit
  - write

commands:
  # Run tests related to changed files
  - name: Run affected tests
    command: |
      # Get last modified file
      CHANGED_FILE=$(git diff --name-only HEAD | head -1)

      # Find corresponding test file
      TEST_FILE="${CHANGED_FILE/.ts/.test.ts}"
      TEST_FILE="${TEST_FILE/src/tests}"

      # Run tests if test file exists
      if [ -f "$TEST_FILE" ]; then
        npm test -- "$TEST_FILE"
      else
        echo "No tests found for $CHANGED_FILE"
      fi
    continueOnError: true
    timeout: 30000  # 30 seconds max
```

**What happens:**
```
taurus> Fix the login validation bug

[Taurus uses edit tool to fix src/auth/login.ts]

🔧 Running after-tool-call hook...
Running tests for src/auth/login.ts...

 PASS  tests/auth/login.test.ts
  ✓ should validate email format (12ms)
  ✓ should reject invalid passwords (8ms)
  ✓ should create JWT token (15ms)

✓ Run affected tests (2.3s)
```

### Example 3: Commit Reminder (session-end)

Remind yourself to commit changes when ending a session.

```yaml
# .taurus/hooks/session-end.yaml
name: session-end
description: Cleanup and commit reminder
enabled: true

commands:
  # Stop development server
  - name: Stop dev server
    command: pkill -f "node.*dev-server"
    continueOnError: true

  # Show uncommitted changes
  - name: Check for uncommitted changes
    command: |
      if ! git diff-index --quiet HEAD --; then
        echo ""
        echo "⚠️  You have uncommitted changes:"
        git status --short
        echo ""
        echo "Don't forget to commit your work!"
        echo "Suggested: git add . && git commit -m 'Your message'"
      else
        echo "✅ All changes committed!"
      fi

  # Show session summary
  - name: Session summary
    command: |
      echo ""
      echo "📊 Session Summary:"
      echo "Files modified: $(git diff --name-only HEAD | wc -l)"
      echo "Lines added: +$(git diff --stat HEAD | tail -1 | grep -oE '[0-9]+ insertion' | grep -oE '[0-9]+')"
      echo "Lines removed: -$(git diff --stat HEAD | tail -1 | grep -oE '[0-9]+ deletion' | grep -oE '[0-9]+')"
```

**What happens:**
```
taurus> /exit

🔧 Running session-end hook...
✓ Stop dev server (0.2s)

⚠️  You have uncommitted changes:
 M src/auth/login.ts
 M tests/auth/login.test.ts

Don't forget to commit your work!
Suggested: git add . && git commit -m 'Fix login validation'

📊 Session Summary:
Files modified: 2
Lines added: +45
Lines removed: -12

Goodbye!
```

### Example 4: Database Sync (session-start)

Keep your local database in sync with development environment.

```yaml
# .taurus/hooks/session-start.yaml
name: session-start
description: Sync database and seed data
enabled: true

environment:
  DATABASE_URL: postgresql://localhost:5432/myapp_dev

commands:
  # Check database connection
  - name: Check database
    command: pg_isready -h localhost -p 5432
    continueOnError: false

  # Run pending migrations
  - name: Run migrations
    command: npx prisma migrate dev
    continueOnError: false

  # Seed database with test data (development only)
  - name: Seed database
    command: |
      if [ "$NODE_ENV" != "production" ]; then
        npx prisma db seed
      fi
    continueOnError: true

  # Show database stats
  - name: Database stats
    command: |
      echo "Database ready!"
      psql $DATABASE_URL -c "SELECT COUNT(*) as users FROM users;"
```

### Example 5: Security Scan (user-prompt-submit)

Scan for security issues before making changes.

```yaml
# .taurus/hooks/user-prompt-submit.yaml
name: user-prompt-submit
description: Security checks
enabled: true

commands:
  # Check for vulnerable dependencies
  - name: Check dependencies
    command: npm audit --audit-level=moderate
    continueOnError: true

  # Scan for secrets in code
  - name: Secret scanning
    command: |
      # Check for API keys, passwords, tokens
      if grep -rE "(api[_-]?key|password|secret|token).*=.*['\"][A-Za-z0-9]{20,}" src/; then
        echo "⚠️  Potential secrets found in code!"
        exit 1
      fi
    continueOnError: true

  # Check for SQL injection vulnerabilities
  - name: SQL injection check
    command: |
      if grep -rE "query.*\+.*req\.(body|params|query)" src/; then
        echo "⚠️  Potential SQL injection vulnerability!"
        echo "Use parameterized queries instead."
        exit 1
      fi
    continueOnError: true
```

## Hook Configuration Reference

### Basic Structure

```yaml
name: hook-name              # Required: Hook identifier
description: What this does  # Optional: Description
enabled: true                # Required: Enable/disable hook

environment:                 # Optional: Environment variables
  NODE_ENV: development
  DEBUG: true

toolFilter:                  # Optional: Only for tool-related hooks
  - edit                     # Run only when these tools are used
  - write

commands:                    # Required: Commands to execute
  - name: Command name       # Required: Display name
    command: echo "Hello"    # Required: Shell command
    continueOnError: false   # Optional: Continue if command fails (default: false)
    background: false        # Optional: Run in background (default: false)
    timeout: 10000           # Optional: Max execution time in ms (default: 10000)
```

### Advanced: Multi-line Commands

```yaml
commands:
  - name: Complex setup
    command: |
      # You can use multi-line shell scripts
      echo "Starting setup..."

      # Variables work
      PROJECT_NAME=$(basename $(pwd))
      echo "Project: $PROJECT_NAME"

      # Conditionals work
      if [ -f "package.json" ]; then
        npm install
      elif [ -f "requirements.txt" ]; then
        pip install -r requirements.txt
      fi

      # Loops work
      for file in src/*.ts; do
        echo "Processing $file"
      done

      echo "Setup complete!"
```

### Advanced: Conditional Execution

```yaml
commands:
  # Run only in production
  - name: Production checks
    command: |
      if [ "$NODE_ENV" = "production" ]; then
        npm run build
        npm run test:e2e
      else
        echo "Skipping production checks (not in production)"
      fi

  # Run only if file exists
  - name: Run custom script
    command: |
      if [ -f "./.dev-setup.sh" ]; then
        bash ./.dev-setup.sh
      fi
```

### Advanced: Error Handling

```yaml
commands:
  # Critical command - fail if it fails
  - name: Database migration
    command: npm run migrate
    continueOnError: false  # Stop entire hook if this fails

  # Optional command - continue if it fails
  - name: Clear cache
    command: rm -rf .cache/
    continueOnError: true  # Continue even if .cache/ doesn't exist

  # Timeout for long-running commands
  - name: Build project
    command: npm run build
    timeout: 60000  # 60 seconds max
    continueOnError: false
```

## Hook Event Context

Each hook event provides context about what triggered it:

### session-start Context

```yaml
# Available environment variables:
# - TAURUS_SESSION_ID: Unique session identifier
# - TAURUS_WORKING_DIR: Current working directory
# - TAURUS_CONFIG_DIR: Configuration directory (~/.taurus)

commands:
  - name: Log session start
    command: |
      echo "Session $TAURUS_SESSION_ID started in $TAURUS_WORKING_DIR"
      date >> ~/.taurus/session-log.txt
```

### before-tool-call / after-tool-call Context

```yaml
# Available environment variables:
# - TAURUS_TOOL_NAME: Name of the tool being called
# - TAURUS_TOOL_SUCCESS: "true" or "false" (after-tool-call only)

commands:
  - name: Log tool usage
    command: |
      echo "$(date): Tool '$TAURUS_TOOL_NAME' was called" >> .taurus/tool-usage.log
```

## Debugging Hooks

### Enable Verbose Output

```yaml
# Add to any hook for detailed output
commands:
  - name: Debug hook
    command: |
      set -x  # Enable bash debugging
      echo "Current directory: $(pwd)"
      echo "Environment: $NODE_ENV"
      env | grep TAURUS
      ls -la
```

### Test Hooks Independently

```bash
# Test a hook without starting Taurus
cd ~/my-project

# Run the session-start hook manually
bash -c "$(cat .taurus/hooks/session-start.yaml | grep 'command:' | head -1 | cut -d: -f2-)"

# Or extract and run specific commands
# (You'll need to parse the YAML manually for multi-command hooks)
```

### Check Hook Status

```yaml
# Add status reporting to hooks
commands:
  - name: Hook start
    command: echo "🔧 Hook started at $(date)"

  - name: Your command here
    command: npm test

  - name: Hook complete
    command: echo "✅ Hook completed at $(date)"
```

## Best Practices

### 1. Keep Hooks Fast

❌ **Slow:** Running full test suite on every prompt
```yaml
commands:
  - name: Run all tests
    command: npm test  # Might take 5 minutes!
```

✅ **Fast:** Running only quick checks
```yaml
commands:
  - name: Quick lint
    command: npm run lint -- --quiet --max-warnings=0
    timeout: 5000  # 5 seconds max
```

### 2. Use continueOnError Wisely

❌ **Too strict:** Fail on non-critical errors
```yaml
commands:
  - name: Clear cache
    command: rm -rf .cache/
    continueOnError: false  # Fails if .cache/ doesn't exist!
```

✅ **Appropriate:** Continue on optional tasks
```yaml
commands:
  - name: Clear cache
    command: rm -rf .cache/
    continueOnError: true  # OK if .cache/ doesn't exist
```

### 3. Provide Feedback

❌ **Silent:** No indication of what's happening
```yaml
commands:
  - name: Setup
    command: npm install && npm run build
```

✅ **Informative:** Clear progress messages
```yaml
commands:
  - name: Setup
    command: |
      echo "📦 Installing dependencies..."
      npm install
      echo "🔨 Building project..."
      npm run build
      echo "✅ Setup complete!"
```

### 4. Guard Against Failures

```yaml
commands:
  # Check preconditions
  - name: Verify Node.js version
    command: |
      REQUIRED="18"
      CURRENT=$(node -v | grep -oE '[0-9]+' | head -1)
      if [ "$CURRENT" -lt "$REQUIRED" ]; then
        echo "❌ Node.js $REQUIRED+ required (you have $CURRENT)"
        exit 1
      fi

  # Now safe to run commands that need Node 18+
  - name: Run build
    command: npm run build
```

### 5. Document Your Hooks

```yaml
# .taurus/hooks/session-start.yaml
#
# PURPOSE: Set up development environment for web application
#
# REQUIREMENTS:
#   - Node.js 18+
#   - PostgreSQL running on localhost:5432
#   - Git repository initialized
#
# WHAT IT DOES:
#   1. Pulls latest code from main branch
#   2. Installs npm dependencies
#   3. Runs database migrations
#   4. Starts development server on port 3000
#
# AUTHOR: Your Name
# LAST UPDATED: 2025-01-18

name: session-start
# ... rest of configuration
```

## Troubleshooting

### Hook Doesn't Run

**Check 1: Is the hook enabled?**
```yaml
enabled: true  # Must be true!
```

**Check 2: Is the hook file named correctly?**
```
.taurus/hooks/session-start.yaml  ✅
.taurus/hooks/session_start.yaml  ❌ (underscore)
.taurus/hook/session-start.yaml   ❌ (missing 's')
```

**Check 3: Is hooks enabled in config?**
```yaml
# ~/.taurus/config.yaml
hooksEnabled: true  # Must be true!
```

### Hook Fails with Error

**Debug the command:**
```bash
# Copy the command from your hook
cd ~/my-project

# Run it manually to see the error
npm run migrate

# Check exit code
echo $?  # Should be 0 for success
```

**Add error handling:**
```yaml
commands:
  - name: Migrate database
    command: |
      npm run migrate 2>&1 || {
        echo "❌ Migration failed!"
        echo "Check database connection and try again."
        exit 1
      }
```

### Hook Times Out

**Increase timeout:**
```yaml
commands:
  - name: Slow command
    command: npm run build
    timeout: 60000  # Increase from default 10s to 60s
```

**Or run in background:**
```yaml
commands:
  - name: Start server
    command: npm run dev
    background: true  # Don't wait for completion
```

## Advanced Patterns

### Pattern 1: Conditional Hooks Based on Git Branch

```yaml
# Only run in feature branches
commands:
  - name: Feature branch checks
    command: |
      BRANCH=$(git branch --show-current)
      if [[ "$BRANCH" == feature/* ]]; then
        echo "Running feature branch checks..."
        npm run lint
        npm test
      else
        echo "Not a feature branch, skipping checks"
      fi
```

### Pattern 2: Parallel Command Execution

```yaml
# Run multiple commands simultaneously
commands:
  - name: Parallel tasks
    command: |
      # Run in background and collect PIDs
      npm run lint &
      PID1=$!

      npm run typecheck &
      PID2=$!

      npm test:unit &
      PID3=$!

      # Wait for all to complete
      wait $PID1 $PID2 $PID3

      echo "All parallel tasks complete!"
```

### Pattern 3: Hook Chaining

```yaml
# session-start hook triggers other setup scripts
commands:
  - name: Run project-specific setup
    command: |
      if [ -f "./.taurus/custom-setup.sh" ]; then
        bash ./.taurus/custom-setup.sh
      fi
```

Then create `.taurus/custom-setup.sh`:
```bash
#!/bin/bash
# Project-specific setup that varies per project

echo "Running custom setup for $(basename $(pwd))"

# Start Docker containers
docker-compose up -d

# Wait for services
./scripts/wait-for-services.sh

# Import test data
./scripts/import-test-data.sh
```

## Real-World Complete Example

Here's a complete hook setup for a production web application:

### .taurus/hooks/session-start.yaml
```yaml
name: session-start
description: Complete development environment setup
enabled: true

environment:
  NODE_ENV: development
  DATABASE_URL: postgresql://localhost:5432/myapp_dev

commands:
  # 1. Check prerequisites
  - name: Check prerequisites
    command: |
      echo "🔍 Checking prerequisites..."
      command -v node >/dev/null 2>&1 || { echo "❌ Node.js not found"; exit 1; }
      command -v docker >/dev/null 2>&1 || { echo "❌ Docker not found"; exit 1; }
      command -v pg_isready >/dev/null 2>&1 || { echo "❌ PostgreSQL client not found"; exit 1; }
      echo "✅ Prerequisites OK"
    continueOnError: false

  # 2. Start Docker services
  - name: Start Docker services
    command: |
      echo "🐳 Starting Docker services..."
      docker-compose up -d postgres redis
      sleep 2  # Wait for services to start
    continueOnError: false

  # 3. Pull latest code
  - name: Pull latest code
    command: |
      echo "📥 Pulling latest code..."
      git pull origin $(git branch --show-current) || echo "Already up-to-date"
    continueOnError: true

  # 4. Install dependencies
  - name: Install dependencies
    command: |
      echo "📦 Checking dependencies..."
      if [ package.json -nt node_modules/.timestamp ]; then
        npm install
        touch node_modules/.timestamp
      else
        echo "Dependencies up-to-date"
      fi
    continueOnError: false
    timeout: 60000

  # 5. Run database migrations
  - name: Run migrations
    command: |
      echo "🗄️  Running database migrations..."
      npx prisma migrate dev
    continueOnError: false

  # 6. Start development server
  - name: Start dev server
    command: npm run dev
    background: true

  # 7. Show environment status
  - name: Environment status
    command: |
      echo ""
      echo "✅ Development environment ready!"
      echo ""
      echo "📊 Status:"
      echo "  - Database: $(pg_isready -h localhost -p 5432 && echo '✅ Ready' || echo '❌ Not ready')"
      echo "  - Redis: $(redis-cli ping 2>/dev/null && echo '✅ Ready' || echo '❌ Not ready')"
      echo "  - Dev server: Starting on http://localhost:3000"
      echo ""
      echo "🌿 Branch: $(git branch --show-current)"
      echo "📝 Uncommitted changes: $(git status --short | wc -l)"
      echo ""
```

**What this does:**
1. ✅ Validates all required tools are installed
2. 🐳 Starts Docker services (database, cache)
3. 📥 Pulls latest code from current branch
4. 📦 Installs dependencies (only if package.json changed)
5. 🗄️ Runs database migrations
6. 🚀 Starts development server in background
7. 📊 Shows environment status

**Time saved:** ~5 minutes of manual setup per session!

## Next Steps

Now you can automate your workflow! Continue learning:

1. **[Slash Commands Tutorial](./04-slash-commands.md)** - Create custom shortcuts
2. **[MCP Integration](./06-mcp-integration.md)** - Connect external tools
3. **[Code Review Workflow](./09-code-review-workflow.md)** - See hooks in action

---

**Automate everything! ⚡**

**Next:** [Slash Commands Tutorial](./04-slash-commands.md)
