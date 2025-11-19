/**
 * Code Validator
 *
 * Validates generated code for syntax, linting, and type errors
 */

import { exec as execCallback } from 'child_process';
import { promisify } from 'util';
import { promises as fs } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { TargetLanguage, ValidationResult, ValidationError, ValidationWarning } from './types.js';

const exec = promisify(execCallback);

export class CodeValidator {
  /**
   * Validate code
   */
  async validate(code: string, language: TargetLanguage): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];

    try {
      // Create temporary file
      const tempFile = await this.createTempFile(code, language);

      try {
        // Run language-specific validation
        await this.validateSyntax(tempFile, language, errors, warnings);
      } finally {
        // Clean up temp file
        await fs.unlink(tempFile).catch(() => {});
      }
    } catch (error: any) {
      errors.push({
        line: 0,
        column: 0,
        message: `Validation error: ${error.message}`,
        severity: 'error',
      });
    }

    return {
      type: 'syntax',
      passed: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Validate syntax for specific language
   */
  private async validateSyntax(
    filePath: string,
    language: TargetLanguage,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      switch (language) {
        case 'typescript':
          await this.validateTypeScript(filePath, errors, warnings);
          break;

        case 'javascript':
          await this.validateJavaScript(filePath, errors, warnings);
          break;

        case 'python':
          await this.validatePython(filePath, errors, warnings);
          break;

        case 'java':
          await this.validateJava(filePath, errors, warnings);
          break;

        case 'go':
          await this.validateGo(filePath, errors, warnings);
          break;

        case 'rust':
          await this.validateRust(filePath, errors, warnings);
          break;

        default:
          // Basic syntax check - just verify file is readable
          await fs.readFile(filePath, 'utf-8');
      }
    } catch (error: any) {
      this.parseValidationError(error, errors, warnings);
    }
  }

  /**
   * Validate TypeScript code
   */
  private async validateTypeScript(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      // Try to compile with tsc
      await exec(`npx tsc --noEmit --strict ${filePath}`, {
        timeout: 10000,
      });
    } catch (error: any) {
      this.parseTscOutput(error.stderr || error.stdout, errors, warnings);
    }
  }

  /**
   * Validate JavaScript code
   */
  private async validateJavaScript(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      // Try to parse with Node
      await exec(`node --check ${filePath}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      this.parseNodeOutput(error.stderr, errors);
    }

    // Try ESLint if available
    try {
      const { stdout } = await exec(`npx eslint --format json ${filePath}`, {
        timeout: 10000,
      });
      this.parseEslintOutput(stdout, errors, warnings);
    } catch {
      // ESLint not available or failed, skip
    }
  }

  /**
   * Validate Python code
   */
  private async validatePython(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      // Compile Python
      await exec(`python3 -m py_compile ${filePath}`, {
        timeout: 5000,
      });
    } catch (error: any) {
      this.parsePythonOutput(error.stderr, errors);
    }

    // Try pylint if available
    try {
      const { stdout } = await exec(`pylint --output-format=json ${filePath}`, {
        timeout: 10000,
      });
      this.parsePylintOutput(stdout, errors, warnings);
    } catch {
      // Pylint not available, skip
    }
  }

  /**
   * Validate Java code
   */
  private async validateJava(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      await exec(`javac ${filePath}`, {
        timeout: 10000,
      });
    } catch (error: any) {
      this.parseJavacOutput(error.stderr, errors);
    }
  }

  /**
   * Validate Go code
   */
  private async validateGo(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      await exec(`go vet ${filePath}`, {
        timeout: 10000,
      });
    } catch (error: any) {
      this.parseGoOutput(error.stderr, errors, warnings);
    }
  }

  /**
   * Validate Rust code
   */
  private async validateRust(
    filePath: string,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): Promise<void> {
    try {
      await exec(`rustc --crate-type lib ${filePath}`, {
        timeout: 10000,
      });
    } catch (error: any) {
      this.parseRustOutput(error.stderr, errors, warnings);
    }
  }

  /**
   * Create temporary file with code
   */
  private async createTempFile(code: string, language: TargetLanguage): Promise<string> {
    const extension = this.getFileExtension(language);
    const tempFile = join(tmpdir(), `code-gen-${Date.now()}${extension}`);
    await fs.writeFile(tempFile, code, 'utf-8');
    return tempFile;
  }

  /**
   * Get file extension for language
   */
  private getFileExtension(language: TargetLanguage): string {
    const extensions: Record<TargetLanguage, string> = {
      typescript: '.ts',
      javascript: '.js',
      python: '.py',
      java: '.java',
      go: '.go',
      rust: '.rs',
      csharp: '.cs',
      ruby: '.rb',
      php: '.php',
    };
    return extensions[language] || '.txt';
  }

  /**
   * Parse TypeScript compiler output
   */
  private parseTscOutput(output: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const lines = output.split('\n');
    const errorRegex = /\((\d+),(\d+)\):\s+(error|warning)\s+TS\d+:\s+(.+)/;

    for (const line of lines) {
      const match = line.match(errorRegex);
      if (match) {
        const [, lineNum, col, severity, message] = match;
        const item = {
          line: parseInt(lineNum, 10),
          column: parseInt(col, 10),
          message,
          severity: severity as 'error' | 'warning',
        };

        if (severity === 'error') {
          errors.push(item as ValidationError);
        } else {
          warnings.push(item as ValidationWarning);
        }
      }
    }
  }

  /**
   * Parse Node.js output
   */
  private parseNodeOutput(output: string, errors: ValidationError[]): void {
    const match = output.match(/SyntaxError: (.+)/);
    if (match) {
      errors.push({
        line: 0,
        column: 0,
        message: match[1],
        severity: 'error',
      });
    }
  }

  /**
   * Parse ESLint output
   */
  private parseEslintOutput(output: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    try {
      const results = JSON.parse(output);
      if (results[0]?.messages) {
        for (const msg of results[0].messages) {
          if (msg.severity === 2) {
            errors.push({
              line: msg.line || 0,
              column: msg.column || 0,
              message: msg.message,
              code: msg.ruleId,
              severity: 'error',
            });
          } else {
            warnings.push({
              line: msg.line || 0,
              column: msg.column || 0,
              message: msg.message,
              code: msg.ruleId,
              severity: 'warning',
            });
          }
        }
      }
    } catch {
      // Failed to parse, skip
    }
  }

  /**
   * Parse Python output
   */
  private parsePythonOutput(output: string, errors: ValidationError[]): void {
    const match = output.match(/File ".*", line (\d+).*\n\s+(.+)/);
    if (match) {
      errors.push({
        line: parseInt(match[1], 10),
        column: 0,
        message: match[2],
        severity: 'error',
      });
    }
  }

  /**
   * Parse Pylint output
   */
  private parsePylintOutput(output: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    try {
      const results = JSON.parse(output);
      for (const result of results) {
        if (result.type === 'error') {
          errors.push({
            line: result.line || 0,
            column: result.column || 0,
            message: result.message,
            code: result.symbol,
            severity: 'error',
          });
        } else {
          warnings.push({
            line: result.line || 0,
            column: result.column || 0,
            message: result.message,
            code: result.symbol,
            severity: 'warning',
          });
        }
      }
    } catch {
      // Failed to parse, skip
    }
  }

  /**
   * Parse javac output
   */
  private parseJavacOutput(output: string, errors: ValidationError[]): void {
    const errorRegex = /.*:(\d+): error: (.+)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        line: parseInt(match[1], 10),
        column: 0,
        message: match[2],
        severity: 'error',
      });
    }
  }

  /**
   * Parse Go output
   */
  private parseGoOutput(output: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const lines = output.split('\n');
    const regex = /.*:(\d+):(\d+): (.+)/;

    for (const line of lines) {
      const match = line.match(regex);
      if (match) {
        warnings.push({
          line: parseInt(match[1], 10),
          column: parseInt(match[2], 10),
          message: match[3],
          severity: 'warning',
        });
      }
    }
  }

  /**
   * Parse Rust output
   */
  private parseRustOutput(output: string, errors: ValidationError[], warnings: ValidationWarning[]): void {
    const errorRegex = /error.*\n\s+--> .*:(\d+):(\d+)/g;
    let match;

    while ((match = errorRegex.exec(output)) !== null) {
      errors.push({
        line: parseInt(match[1], 10),
        column: parseInt(match[2], 10),
        message: 'Rust compilation error',
        severity: 'error',
      });
    }
  }

  /**
   * Parse generic validation error
   */
  private parseValidationError(
    error: any,
    errors: ValidationError[],
    warnings: ValidationWarning[]
  ): void {
    errors.push({
      line: 0,
      column: 0,
      message: error.message || 'Unknown validation error',
      severity: 'error',
    });
  }
}
