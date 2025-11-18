# Tutorial 8: Session Management

Save your work, resume conversations, and maintain context across multiple coding sessions.

## What Are Sessions?

Sessions are saved conversations with Claude. Every interaction is automatically saved so you can:
- **Resume work** after breaks
- **Review** past conversations
- **Share** solutions with teammates
- **Track** what was accomplished

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Taurus CLI installed

## How Sessions Work

### Automatic Session Creation

Every time you start Taurus, a session begins:

```bash
taurus chat

# Session automatically created
# Saved to: ~/.taurus/sessions/2025-01-18_abc123.json
```

**Session naming:** `YYYY-MM-DD_<random-id>.json`

### Automatic Saving

Your conversation is saved automatically:
- After every message
- After every tool execution
- When you exit Taurus

**No manual save needed!**

## Working with Sessions

### Viewing All Sessions

```bash
# List all saved sessions
ls -lh ~/.taurus/sessions/

# Output:
# -rw-r--r--  1 user  staff   15K Jan 18 10:23 2025-01-18_abc123.json
# -rw-r--r--  1 user  staff   8.2K Jan 17 14:45 2025-01-17_def456.json
# -rw-r--r--  1 user  staff   22K Jan 17 09:15 2025-01-17_ghi789.json
```

### Viewing Session Content

```bash
# View session details
cat ~/.taurus/sessions/2025-01-18_abc123.json

# Shows:
{
  "sessionId": "abc123",
  "created": "2025-01-18T10:23:45.123Z",
  "updated": "2025-01-18T11:45:12.456Z",
  "messages": [
    {
      "role": "user",
      "content": "Help me debug the login issue"
    },
    {
      "role": "assistant",
      "content": "I'll help you debug the login issue..."
    },
    ...
  ],
  "toolCalls": [
    {
      "tool": "read",
      "file": "src/auth/login.ts",
      "timestamp": "2025-01-18T10:24:15.789Z"
    }
  ]
}
```

### Resuming a Session

**Method 1: Resume Last Session**
```bash
# Resume the most recent session
taurus chat --resume

# Or using short form
taurus chat -r
```

**Method 2: Resume Specific Session**
```bash
# Resume by session ID
taurus chat --session abc123

# Or using short form
taurus chat -s abc123
```

**What happens when resuming:**
```bash
taurus chat --resume

# Output:
# 🐂 Taurus CLI - Claude Code Clone
# 📂 Resuming session from 2025-01-18 10:23 AM
# 💬 17 messages loaded
#
# Last conversation:
# You: Help me debug the login issue
# Claude: I found the issue in src/auth/login.ts:45...
#
# taurus>
```

## Real-World Session Examples

### Example 1: Multi-Day Feature Development

**Day 1: Start feature**
```bash
taurus chat

taurus> I need to implement a password reset feature

Claude: I'll help you implement password reset. Let me break this down...
[Conversation continues, creates migrations, endpoints, tests]

taurus> Great! I need to stop for today. I'll continue tomorrow.

# Exit (Ctrl+C)
# Session automatically saved: 2025-01-18_abc123.json
```

**Day 2: Resume and continue**
```bash
taurus chat --resume

# Loads yesterday's conversation
# Claude remembers the entire context!

taurus> Let's add email notifications to the password reset flow

Claude: I remember the password reset feature we implemented yesterday. Let me add email notifications...
[Continues from where you left off]
```

### Example 2: Debugging Across Sessions

**Session 1: Initial investigation**
```bash
taurus chat

taurus> Users report slow performance on the dashboard

Claude: Let me investigate...
[Reads dashboard code, finds potential issues]

Claude: I found several issues:
1. N+1 queries in UserWidget
2. Large JSON payload
3. No caching

It's late, shall we continue this tomorrow?

taurus> Yes, let's fix these tomorrow

# Exit and save session
```

