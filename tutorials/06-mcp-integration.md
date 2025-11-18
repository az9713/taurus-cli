# Tutorial 6: MCP Integration

Connect Taurus to external tools and data sources using the Model Context Protocol (MCP). Extend Claude's capabilities beyond local files.

## What is MCP?

**Model Context Protocol (MCP)** is a standard for connecting AI assistants to external tools, databases, APIs, and services.

**Real-world examples:**
- 🗄️ Query your PostgreSQL database directly from Claude
- 📁 Access files outside your project directory
- 🐙 Interact with GitHub (issues, PRs, repos)
- 🔍 Search your company's internal documentation
- 📊 Fetch data from Google Sheets/Excel files

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Node.js 18+ installed
✅ Understanding of command-line tools
✅ Taurus CLI installed

## Understanding MCP Architecture

```
┌─────────────┐
│   Taurus    │
│   (Client)  │
└──────┬──────┘
       │
       │ MCP Protocol (JSON-RPC)
       │
       ├──────────┬──────────┬──────────┐
       │          │          │          │
   ┌───▼───┐  ┌──▼──┐   ┌───▼───┐  ┌──▼──┐
   │  File │  │ Git │   │Postgres│  │ ... │
   │Server │  │Hub  │   │ Server │  │     │
   └───────┘  └─────┘   └────────┘  └─────┘
```

**Key Concepts:**
- **MCP Server:** External tool that provides capabilities
- **MCP Client:** Taurus (connects to servers)
- **Transport:** Communication method (stdio or HTTP)
- **Tools:** Functions provided by servers (like `read_file`, `query_database`)
- **Resources:** Data sources (like files, database rows)

## Quick Start: Your First MCP Server

### Step 1: Install an MCP Server

Let's install the filesystem server to access files anywhere on your computer:

```bash
# Install globally
npm install -g @modelcontextprotocol/server-filesystem

# Verify installation
npx @modelcontextprotocol/server-filesystem --version
```

### Step 2: Configure Taurus to Use the Server

```bash
# Edit your Taurus config
nano ~/.taurus/config.yaml
```

Add the MCP server configuration:

```yaml
# ~/.taurus/config.yaml
apiKey: sk-ant-your-key-here
model: claude-sonnet-4-5-20250929
maxTokens: 8096
hooksEnabled: true

# MCP Server Configuration
mcpServers:
  - name: filesystem
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-filesystem'
      - '/Users/yourname/Documents'  # Directory to access
    env:
      NODE_ENV: production
```

**Important:** Replace `/Users/yourname/Documents` with the actual path you want to access!

### Step 3: Test the MCP Server

```bash
# Start Taurus
taurus chat

# Try accessing a file outside your project
taurus> Read the file ~/Documents/report.pdf and summarize it

# Taurus will:
# 1. Connect to filesystem MCP server
# 2. Use the filesystem__read_file tool
# 3. Access ~/Documents/report.pdf
# 4. Summarize the content
```

**What happened:**
```
[Connecting to MCP servers...]
✓ Connected to filesystem server

[Using tool: filesystem__read_file]
File: /Users/yourname/Documents/report.pdf
[Content extracted]

Summary:
The report covers Q4 financial performance with the following highlights:
- Revenue: $2.3M (+15% YoY)
- Customer growth: 450 new customers
- Churn rate: 3.2% (down from 4.1%)
...
```

## MCP Transport Types

MCP supports two transport methods:

### Transport 1: Stdio (Standard Input/Output)

**Best for:** Local command-line tools

```yaml
mcpServers:
  - name: my-tool
    transport: stdio
    command: npx          # Or: python, node, ./my-script
    args:
      - my-mcp-server
      - --option
      - value
    env:
      API_KEY: secret
```

**How it works:**
1. Taurus spawns the command as a subprocess
2. Communicates via stdin/stdout
3. Messages are JSON-RPC over newline-delimited JSON

**Example:** Database access
```yaml
- name: postgres
  transport: stdio
  command: npx
  args:
    - '@modelcontextprotocol/server-postgres'
    - 'postgresql://localhost:5432/mydb'
```

