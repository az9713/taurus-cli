# Tutorial 10: Project Setup Workflow

Automate new project creation with Taurus. From scaffolding to deployment-ready in minutes.

## Overview

This workflow demonstrates:
1. **Project scaffolding** with best practices
2. **Dependency setup** and configuration
3. **Development environment** initialization
4. **CI/CD pipeline** creation
5. **Documentation** generation

**Time saved:** ~4 hours per project setup

## Prerequisites

✅ Completed [Hooks Tutorial](./03-hooks.md)
✅ Completed [Slash Commands Tutorial](./04-slash-commands.md)
✅ Node.js, Git installed

## Workflow Setup

### Step 1: Create Project Setup Command

```bash
mkdir -p ~/.taurus/commands
nano ~/.taurus/commands/init-project.md
```

```markdown
---
name: init-project
description: Initialize a new project with best practices
---

Create a complete project setup with:

## 1. PROJECT STRUCTURE
Create organized directory structure:
```
project-name/
├── src/
│   ├── api/
│   ├── services/
│   ├── models/
│   ├── utils/
│   └── index.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── e2e/
├── docs/
├── scripts/
├── .github/workflows/
└── config/
```

## 2. CONFIGURATION FILES
- package.json with scripts
- tsconfig.json (TypeScript)
- .eslintrc.js (ESLint)
- .prettierrc (Prettier)
- .gitignore
- .env.example
- .editorconfig
- docker-compose.yml (optional)

## 3. DEVELOPMENT TOOLS
- TypeScript setup
- ESLint with recommended rules
- Prettier for code formatting
- Husky for git hooks
- lint-staged for pre-commit
- Jest for testing
- Nodemon for development

## 4. CI/CD
- GitHub Actions workflow
- Automated tests on PR
- Linting and type checking
- Code coverage reports
- Automated deployment (staging)

## 5. DOCUMENTATION
- README.md with:
  - Project description
  - Installation instructions
  - Usage examples
  - API documentation
  - Contributing guidelines
- CONTRIBUTING.md
- CODE_OF_CONDUCT.md
- LICENSE (MIT)

## 6. DOCKER SUPPORT
- Dockerfile
- docker-compose.yml
- .dockerignore

## 7. SECURITY
- Security policy (SECURITY.md)
- Dependabot configuration
- npm audit checks in CI

## 8. QUALITY GATES
- Minimum 80% test coverage
- No ESLint errors
- No TypeScript errors
- All tests passing
- Security vulnerabilities check

Ask for:
- Project name
- Project description
- Tech stack preferences
- Database choice (if any)
- Authentication method (if any)

Then create everything automatically.
```

## Complete Workflow Example

### Scenario: Create New REST API Project

```bash
taurus chat
```

```
taurus> /init-project

I want to create a new REST API project:
- Name: "task-manager-api"
- Description: "Task management API with user authentication"
- Stack: Node.js + TypeScript + Express
- Database: PostgreSQL with Prisma ORM
- Auth: JWT authentication
- Features: Users, tasks, teams
```

**Taurus starts working:**

