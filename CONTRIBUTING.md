# Contributing to Taurus CLI

Thank you for your interest in contributing to Taurus CLI! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. **Fork the repository**
   ```bash
   git clone https://github.com/az9713/taurus-cli.git
   cd taurus-cli
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build the project**
   ```bash
   npm run build
   ```

4. **Run tests**
   ```bash
   npm test
   ```

## Development Workflow

### 1. Create a Branch
```bash
git checkout -b feature/your-feature-name
```

### 2. Make Changes
- Write clear, documented code
- Follow TypeScript best practices
- Add tests for new features
- Update documentation

### 3. Test Your Changes
```bash
# Run all tests
npm test

# Run specific test
npm test -- bash.test.ts

# Run with coverage
npm test -- --coverage

# Lint
npm run lint

# Format
npm run format
```

### 4. Commit Your Changes
```bash
git add .
git commit -m "feat: add new feature"
```

Commit message format:
- `feat:` New feature
- `fix:` Bug fix
- `docs:` Documentation changes
- `test:` Test additions/changes
- `refactor:` Code refactoring
- `chore:` Maintenance tasks

### 5. Push and Create PR
```bash
git push origin feature/your-feature-name
```

Then create a Pull Request on GitHub.

## Project Structure

```
taurus-cli/
├── src/
│   ├── agent/          # Agent orchestration
│   ├── api/            # Claude API client
│   ├── cli/            # CLI interface
│   ├── config/         # Configuration management
│   ├── hooks/          # Hooks system
│   ├── session/        # Session management
│   ├── tools/          # Tool implementations
│   ├── types/          # TypeScript types
│   └── utils/          # Utilities
├── docs/               # Documentation
└── examples/           # Example configurations
```

## Adding New Tools

1. **Create tool file** in `src/tools/`:
```typescript
import { BaseTool } from './base.js';

export class MyTool extends BaseTool {
  name = 'MyTool';
  description = 'What my tool does';

  schema = {
    type: 'object' as const,
    properties: {
      param: {
        type: 'string',
        description: 'Parameter description',
      },
    },
    required: ['param'],
  };

  async execute(input: Record<string, any>) {
    const { param } = input;
    // Implementation
    return this.success('Result');
  }
}
```

2. **Register tool** in `src/tools/index.ts`:
```typescript
import { MyTool } from './mytool.js';

export function createToolRegistry(): ToolRegistry {
  const registry = new ToolRegistry();
  // ... existing tools
  registry.register(new MyTool());
  return registry;
}
```

3. **Add tests** in `src/tools/__tests__/mytool.test.ts`:
```typescript
import { MyTool } from '../mytool.js';

describe('MyTool', () => {
  it('should execute correctly', async () => {
    const tool = new MyTool();
    const result = await tool.execute({ param: 'value' });
    expect(result.is_error).toBe(false);
  });
});
```

4. **Update documentation** in README.md

## Adding New Features

1. Design the feature
2. Update types if needed
3. Implement the feature
4. Add comprehensive tests
5. Update documentation
6. Create PR with description

## Code Style

### TypeScript Guidelines
- Use strict type checking
- Prefer interfaces over types for objects
- Use async/await over promises
- Document public APIs with JSDoc

### File Organization
- One class per file
- Export from index files
- Keep files under 500 lines
- Group related functionality

### Naming Conventions
- Classes: PascalCase
- Functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Files: kebab-case

### Comments
```typescript
/**
 * Function description
 *
 * @param param - Parameter description
 * @returns Return value description
 */
export function myFunction(param: string): string {
  // Implementation comment
  return result;
}
```

## Testing Guidelines

### Test Structure
```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

### Test Coverage
- Aim for >80% coverage
- Test happy paths
- Test error cases
- Test edge cases

## Documentation

### Code Documentation
- Document all public APIs
- Explain complex logic
- Add usage examples
- Keep docs up to date

### README Updates
- Document new features
- Update examples
- Add troubleshooting tips
- Update API reference

## Pull Request Process

1. **Before submitting:**
   - All tests pass
   - Code is formatted
   - Documentation updated
   - No console.log statements
   - No commented code

2. **PR Description:**
   - Clear title
   - Description of changes
   - Link to related issues
   - Screenshots if applicable

3. **Review Process:**
   - Address review comments
   - Keep PR focused
   - Squash commits if needed

4. **After Merge:**
   - Delete your branch
   - Update local main branch

## Release Process

1. Update version in package.json
2. Update CHANGELOG.md
3. Create git tag
4. Push tag to trigger release
5. Publish to npm

## Questions?

- Open an issue for bugs
- Start a discussion for questions
- Join our community chat

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Taurus CLI! 🐂
