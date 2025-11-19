/**
 * Code Reviewer
 *
 * Main orchestrator for AI-powered code review
 */

import { EventEmitter } from 'events';
import { promises as fs } from 'fs';
import { join, extname } from 'path';
import {
  CodeReviewConfig,
  ReviewContext,
  ReviewResult,
  ReviewFinding,
  PRReviewRequest,
  PRReviewComment,
} from './types.js';
import { StyleAnalyzer } from './analyzers/style-analyzer.js';
import { SecurityAnalyzer } from './analyzers/security-analyzer.js';
import { PerformanceAnalyzer } from './analyzers/performance-analyzer.js';
import { TestAnalyzer } from './analyzers/test-analyzer.js';

export class CodeReviewer extends EventEmitter {
  private config: CodeReviewConfig;
  private styleAnalyzer: StyleAnalyzer;
  private securityAnalyzer: SecurityAnalyzer;
  private performanceAnalyzer: PerformanceAnalyzer;
  private testAnalyzer: TestAnalyzer;

  constructor(config: CodeReviewConfig) {
    super();
    this.config = config;
    this.styleAnalyzer = new StyleAnalyzer();
    this.securityAnalyzer = new SecurityAnalyzer();
    this.performanceAnalyzer = new PerformanceAnalyzer();
    this.testAnalyzer = new TestAnalyzer();
  }

  /**
   * Review a single file
   */
  async reviewFile(filePath: string, fullReview = true): Promise<ReviewResult> {
    this.emit('review-started', { file: filePath });

    try {
      // Read file content
      const content = await fs.readFile(filePath, 'utf-8');

      // Create review context
      const context: ReviewContext = {
        file: filePath,
        content,
        language: this.detectLanguage(filePath),
        fullReview,
      };

      // Run all enabled analyzers
      const findings: ReviewFinding[] = [];

      if (this.config.checks.includes('style')) {
        const styleFindings = await this.styleAnalyzer.analyze(context);
        findings.push(...styleFindings);
      }

      if (this.config.checks.includes('security')) {
        const securityFindings = await this.securityAnalyzer.analyze(context);
        findings.push(...securityFindings);
      }

      if (this.config.checks.includes('performance')) {
        const perfFindings = await this.performanceAnalyzer.analyze(context);
        findings.push(...perfFindings);
      }

      if (this.config.checks.includes('testing')) {
        const testFindings = await this.testAnalyzer.analyze(context);
        findings.push(...testFindings);
      }

      // Calculate score
      const score = this.calculateScore(findings);

      // Create summary
      const summary = this.createSummary(findings);

      const result: ReviewResult = {
        file: filePath,
        findings,
        score,
        summary,
        reviewedAt: new Date(),
        reviewedBy: 'Taurus AI Code Reviewer',
      };

      this.emit('review-completed', result);

      // Check if should block
      if (this.shouldBlock(findings)) {
        this.emit('review-blocked', result);
      }

      return result;
    } catch (error: any) {
      this.emit('review-failed', { file: filePath, error: error.message });
      throw error;
    }
  }

  /**
   * Review multiple files
   */
  async reviewFiles(filePaths: string[]): Promise<ReviewResult[]> {
    const results: ReviewResult[] = [];

    for (const filePath of filePaths) {
      if (this.shouldReviewFile(filePath)) {
        const result = await this.reviewFile(filePath);
        results.push(result);
      }
    }

    return results;
  }

  /**
   * Review a pull request
   */
  async reviewPullRequest(request: PRReviewRequest): Promise<{
    results: ReviewResult[];
    comments: PRReviewComment[];
    approved: boolean;
  }> {
    this.emit('pr-review-started', request);

    const results = await this.reviewFiles(request.files);

    // Generate PR comments
    const comments: PRReviewComment[] = [];
    for (const result of results) {
      for (const finding of result.findings) {
        if (finding.severity === 'critical' || finding.severity === 'high') {
          comments.push({
            file: result.file,
            line: finding.line,
            body: `**[${finding.severity.toUpperCase()}]** ${finding.category}: ${finding.message}\n\n${finding.suggestion || ''}`,
            severity: finding.severity,
          });
        }
      }
    }

    // Determine if PR should be approved
    const approved = !results.some(r => this.shouldBlock(r.findings));

    this.emit('pr-review-completed', { results, comments, approved });

    return { results, comments, approved };
  }

  /**
   * Check if file should be reviewed
   */
  private shouldReviewFile(filePath: string): boolean {
    // Check exclude patterns
    if (this.config.excludePatterns) {
      for (const pattern of this.config.excludePatterns) {
        if (new RegExp(pattern).test(filePath)) {
          return false;
        }
      }
    }

    // Check include patterns
    if (this.config.includePatterns && this.config.includePatterns.length > 0) {
      let matches = false;
      for (const pattern of this.config.includePatterns) {
        if (new RegExp(pattern).test(filePath)) {
          matches = true;
          break;
        }
      }
      if (!matches) return false;
    }

    // Only review code files
    const ext = extname(filePath);
    const codeExtensions = ['.ts', '.js', '.tsx', '.jsx', '.py', '.go', '.rs', '.java', '.c', '.cpp'];
    return codeExtensions.includes(ext);
  }