```
🚀 Initializing project: task-manager-api
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ Creating project directory structure
✓ Initializing git repository
✓ Creating package.json
✓ Setting up TypeScript
✓ Configuring ESLint
✓ Configuring Prettier
✓ Creating .gitignore
✓ Setting up Husky + lint-staged
✓ Configuring Jest
✓ Creating Docker files
✓ Setting up GitHub Actions
✓ Generating documentation
✓ Creating example code
✓ Installing dependencies (this may take a minute...)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📁 PROJECT STRUCTURE CREATED:

task-manager-api/
├── src/
│   ├── api/
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── tasks.routes.ts
│   │   │   └── teams.routes.ts
│   │   └── middleware/
│   │       ├── auth.middleware.ts
│   │       ├── error.middleware.ts
│   │       └── validation.middleware.ts
│   ├── services/
│   │   ├── auth.service.ts
│   │   ├── task.service.ts
│   │   └── team.service.ts
│   ├── models/
│   │   └── prisma/
│   │       └── schema.prisma
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── validation.ts
│   │   └── logger.ts
│   ├── types/
│   │   └── index.ts
│   ├── config/
│   │   └── index.ts
│   └── server.ts
│   └── index.ts
├── tests/
│   ├── unit/
│   │   ├── services/
│   │   └── utils/
│   ├── integration/
│   │   └── api/
│   └── setup.ts
├── docs/
│   ├── API.md
│   └── ARCHITECTURE.md
├── scripts/
│   ├── setup.sh
│   ├── migrate.sh
│   └── seed.sh
├── .github/
│   └── workflows/
│       ├── test.yml
│       └── deploy.yml
├── .husky/
│   ├── pre-commit
│   └── pre-push
├── Dockerfile
├── docker-compose.yml
├── .dockerignore
├── .env.example
├── .eslintrc.js
├── .prettierrc
├── .gitignore
├── tsconfig.json
├── jest.config.js
├── package.json
├── README.md
├── CONTRIBUTING.md
├── SECURITY.md
└── LICENSE

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📦 DEPENDENCIES INSTALLED:

Production:
- express (^4.18.2)
- @prisma/client (^5.7.0)
- jsonwebtoken (^9.0.2)
- bcrypt (^5.1.1)
- dotenv (^16.3.1)
- zod (^3.22.4) - validation
- winston (^3.11.0) - logging
- helmet (^7.1.0) - security
- cors (^2.8.5)
- compression (^1.7.4)

Development:
- typescript (^5.3.3)
- @types/node (^20.10.5)
- @types/express (^4.17.21)
- ts-node-dev (^2.0.0)
- eslint (^8.56.0)
- @typescript-eslint/* (^6.15.0)
- prettier (^3.1.1)
- jest (^29.7.0)
- @types/jest (^29.5.11)
- supertest (^6.3.3)
- husky (^8.0.3)
- lint-staged (^15.2.0)
- prisma (^5.7.0)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📄 KEY FILES CREATED:

1. package.json
   Scripts:
   - npm run dev       → Start development server
   - npm run build     → Build for production
   - npm start         → Start production server
   - npm test          → Run tests
   - npm run lint      → Run ESLint
   - npm run format    → Format code with Prettier
   - npm run migrate   → Run database migrations
   - npm run studio    → Open Prisma Studio

2. src/server.ts (Express server with middleware)
3. src/api/routes/*.routes.ts (RESTful routes)
4. src/services/*.service.ts (Business logic)
5. prisma/schema.prisma (Database schema)
6. Dockerfile (Production-ready container)
7. .github/workflows/test.yml (CI pipeline)
8. README.md (Complete documentation)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🗄️ DATABASE SCHEMA CREATED:

```prisma
// prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String
  name      String
  role      Role     @default(USER)
  tasks     Task[]
  teams     TeamMember[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@index([email])
}

model Task {
  id          String   @id @default(uuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority @default(MEDIUM)
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  teamId      String?
  team        Team?    @relation(fields: [teamId], references: [id])
  dueDate     DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
  @@index([teamId])
  @@index([status])
}

model Team {
  id        String       @id @default(uuid())
  name      String
  members   TeamMember[]
  tasks     Task[]
  createdAt DateTime     @default(now())
  updatedAt DateTime     @updatedAt
}

model TeamMember {
  id        String   @id @default(uuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id])
  teamId    String
  team      Team     @relation(fields: [teamId], references: [id])
  role      TeamRole @default(MEMBER)
  joinedAt  DateTime @default(now())

  @@unique([userId, teamId])
}

enum Role {
  USER
  ADMIN
}

enum TaskStatus {
  TODO
  IN_PROGRESS
  DONE
}

enum Priority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum TeamRole {
  MEMBER
  ADMIN
  OWNER
}
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🔐 SECURITY FEATURES:

✅ JWT authentication with bcrypt password hashing
✅ Helmet.js for security headers
✅ CORS configuration
✅ Input validation with Zod
✅ SQL injection protection (Prisma ORM)
✅ Rate limiting on auth endpoints
✅ Environment variables for secrets
✅ .env.example for reference (no secrets committed)
✅ Security policy (SECURITY.md)
✅ Dependabot enabled

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🧪 TESTING SETUP:

✅ Jest configured with TypeScript
✅ Test structure created (unit/integration/e2e)
✅ Example tests provided
✅ Code coverage configured (minimum 80%)
✅ Supertest for API testing
✅ Test database configuration