### Transport 2: HTTP with Server-Sent Events (SSE)

**Best for:** Remote services, long-running servers

```yaml
mcpServers:
  - name: api-service
    transport: http
    url: http://localhost:3000/mcp
    headers:
      Authorization: Bearer your-token-here
      X-Custom-Header: value
```

**How it works:**
1. Taurus makes HTTP POST requests
2. Server responds via Server-Sent Events (SSE)
3. Supports long-running operations

**Example:** Remote documentation search
```yaml
- name: docs
  transport: http
  url: https://docs.mycompany.com/mcp
  headers:
    Authorization: Bearer ${DOCS_API_KEY}
```

## Real-World MCP Configurations

### Configuration 1: GitHub Integration

Access GitHub repositories, issues, and pull requests:

```bash
# Install GitHub MCP server
npm install -g @modelcontextprotocol/server-github
```

```yaml
# ~/.taurus/config.yaml
mcpServers:
  - name: github
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-github'
    env:
      GITHUB_TOKEN: ghp_your_github_personal_access_token
```

**Usage:**
```
taurus> List all open issues in the repository az9713/taurus-cli

[Uses github__list_issues tool]

Open Issues (5):
1. #23: Add support for custom themes
2. #24: Bug: Session not saving on exit
3. #25: Feature request: Vim mode
...

taurus> Create a new issue titled "Add Windows support" with description "Users on Windows can't run Taurus"

[Uses github__create_issue tool]

✓ Created issue #26: Add Windows support
URL: https://github.com/az9713/taurus-cli/issues/26
```

### Configuration 2: Database Access

Query your database directly from Taurus:

```bash
# Install PostgreSQL MCP server
npm install -g @modelcontextprotocol/server-postgres
```

```yaml
# ~/.taurus/config.yaml
mcpServers:
  - name: database
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-postgres'
      - 'postgresql://user:password@localhost:5432/myapp_dev'
    env:
      NODE_ENV: development
```

**Usage:**
```
taurus> How many users registered in the last 7 days?

[Uses database__query tool]

SELECT COUNT(*) as user_count
FROM users
WHERE created_at >= NOW() - INTERVAL '7 days'

Result: 142 users registered in the last 7 days

taurus> Show me the top 10 users by order count

[Generates and executes query]

SELECT users.email, COUNT(orders.id) as order_count
FROM users
JOIN orders ON users.id = orders.user_id
GROUP BY users.id
ORDER BY order_count DESC
LIMIT 10

Results:
1. john@example.com - 45 orders
2. sarah@example.com - 38 orders
...
```

### Configuration 3: Multiple Filesystems

Access multiple directories with different permissions:

```yaml
mcpServers:
  # Project files
  - name: project
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-filesystem'
      - '/Users/yourname/projects'

  # Documentation
  - name: docs
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-filesystem'
      - '/Users/yourname/Documents/docs'

  # Shared team resources
  - name: shared
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-filesystem'
      - '/Volumes/TeamDrive/resources'
```

**Usage:**
```
taurus> Compare the API documentation in docs with the actual implementation in my project

[Uses project__read_file and docs__read_file]
[Analyzes both]

Discrepancies found:

1. Authentication endpoint
   Docs say: POST /api/v1/auth/login
   Code implements: POST /api/auth/login (missing v1)

2. Response format
   Docs say: { token: string, expiresIn: number }
   Code returns: { accessToken: string, expiresAt: string }

...
```

### Configuration 4: Google Sheets Integration

Access and manipulate Google Sheets:

```yaml
mcpServers:
  - name: sheets
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-google-sheets'
    env:
      GOOGLE_SHEETS_CREDENTIALS: /path/to/credentials.json
      GOOGLE_SHEETS_TOKEN: /path/to/token.json
```

