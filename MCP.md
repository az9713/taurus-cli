# MCP (Model Context Protocol) Integration

## Overview

Taurus CLI includes full support for the **Model Context Protocol (MCP)**, allowing you to connect to MCP servers and dynamically load tools, resources, and prompts into your AI workflows.

MCP is a standardized protocol for AI applications to communicate with external data sources and tools. Learn more at [modelcontextprotocol.io](https://modelcontextprotocol.io).

## What is MCP?

The Model Context Protocol enables:

- **Dynamic Tool Loading**: MCP servers can expose tools that become available in your Taurus session
- **Resource Access**: Access files, databases, and other resources through MCP servers
- **Prompt Templates**: Use predefined prompt templates from MCP servers
- **Extensibility**: Add new capabilities without modifying Taurus code

## Supported Transports

Taurus CLI supports two MCP transport mechanisms:

### 1. Stdio Transport
Communication via stdin/stdout with a spawned process.

**Best for:** Local command-line tools, scripts, and executables

**Configuration:**
```yaml
mcpServers:
  - name: my-server
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /path/to/directory
    env:
      DEBUG: "true"
```

### 2. HTTP/SSE Transport
Communication via HTTP with Server-Sent Events for real-time updates.

**Best for:** Remote servers, cloud services, and web-based tools

**Configuration:**
```yaml
mcpServers:
  - name: remote-server
    transport: http
    url: https://mcp.example.com
    headers:
      Authorization: "Bearer YOUR_TOKEN"
```

## Configuration

### Global Configuration

Add MCP servers to `~/.taurus/config.yaml`:

```yaml
# Taurus Configuration with MCP
model: claude-sonnet-4-5-20250929
maxTokens: 8096
hooksEnabled: true

mcpServers:
  - name: filesystem
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /Users/username/projects
    env:
      LOG_LEVEL: info

  - name: github
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-github
    env:
      GITHUB_TOKEN: ghp_your_token_here

  - name: database
    transport: http
    url: https://mcp-db.example.com
    headers:
      X-API-Key: your-api-key
```

### Project Configuration

Override global settings with `.taurus/config.yaml` in your project:

```yaml
mcpServers:
  - name: project-tools
    transport: stdio
    command: ./scripts/mcp-server.js
    args:
      - --workspace
      - .
```

## Available MCP Servers

### Official MCP Servers

1. **@modelcontextprotocol/server-filesystem**
   - Access local file system
   - Read and search files
   - List directories

2. **@modelcontextprotocol/server-github**
   - Access GitHub repositories
   - Read files, issues, pull requests
   - Create and manage issues

3. **@modelcontextprotocol/server-postgres**
   - Query PostgreSQL databases
   - Execute SQL
   - Access schema information

4. **@modelcontextprotocol/server-sqlite**
   - Query SQLite databases
   - Execute SQL queries
   - Access database schema

5. **@modelcontextprotocol/server-brave-search**
   - Search the web using Brave Search API
   - Get current information
   - Research topics

### Community Servers

Many community-built MCP servers are available on npm and GitHub. Search for packages with the `mcp-server` keyword.

## Using MCP Tools

Once configured, MCP tools become available automatically in your Taurus session.

### Tool Naming

MCP tools are prefixed with their server name:

- Format: `{server-name}__{tool-name}`
- Example: `filesystem__read_file`, `github__create_issue`

### Example Session

```bash
$ taurus chat
🐂 Taurus CLI - Claude Code Clone
MCP: 2/2 servers connected

taurus> List the files in my home directory

# Claude will use the filesystem__list_directory tool
# automatically if you have the filesystem server configured
taurus> Read the README.md file

# Uses filesystem__read_file tool

taurus> Search my GitHub repos for issues mentioning "bug"

# Uses github__search_issues tool
```

## MCP Resources

MCP servers can expose resources (files, database records, etc.) that Taurus can access.

### Accessing Resources

Resources are accessed programmatically when needed:

```yaml
# MCP server exposes resources with URIs like:
# file:///path/to/file.txt
# github://owner/repo/issues/123
# db://localhost/mydb/users
```

The resource system allows Claude to read data from various sources without requiring specific tools for each data type.

## MCP Prompts

MCP servers can provide prompt templates for common tasks.

### Using Prompt Templates

```
taurus> /mcp-prompt code-review file=src/app.ts

# This would use a prompt template from an MCP server
# that specializes in code reviews
```

## Creating Your Own MCP Server

You can create custom MCP servers to expose your own tools and data.

### Minimal MCP Server (TypeScript)

```typescript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server(
  {
    name: 'my-custom-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Define a tool
server.setRequestHandler('tools/list', async () => {
  return {
    tools: [
      {
        name: 'hello',
        description: 'Say hello',
        inputSchema: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Name to greet',
            },
          },
          required: ['name'],
        },
      },
    ],
  };
});

// Handle tool execution
server.setRequestHandler('tools/call', async (request) => {
  if (request.params.name === 'hello') {
    const name = request.params.arguments?.name || 'World';
    return {
      content: [
        {
          type: 'text',
          text: `Hello, ${name}!`,
        },
      ],
    };
  }
  throw new Error('Unknown tool');
});

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Register Custom Server

```yaml
mcpServers:
  - name: my-server
    transport: stdio
    command: node
    args:
      - /path/to/my-server.js
```

## Architecture

### How MCP Integration Works

```
┌─────────────┐
│ Taurus CLI  │
└──────┬──────┘
       │
       ├─ Tool Registry
       │  ├─ Built-in Tools (Bash, Read, etc.)
       │  └─ MCP Tool Proxies
       │     ├─ filesystem__read_file
       │     ├─ filesystem__list_directory
       │     ├─ github__create_issue
       │     └─ ...
       │
       ├─ MCP Manager
       │  ├─ Server Connections
       │  ├─ Tool Discovery
       │  └─ Lifecycle Management
       │
       └─ MCP Servers
          ├─ Stdio Transport
          │  ├─ Process Management
          │  └─ JSON-RPC via stdin/stdout
          │
          └─ HTTP Transport
             ├─ REST API
             └─ Server-Sent Events (SSE)
```

### Components

1. **MCP Manager** (`src/mcp/manager.ts`)
   - Manages server lifecycle
   - Discovers and registers tools
   - Handles server connections

2. **MCP Server** (`src/mcp/server.ts`)
   - Implements MCP protocol
   - Handles JSON-RPC communication
   - Manages server state

3. **Transport Layer**
   - **Stdio Transport** (`src/mcp/stdio-transport.ts`): Process-based communication
   - **HTTP Transport** (`src/mcp/http-transport.ts`): HTTP/SSE communication

4. **Tool Proxy** (`src/mcp/tool-proxy.ts`)
   - Wraps MCP tools as Taurus tools
   - Handles parameter conversion
   - Manages results

## Protocol Details

### JSON-RPC 2.0

MCP uses JSON-RPC 2.0 for all communication.

**Request:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/list",
  "params": {}
}
```

**Response:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "tools": [
      {
        "name": "read_file",
        "description": "Read a file",
        "inputSchema": {
          "type": "object",
          "properties": {
            "path": { "type": "string" }
          }
        }
      }
    ]
  }
}
```

### Initialization Sequence

1. **Client→Server**: `initialize` request
2. **Server→Client**: `initialize` response with capabilities
3. **Client→Server**: `notifications/initialized` notification
4. **Server is ready for requests**

### MCP Methods

- `initialize`: Initialize connection
- `tools/list`: List available tools
- `tools/call`: Execute a tool
- `resources/list`: List available resources
- `resources/read`: Read a resource
- `prompts/list`: List prompt templates
- `prompts/get`: Get a prompt template

## Troubleshooting

### Server Won't Connect

**Check logs:**
```bash
DEBUG=true taurus chat
```

**Verify command:**
```bash
# Test the server command manually
npx -y @modelcontextprotocol/server-filesystem /path/to/directory
```

**Check environment:**
```yaml
mcpServers:
  - name: test
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "."]
    env:
      DEBUG: "mcp:*"  # Enable MCP debug logging
