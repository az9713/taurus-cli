/**
 * Style Analyzer
 *
 * Analyzes code style and formatting issues
 */

import { ReviewFinding, ReviewContext, StyleViolation } from '../types.js';

export class StyleAnalyzer {
  private rules: Map<string, (context: ReviewContext) => StyleViolation[]> = new Map();

  constructor() {
    this.initializeRules();
  }

  /**
   * Initialize built-in style rules
   */
  private initializeRules(): void {
    // TODO comments
    this.rules.set('no-todo-comments', (context) => {
      const violations: StyleViolation[] = [];
      const lines = context.content.split('\n');

      lines.forEach((line, index) => {
        if (/\/\/\s*TODO|\/\*\s*TODO|\#\s*TODO/.test(line)) {
          violations.push({
            rule: 'no-todo-comments',
            file: context.file,
            line: index + 1,
            message: 'TODO comments should be tracked as issues',
            autoFixable: false,
          });
        }
      });

      return violations;
    });

    // Console logs
    this.rules.set('no-console-log', (context) => {
      const violations: StyleViolation[] = [];
      if (!context.file.includes('.test.') && !context.file.includes('.spec.')) {
        const lines = context.content.split('\n');

        lines.forEach((line, index) => {
          if (/console\.(log|debug|info|warn|error)/.test(line) && !line.trim().startsWith('//')) {
            violations.push({
              rule: 'no-console-log',
              file: context.file,
              line: index + 1,
              message: 'Avoid console statements in production code. Use a proper logger.',
              autoFixable: true,
            });
          }
        });
      }

      return violations;
    });

    // Long functions
    this.rules.set('max-function-length', (context) => {
      const violations: StyleViolation[] = [];
      const lines = context.content.split('\n');
      let inFunction = false;
      let functionStart = 0;
      let braceCount = 0;

      lines.forEach((line, index) => {
        if (/function\s+\w+|=>\s*\{|^\s*(async\s+)?(\w+)\s*\([^)]*\)\s*\{/.test(line)) {
          inFunction = true;
          functionStart = index + 1;
          braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
        } else if (inFunction) {
          braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;

          if (braceCount === 0) {
            const functionLength = index - functionStart + 1;
            if (functionLength > 50) {
              violations.push({
                rule: 'max-function-length',
                file: context.file,
                line: functionStart,
                message: `Function is ${functionLength} lines long (max 50). Consider breaking it down.`,
                autoFixable: false,
              });
            }
            inFunction = false;
          }
        }
      });

      return violations;
    });

    // Magic numbers
    this.rules.set('no-magic-numbers', (context) => {
      const violations: StyleViolation[] = [];
      const lines = context.content.split('\n');

      lines.forEach((line, index) => {
        // Look for numeric literals (excluding 0, 1, -1, and numbers in comments)
        const magicNumberRegex = /(?<![a-zA-Z0-9_])(?<!\/\/.*)\b([2-9]|\d{2,})\b(?![eE])/g;
        const matches = line.match(magicNumberRegex);

        if (matches && !line.trim().startsWith('//') && !line.includes('const ')) {
          violations.push({
            rule: 'no-magic-numbers',
            file: context.file,
            line: index + 1,
            message: 'Avoid magic numbers. Use named constants instead.',
            autoFixable: false,
          });
        }
      });

      return violations;
    });

    // Nested ternaries
    this.rules.set('no-nested-ternary', (context) => {
      const violations: StyleViolation[] = [];
      const lines = context.content.split('\n');

      lines.forEach((line, index) => {
        // Count ? and : to detect nested ternaries
        const questionMarks = (line.match(/\?/g) || []).length;
        if (questionMarks > 1) {
          violations.push({
            rule: 'no-nested-ternary',
            file: context.file,
            line: index + 1,
            message: 'Nested ternary operators reduce readability. Use if-else instead.',
            autoFixable: false,
          });
        }
      });

      return violations;
    });

    // Var usage (for JavaScript/TypeScript)
    this.rules.set('no-var', (context) => {
      const violations: StyleViolation[] = [];
      if (context.language === 'typescript' || context.language === 'javascript') {
        const lines = context.content.split('\n');

        lines.forEach((line, index) => {
          if (/\bvar\s+/.test(line) && !line.trim().startsWith('//')) {
            violations.push({
              rule: 'no-var',
              file: context.file,
              line: index + 1,
              message: 'Use const or let instead of var',
              autoFixable: true,
            });
          }
        });
      }

      return violations;
    });
  }

  /**
   * Analyze code for style violations
   */
  async analyze(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    let findingId = 1;

    // Run all rules
    for (const [ruleName, ruleFunc] of this.rules) {
      const violations = ruleFunc(context);

      for (const violation of violations) {
        findings.push({
          id: `style-${findingId++}`,
          severity: this.getSeverity(ruleName),
          category: 'style',
          message: violation.message,
          file: violation.file,
          line: violation.line,
          code: this.getCodeSnippet(context.content, violation.line),
          suggestion: this.getSuggestion(ruleName),
          autoFixable: violation.autoFixable,
          references: [`Rule: ${ruleName}`],
        });
      }
    }

    return findings;
  }

  /**
   * Get severity for a rule
   */
  private getSeverity(rule: string): ReviewFinding['severity'] {
    const criticalRules: string[] = [];
    const highRules = ['no-var'];
    const mediumRules = ['no-console-log', 'max-function-length'];
    const lowRules = ['no-magic-numbers', 'no-nested-ternary'];

    if (criticalRules.includes(rule)) return 'critical';
    if (highRules.includes(rule)) return 'high';
    if (mediumRules.includes(rule)) return 'medium';
    if (lowRules.includes(rule)) return 'low';
    return 'info';
  }

  /**
   * Get code snippet around a line
   */
  private getCodeSnippet(content: string, line: number, context = 2): string {
    const lines = content.split('\n');
    const start = Math.max(0, line - context - 1);
    const end = Math.min(lines.length, line + context);

    return lines.slice(start, end).join('\n');
  }

  /**
   * Get suggestion for fixing a violation
   */
  private getSuggestion(rule: string): string {
    const suggestions: Record<string, string> = {
      'no-todo-comments': 'Create a GitHub issue to track this work',
      'no-console-log': 'Use a logger library like winston or pino',
      'max-function-length': 'Extract logic into smaller, focused functions',
      'no-magic-numbers': 'Define a named constant: const MAX_RETRIES = 3',
      'no-nested-ternary': 'Use if-else statements for better readability',
      'no-var': 'Replace with const for immutable values or let for reassignment',
    };

    return suggestions[rule] || 'Follow the project style guide';
  }

  /**
   * Auto-fix violations where possible
   */
  async autoFix(content: string, violations: StyleViolation[]): Promise<string> {
    let fixed = content;

    for (const violation of violations) {
      if (violation.autoFixable) {
        switch (violation.rule) {
          case 'no-var':
            fixed = fixed.replace(/\bvar\s+/g, 'const ');
            break;
          case 'no-console-log':
            // Comment out console statements
            const lines = fixed.split('\n');
            if (violation.line <= lines.length) {
              lines[violation.line - 1] = '// ' + lines[violation.line - 1];
              fixed = lines.join('\n');
            }
            break;
        }
      }
    }

    return fixed;
  }

  /**
   * Add custom rule
   */
  addCustomRule(
    name: string,
    ruleFunc: (context: ReviewContext) => StyleViolation[]
  ): void {
    this.rules.set(name, ruleFunc);
  }
}