**Usage:**
```
taurus> Read the sales data from the Q4 Report sheet and calculate total revenue

[Uses sheets__read tool]
[Processes data]

Q4 Sales Summary:
- Total Revenue: $458,392
- Number of Transactions: 1,247
- Average Order Value: $367.42
- Top Product: Premium Plan ($125,000 revenue)
```

## Environment Variables

Use environment variables for sensitive data:

```bash
# .env file (or export in shell)
ANTHROPIC_API_KEY=sk-ant-your-key-here
GITHUB_TOKEN=ghp_your_github_token
DATABASE_URL=postgresql://user:pass@localhost:5432/db
SHEETS_CREDENTIALS=/path/to/google-credentials.json
```

```yaml
# ~/.taurus/config.yaml
apiKey: ${ANTHROPIC_API_KEY}

mcpServers:
  - name: github
    transport: stdio
    command: npx
    args: ['@modelcontextprotocol/server-github']
    env:
      GITHUB_TOKEN: ${GITHUB_TOKEN}  # References environment variable

  - name: database
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-postgres'
      - ${DATABASE_URL}

  - name: sheets
    transport: stdio
    command: npx
    args: ['@modelcontextprotocol/server-google-sheets']
    env:
      GOOGLE_SHEETS_CREDENTIALS: ${SHEETS_CREDENTIALS}
```

## Available MCP Servers

### Official MCP Servers

| Server | Package | Use Case |
|--------|---------|----------|
| **Filesystem** | `@modelcontextprotocol/server-filesystem` | Access local files |
| **GitHub** | `@modelcontextprotocol/server-github` | GitHub integration |
| **PostgreSQL** | `@modelcontextprotocol/server-postgres` | Database queries |
| **SQLite** | `@modelcontextprotocol/server-sqlite` | SQLite databases |
| **Google Drive** | `@modelcontextprotocol/server-gdrive` | Google Drive access |
| **Google Sheets** | `@modelcontextprotocol/server-google-sheets` | Spreadsheet data |
| **Slack** | `@modelcontextprotocol/server-slack` | Slack integration |

Install any server:
```bash
npm install -g @modelcontextprotocol/server-{name}
```

### Community MCP Servers

Search npm for community servers:
```bash
npm search mcp-server
```

## Creating Your Own MCP Server

### Simple Example: Custom Tool Server

Create a custom server that provides company-specific tools:

**Step 1: Create server file**

```typescript
// custom-mcp-server.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

// Define your tools
const server = new Server({
  name: 'company-tools',
  version: '1.0.0'
}, {
  capabilities: {
    tools: {}
  }
});

// Register tools
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'lookup_employee',
        description: 'Look up employee information by email',
        inputSchema: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              description: 'Employee email address'
            }
          },
          required: ['email']
        }
      },
      {
        name: 'get_company_holiday',
        description: 'Get list of company holidays',
        inputSchema: {
          type: 'object',
          properties: {
            year: {
              type: 'number',
              description: 'Year to get holidays for'
            }
          }
        }
      }
    ]
  };
});

// Implement tool calls
server.setRequestHandler('tools/call', async (request) => {
  const { name, arguments: args } = request.params;

  if (name === 'lookup_employee') {
    // In reality, query your employee database
    const employee = await lookupEmployee(args.email);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(employee, null, 2)
      }]
    };
  }

  if (name === 'get_company_holiday') {
    const holidays = getCompanyHolidays(args.year);
    return {
      content: [{
        type: 'text',
        text: JSON.stringify(holidays, null, 2)
      }]
    };
  }

  throw new Error(`Unknown tool: ${name}`);
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

**Step 2: Build and package**

```bash
# Compile TypeScript
tsc custom-mcp-server.ts

# Create package.json
npm init -y

# Add to package.json
{
  "name": "my-company-mcp-server",
  "version": "1.0.0",
  "bin": {
    "company-tools": "./dist/custom-mcp-server.js"
  }
}

# Install globally
npm install -g .
```

**Step 3: Configure in Taurus**

```yaml
mcpServers:
  - name: company
    transport: stdio
    command: company-tools
```

**Step 4: Use in Taurus**

```
taurus> Who is the engineering manager? Look up manager@company.com