```

### Tools Not Appearing

1. **Check server connection:**
   - Look for "MCP: X/Y servers connected" message on startup
   - X should equal Y

2. **Verify server supports tools:**
   ```bash
   # Check server capabilities in logs
   DEBUG=true taurus chat
   ```

3. **Check tool naming:**
   - Tools are prefixed: `{server-name}__{tool-name}`
   - Example: If server is named "fs", tools are `fs__read_file`, not `read_file`

### Permission Errors

**Filesystem server:**
```yaml
mcpServers:
  - name: filesystem
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - /allowed/path  # Only has access to this path
```

**HTTP server:**
```yaml
mcpServers:
  - name: api
    transport: http
    url: https://api.example.com
    headers:
      Authorization: "Bearer YOUR_TOKEN"  # Ensure token is valid
```

### Timeout Issues

**Increase timeouts:**

The default timeout is 30 seconds. For slow servers, you may need to modify the transport code or ensure servers respond quickly.

## Performance Considerations

### Stdio Transport
- **Pros**: Simple, secure, local-only
- **Cons**: Process overhead, not suitable for remote servers
- **Best for**: Local tools, file system access, local databases

### HTTP Transport
- **Pros**: Remote access, scalable, can handle multiple clients
- **Cons**: Network latency, requires server setup
- **Best for**: Cloud services, shared tools, web APIs

### Tool Caching

MCP tools are discovered once at startup. To refresh:
```bash
# Restart Taurus
taurus chat
```

## Security

### Stdio Servers
- Run in separate processes with limited permissions
- Cannot access files outside specified directories
- Environment variables are isolated

### HTTP Servers
- Use HTTPS in production
- Implement proper authentication
- Validate all inputs
- Rate limit requests

### Best Practices

1. **Principle of Least Privilege**
   ```yaml
   # Good: Specific directory
   args: ["-y", "@modelcontextprotocol/server-filesystem", "/data/readonly"]

   # Bad: Root access
   args: ["-y", "@modelcontextprotocol/server-filesystem", "/"]
   ```

2. **Use Environment Variables for Secrets**
   ```yaml
   mcpServers:
     - name: api
       transport: http
       url: https://api.example.com
       headers:
         Authorization: "Bearer ${API_TOKEN}"  # From environment
   ```

3. **Validate Server Sources**
   - Only use trusted MCP servers
   - Review server code before use
   - Keep servers updated

## Examples

### Example 1: Local File System Access

**Config:**
```yaml
mcpServers:
  - name: fs
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-filesystem
      - ~/Documents
