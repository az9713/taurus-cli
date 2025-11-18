# Tutorial 11: Documentation Workflow

Generate and maintain comprehensive documentation automatically with Taurus.

## Overview

Automate documentation for:
1. **API documentation** (OpenAPI/Swagger)
2. **Code documentation** (JSDoc/TSDoc)
3. **README files** (features, installation, usage)
4. **Architecture docs** (system design, decisions)
5. **User guides** (tutorials, examples)

**Time saved:** ~3 hours per documentation cycle

## Prerequisites

✅ Completed [Quick Start Guide](./02-quickstart.md)
✅ Project with code to document
✅ Taurus CLI installed

## Workflow Setup

### Create Documentation Command

```bash
mkdir -p .taurus/commands
nano .taurus/commands/document.md
```

```markdown
---
name: document
description: Generate comprehensive documentation
---

Generate documentation for the specified code including:

## 1. CODE DOCUMENTATION (JSDoc/TSDoc)
For each function/class/method:
- Clear description
- Parameters with types
- Return values
- Throws/errors
- Usage examples
- Notes/warnings

Format:
```typescript
/**
 * Description of what this function does
 *
 * @param paramName - Description of parameter
 * @param options - Configuration options
 * @param options.setting - Specific setting description
 * @returns Description of return value
 * @throws {ErrorType} When this error occurs
 *
 * @example
 * ```typescript
 * const result = functionName('example', { setting: true });
 * console.log(result); // Output explanation
 * ```
 *
 * @see {@link RelatedFunction} for related functionality
 * @since 1.0.0
 */
```

## 2. API DOCUMENTATION
For each endpoint:
- Method and path
- Description
- Authentication requirements
- Request parameters
- Request body schema
- Response schema
- Error responses
- Example requests/responses

## 3. README
Include:
- Project title and description
- Badges (build status, coverage, version)
- Features list
- Installation instructions
- Quick start guide
- Usage examples
- API reference (brief)
- Configuration options
- Contributing guide
- License

## 4. ARCHITECTURE DOCUMENTATION
Include:
- System overview
- Component diagram
- Data flow
- Technology stack
- Design decisions
- Trade-offs
- Future improvements

Generate markdown files with proper formatting, code blocks, and examples.
```

## Complete Workflow Example

### Scenario: Document REST API

```bash
cd ~/my-api
taurus chat
```

```
taurus> /document

Document the entire API in src/api/. Generate:
1. JSDoc comments for all functions
2. API.md with all endpoints
3. Update README.md
4. Create ARCHITECTURE.md

Current API has:
- User authentication (JWT)
- CRUD operations for tasks
- Team management
- File uploads
```

**Taurus works:**