Example test created:
```typescript
// tests/integration/api/auth.test.ts
describe('POST /api/auth/register', () => {
  it('should register a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        email: 'test@example.com',
        password: 'SecureP@ss123',
        name: 'Test User'
      });

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe('test@example.com');
  });
});
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🚀 CI/CD PIPELINE:

✅ GitHub Actions workflow created
✅ Automated testing on every PR
✅ Linting and type checking
✅ Code coverage reports
✅ Security vulnerability scanning
✅ Docker build and push
✅ Automatic deployment to staging (on main branch)

Workflow triggers:
- Pull requests → Run tests, lint, type check
- Push to main → Deploy to staging
- Tagged releases → Deploy to production

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

📚 DOCUMENTATION CREATED:

1. README.md
   - Project overview
   - Features list
   - Installation instructions
   - API documentation
   - Development guide
   - Deployment guide

2. docs/API.md
   - Complete API reference
   - Authentication flow
   - Request/response examples
   - Error codes

3. docs/ARCHITECTURE.md
   - System architecture
   - Database schema
   - Design decisions
   - Technology choices

4. CONTRIBUTING.md
   - How to contribute
   - Development workflow
   - Code style guide
   - PR process

5. SECURITY.md
   - Security policy
   - Vulnerability reporting
   - Security best practices

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🐳 DOCKER SETUP:

✅ Production-ready Dockerfile (multi-stage build)
✅ docker-compose.yml for local development
✅ PostgreSQL service included
✅ Redis service for caching/sessions
✅ Volume mounts for persistence
✅ Health checks configured
✅ .dockerignore optimized

Quick start with Docker:
```bash
docker-compose up
```

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ PROJECT READY!

Next steps:

1. Navigate to project:
   cd task-manager-api

2. Set up environment:
   cp .env.example .env
   # Edit .env with your database credentials

3. Start database:
   docker-compose up -d postgres

4. Run migrations:
   npm run migrate

5. Start development server:
   npm run dev

6. Run tests:
   npm test

7. Visit http://localhost:3000

8. API documentation: http://localhost:3000/api-docs

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🎯 PROJECT STATISTICS:

Files created: 47
Lines of code: ~2,500
Dependencies: 25
Dev dependencies: 18
Tests: 15 example tests
Documentation: 5 files (~1,200 lines)
Time saved: ~4 hours

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Would you like me to:
1. Add more features (e.g., email notifications, file uploads)?
2. Set up additional services (Redis, RabbitMQ)?
3. Create example API calls (Postman collection)?
4. Generate more comprehensive tests?
5. Set up monitoring and logging (Datadog, Sentry)?
```

### Customization Examples

**Example 1: Add Email Service**

```
taurus> Add email functionality using SendGrid:
- Welcome email on registration
- Password reset emails
- Task assignment notifications

Create email templates and service class.
```

**Example 2: Add Authentication Providers**

```
taurus> Add social authentication:
- Google OAuth
- GitHub OAuth
- Configure passport.js
- Add login buttons to documentation
```

**Example 3: Add Monitoring**

```
taurus> Add monitoring and observability:
- Prometheus metrics
- Grafana dashboards
- Health check endpoint
- Structured logging with correlation IDs
```

## Project Templates

### Template 1: Microservice

```
taurus> /init-project

Create a microservice with:
- gRPC APIs
- Event-driven architecture (Kafka)
- Circuit breakers
- Service mesh ready (Istio)
- Distributed tracing (Jaeger)
```

### Template 2: Serverless API

```
taurus> /init-project

Create a serverless API with:
- AWS Lambda functions
- API Gateway
- DynamoDB
- CloudFormation templates
- Serverless framework
```

### Template 3: GraphQL API

```
taurus> /init-project

Create a GraphQL API with:
- Apollo Server
- Type-safe schema
- DataLoader for N+1
- Subscriptions support
- GraphQL Playground
```

## Best Practices

### 1. Use Consistent Structure

All projects should follow similar patterns:
- Same directory structure
- Same npm scripts
- Same tooling setup
- Same CI/CD pipeline

### 2. Include Examples

Every generated project should have:
- Example API endpoints
- Example tests
- Example documentation
- Example Docker usage

### 3. Security First

Every project includes:
- Security headers (Helmet)
- Input validation
- Authentication/authorization
- Secure defaults
- Security policy

### 4. Production Ready

Projects should be ready for production:
- Docker support
- CI/CD pipeline
- Health checks
- Logging
- Error handling
- Monitoring hooks

### 5. Developer Experience

Optimize for developers:
- Hot reloading
- Clear error messages
- Good documentation
- Example usage
- Development tools

## Next Steps

Automate everything! Continue with:

1. **[Documentation Workflow](./11-documentation-workflow.md)** - Generate comprehensive docs
2. **[Bug Fixing Workflow](./12-bug-fixing-workflow.md)** - Systematic debugging

---

**Bootstrap projects in minutes! ⚡**

**Next:** [Documentation Workflow](./11-documentation-workflow.md)
