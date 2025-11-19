/**
 * Performance Analyzer
 *
 * Analyzes code for performance issues
 */

import { ReviewFinding, ReviewContext, PerformanceIssue } from '../types.js';

export class PerformanceAnalyzer {
  /**
   * Analyze code for performance issues
   */
  async analyze(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];

    findings.push(...await this.checkNPlusOne(context));
    findings.push(...await this.checkInefficientLoops(context));
    findings.push(...await this.checkBlockingOperations(context));
    findings.push(...await this.checkMemoryLeaks(context));
    findings.push(...await this.checkLargeArrayOperations(context));
    findings.push(...await this.checkRegexPerformance(context));

    return findings;
  }

  /**
   * Check for N+1 query problems
   */
  private async checkNPlusOne(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    let inLoop = false;
    let loopStart = 0;

    lines.forEach((line, index) => {
      // Detect loop start
      if (/for\s*\(|\.forEach\(|\.map\(|while\s*\(/.test(line)) {
        inLoop = true;
        loopStart = index + 1;
      }

      // Check for database queries inside loops
      if (inLoop && /(?:find|findOne|findById|query|execute|select|insert|update|delete)\s*\(/.test(line)) {
        findings.push({
          id: `perf-n-plus-one-${index}`,
          severity: 'high',
          category: 'performance',
          message: 'Potential N+1 query problem detected',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use batch queries, joins, or eager loading to fetch data in a single query',
          autoFixable: false,
          references: [
            'N+1 Query Problem',
            'https://stackoverflow.com/questions/97197/what-is-the-n1-selects-problem',
          ],
        });
      }

      // Detect loop end (simplified)
      if (inLoop && /\}/.test(line)) {
        inLoop = false;
      }
    });

    return findings;
  }

  /**
   * Check for inefficient loop operations
   */
  private async checkInefficientLoops(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for array operations inside loops
      if (/for\s*\([^)]*\.length[^)]*\)/.test(line) && /\.push\(|\.concat\(|\.splice\(/.test(lines[index + 1] || '')) {
        findings.push({
          id: `perf-loop-${index}`,
          severity: 'medium',
          category: 'performance',
          message: 'Inefficient array operation in loop',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Consider using array methods like map(), filter(), or reduce() for better performance',
          autoFixable: false,
          references: ['JavaScript Array Performance'],
        });
      }

      // Check for nested loops
      if (/for\s*\(|\.forEach\(/.test(line)) {
        const nextFewLines = lines.slice(index, index + 10).join('\n');
        if ((nextFewLines.match(/for\s*\(|\.forEach\(/g) || []).length > 1) {
          findings.push({
            id: `perf-nested-loop-${index}`,
            severity: 'medium',
            category: 'performance',
            message: 'Nested loops detected - potential O(n²) complexity',
            file: context.file,
            line: index + 1,
            code: line.trim(),
            suggestion: 'Consider using a Map or Set for O(1) lookups instead of nested iteration',
            autoFixable: false,
            references: ['Algorithm Complexity'],
          });
        }
      }

      // Check for repeated property access
      if (/for\s*\([^)]*array\.length[^)]*\)/.test(line)) {
        findings.push({
          id: `perf-prop-access-${index}`,
          severity: 'low',
          category: 'performance',
          message: 'Repeated property access in loop condition',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Cache array.length in a variable: const len = array.length; for (let i = 0; i < len; i++)',
          autoFixable: true,
          references: ['Loop Optimization'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for blocking operations
   */
  private async checkBlockingOperations(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for synchronous file operations
      if (/readFileSync|writeFileSync|existsSync|statSync|readdirSync/.test(line) &&
          !context.file.includes('test') && !context.file.includes('config')) {
        findings.push({
          id: `perf-sync-${index}`,
          severity: 'high',
          category: 'performance',
          message: 'Synchronous file operation blocks event loop',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use async versions (readFile, writeFile, etc.) with await or promises',
          autoFixable: false,
          references: ['Node.js Event Loop'],
        });
      }

      // Check for large setTimeout/setInterval delays
      if (/setTimeout\s*\([^,]*,\s*(\d{5,})|setInterval\s*\([^,]*,\s*(\d{5,})/.test(line)) {
        findings.push({
          id: `perf-timer-${index}`,
          severity: 'low',
          category: 'performance',
          message: 'Very long timer delay detected',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Consider using a scheduled task or cron job for long-running operations',
          autoFixable: false,
          references: ['Timer Management'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for potential memory leaks
   */
  private async checkMemoryLeaks(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    let hasEventListener = false;
    let hasRemoveListener = false;

    lines.forEach((line, index) => {
      // Check for event listeners without cleanup
      if (/addEventListener|on\(|addListener/.test(line)) {
        hasEventListener = true;

        // Look ahead for cleanup
        const nextLines = lines.slice(index, index + 20).join('\n');
        if (!/removeEventListener|off\(|removeListener/.test(nextLines)) {
          findings.push({
            id: `perf-leak-listener-${index}`,
            severity: 'medium',
            category: 'performance',
            message: 'Event listener added without corresponding cleanup',
            file: context.file,
            line: index + 1,
            code: line.trim(),
            suggestion: 'Add removeEventListener in cleanup/unmount function to prevent memory leaks',
            autoFixable: false,
            references: ['Memory Leak Prevention'],
          });
        }
      }

      // Check for setInterval without clearInterval
      if (/setInterval\s*\(/.test(line)) {
        const nextLines = lines.slice(index, index + 30).join('\n');
        if (!/clearInterval/.test(nextLines)) {
          findings.push({
            id: `perf-leak-interval-${index}`,
            severity: 'high',
            category: 'performance',
            message: 'setInterval without clearInterval can cause memory leaks',
            file: context.file,
            line: index + 1,
            code: line.trim(),
            suggestion: 'Store interval ID and call clearInterval in cleanup function',
            autoFixable: false,
            references: ['Timer Memory Leaks'],
          });
        }
      }

      // Check for large global arrays/objects
      if (/(?:window\.|global\.).*\s*=\s*\[|\bglobal\s+\w+\s*=\s*\[/.test(line)) {
        findings.push({
          id: `perf-leak-global-${index}`,
          severity: 'medium',
          category: 'performance',
          message: 'Large global data structure can cause memory issues',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use module-scoped variables or implement cleanup logic',
          autoFixable: false,
          references: ['Global Variable Risks'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for large array operations
   */
  private async checkLargeArrayOperations(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for multiple array transformations
      if ((line.match(/\.map\(|\.filter\(|\.reduce\(/g) || []).length >= 3) {
        findings.push({
          id: `perf-array-chain-${index}`,
          severity: 'medium',
          category: 'performance',
          message: 'Multiple array transformations create intermediate arrays',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Combine operations into a single reduce() or use a for loop for better performance',
          autoFixable: false,
          references: ['Array Method Performance'],
        });
      }

      // Check for sort without caching
      if (/\.sort\s*\([^)]*\)/.test(line) && /for\s*\(|while\s*\(/.test(lines[index - 1] || '')) {
        findings.push({
          id: `perf-sort-in-loop-${index}`,
          severity: 'high',
          category: 'performance',
          message: 'Sorting array inside a loop is inefficient',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Sort once before the loop and reuse the sorted array',
          autoFixable: false,
          references: ['Sorting Performance'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for regex performance issues
   */
  private async checkRegexPerformance(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for catastrophic backtracking patterns
      if (/\/.*\(\.\*\)\+.*\/|\/.*\(\.\+\)\+.*\//.test(line)) {
        findings.push({
          id: `perf-regex-${index}`,
          severity: 'high',
          category: 'performance',
          message: 'Regex pattern may cause catastrophic backtracking',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Avoid nested quantifiers. Use possessive quantifiers or atomic groups',
          autoFixable: false,
          references: [
            'ReDoS - Regular Expression Denial of Service',
            'https://owasp.org/www-community/attacks/Regular_expression_Denial_of_Service_-_ReDoS',
          ],
        });
      }

      // Check for regex in loops
      if (/for\s*\(|while\s*\(|\.forEach\(|\.map\(/.test(lines[index - 1] || '') && /new RegExp\(|\/.*\//.test(line)) {
        findings.push({
          id: `perf-regex-loop-${index}`,
          severity: 'medium',
          category: 'performance',
          message: 'Creating regex inside loop is inefficient',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Define regex outside loop and reuse it',
          autoFixable: true,
          references: ['Regex Optimization'],
        });
      }
    });

    return findings;
  }
}
