/**
 * Test Analyzer - Analyzes code to identify testable elements
 */

import * as fs from 'fs';
import {
  CodeElement,
  CodeElementType,
  CodeLocation,
  TestType,
} from './types';

export class TestAnalyzer {
  /**
   * Analyze source code to extract testable elements
   */
  analyzeCode(sourceCode: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = [];

    // Analyze functions
    elements.push(...this.analyzeFunctions(sourceCode, filePath));

    // Analyze classes
    elements.push(...this.analyzeClasses(sourceCode, filePath));

    // Analyze components (React/Vue)
    elements.push(...this.analyzeComponents(sourceCode, filePath));

    // Analyze hooks (React)
    elements.push(...this.analyzeHooks(sourceCode, filePath));

    return elements;
  }

  /**
   * Analyze functions in code
   */
  private analyzeFunctions(
    sourceCode: string,
    filePath: string
  ): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = sourceCode.split('\n');

    // Match function declarations and expressions
    const functionPatterns = [
      /(?:export\s+)?(?:async\s+)?function\s+(\w+)\s*\((.*?)\)/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\((.*?)\)\s*=>/g,
      /(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?function\s*\((.*?)\)/g,
    ];

    for (const pattern of functionPatterns) {
      let match;
      while ((match = pattern.exec(sourceCode)) !== null) {
        const name = match[1];
        const params = match[2];
        const position = match.index;
        const lineNumber = this.getLineNumber(sourceCode, position);

        elements.push({
          type: 'function',
          name,
          signature: `${name}(${params})`,
          location: {
            file: filePath,
            startLine: lineNumber,
            endLine: this.findFunctionEndLine(lines, lineNumber),
          },
          complexity: this.calculateComplexity(
            this.extractFunctionBody(lines, lineNumber)
          ),
          dependencies: this.extractDependencies(
            this.extractFunctionBody(lines, lineNumber)
          ),
        });
      }
    }

    return elements;
  }

  /**
   * Analyze classes in code
   */
  private analyzeClasses(sourceCode: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = [];
    const lines = sourceCode.split('\n');

    // Match class declarations
    const classPattern = /(?:export\s+)?class\s+(\w+)(?:\s+extends\s+\w+)?/g;
    let match;

    while ((match = classPattern.exec(sourceCode)) !== null) {
      const className = match[1];
      const position = match.index;
      const lineNumber = this.getLineNumber(sourceCode, position);
      const classBody = this.extractClassBody(lines, lineNumber);

      // Add class element
      elements.push({
        type: 'class',
        name: className,
        signature: className,
        location: {
          file: filePath,
          startLine: lineNumber,
          endLine: this.findClassEndLine(lines, lineNumber),
        },
        complexity: this.calculateComplexity(classBody),
        dependencies: this.extractDependencies(classBody),
      });

      // Add method elements
      const methods = this.extractMethods(classBody, className, filePath, lineNumber);
      elements.push(...methods);
    }

    return elements;
  }

