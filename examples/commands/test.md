# Test Generation Command

Generate unit tests for the specified code.

## Instructions

When this command is invoked, you should:

1. **Identify the target:**
   - Parse arguments to determine which file/function to test
   - If no argument provided, ask the user what to test

2. **Analyze the code:**
   - Read the target file
   - Understand the functions/classes
   - Identify edge cases and scenarios

3. **Generate tests:**
   - Create comprehensive test cases
   - Cover happy paths
   - Cover error cases
   - Cover edge cases
   - Use appropriate testing framework (Jest, Mocha, etc.)

4. **Write the test file:**
   - Follow project testing conventions
   - Include setup and teardown
   - Add descriptive test names
   - Include assertions

## Example Usage

```
/test src/utils/helper.ts
/test UserController
```
