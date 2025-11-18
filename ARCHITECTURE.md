# Taurus CLI Architecture

## Overview

Taurus CLI is a comprehensive implementation of Claude Code's architecture, featuring a modular design with clear separation of concerns.

## Core Components

### 1. Agent Orchestrator (`src/agent/orchestrator.ts`)

The orchestrator is the central coordinator that:
- Manages conversation flow
- Coordinates between Claude API and tools
- Handles tool execution (parallel and sequential)
- Triggers hooks at appropriate lifecycle events
- Manages session state

**Key Responsibilities:**
- Process user messages
- Send messages to Claude API
- Execute tool calls
- Display responses
- Coordinate all subsystems

**Flow:**
```
User Input → Orchestrator → Claude API → Tool Execution → Response → User
                ↓              ↓              ↓
            Hooks      Session Save    Tool Results
```

### 2. Claude API Client (`src/api/claude.ts`)

Handles all communication with Anthropic's Claude API:
- Message sending (streaming and non-streaming)
- Tool definition formatting
- Error handling
- Response parsing

**Features:**
- Streaming support for real-time responses
- Automatic retry logic
- Rate limiting compliance
- Token management

### 3. Tool System (`src/tools/`)

Modular tool architecture with base class and registry:

**Base Tool** (`base.ts`):
- Abstract base class for all tools
- Standard interface (execute, schema, description)
- Success/error result formatting
- Tool definition generation

**Tool Registry**:
- Central tool registration
- Tool lookup and execution
- Tool definition aggregation
- Error handling

**Available Tools:**
1. **Bash** - Shell command execution
2. **Read** - File reading with formatting
3. **Write** - File creation
4. **Edit** - String replacement in files
5. **Glob** - File pattern matching
6. **Grep** - Content search
7. **TodoWrite** - Task management
8. **Task** - Subagent launching
9. **WebFetch** - Web content fetching
10. **WebSearch** - Web search
11. **Skill** - Skill execution
12. **SlashCommand** - Custom command execution

### 4. Hooks System (`src/hooks/manager.ts`)

Event-driven hook system for automation:

**Hook Events:**
- `session-start` - Session initialization
- `session-end` - Session termination
- `user-prompt-submit` - Before processing user input
- `before-tool-call` - Before tool execution
- `after-tool-call` - After tool execution

**Hook Configuration:**
```yaml
hooks:
  - name: hook-name
    event: event-type
    command: shell-command
    enabled: true
```

**Features:**
- YAML configuration
- Environment variable passing
- Timeout protection
- Error isolation

### 5. Session Management (`src/session/manager.ts`)

Handles conversation persistence:

**Responsibilities:**
- Session creation
- Message storage
- Session loading/saving
- Session listing

**Session Structure:**
```typescript
{
  id: string,
  messages: Message[],
  createdAt: Date,
  updatedAt: Date
}
```

### 6. Configuration System (`src/config/manager.ts`)

Layered configuration with precedence:

**Priority Order:**
1. Command-line arguments
2. Environment variables
3. Project config (`.taurus/config.yaml`)
4. Global config (`~/.taurus/config.yaml`)
5. Defaults

**Configuration Options:**
- API settings (key, model, tokens)
- Paths (working dir, session dir)
- Features (hooks enabled)
- MCP servers

### 7. REPL (`src/cli/repl.ts`)

Interactive command-line interface:

**Features:**
- Command history
- Prompt customization
- Built-in commands (/help, /clear, /exit)
- Slash command routing
- Graceful shutdown

## Data Flow

### User Message Processing

```
1. User types message in REPL
2. REPL passes to Orchestrator
3. Orchestrator triggers user-prompt-submit hook
4. Message added to session
5. Orchestrator calls Claude API with:
   - Conversation history
   - Tool definitions
   - System prompt
6. Claude responds with:
   - Text content, OR
   - Tool use requests
7. If tool use:
   a. Orchestrator triggers before-tool-call hooks
   b. Tools executed (in parallel if independent)
   c. Orchestrator triggers after-tool-call hooks
   d. Results added to conversation
   e. Process repeats from step 5
8. If text content:
   - Display to user
   - Session saved
   - Ready for next input
```

### Tool Execution Flow

