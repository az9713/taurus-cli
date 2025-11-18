# Refactoring Skill

Specialized skill for code refactoring following best practices.

## When to Use

This skill should be invoked when:
- Code needs to be restructured
- Technical debt needs to be addressed
- Code smells are present
- Maintainability improvements are needed

## Refactoring Principles

1. **Keep it working:** Ensure tests pass after each refactoring step
2. **Small steps:** Make incremental changes
3. **Clear intent:** Make code more readable and maintainable
4. **Remove duplication:** DRY principle
5. **Simplify:** Reduce complexity

## Refactoring Techniques

### Extract Method
Break down large functions into smaller, focused ones.

### Rename
Use clear, descriptive names for variables, functions, and classes.

### Extract Class
Separate concerns into distinct classes.

### Inline
Remove unnecessary abstractions.

### Move Method/Field
Relocate code to where it belongs.

### Replace Conditional with Polymorphism
Use inheritance instead of complex conditionals.

## Process

1. **Analyze:** Identify code smells and issues
2. **Plan:** Determine refactoring approach
3. **Test:** Ensure tests exist and pass
4. **Refactor:** Make incremental changes
5. **Test again:** Verify nothing broke
6. **Commit:** Commit each successful refactoring step

## Example Patterns

### Before
```typescript
function processUser(user: any) {
  if (user.type === 'admin') {
    // admin logic
  } else if (user.type === 'user') {
    // user logic
  } else if (user.type === 'guest') {
    // guest logic
  }
}
```

### After
```typescript
interface UserProcessor {
  process(user: User): void;
}

class AdminProcessor implements UserProcessor {
  process(user: User): void {
    // admin logic
  }
}

class RegularUserProcessor implements UserProcessor {
  process(user: User): void {
    // user logic
  }
}

class GuestProcessor implements UserProcessor {
  process(user: User): void {
    // guest logic
  }
}

function processUser(user: User, processor: UserProcessor) {
  processor.process(user);
}
```