[Uses company__lookup_employee tool]

Employee: Jane Doe
Title: Engineering Manager
Department: Engineering
Email: manager@company.com
Phone: ext. 1234
```

## MCP Tools in Taurus

When MCP servers are configured, their tools appear in Taurus with prefixed names:

```
MCP Server: github
Tools provided:
- list_repos
- get_issue
- create_issue
- update_issue

In Taurus, these become:
- github__list_repos
- github__get_issue
- github__create_issue
- github__update_issue
```

**You don't call them directly.** Just describe what you want:

```
taurus> Create a GitHub issue titled "Bug in login"

[Taurus automatically detects and uses github__create_issue tool]
```

## Advanced: MCP Resources

MCP servers can provide **resources** (data sources):

```typescript
// In your MCP server
server.setRequestHandler('resources/list', async () => {
  return {
    resources: [
      {
        uri: 'employee://john@company.com',
        name: 'John Doe Employee Record',
        mimeType: 'application/json'
      },
      {
        uri: 'docs://api-reference',
        name: 'API Reference Documentation',
        mimeType: 'text/markdown'
      }
    ]
  };
});

server.setRequestHandler('resources/read', async (request) => {
  const { uri } = request.params;

  if (uri === 'employee://john@company.com') {
    return {
      contents: [{
        uri,
        mimeType: 'application/json',
        text: JSON.stringify(employeeData)
      }]
    };
  }
});
```

**Usage in Taurus:**
```
taurus> Show me John's employee record