  /**
   * Extract methods from class body
   */
  private extractMethods(
    classBody: string,
    className: string,
    filePath: string,
    classStartLine: number
  ): CodeElement[] {
    const elements: CodeElement[] = [];
    const methodPattern =
      /(?:async\s+)?(\w+)\s*\((.*?)\)(?:\s*:\s*[\w<>[\]|]+)?\s*\{/g;
    let match;

    while ((match = methodPattern.exec(classBody)) !== null) {
      const methodName = match[1];
      const params = match[2];

      // Skip constructor (will be tested via class instantiation)
      if (methodName === 'constructor') continue;

      const position = match.index;
      const lineNumber =
        classStartLine + this.getLineNumber(classBody, position);

      elements.push({
        type: 'method',
        name: `${className}.${methodName}`,
        signature: `${methodName}(${params})`,
        location: {
          file: filePath,
          startLine: lineNumber,
          endLine: lineNumber + 10, // Approximate
        },
        complexity: this.calculateComplexity(match[0]),
        dependencies: this.extractDependencies(match[0]),
      });
    }

    return elements;
  }

  /**
   * Analyze React/Vue components
   */
  private analyzeComponents(
    sourceCode: string,
    filePath: string
  ): CodeElement[] {
    const elements: CodeElement[] = [];

    // React functional components
    const reactPattern =
      /(?:export\s+)?(?:const|function)\s+(\w+)\s*(?:=\s*)?\([^)]*\)(?:\s*:\s*[\w.]+)?\s*(?:=>)?\s*\{[\s\S]*?return\s*\(/g;
    let match;

    while ((match = reactPattern.exec(sourceCode)) !== null) {
      const name = match[1];

      // Check if it's a component (starts with uppercase)
      if (name[0] === name[0].toUpperCase()) {
        const position = match.index;
        const lineNumber = this.getLineNumber(sourceCode, position);

        elements.push({
          type: 'component',
          name,
          signature: name,
          location: {
            file: filePath,
            startLine: lineNumber,
            endLine: lineNumber + 20, // Approximate
          },
          complexity: this.calculateComplexity(match[0]),
          dependencies: this.extractDependencies(match[0]),
        });
      }
    }

    return elements;
  }

  /**
   * Analyze React hooks
   */
  private analyzeHooks(sourceCode: string, filePath: string): CodeElement[] {
    const elements: CodeElement[] = [];

    // Custom hooks (functions starting with 'use')
    const hookPattern =
      /(?:export\s+)?(?:const|function)\s+(use\w+)\s*(?:=\s*)?\([^)]*\)/g;
    let match;

    while ((match = hookPattern.exec(sourceCode)) !== null) {
      const name = match[1];
      const position = match.index;
      const lineNumber = this.getLineNumber(sourceCode, position);

      elements.push({
        type: 'hook',
        name,
        signature: name,
        location: {
          file: filePath,
          startLine: lineNumber,
          endLine: lineNumber + 15, // Approximate
        },
        complexity: 3, // Hooks are moderately complex
        dependencies: this.extractDependencies(match[0]),
      });
    }

    return elements;
  }

  /**
   * Calculate cyclomatic complexity
   */
  private calculateComplexity(code: string): number {
    let complexity = 1; // Base complexity

    // Count decision points
    const patterns = [
      /\bif\s*\(/g,
      /\belse\s+if\s*\(/g,
      /\bfor\s*\(/g,
      /\bwhile\s*\(/g,
      /\bcase\s+/g,
      /\bcatch\s*\(/g,
      /\&\&/g,
      /\|\|/g,
      /\?/g, // Ternary operator
    ];

    for (const pattern of patterns) {
      const matches = code.match(pattern);
      if (matches) {
        complexity += matches.length;
      }
    }

    return complexity;
  }

  /**
   * Extract dependencies (imports, external calls)
   */
  private extractDependencies(code: string): string[] {
    const dependencies = new Set<string>();

    // Extract function calls
    const callPattern = /(\w+)\s*\(/g;
    let match;

    while ((match = callPattern.exec(code)) !== null) {
      const funcName = match[1];
      // Filter out common language keywords
      if (
        !['if', 'for', 'while', 'switch', 'catch', 'return'].includes(funcName)
      ) {
        dependencies.add(funcName);
      }
    }

    return Array.from(dependencies);
  }

  /**
   * Get line number from position
   */
  private getLineNumber(code: string, position: number): number {
    return code.substring(0, position).split('\n').length;
  }

  /**
   * Extract function body
   */
  private extractFunctionBody(lines: string[], startLine: number): string {
    const endLine = this.findFunctionEndLine(lines, startLine);
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  /**
   * Find end line of function
   */
  private findFunctionEndLine(lines: string[], startLine: number): number {
    let braceCount = 0;
    let foundStart = false;

    for (let i = startLine - 1; i < lines.length; i++) {
      const line = lines[i];

      for (const char of line) {
        if (char === '{') {
          braceCount++;
          foundStart = true;
        } else if (char === '}') {
          braceCount--;
          if (foundStart && braceCount === 0) {
            return i + 1;
          }
        }
      }
    }

    return startLine + 10; // Fallback
  }

  /**
   * Extract class body
   */
  private extractClassBody(lines: string[], startLine: number): string {
    const endLine = this.findClassEndLine(lines, startLine);
    return lines.slice(startLine - 1, endLine).join('\n');
  }

  /**
   * Find end line of class
   */
  private findClassEndLine(lines: string[], startLine: number): number {
    return this.findFunctionEndLine(lines, startLine); // Same logic
  }

  /**
   * Determine recommended test types for code element
   */
  recommendTestTypes(element: CodeElement): TestType[] {
    const types: TestType[] = ['unit'];

    // Complex functions need integration tests
    if (element.complexity > 5) {
      types.push('integration');
    }

    // Components need snapshot tests
    if (element.type === 'component') {
      types.push('snapshot');
    }

    // API endpoints need functional tests
    if (element.type === 'api-endpoint') {
      types.push('functional');
    }

    // Functions with external dependencies need integration tests
    if (element.dependencies.length > 3) {
      types.push('integration');
    }

    return types;
  }

  /**
   * Analyze file from path
   */
  analyzeFile(filePath: string): CodeElement[] {
    const sourceCode = fs.readFileSync(filePath, 'utf-8');
    return this.analyzeCode(sourceCode, filePath);
  }
}
