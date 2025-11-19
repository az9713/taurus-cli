# Taurus CLI - New Features

This document describes the 5 major new features added to Taurus CLI that extend beyond Claude Code's capabilities.

## Table of Contents

1. [Multi-Model AI Provider Support](#1-multi-model-ai-provider-support)
2. [Collaborative Sessions](#2-collaborative-sessions)
3. [Context-Aware Integrations Hub](#3-context-aware-integrations-hub)
4. [Time-Travel Session Replay](#4-time-travel-session-replay)
5. [AI-Powered Cron Jobs](#5-ai-powered-cron-jobs)

---

## 1. Multi-Model AI Provider Support

### Overview

Taurus now supports multiple AI providers beyond Anthropic Claude, including OpenAI GPT and local models via Ollama. The system intelligently routes requests to the best provider based on your task.

### Supported Providers

- **Anthropic Claude** - Claude Sonnet, Opus, and Haiku models
- **OpenAI** - GPT-4, GPT-4 Turbo, GPT-3.5 Turbo
- **Ollama** - Local models (Llama 2, CodeLlama, Mistral, etc.)

### Configuration

```yaml
providers:
  anthropic:
    apiKey: ${ANTHROPIC_API_KEY}
    models:
      - claude-sonnet-4-5-20250929
      - claude-opus-4-20250514

  openai:
    apiKey: ${OPENAI_API_KEY}
    models:
      - gpt-4-turbo
      - gpt-4

  ollama:
    baseUrl: http://localhost:11434
    models:
      - codellama
      - llama2
```

### Automatic Routing

Taurus can automatically select the best provider based on your request:

```yaml
providerRouting:
  rules:
    - pattern: "quick|fast|simple"
      provider: anthropic
      model: claude-haiku-4-20250514

    - pattern: "complex|detailed"
      provider: anthropic
      model: claude-opus-4-20250514

    - pattern: "local|offline|private"
      provider: ollama
      model: codellama
```

### Usage Examples

```bash
# Explicitly specify provider
taurus> Using OpenAI, write a function to sort an array

# Use local model for privacy
taurus> Using Ollama, help me refactor this code

# Let Taurus auto-route
taurus> Quick question: what's the syntax for async/await?
# → Uses Claude Haiku (fast model)

taurus> Write a comprehensive architectural design document
# → Uses Claude Opus (most capable model)
```

### Programmatic Usage

```typescript
import { ProviderManager, AnthropicProvider, OpenAIProvider } from 'taurus-cli';

const providerManager = new ProviderManager({
  providers: {
    anthropic: new AnthropicProvider({
      apiKey: process.env.ANTHROPIC_API_KEY,
    }),
    openai: new OpenAIProvider({
      apiKey: process.env.OPENAI_API_KEY,
    }),
  },
});

// Generate with specific provider
const response = await providerManager.generate(
  [{ role: 'user', content: 'Hello!' }],
  { provider: 'openai', model: 'gpt-4-turbo' }
);

// Auto-select best provider
const response2 = await providerManager.generate(
  [{ role: 'user', content: 'Quick code review needed' }]
);
```

### Cost Tracking

```typescript
const stats = providerManager.getUsageStats();
console.log(stats);
// {
//   anthropic: { requests: 45, totalCost: 1.23 },
//   openai: { requests: 12, totalCost: 0.56 }
// }
```

---

## 2. Collaborative Sessions

### Overview

Work together with your team in real-time. Multiple users can join the same Taurus session, see each other's cursors, and collaborate on code together.

### Features

- **Real-time sync** - See changes instantly across all connected users
- **Cursor tracking** - View where other users are working
- **Role-based permissions** - Admin, Editor, Viewer roles
- **Session recording** - Record and replay collaborative sessions
- **Chat integration** - Built-in messaging between collaborators

### Configuration

```yaml
collaboration:
  enabled: true
  serverPort: 8080
  serverHost: localhost
```

### Usage

**Start a collaborative session:**

```bash
taurus> /collab start
Session ID: abc123xyz
Share this URL: http://localhost:8080/session/abc123xyz
```

**Join an existing session:**

```bash
taurus chat --collab-join abc123xyz
```

**Invite collaborators:**

```bash
taurus> /collab invite user@example.com --role editor
```

### Programmatic Usage

```typescript
import { CollaborationServer, CollaborationClient } from 'taurus-cli';

// Server side
const server = new CollaborationServer({
  port: 8080,
});

const session = server.createSession({
  id: 'my-session',
  owner: 'user1',
  permissions: {
    allowAnonymous: false,
    requireApproval: true,
  },
});

// Client side
const client = new CollaborationClient({
  userId: 'user2',
  userName: 'John Doe',
});

await client.joinSession('my-session', 'http://localhost:8080');

client.on('message-received', (message) => {
  console.log(`${message.from}: ${message.content}`);
});

client.sendMessage('Hello everyone!');
```

### Use Cases

1. **Pair Programming** - Code together in real-time
2. **Code Reviews** - Review and discuss code changes together
3. **Debugging** - Collaborate on finding and fixing bugs
4. **Teaching** - Mentor junior developers in live sessions
5. **Remote Workshops** - Conduct training sessions

---

## 3. Context-Aware Integrations Hub

### Overview

Automatically fetch relevant context from external services when you mention them. No more manual copy-pasting of Jira tickets, GitHub issues, or Slack conversations.

### Supported Integrations

- **Jira** - Tickets, comments, linked issues
- **GitHub** - Issues, PRs, comments
- **Slack** - Messages, threads
- **Confluence** - Documentation pages

### Configuration

```yaml
integrations:
  jira:
    url: https://your-company.atlassian.net
    email: your-email@company.com
    apiToken: ${JIRA_API_TOKEN}

  github:
    token: ${GITHUB_TOKEN}

  slack:
    token: ${SLACK_TOKEN}
    lookbackDays: 7

  confluence:
    url: https://your-company.atlassian.net/wiki
    email: your-email@company.com
    apiToken: ${CONFLUENCE_API_TOKEN}
```

### Automatic Context Fetching

Simply mention the integration identifier in your message:

```bash
# Jira
taurus> Help me fix the bug in JIRA-1234
# → Auto-fetches ticket details, description, comments, linked issues

# GitHub
taurus> Review the changes in #456
# → Auto-fetches PR/issue details, comments, file changes

taurus> Check out owner/repo#123
# → Fetches from specific repository

# Slack
taurus> What did we discuss about the deployment?
# → Searches recent Slack messages

# Confluence
taurus> Implement the feature described in page 123456789
# → Fetches Confluence page content
```

### Context Rules

Define automatic actions based on keywords:

```yaml
contextRules:
  - trigger: "bug|issue|error"
    actions:
      - fetchRelatedSlackMessages
      - fetchRelatedConfluenceDocs
    priority: high

  - trigger: "deploy|release"
    actions:
      - fetchRelatedSlackMessages
    priority: medium
```

### Programmatic Usage

```typescript
import { IntegrationManager, JiraIntegration, GitHubIntegration } from 'taurus-cli';

const integrationManager = new IntegrationManager({
  integrations: [
    {
      type: 'jira',
      name: 'company-jira',
      enabled: true,
      config: {
        url: 'https://company.atlassian.net',
        email: 'user@company.com',
        apiToken: process.env.JIRA_API_TOKEN,
      },
    },
    {
      type: 'github',
      name: 'github',
      enabled: true,
      config: {
        token: process.env.GITHUB_TOKEN,
      },
    },
  ],
});

// Auto-fetch context
const context = await integrationManager.autoFetchContext(
  'Fix bug in JIRA-1234 related to #567'
);

// Manual search
const results = await integrationManager.searchAll('authentication bug');

// Update item
await integrationManager.updateItem('jira', 'JIRA-1234', {
  status: 'In Progress',
});
```

### Benefits

- **Save time** - No manual context gathering
- **Stay in flow** - Don't leave your terminal
- **Better context** - AI has full background information
- **Automatic updates** - Context stays current

---

## 4. Time-Travel Session Replay

### Overview

Record your entire Taurus session with file state snapshots. Jump back to any point in time, see what changed, and restore previous states.

### Features

- **Automatic snapshots** - Captures state before/after significant actions
- **File state tracking** - Records file contents and changes
- **Conversation replay** - See full conversation history
- **Diff visualization** - Compare any two points in time
- **Restore capability** - Roll back to previous states
- **Video export** - Generate replay videos

### Configuration

```yaml
replay:
  enabled: true
  snapshotInterval: 300000  # 5 minutes
  maxSnapshots: 100
```

### Usage

**Navigate through time:**

```bash
# View timeline
taurus> /replay timeline

# Jump to specific snapshot
taurus> /replay jump 15

# Go back/forward
taurus> /replay back 3
taurus> /replay forward 2

# Jump to time
taurus> /replay goto 14:30

# View diff
taurus> /replay diff 10 15
```

**Restore state:**

```bash
# Restore files to snapshot
taurus> /replay restore 12

# Restore conversation only
taurus> /replay restore 12 --conversation-only
```

**Export:**

```bash
# Export timeline
taurus> /replay export timeline.json

# Generate video
taurus> /replay export video.mp4
```

### Programmatic Usage

```typescript
import { SnapshotManager, ReplayEngine } from 'taurus-cli';

// Create snapshot manager
const snapshotManager = new SnapshotManager({
  sessionId: 'my-session',
  snapshotDir: './snapshots',
});

// Create snapshots
snapshotManager.createSnapshot('message', 'User asked a question', {
  query: 'How do I...?',
});

snapshotManager.createSnapshot('file-change', 'Updated main.ts', {
  file: 'src/main.ts',
});

// Replay engine
const replayEngine = new ReplayEngine(snapshotManager);

// Navigate
replayEngine.jumpToSnapshot(5);
replayEngine.stepForward();
replayEngine.stepBackward();

// Get diff
const diff = replayEngine.diff(5, 10);
console.log(diff.summary);

// Restore
await replayEngine.restoreSnapshot(5);
```

### Use Cases

1. **Debugging** - See exactly when a bug was introduced
2. **Learning** - Review your development process
3. **Recovery** - Undo mistaken changes
4. **Auditing** - Track what AI suggested and when
5. **Sharing** - Show others your development journey

---

## 5. AI-Powered Cron Jobs

### Overview

Schedule automated AI-powered tasks that run on a cron schedule. Let Taurus automatically audit security, check test coverage, update dependencies, and more.

### Task Types

- **Security Audit** - Scan for vulnerabilities
- **Test Coverage** - Analyze code coverage
- **Dependency Update** - Check for outdated packages
- **Performance Audit** - Run performance benchmarks

### Configuration

```yaml
scheduler:
  enabled: true

  tasks:
    - name: security-audit
      description: Daily security scan
      schedule: "0 9 * * *"  # Daily at 9 AM
      type: security-audit
      enabled: true
      action: create-github-issue
      notifications:
        slack: true
        email: true

    - name: coverage-check
      description: Test coverage check
      schedule: "0 */6 * * *"  # Every 6 hours
      type: test-coverage
      enabled: true
      action: create-pr

    - name: dependency-update
      description: Weekly dependency check
      schedule: "0 9 * * MON"  # Every Monday
      type: dependency-update
      enabled: true
      action: create-pr
```

### Actions

When findings are detected, tasks can:

- **create-github-issue** - Create GitHub issue with findings
- **create-pr** - Create pull request with fixes
- **notify** - Send Slack/email notifications
- **auto-fix** - Automatically fix issues (use with caution)

### Usage

**Manage tasks:**

```bash
# List all tasks
taurus> /scheduler list

# Run task manually
taurus> /scheduler run security-audit

# Enable/disable task
taurus> /scheduler enable security-audit
taurus> /scheduler disable coverage-check

# View task history
taurus> /scheduler history security-audit

# View statistics
taurus> /scheduler stats
```

### Programmatic Usage

```typescript
import { SchedulerManager } from 'taurus-cli';

const scheduler = new SchedulerManager({
  tasks: [
    {
      name: 'security-audit',
      description: 'Daily security scan',
      schedule: '0 9 * * *',
      type: 'security-audit',
      enabled: true,
      action: 'create-github-issue',
      config: {
        scanPaths: ['src/', 'lib/'],
        excludePatterns: ['*.test.ts'],
      },
    },
  ],
});

// Start scheduler
scheduler.start();

// Listen for events
scheduler.on('task-completed', (execution) => {
  console.log(`Task ${execution.taskName} completed`);
  console.log(`Found ${execution.findings?.length} issues`);
});

scheduler.on('task-failed', (execution) => {
  console.error(`Task ${execution.taskName} failed: ${execution.error}`);
});

// Manual execution
const result = await scheduler.runTaskByName('security-audit');

// Get statistics
const stats = scheduler.getStats();
console.log(`Success rate: ${stats.averageSuccessRate}%`);

// Stop scheduler
scheduler.stop();
```

### Example Workflow

**Daily Security Audit:**

1. Scheduler runs security audit at 9 AM
2. Finds 3 vulnerabilities in dependencies
3. Creates GitHub issue with details
4. Sends Slack notification to team
5. Team reviews and fixes issues

**Weekly Dependency Updates:**

1. Scheduler checks for outdated packages every Monday
2. Finds 5 packages with updates available
3. Creates PR with updated package.json
4. Runs tests automatically
5. Team reviews and merges if tests pass

### Benefits

- **Proactive monitoring** - Catch issues before they become problems
- **Automated maintenance** - Reduce manual maintenance work
- **Consistent checks** - Never forget to run important audits
- **Team notifications** - Keep everyone informed
- **Audit trail** - Track all automated checks and findings

---

## Feature Comparison

| Feature | Claude Code | Taurus CLI |
|---------|-------------|------------|
| Single AI Provider | ✅ | ✅ |
| Multiple AI Providers | ❌ | ✅ |
| Auto Provider Routing | ❌ | ✅ |
| Collaborative Sessions | ❌ | ✅ |
| External Integrations | ❌ | ✅ |
| Auto-Context Fetching | ❌ | ✅ |
| Session Recording | ❌ | ✅ |
| Time-Travel | ❌ | ✅ |
| Scheduled Tasks | ❌ | ✅ |
| Cost Tracking | ❌ | ✅ |

---

## Getting Started

1. **Update your config:**
   ```bash
   cp config.example.yaml ~/.taurus/config.yaml
   ```

2. **Set environment variables:**
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   export OPENAI_API_KEY=sk-...  # Optional
   export JIRA_API_TOKEN=...     # Optional
   export GITHUB_TOKEN=...       # Optional
   ```

3. **Start using features:**
   ```bash
   taurus chat
   ```

4. **Try examples:**
   ```bash
   # Multi-provider
   taurus> Using GPT-4, write me a sorting algorithm

   # Integrations
   taurus> Fix the bug in JIRA-1234

   # Time-travel
   taurus> /replay timeline

   # Scheduler
   taurus> /scheduler run security-audit
   ```

---

## Best Practices

### Multi-Provider

- Use Haiku for quick/simple tasks
- Use Opus for complex reasoning
- Use local models for sensitive data
- Set up routing rules for automatic selection

### Collaboration

- Define clear roles (admin, editor, viewer)
- Use session recording for important sessions
- Share session IDs securely
- Review permissions before sharing

### Integrations

- Configure only integrations you need
- Use specific patterns for better context
- Review fetched context before sending
- Set appropriate lookback periods

### Time-Travel

- Enable auto-snapshots for important sessions
- Create manual snapshots before risky operations
- Review diffs before restoring
- Export timelines for audit trails

### Scheduler

- Start with notifications only
- Test thoroughly before enabling auto-fixes
- Monitor task history regularly
- Adjust schedules based on team needs

---

## Troubleshooting

### Multi-Provider Issues

```bash
# Check provider status
taurus> /providers status

# Test specific provider
taurus> /providers test openai

# View usage statistics
taurus> /providers stats
```

### Integration Issues

```bash
# Validate credentials
taurus> /integrations validate

# Clear context cache
taurus> /integrations clear-cache

# Test specific integration
taurus> /integrations test jira JIRA-1234
```

### Replay Issues

```bash
# Verify snapshots
taurus> /replay verify

# Clear old snapshots
taurus> /replay cleanup --older-than 30d

# Rebuild timeline
taurus> /replay rebuild
```

### Scheduler Issues

```bash
# Check task logs
taurus> /scheduler logs security-audit

# Dry run task
taurus> /scheduler dry-run coverage-check

# Reset task history
taurus> /scheduler reset security-audit
```

---

## API Documentation

For detailed API documentation, see:

- [Multi-Provider API](./docs/api/providers.md)
- [Collaboration API](./docs/api/collaboration.md)
- [Integrations API](./docs/api/integrations.md)
- [Replay API](./docs/api/replay.md)
- [Scheduler API](./docs/api/scheduler.md)

---

## Contributing

We welcome contributions! See [CONTRIBUTING.md](./CONTRIBUTING.md) for guidelines.

---

## License

MIT License - see [LICENSE](./LICENSE) for details.