  /**
   * Detect programming language from file extension
   */
  private detectLanguage(filePath: string): string {
    const ext = extname(filePath);
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.go': 'go',
      '.rs': 'rust',
      '.java': 'java',
      '.c': 'c',
      '.cpp': 'cpp',
      '.rb': 'ruby',
      '.php': 'php',
    };

    return languageMap[ext] || 'unknown';
  }

  /**
   * Calculate review score (0-100)
   */
  private calculateScore(findings: ReviewFinding[]): number {
    let score = 100;

    for (const finding of findings) {
      switch (finding.severity) {
        case 'critical':
          score -= 20;
          break;
        case 'high':
          score -= 10;
          break;
        case 'medium':
          score -= 5;
          break;
        case 'low':
          score -= 2;
          break;
        case 'info':
          score -= 0.5;
          break;
      }
    }

    return Math.max(0, score);
  }

  /**
   * Create findings summary
   */
  private createSummary(findings: ReviewFinding[]) {
    return {
      total: findings.length,
      critical: findings.filter(f => f.severity === 'critical').length,
      high: findings.filter(f => f.severity === 'high').length,
      medium: findings.filter(f => f.severity === 'medium').length,
      low: findings.filter(f => f.severity === 'low').length,
      info: findings.filter(f => f.severity === 'info').length,
    };
  }

  /**
   * Check if findings should block merge
   */
  private shouldBlock(findings: ReviewFinding[]): boolean {
    const hasCritical = findings.some(f => f.severity === 'critical');
    const hasHigh = findings.some(f => f.severity === 'high');

    if (this.config.severity.blockOnCritical && hasCritical) {
      return true;
    }

    if (this.config.severity.blockOnHigh && hasHigh) {
      return true;
    }

    return false;
  }

  /**
   * Generate review report
   */
  generateReport(results: ReviewResult[]): string {
    let report = '# Code Review Report\n\n';
    report += `Generated: ${new Date().toISOString()}\n\n`;

    // Overall statistics
    const totalFindings = results.reduce((sum, r) => sum + r.findings.length, 0);
    const totalCritical = results.reduce((sum, r) => sum + r.summary.critical, 0);
    const totalHigh = results.reduce((sum, r) => sum + r.summary.high, 0);
    const totalMedium = results.reduce((sum, r) => sum + r.summary.medium, 0);
    const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;

    report += '## Summary\n\n';
    report += `- Files Reviewed: ${results.length}\n`;
    report += `- Total Findings: ${totalFindings}\n`;
    report += `- Critical: ${totalCritical}\n`;
    report += `- High: ${totalHigh}\n`;
    report += `- Medium: ${totalMedium}\n`;
    report += `- Average Score: ${avgScore.toFixed(1)}/100\n\n`;

    // Per-file results
    report += '## Files\n\n';
    for (const result of results) {
      report += `### ${result.file} (Score: ${result.score}/100)\n\n`;

      if (result.findings.length === 0) {
        report += 'No issues found! ✅\n\n';
        continue;
      }

      // Group by severity
      const critical = result.findings.filter(f => f.severity === 'critical');
      const high = result.findings.filter(f => f.severity === 'high');
      const medium = result.findings.filter(f => f.severity === 'medium');

      if (critical.length > 0) {
        report += '#### Critical Issues\n\n';
        critical.forEach(f => {
          report += `- Line ${f.line}: ${f.message}\n`;
          if (f.suggestion) report += `  - Suggestion: ${f.suggestion}\n`;
        });
        report += '\n';
      }

      if (high.length > 0) {
        report += '#### High Priority Issues\n\n';
        high.forEach(f => {
          report += `- Line ${f.line}: ${f.message}\n`;
        });
        report += '\n';
      }

      if (medium.length > 0) {
        report += '#### Medium Priority Issues\n\n';
        medium.forEach(f => {
          report += `- Line ${f.line}: ${f.message}\n`;
        });
        report += '\n';
      }
    }

    return report;
  }

  /**
   * Export results to JSON
   */
  exportResults(results: ReviewResult[], outputPath: string): Promise<void> {
    const data = {
      generatedAt: new Date().toISOString(),
      results,
      summary: {
        filesReviewed: results.length,
        totalFindings: results.reduce((sum, r) => sum + r.findings.length, 0),
        averageScore: results.reduce((sum, r) => sum + r.score, 0) / results.length,
      },
    };

    return fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  }
}