```
📚 Generating documentation for API...
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

[Reading project files...]
✓ Found 23 API endpoints
✓ Found 15 service functions
✓ Found 8 model definitions
✓ Found 12 utility functions

[Analyzing code...]
✓ Understanding authentication flow
✓ Mapping endpoint relationships
✓ Extracting parameter schemas
✓ Identifying error responses

[Generating documentation...]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STEP 1: JSDoc Comments Added

Modified: src/api/auth.ts

```typescript
/**
 * Registers a new user account
 *
 * Validates email uniqueness, hashes password with bcrypt,
 * creates user record, and returns JWT authentication token.
 *
 * @param email - User's email address (must be valid and unique)
 * @param password - User's password (min 8 chars, must include number and special char)
 * @param name - User's full name
 * @returns Promise resolving to user object and JWT token
 * @throws {ValidationError} If email/password doesn't meet requirements
 * @throws {ConflictError} If email already exists
 * @throws {DatabaseError} If database operation fails
 *
 * @example
 * ```typescript
 * const result = await registerUser({
 *   email: 'user@example.com',
 *   password: 'SecureP@ss123',
 *   name: 'John Doe'
 * });
 *
 * console.log(result);
 * // {
 * //   user: { id: 'uuid', email: 'user@example.com', name: 'John Doe' },
 * //   token: 'eyJhbG...'
 * // }
 * ```
 *
 * @see {@link loginUser} for authentication
 * @see {@link hashPassword} for password hashing implementation
 * @since 1.0.0
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  // Implementation...
}
```

✓ Added JSDoc to 58 functions across 12 files

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STEP 2: API Documentation Generated

Created: docs/API.md (342 lines)

# API Documentation

## Overview

Task Manager API v1.0.0

Base URL: `https://api.taskmanager.com/v1`

Authentication: JWT Bearer token required for most endpoints

## Table of Contents

- [Authentication](#authentication)
- [Users](#users)
- [Tasks](#tasks)
- [Teams](#teams)
- [File Uploads](#file-uploads)
- [Error Responses](#error-responses)

## Authentication

### POST /api/auth/register

Register a new user account.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123",
  "name": "John Doe"
}
```

**Validation:**
- Email: Valid email format, max 255 chars
- Password: Min 8 chars, must include number and special character
- Name: Min 2 chars, max 100 chars

**Response:** `201 Created`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER",
    "createdAt": "2025-01-18T10:00:00Z"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**Errors:**
- `400 Bad Request` - Invalid email or password format
- `409 Conflict` - Email already registered
- `500 Internal Server Error` - Server error

**Example:**
```bash
curl -X POST https://api.taskmanager.com/v1/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123",
    "name": "John Doe"
  }'
```

---

### POST /api/auth/login

Authenticate user and receive JWT token.

**Authentication:** None required

**Request Body:**
```json
{
  "email": "user@example.com",
  "password": "SecureP@ss123"
}
```

**Response:** `200 OK`
```json
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "email": "user@example.com",
    "name": "John Doe",
    "role": "USER"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-19T10:00:00Z"
}
```

**Errors:**
- `400 Bad Request` - Missing email or password
- `401 Unauthorized` - Invalid credentials
- `429 Too Many Requests` - Rate limit exceeded (5 attempts per 15 minutes)

**Example:**
```bash
curl -X POST https://api.taskmanager.com/v1/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123"
  }'
```

---

## Tasks

### GET /api/tasks

Retrieve all tasks for the authenticated user.

**Authentication:** Required (Bearer token)

**Query Parameters:**
- `status` (optional): Filter by status (`TODO`, `IN_PROGRESS`, `DONE`)
- `priority` (optional): Filter by priority (`LOW`, `MEDIUM`, `HIGH`, `URGENT`)
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 20, max: 100)
- `sort` (optional): Sort field (`createdAt`, `dueDate`, `priority`, `status`)
- `order` (optional): Sort order (`asc`, `desc`, default: `desc`)

**Response:** `200 OK`
```json
{
  "tasks": [
    {
      "id": "123e4567-e89b-12d3-a456-426614174000",
      "title": "Complete project documentation",
      "description": "Write comprehensive docs for API",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2025-01-20T00:00:00Z",
      "userId": "550e8400-e29b-41d4-a716-446655440000",
      "teamId": null,
      "createdAt": "2025-01-18T10:00:00Z",
      "updatedAt": "2025-01-18T11:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 42,
    "pages": 3
  }
}
```

**Example:**
```bash
curl -X GET 'https://api.taskmanager.com/v1/api/tasks?status=IN_PROGRESS&sort=priority&order=desc' \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

... [Complete documentation for all 23 endpoints]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STEP 3: README Updated

Modified: README.md

# Task Manager API

> Modern task management API with team collaboration

[![Build Status](https://github.com/user/task-manager-api/workflows/test/badge.svg)](https://github.com/user/task-manager-api/actions)
[![Coverage](https://codecov.io/gh/user/task-manager-api/branch/main/graph/badge.svg)](https://codecov.io/gh/user/task-manager-api)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

## Features

- ✅ **User Authentication** - Secure JWT-based authentication
- ✅ **Task Management** - Create, update, and track tasks
- ✅ **Team Collaboration** - Organize tasks in teams
- ✅ **File Uploads** - Attach files to tasks
- ✅ **RESTful API** - Clean, well-documented API
- ✅ **TypeScript** - Full type safety
- ✅ **Database** - PostgreSQL with Prisma ORM
- ✅ **Testing** - Comprehensive test suite (87% coverage)
- ✅ **Docker** - Production-ready containers
- ✅ **CI/CD** - Automated testing and deployment

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm 9+

### Installation

```bash
# Clone repository
git clone https://github.com/user/task-manager-api.git
cd task-manager-api

# Install dependencies
npm install

# Set up environment
cp .env.example .env
# Edit .env with your database credentials

# Run migrations
npm run migrate

# Start development server
npm run dev
```

Server will start at `http://localhost:3000`

### Docker Setup

```bash
# Start all services
docker-compose up

# API available at http://localhost:3000
```

## Usage

### Register User

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "SecureP@ss123",
    "name": "John Doe"
  }'
```

### Create Task

```bash
curl -X POST http://localhost:3000/api/tasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Complete documentation",
    "description": "Write API docs",
    "priority": "HIGH",
    "dueDate": "2025-01-20"
  }'
```

See [API Documentation](docs/API.md) for complete API reference.

## Configuration

### Environment Variables

```bash
# Server
PORT=3000
NODE_ENV=development

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/taskmanager

# Authentication
JWT_SECRET=your-secret-key
JWT_EXPIRATION=24h

# File Uploads
UPLOAD_MAX_SIZE=10485760  # 10MB in bytes
UPLOAD_DIR=./uploads

# Email (optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-password
```

## Development

```bash
# Run in development mode (with hot reload)
npm run dev

# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Lint code
npm run lint

# Format code
npm run format

# Type check
npm run type-check
```

## API Documentation

Full API documentation available at:
- Local: `http://localhost:3000/api-docs`
- Documentation file: [docs/API.md](docs/API.md)

## Architecture

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system architecture and design decisions.

## Contributing

Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ STEP 4: Architecture Documentation Created

Created: docs/ARCHITECTURE.md (287 lines)

# Architecture Documentation

## System Overview

Task Manager API is a RESTful service built with Node.js, TypeScript, and PostgreSQL.

### High-Level Architecture

```
┌──────────────┐
│    Client    │
│ (Web/Mobile) │
└──────┬───────┘
       │ HTTPS
       │
┌──────▼───────┐
│ Load Balancer│
└──────┬───────┘
       │
   ┌───▼────┐
   │  API   │────┐
   │ Server │    │ Read/Write
   └────────┘    │
                 │
         ┌───────▼────────┐
         │   PostgreSQL   │
         │   (Primary)    │
         └────────────────┘
```

### Component Diagram

```
┌─────────────────────────────────────────┐
│          API Layer                       │
│  ┌──────────┐  ┌──────────┐            │
│  │  Auth    │  │  Tasks   │  ...       │
│  │ Routes   │  │ Routes   │            │
│  └─────┬────┘  └─────┬────┘            │
└────────┼─────────────┼──────────────────┘
         │             │
┌────────▼─────────────▼──────────────────┐
│       Middleware Layer                   │
│  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │Validation│  ...       │
│  └──────────┘  └──────────┘            │
└────────┬─────────────┬──────────────────┘
         │             │
┌────────▼─────────────▼──────────────────┐
│      Business Logic Layer                │
│  ┌──────────┐  ┌──────────┐            │
│  │   Auth   │  │   Task   │            │
│  │ Service  │  │ Service  │  ...       │
│  └─────┬────┘  └─────┬────┘            │
└────────┼─────────────┼──────────────────┘
         │             │
┌────────▼─────────────▼──────────────────┐
│         Data Access Layer                │
│  ┌──────────┐  ┌──────────┐            │
│  │  Prisma  │  │  Redis   │            │
│  │  Client  │  │  Client  │  ...       │
│  └─────┬────┘  └──────────┘            │
└────────┼──────────────────────────────┘
         │
┌────────▼───────────┐
│    PostgreSQL      │
│    Database        │
└────────────────────┘
```

## Technology Stack

### Backend
- **Runtime:** Node.js 18+
- **Language:** TypeScript 5.3
- **Framework:** Express.js 4.18
- **ORM:** Prisma 5.7
- **Database:** PostgreSQL 14+
- **Caching:** Redis (optional)

### Development Tools
- **Testing:** Jest + Supertest
- **Linting:** ESLint + TypeScript ESLint
- **Formatting:** Prettier
- **Git Hooks:** Husky + lint-staged

### DevOps
- **Containerization:** Docker
- **CI/CD:** GitHub Actions
- **Deployment:** AWS ECS / Heroku / Railway

## Design Decisions

### 1. Why Express.js?

**Decision:** Use Express.js as web framework

**Reasons:**
- Mature and well-documented
- Large ecosystem of middleware
- Team familiarity
- Performance sufficient for requirements

**Trade-offs:**
- Less opinionated than alternatives (Nest.js)
- Manual setup required

**Alternatives considered:**
- Fastify (more performant but smaller ecosystem)
- Nest.js (more structure but steeper learning curve)

... [Complete architecture documentation]

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Documentation Generation Complete!

📊 Summary:
- JSDoc comments: 58 functions
- API endpoints documented: 23
- README updated: Yes
- Architecture doc created: Yes
- Total documentation lines: ~1,200

Files created/modified:
- src/**/*.ts (JSDoc comments added)
- docs/API.md (new)
- docs/ARCHITECTURE.md (new)
- README.md (updated)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like me to:
1. Generate OpenAPI/Swagger spec file?
2. Create user guide tutorials?
3. Generate Postman collection?
4. Create deployment documentation?
5. Generate changelog from git commits?
```

## Advanced Documentation Workflows

### Workflow A: Sync Docs with Code

```yaml
# .taurus/hooks/after-tool-call.yaml
name: after-tool-call
description: Update docs after code changes
enabled: true