**Session 2: Resume and fix**
```bash
taurus chat --resume

taurus> Let's fix those performance issues we found yesterday

Claude: Yes! We identified 3 performance issues:
1. N+1 queries in UserWidget (most critical)
2. Large JSON payload (10MB)
3. No caching

Let's start with the N+1 queries...
[Implements fixes with full context]
```

### Example 3: Team Collaboration

**Developer A: Investigates issue**
```bash
taurus chat

taurus> Investigate why the payment integration is failing

Claude: [Investigates, finds root cause]

# Save session ID: xyz789
```

**Developer A shares with Developer B:**
```
Hey team, I investigated the payment issue.
Session ID: xyz789
Check ~/.taurus/sessions/2025-01-18_xyz789.json
```

**Developer B: Views and continues**
```bash
# Copy session file to their machine
cp /shared/sessions/2025-01-18_xyz789.json ~/.taurus/sessions/

# Resume that session
taurus chat --session xyz789

taurus> Thanks for the investigation. Let me implement the fix.

Claude: [Has full context from Developer A's investigation]
[Implements fix]
```

## Session Management Commands

### Finding Session IDs

**Method 1: List sessions with dates**
```bash
ls -lt ~/.taurus/sessions/ | head -10

# Shows most recent 10 sessions
```

**Method 2: Search session content**
```bash
# Find sessions about "authentication"
grep -l "authentication" ~/.taurus/sessions/*.json

# Output:
# ~/.taurus/sessions/2025-01-18_abc123.json
# ~/.taurus/sessions/2025-01-15_def456.json
```

**Method 3: Use jq for pretty queries**
```bash
# Install jq if needed: brew install jq (Mac) or apt install jq (Linux)

# Find sessions that used the 'write' tool
jq '.toolCalls[] | select(.tool=="write") | .file' ~/.taurus/sessions/2025-01-18_abc123.json

# Show first user message of each session
for file in ~/.taurus/sessions/*.json; do
  echo "Session: $(basename $file)"
  jq -r '.messages[0].content' "$file"
  echo "---"
done
```

### Cleaning Old Sessions

Sessions can grow large over time. Clean up old ones:

```bash
# Delete sessions older than 30 days
find ~/.taurus/sessions/ -name "*.json" -mtime +30 -delete

# Delete all sessions except last 10
cd ~/.taurus/sessions/
ls -t | tail -n +11 | xargs rm

# Archive old sessions
mkdir -p ~/.taurus/archive
find ~/.taurus/sessions/ -name "*.json" -mtime +30 -exec mv {} ~/.taurus/archive/ \;
```

### Session Backup

Backup important sessions:

```bash
# Backup all sessions
tar -czf taurus-sessions-backup-$(date +%Y%m%d).tar.gz ~/.taurus/sessions/

# Restore from backup
tar -xzf taurus-sessions-backup-20250118.tar.gz -C ~/
```

## Session Organization

### Naming Convention

Add descriptive names by creating symlinks:

```bash
cd ~/.taurus/sessions/

# Create descriptive symlink
ln -s 2025-01-18_abc123.json password-reset-implementation.json

# Now you can resume by name
taurus chat --session password-reset-implementation
```

### Organizing by Project

```bash
# Create project-specific session directories
mkdir -p ~/.taurus/sessions/project-a
mkdir -p ~/.taurus/sessions/project-b

# Move sessions to project folders
mv ~/.taurus/sessions/2025-01-18_abc123.json ~/.taurus/sessions/project-a/

# Configure Taurus to use project directory
# (in project-a directory)
echo "sessionDirectory: ~/.taurus/sessions/project-a" > .taurus/config.yaml
```

## Advanced Session Techniques

### Session Templates

Create session templates for common tasks:

```bash
# Create template directory
mkdir -p ~/.taurus/templates

# Create code review template
cat > ~/.taurus/templates/code-review.json << 'EOF'
{
  "sessionId": "new",
  "messages": [
    {
      "role": "user",
      "content": "Please review the following code for:\n1. Security vulnerabilities\n2. Performance issues\n3. Code quality\n4. Missing tests\n\nProvide specific fixes with examples."
    }
  ]
}
EOF

# Use template
cp ~/.taurus/templates/code-review.json ~/.taurus/sessions/2025-01-18_review123.json
taurus chat --session review123
```

### Session Analysis

Analyze your productivity:

```bash
#!/bin/bash
# session-stats.sh - Analyze session statistics

echo "📊 Taurus Session Statistics"
echo "============================"

# Total sessions
total=$(ls ~/.taurus/sessions/*.json 2>/dev/null | wc -l)
echo "Total sessions: $total"

# Sessions this week
week=$(find ~/.taurus/sessions/ -name "*.json" -mtime -7 | wc -l)
echo "This week: $week"

# Most used tools
echo -e "\nMost used tools:"
jq -r '.toolCalls[].tool' ~/.taurus/sessions/*.json 2>/dev/null | \
  sort | uniq -c | sort -rn | head -5

# Average session length
echo -e "\nAverage messages per session:"
jq '.messages | length' ~/.taurus/sessions/*.json 2>/dev/null | \
  awk '{sum+=$1} END {print sum/NR}'

# Files modified most
echo -e "\nMost modified files:"
jq -r '.toolCalls[] | select(.tool=="edit" or .tool=="write") | .file' \
  ~/.taurus/sessions/*.json 2>/dev/null | \
  sort | uniq -c | sort -rn | head -10
```

**Example output:**
```
📊 Taurus Session Statistics
============================
Total sessions: 47
This week: 12

Most used tools:
  145 read
   89 edit
   67 grep
   45 bash
   34 write

Average messages per session:
23.4

Most modified files:
   12 src/api/users.ts
    8 src/auth/login.ts
    7 src/utils/validation.ts
    ...
```

### Export Sessions

Export sessions to markdown for documentation:

```bash
#!/bin/bash
# export-session.sh - Export session to markdown

SESSION_FILE=$1
OUTPUT_FILE="${SESSION_FILE%.json}.md"

echo "# Taurus Session Export" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Extract session metadata
jq -r '
  "**Created:** \(.created)\n" +
  "**Messages:** \(.messages | length)\n" +
  "**Tools Used:** \(.toolCalls | length)\n"
' "$SESSION_FILE" >> "$OUTPUT_FILE"

echo -e "\n## Conversation\n" >> "$OUTPUT_FILE"

# Extract messages
jq -r '
  .messages[] |
  "### \(.role | ascii_upcase)\n\n\(.content)\n"
' "$SESSION_FILE" >> "$OUTPUT_FILE"

echo "Exported to: $OUTPUT_FILE"
```

**Usage:**
```bash
./export-session.sh ~/.taurus/sessions/2025-01-18_abc123.json

# Creates: 2025-01-18_abc123.md
```

## Session Configuration

### Custom Session Directory

```yaml
# ~/.taurus/config.yaml
sessionDirectory: ~/my-custom-sessions/

# Or per-project
# .taurus/config.yaml (in project directory)
sessionDirectory: ./.taurus/sessions
```

### Session Retention

Configure automatic cleanup:

```yaml
# ~/.taurus/config.yaml
sessions:
  retentionDays: 30        # Auto-delete sessions older than 30 days
  maxSessions: 100         # Keep max 100 sessions
  autoArchive: true        # Archive instead of delete
  archiveDirectory: ~/.taurus/archive
```

**Note:** These are examples - implement in your configuration system.

## Best Practices

### 1. Clear Session Boundaries

Start new sessions for new tasks:

```bash
# ❌ Don't continue unrelated work in same session
taurus> Fix login bug
[...]
taurus> Now help me plan my vacation
[Context gets confused]

# ✅ Start new session for new task
taurus> Fix login bug
[Complete task]
# Exit

# New session
taurus chat
taurus> Plan vacation
```

### 2. Descriptive First Messages