[Taurus uses MCP resource: employee://john@company.com]
[Displays data]
```

## Security Best Practices

### 1. Limit Filesystem Access

❌ **Dangerous:** Granting access to entire filesystem
```yaml
- name: files
  command: npx
  args:
    - '@modelcontextprotocol/server-filesystem'
    - '/'  # Root directory - BAD!
```

✅ **Safe:** Limit to specific directories
```yaml
- name: files
  command: npx
  args:
    - '@modelcontextprotocol/server-filesystem'
    - '/Users/yourname/safe-directory'
```

### 2. Use Environment Variables for Secrets

❌ **Dangerous:** Hardcoded credentials
```yaml
mcpServers:
  - name: database
    args:
      - 'postgresql://admin:P@ssw0rd@localhost/db'  # Exposed!
```

✅ **Safe:** Environment variables
```yaml
mcpServers:
  - name: database
    args:
      - '${DATABASE_URL}'  # Loaded from environment
```

### 3. Read-Only Access When Possible

For database servers, use read-only credentials:

```bash
# Create read-only database user
CREATE USER readonly WITH PASSWORD 'secure_password';
GRANT SELECT ON ALL TABLES IN SCHEMA public TO readonly;
```

```yaml
mcpServers:
  - name: database
    args:
      - 'postgresql://readonly:password@localhost/db'
```

### 4. Audit MCP Server Code

Before using third-party MCP servers:
1. Check source code on GitHub
2. Verify npm package authenticity
3. Read what data it accesses
4. Check for known vulnerabilities

```bash
# Check npm package
npm info @modelcontextprotocol/server-filesystem

# View source
git clone https://github.com/modelcontextprotocol/servers
cd servers/filesystem
# Review code before installing
```

## Troubleshooting

### Server Won't Connect

**Check 1: Server installed?**
```bash
# Verify installation
which npx @modelcontextprotocol/server-filesystem

# Or test manually
npx @modelcontextprotocol/server-filesystem --help
```

**Check 2: Correct command path?**
```yaml
# Check command is correct
command: npx  # Not 'npm' or 'node'
args:
  - '@modelcontextprotocol/server-filesystem'  # Full package name
```

**Check 3: Taurus logs**
```bash
# Run Taurus with debug logging
DEBUG=mcp taurus chat

# You'll see MCP connection details
```

### Permission Errors

**Error:** `EACCES: permission denied`

**Fix:** Check directory permissions
```bash
# List permissions
ls -la /path/to/directory

# Fix permissions if needed
chmod +r /path/to/directory
```

### Tool Not Found

**Error:** `Tool 'github__list_repos' not found`

**Check:** Is server connected?
```
taurus> List all available tools

[Shows all tools including MCP tools]
```

If MCP tools are missing:
1. Check server configuration
2. Verify server is running
3. Check Taurus logs for connection errors

### Slow Performance

MCP servers run as separate processes. For better performance:

1. **Use HTTP transport for remote servers**
```yaml
# Instead of stdio spawning remote process
- name: remote-api
  transport: http  # Faster for remote services
  url: https://api.company.com/mcp
```

2. **Cache frequently accessed data**
   - Implement caching in your MCP server
   - Use Redis/Memcached for shared cache

3. **Batch operations**
   - Design tools that handle multiple items
   - Reduce round-trip requests

## Real-World Workflow Examples

### Workflow 1: Database-Driven Development

```
taurus> Show me the schema for the users table

[Uses database__query_schema tool]

Table: users
Columns:
- id (uuid, primary key)
- email (varchar, unique, not null)
- name (varchar, not null)
- created_at (timestamp, not null)
...

taurus> Generate a TypeScript interface for this table

interface User {
  id: string;
  email: string;
  name: string;
  createdAt: Date;
  ...
}

taurus> Now generate a repository class with CRUD operations

[Generates complete UserRepository class]

taurus> Add tests for the repository

[Generates comprehensive tests]
```

### Workflow 2: Multi-Source Research

```
taurus> I need to write a feature spec for user authentication. Check:
1. How we currently do auth (codebase)
2. What our design docs say (Google Docs)
3. What GitHub issues exist about auth
4. Industry best practices (web search)

[Uses multiple MCP servers:]
- filesystem__read_file (local code)
- gdrive__read_document (design docs)
- github__list_issues (issues)
- Built-in web search

Comprehensive report:
...
```

### Workflow 3: Automated Reporting

```
taurus> Generate a weekly development report:
- Pull requests merged (GitHub)
- Database schema changes (PostgreSQL)
- Test coverage trends (local files)
- Deploy frequency (check git commits)

Format as markdown and save to ~/reports/

[Automatically gathers data from all sources]
[Generates comprehensive report]
[Saves to file]

Report generated: ~/reports/weekly-2025-01-18.md
```

## Best Practices

### 1. Organize MCP Servers by Purpose

```yaml
mcpServers:
  # Data sources
  - name: postgres-prod
    ...
  - name: postgres-dev
    ...

  # External services
  - name: github
    ...
  - name: slack
    ...

  # Filesystem
  - name: project-files
    ...
  - name: docs-files
    ...
```

### 2. Use Descriptive Server Names

✅ **Good:**
- `database-production`
- `github-personal`
- `company-docs`

❌ **Avoid:**
- `db1`
- `gh`
- `files`

### 3. Document Your MCP Configuration

```yaml
mcpServers:
  # Production database - READ ONLY
  # Used for: analytics queries, reporting
  # Credentials: In 1Password (Database - Prod Readonly)
  - name: database-prod
    transport: stdio
    command: npx
    args:
      - '@modelcontextprotocol/server-postgres'
      - '${DATABASE_PROD_URL}'

  # GitHub - Personal repos
  # Token: Settings > Developer settings > Personal access tokens
  # Scopes: repo, read:org
  - name: github
    ...
```

### 4. Test MCP Servers Independently

Before using in Taurus:

```bash
# Test filesystem server
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  npx @modelcontextprotocol/server-filesystem /tmp

# Should return list of tools
```

## Next Steps

Extend Taurus with external capabilities! Continue learning:

1. **[Subagents Tutorial](./07-subagents.md)** - Launch specialized agents
2. **[Code Review Workflow](./09-code-review-workflow.md)** - See MCP in action
3. **[MCP Documentation](../MCP.md)** - Full technical reference

---

**Connect everything! 🔌**

**Next:** [Subagents Tutorial](./07-subagents.md)