toolFilter:
  - edit
  - write

commands:
  - name: Update documentation
    command: |
      # If code file was modified, remind to update docs
      if echo "$TOOL_FILE" | grep -E "src/.*\.(ts|js)$"; then
        echo "💡 Remember to update documentation!"
        echo "Run: taurus chat"
        echo "Command: /document $TOOL_FILE"
      fi
    continueOnError: true
```

### Workflow B: Generate Changelog

```
taurus> Generate CHANGELOG.md from git commits since last release

[Analyzes git history]
[Groups commits by type]
[Generates changelog]

✅ Generated: CHANGELOG.md

# Changelog

## [1.2.0] - 2025-01-18

### Added
- User authentication with JWT
- Task priority levels
- File upload support
- Team management

### Changed
- Improved validation error messages
- Updated Prisma to v5.7.0
- Refactored auth middleware

### Fixed
- SQL injection vulnerability in search
- Memory leak in file uploads
- Race condition in task creation

### Security
- Fixed CSRF vulnerability
- Added rate limiting
- Updated dependencies
```

### Workflow C: Generate User Guide

```
taurus> Create a comprehensive user guide with tutorials for:
1. Getting started
2. User authentication
3. Managing tasks
4. Team collaboration
5. File uploads

Include screenshots (placeholders) and step-by-step instructions.
```

## Best Practices

### 1. Keep Docs in Sync

Use hooks to remind about documentation:
```yaml
# Remind after code changes
after-tool-call:
  - Check if docs need updating
```

### 2. Use Examples Everywhere

Every function should have usage examples:
```typescript
/**
 * @example
 * const user = await createUser({...});
 */
```

### 3. Document the "Why"

```typescript
/**
 * Uses bcrypt with cost factor 12 (not 10) because:
 * - Security analysis showed 10 rounds insufficient for 2024
 * - Performance impact acceptable (< 200ms per hash)
 * - Recommended by OWASP guidelines
 */
```

### 4. Automate Validation

Check docs exist in CI:
```yaml
# .github/workflows/docs-check.yml
- name: Check documentation
  run: |
    # Ensure all public functions have JSDoc
    npm run docs:validate
```

### 5. Version Documentation

Tag documentation with versions:
```typescript
/**
 * @since 1.0.0
 * @deprecated since 2.0.0 - Use newFunction() instead
 */
```

## Next Steps

Perfect your documentation! Continue with:

1. **[Bug Fixing Workflow](./12-bug-fixing-workflow.md)** - Systematic debugging

---

**Document everything! 📚**

**Next:** [Bug Fixing Workflow](./12-bug-fixing-workflow.md)