Your first message sets the context:

```bash
# ❌ Vague
taurus> help me

# ✅ Clear context
taurus> I need to implement OAuth2 authentication for our API. Current auth uses basic JWT tokens in src/auth/. Users are stored in PostgreSQL.
```

### 3. Resume When Context Matters

Resume sessions when:
- ✅ Continuing multi-day work
- ✅ Building on previous conversation
- ✅ Debugging same issue

Start fresh when:
- ✅ Completely new task
- ✅ Different codebase area
- ✅ Session has too many unrelated topics

### 4. Regular Cleanup

```bash
# Weekly cleanup script
# Keep last 20 sessions, archive the rest

cd ~/.taurus/sessions/
ls -t *.json | tail -n +21 | xargs -I {} mv {} ../archive/
```

### 5. Backup Important Sessions

```bash
# Before major refactoring
cp ~/.taurus/sessions/current-session.json \
   ~/.taurus/backups/before-refactor-$(date +%Y%m%d).json
```

## Troubleshooting

### Session File Corrupted

**Symptoms:** Can't resume session, JSON parse error

**Fix:**
```bash
# Validate JSON
jq . ~/.taurus/sessions/2025-01-18_abc123.json

# If invalid, try to recover
cp ~/.taurus/sessions/2025-01-18_abc123.json backup.json
jq '.' backup.json > ~/.taurus/sessions/2025-01-18_abc123.json

# If can't recover, start new session
```

### Can't Find Session

**Check session directory:**
```bash
# Where are sessions stored?
cat ~/.taurus/config.yaml | grep sessionDirectory

# List all sessions
find ~/ -name "*.json" -path "*/.taurus/sessions/*" 2>/dev/null
```

### Session Too Large

**Symptoms:** Slow to load, high memory usage

**Solution:** Start fresh, archive old session
```bash
# Archive large session
mv ~/.taurus/sessions/large-session.json ~/.taurus/archive/

# Start new session for continued work
taurus chat

taurus> Continuing from previous session (archived). Here's what we were working on: [summary]
```

## Real-World Workflows

### Workflow 1: Weekly Sprint Planning

```bash
# Monday: Plan sprint
taurus chat

taurus> Help me plan this week's sprint. We need to:
1. Implement user notifications
2. Fix critical bugs
3. Improve test coverage

[Plan entire week]
# Session: 2025-01-15_sprint_planning.json

# Tuesday-Friday: Reference plan
taurus chat --session sprint_planning

taurus> According to our plan, today I should work on user notifications. Let's start with the database schema.

[Work continues with full context]
```

### Workflow 2: Learning Session

```bash
# Session 1: Learn React hooks
taurus chat

taurus> Teach me React hooks with practical examples

[Long learning conversation]

# Next day: Quick reference
taurus chat --session <yesterday's id>

taurus> What was that pattern you showed me for data fetching with useEffect?

Claude: Yes! Yesterday we discussed the useEffect pattern for data fetching...
[Instant recall]
```

### Workflow 3: Incident Response

```bash
# Incident starts
taurus chat

taurus> Production is down! Users can't login. Error: "Database connection timeout"

[Investigation and fix]

# Incident resolved
taurus> Create a post-mortem document from this session

Claude: Based on our investigation:

POST-MORTEM: Login Outage (2025-01-18)
========================================
Duration: 45 minutes
Impact: All users unable to login

Root Cause:
Database connection pool exhausted...

[Complete post-mortem generated from session history]
```

## Next Steps

Master session management! Continue to workflow tutorials:

1. **[Code Review Workflow](./09-code-review-workflow.md)** - Complete code review process
2. **[Project Setup Workflow](./10-project-setup-workflow.md)** - Automated project setup
3. **[Documentation Workflow](./11-documentation-workflow.md)** - Generate docs

---

**Never lose your work! 💾**

**Next:** [Code Review Workflow Tutorial](./09-code-review-workflow.md)
