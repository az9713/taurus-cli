/**
 * Coverage Analyzer - Analyzes test coverage and identifies gaps
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  CoverageAnalysisRequest,
  CoverageAnalysisResult,
  CoverageMetrics,
  CoverageMetric,
  FileCoverage,
  CoverageGap,
  CoverageSuggestion,
  CoverageReport,
  CoverageReportFormat,
} from './types';
import { TestAnalyzer } from './test-analyzer';

export class CoverageAnalyzer {
  constructor(private analyzer: TestAnalyzer) {}

  /**
   * Analyze test coverage
   */
  async analyzeCoverage(
    request: CoverageAnalysisRequest
  ): Promise<CoverageAnalysisResult> {
    const byFile = new Map<string, FileCoverage>();
    const gaps: CoverageGap[] = [];

    // Analyze each source file
    for (const sourceFile of request.sourceFiles) {
      const fileCoverage = await this.analyzeFileCoverage(
        sourceFile,
        request.testFiles
      );
      byFile.set(sourceFile, fileCoverage);

      // Identify coverage gaps
      const fileGaps = this.identifyCoverageGaps(sourceFile, fileCoverage);
      gaps.push(...fileGaps);
    }

    // Calculate overall metrics
    const overall = this.calculateOverallMetrics(byFile);

    // Generate suggestions
    const suggestions = this.generateSuggestions(gaps, byFile);

    // Generate report if requested
    const report = request.options?.includeReport
      ? this.generateReport(overall, byFile, request.options.reportFormat?.[0] || 'text')
      : undefined;

    return {
      overall,
      byFile,
      gaps,
      report,
      suggestions,
    };
  }

  /**
   * Analyze coverage for a single file
   */
  private async analyzeFileCoverage(
    sourceFile: string,
    testFiles: string[]
  ): Promise<FileCoverage> {
    const sourceCode = fs.readFileSync(sourceFile, 'utf-8');
    const elements = this.analyzer.analyzeCode(sourceCode, sourceFile);

    // Analyze which elements are tested
    const testedElements = new Set<string>();
    for (const testFile of testFiles) {
      const testCode = fs.readFileSync(testFile, 'utf-8');
      for (const element of elements) {
        if (this.isElementTested(element.name, testCode)) {
          testedElements.add(element.name);
        }
      }
    }

    // Calculate metrics
    const totalFunctions = elements.filter(
      (e) => e.type === 'function' || e.type === 'method'
    ).length;
    const testedFunctions = elements.filter(
      (e) =>
        (e.type === 'function' || e.type === 'method') &&
        testedElements.has(e.name)
    ).length;

    const lines = sourceCode.split('\n');
    const executableLines = this.getExecutableLines(lines);
    const coveredLines = this.getCoveredLines(
      executableLines,
      testedElements,
      elements
    );

    return {
      file: sourceFile,
      metrics: {
        statements: this.calculateMetric(
          coveredLines.length,
          executableLines.length
        ),
        branches: this.calculateMetric(0, 0), // Simplified
        functions: this.calculateMetric(testedFunctions, totalFunctions),
        lines: this.calculateMetric(coveredLines.length, executableLines.length),
      },
      uncoveredLines: executableLines.filter(
        (line) => !coveredLines.includes(line)
      ),
      uncoveredBranches: [],
      uncoveredFunctions: elements
        .filter(
          (e) =>
            (e.type === 'function' || e.type === 'method') &&
            !testedElements.has(e.name)
        )
        .map((e) => e.name),
    };
  }

  /**
   * Check if element is tested
   */
  private isElementTested(elementName: string, testCode: string): boolean {
    // Simple heuristic: check if element name appears in test
    const patterns = [
      new RegExp(`${elementName}\\s*\\(`, 'g'),
      new RegExp(`test.*${elementName}`, 'gi'),
      new RegExp(`it.*${elementName}`, 'gi'),
      new RegExp(`describe.*${elementName}`, 'gi'),
    ];

    return patterns.some((pattern) => pattern.test(testCode));
  }

  /**
   * Get executable lines (not comments or blank)
   */
  private getExecutableLines(lines: string[]): number[] {
    const executable: number[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();

      // Skip blank lines
      if (!line) continue;

      // Skip comments
      if (line.startsWith('//') || line.startsWith('/*') || line.startsWith('*'))
        continue;

      // Skip import/export statements
      if (line.startsWith('import ') || line.startsWith('export ')) continue;

      // Skip type definitions
      if (line.startsWith('interface ') || line.startsWith('type ')) continue;

      executable.push(i + 1);
    }

    return executable;
  }

  /**
   * Get covered lines based on tested elements
   */
  private getCoveredLines(
    executableLines: number[],
    testedElements: Set<string>,
    elements: any[]
  ): number[] {
    const covered: number[] = [];

    for (const element of elements) {
      if (testedElements.has(element.name)) {
        // Add all lines in the element's range
        for (
          let line = element.location.startLine;
          line <= element.location.endLine;
          line++
        ) {
          if (executableLines.includes(line)) {
            covered.push(line);
          }
        }
      }
    }

    return [...new Set(covered)]; // Remove duplicates
  }

  /**
   * Calculate coverage metric
   */
  private calculateMetric(covered: number, total: number): CoverageMetric {
    return {
      total,
      covered,
      percentage: total > 0 ? (covered / total) * 100 : 0,
    };
  }

  /**
   * Calculate overall metrics across all files
   */
  private calculateOverallMetrics(
    byFile: Map<string, FileCoverage>
  ): CoverageMetrics {
    let totalStatements = 0;
    let coveredStatements = 0;
    let totalBranches = 0;
    let coveredBranches = 0;
    let totalFunctions = 0;
    let coveredFunctions = 0;
    let totalLines = 0;
    let coveredLines = 0;

    for (const fileCoverage of byFile.values()) {
      totalStatements += fileCoverage.metrics.statements.total;
      coveredStatements += fileCoverage.metrics.statements.covered;
      totalBranches += fileCoverage.metrics.branches.total;
      coveredBranches += fileCoverage.metrics.branches.covered;
      totalFunctions += fileCoverage.metrics.functions.total;
      coveredFunctions += fileCoverage.metrics.functions.covered;
      totalLines += fileCoverage.metrics.lines.total;
      coveredLines += fileCoverage.metrics.lines.covered;
    }

    return {
      statements: this.calculateMetric(coveredStatements, totalStatements),
      branches: this.calculateMetric(coveredBranches, totalBranches),
      functions: this.calculateMetric(coveredFunctions, totalFunctions),
      lines: this.calculateMetric(coveredLines, totalLines),
    };
  }

  /**
   * Identify coverage gaps
   */
  private identifyCoverageGaps(
    sourceFile: string,
    fileCoverage: FileCoverage
  ): CoverageGap[] {
    const gaps: CoverageGap[] = [];
    const sourceCode = fs.readFileSync(sourceFile, 'utf-8');
    const elements = this.analyzer.analyzeCode(sourceCode, sourceFile);

    for (const funcName of fileCoverage.uncoveredFunctions) {
      const element = elements.find((e) => e.name === funcName);
      if (!element) continue;

      const severity = this.determineSeverity(element);

      gaps.push({
        file: sourceFile,
        element,
        severity,
        reason: `Function "${funcName}" has no test coverage`,
        suggestedTests: [
          `Test happy path for ${funcName}`,
          `Test error handling for ${funcName}`,
          `Test edge cases for ${funcName}`,
        ],
      });
    }

    return gaps;
  }

  /**
   * Determine severity of coverage gap
   */
  private determineSeverity(
    element: any
  ): 'critical' | 'high' | 'medium' | 'low' {
    // High complexity = critical
    if (element.complexity > 10) return 'critical';
    if (element.complexity > 5) return 'high';

    // Public APIs are more important
    if (element.name.startsWith('_') || element.name.startsWith('private')) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Generate coverage suggestions
   */
  private generateSuggestions(
    gaps: CoverageGap[],
    byFile: Map<string, FileCoverage>
  ): CoverageSuggestion[] {
    const suggestions: CoverageSuggestion[] = [];

    // Suggestions for critical gaps
    for (const gap of gaps.filter((g) => g.severity === 'critical')) {
      suggestions.push({
        type: 'missing-test',
        priority: 'high',
        file: gap.file,
        location: gap.element.location,
        description: `Critical: ${gap.reason}`,
        suggestedTest: gap.suggestedTests[0],
      });
    }

    // Suggestions for low coverage files
    for (const [file, coverage] of byFile.entries()) {
      if (coverage.metrics.functions.percentage < 50) {
        suggestions.push({
          type: 'missing-test',
          priority: 'high',
          file,
          location: { file, startLine: 1, endLine: 1 },
          description: `File has only ${coverage.metrics.functions.percentage.toFixed(1)}% function coverage`,
          suggestedTest: 'Add comprehensive test suite for this file',
        });
      }
    }

    return suggestions.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  /**
   * Generate coverage report
   */
  private generateReport(
    overall: CoverageMetrics,
    byFile: Map<string, FileCoverage>,
    format: CoverageReportFormat
  ): CoverageReport {
    if (format === 'text') {
      return this.generateTextReport(overall, byFile);
    } else if (format === 'json') {
      return this.generateJsonReport(overall, byFile);
    }

    return {
      format,
      content: 'Report format not implemented',
    };
  }

  /**
   * Generate text coverage report
   */
  private generateTextReport(
    overall: CoverageMetrics,
    byFile: Map<string, FileCoverage>
  ): CoverageReport {
    const lines: string[] = [];

    lines.push('Test Coverage Report');
    lines.push('===================\n');

    lines.push('Overall Coverage:');
    lines.push(`  Statements: ${overall.statements.percentage.toFixed(2)}% (${overall.statements.covered}/${overall.statements.total})`);
    lines.push(`  Branches:   ${overall.branches.percentage.toFixed(2)}% (${overall.branches.covered}/${overall.branches.total})`);
    lines.push(`  Functions:  ${overall.functions.percentage.toFixed(2)}% (${overall.functions.covered}/${overall.functions.total})`);
    lines.push(`  Lines:      ${overall.lines.percentage.toFixed(2)}% (${overall.lines.covered}/${overall.lines.total})`);
    lines.push('');

    lines.push('Coverage by File:');
    for (const [file, coverage] of byFile.entries()) {
      const fileName = path.basename(file);
      lines.push(`\n  ${fileName}:`);
      lines.push(`    Functions: ${coverage.metrics.functions.percentage.toFixed(2)}%`);
      lines.push(`    Lines:     ${coverage.metrics.lines.percentage.toFixed(2)}%`);

      if (coverage.uncoveredFunctions.length > 0) {
        lines.push(`    Uncovered: ${coverage.uncoveredFunctions.join(', ')}`);
      }
    }

    return {
      format: 'text',
      content: lines.join('\n'),
    };
  }

  /**
   * Generate JSON coverage report
   */
  private generateJsonReport(
    overall: CoverageMetrics,
    byFile: Map<string, FileCoverage>
  ): CoverageReport {
    const report = {
      overall,
      files: Array.from(byFile.entries()).map(([_file, coverage]) => ({
        ...coverage,
      })),
    };

    return {
      format: 'json',
      content: JSON.stringify(report, null, 2),
    };
  }
}
