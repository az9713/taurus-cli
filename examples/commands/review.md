# Code Review Command

Review the current codebase or specific files and provide detailed feedback.

## Instructions

When this command is invoked, you should:

1. **Identify what to review:**
   - If the user specified files or directories, focus on those
   - Otherwise, review recent changes (git diff)
   - Or review the most recently modified files

2. **Analyze the code for:**
   - Code quality and best practices
   - Potential bugs or issues
   - Security vulnerabilities
   - Performance concerns
   - Testing coverage
   - Documentation completeness

3. **Provide feedback on:**
   - What's done well
   - What needs improvement
   - Specific suggestions with examples
   - Priority of each issue (high/medium/low)

4. **Format your response:**
   - Summary of findings
   - Detailed list of issues
   - Suggested improvements
   - Example code fixes where applicable

## Example Usage

```
/review
/review src/components/
/review src/app.ts
```