```
Tool Call Request
    ↓
Orchestrator identifies tool uses
    ↓
Parallel execution of independent tools
    ↓
Tool Registry routes to specific tool
    ↓
Tool.execute() runs
    ↓
Result returned (success or error)
    ↓
Results formatted as tool_result blocks
    ↓
Results added to conversation
    ↓
Continue conversation loop
```

## Design Patterns

### 1. Registry Pattern
Used for tools - allows dynamic registration and lookup.

### 2. Manager Pattern
Used for sessions, hooks, and config - encapsulates lifecycle management.

### 3. Orchestrator Pattern
Central coordinator that delegates to specialized subsystems.

### 4. Template Method Pattern
Base tool class defines structure, subclasses implement specifics.

### 5. Strategy Pattern
Different tools implement same interface with different strategies.

## Extensibility Points

### Adding New Tools
1. Create class extending `BaseTool`
2. Implement `execute()` method
3. Define `schema` and `description`
4. Register in `createToolRegistry()`

### Adding New Hooks
1. Define event type in `HookEvent`
2. Add trigger call in orchestrator
3. Document in hooks configuration

### Adding New Subagent Types
1. Add to `AGENT_TYPES` in types
2. Define tool access
3. Update Task tool

### Adding MCP Servers
1. Configure in `config.yaml`
2. Implement MCP protocol
3. Register tools from server

## Error Handling

### Levels of Error Handling:

1. **Tool Level**: Tools catch and return errors
2. **Registry Level**: Registry catches tool execution errors
3. **Orchestrator Level**: Orchestrator handles API errors
4. **REPL Level**: REPL catches display errors
5. **Process Level**: Graceful shutdown on SIGINT

### Error Recovery:

- Tools return `is_error: true` for failures
- Conversation continues with error context
- Claude can adapt based on error messages
- Hooks failures are logged but don't stop execution

## Performance Optimizations

### 1. Parallel Tool Execution
Independent tools execute concurrently using Promise.all().

### 2. Streaming Responses
Real-time response streaming for better UX.

### 3. Session Caching
Sessions kept in memory during active use.

### 4. Tool Result Truncation
Large outputs truncated to prevent token overflow.

### 5. Lazy Loading
Skills and commands loaded on-demand.

## Security Considerations

### 1. Input Validation
- File paths validated
- Commands sanitized
- Tool inputs validated against schemas

### 2. Sandbox Execution
- Bash commands run in controlled environment
- Timeout limits on all operations
- Resource limits on tool execution

### 3. API Key Protection
- Keys stored in environment or config
- Never logged or displayed
- Config files in .gitignore

### 4. Hook Safety
- Hooks run with limited permissions
- Timeout protection
- Error isolation

## Testing Strategy

### Unit Tests
- Individual tool execution
- Configuration loading
- Session management
- Hook triggering

### Integration Tests
- Tool registry integration
- Orchestrator flow
- API client integration

### End-to-End Tests
- Full conversation flows
- Multi-turn interactions
- Error scenarios

## Future Enhancements

### Planned Features:
1. **MCP Server Support** - Full Model Context Protocol integration
2. **Plugin System** - Third-party tool plugins
3. **Web UI** - Browser-based interface
4. **Multi-Session** - Multiple concurrent sessions
5. **Cloud Sync** - Session synchronization
6. **Analytics** - Usage statistics and insights
7. **Voice Input** - Speech-to-text integration
8. **IDE Integration** - VS Code extension

### Performance Improvements:
1. **Caching** - Response caching for repeated queries
2. **Compression** - Session compression for storage
3. **Indexing** - Fast session search
4. **Batching** - Batch API requests

### Developer Experience:
1. **Debugging Tools** - Built-in debugger
2. **Profiling** - Performance profiling
3. **Logging Levels** - Granular logging control
4. **Hot Reload** - Live config reloading

## Deployment

### Local Installation
```bash
npm install
npm run build
npm link
```

### Docker Deployment
```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY dist ./dist
ENTRYPOINT ["node", "dist/index.js"]
```

### CI/CD Pipeline
1. Lint and format check
2. Type checking
3. Unit tests
4. Integration tests
5. Build
6. Package
7. Release

## Maintenance

### Regular Tasks:
- Dependency updates
- Security patches
- Performance monitoring
- Bug fixes
- Documentation updates

### Monitoring:
- API usage tracking
- Error rate monitoring
- Performance metrics
- User feedback

---

For more information, see the README.md and inline code documentation.