```

**Usage:**
```
taurus> What files are in my Documents folder?
taurus> Read the contents of resume.pdf
taurus> Search for files containing "TODO"
```

### Example 2: GitHub Integration

**Config:**
```yaml
mcpServers:
  - name: github
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-github
    env:
      GITHUB_TOKEN: ${GITHUB_TOKEN}
```

**Usage:**
```
taurus> List my GitHub repositories
taurus> Show open issues in my repo
taurus> Create an issue titled "Bug: Login fails"
```

### Example 3: Database Access

**Config:**
```yaml
mcpServers:
  - name: db
    transport: stdio
    command: npx
    args:
      - -y
      - @modelcontextprotocol/server-postgres
    env:
      DATABASE_URL: postgresql://user:pass@localhost/mydb
```

**Usage:**
```
taurus> Show me the schema of the users table
taurus> Query the top 10 users by creation date
taurus> Count how many active users we have
```

## Advanced Topics

### Multiple Servers

You can configure multiple MCP servers simultaneously:

```yaml
mcpServers:
  - name: local-fs
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "~/projects"]

  - name: work-fs
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-filesystem", "/work/repos"]

  - name: github
    transport: stdio
    command: npx
    args: ["-y", "@modelcontextprotocol/server-github"]
    env:
      GITHUB_TOKEN: ${GITHUB_TOKEN}

  - name: remote-api
    transport: http
    url: https://mcp.company.com
    headers:
      X-API-Key: ${COMPANY_API_KEY}
```

### Dynamic Server Configuration

Servers are loaded from config files on startup. To change servers:

1. Edit config file
2. Restart Taurus
3. New servers will be loaded

### Server Lifecycle

```typescript
// MCP Manager handles lifecycle automatically
// Servers are:
// 1. Created on startup
// 2. Connected during initialization
// 3. Tools discovered and registered
// 4. Disconnected on shutdown
```

## Reference

### MCP Specification
- https://modelcontextprotocol.io
- https://spec.modelcontextprotocol.io

### Official Servers
- https://github.com/modelcontextprotocol/servers

### SDKs
- TypeScript/JavaScript: `@modelcontextprotocol/sdk`
- Python: `mcp`
- Rust: `mcp-rs`

### Community
- GitHub Discussions: https://github.com/modelcontextprotocol/specification/discussions
- Discord: https://discord.gg/modelcontextprotocol

---

**Full MCP integration in Taurus CLI - Connect to any MCP server and extend your AI capabilities!** 🚀
