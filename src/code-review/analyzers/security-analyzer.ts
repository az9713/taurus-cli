/**
 * Security Analyzer
 *
 * Analyzes code for security vulnerabilities
 */

import { ReviewFinding, ReviewContext, SecurityVulnerability } from '../types.js';

export class SecurityAnalyzer {
  /**
   * Analyze code for security vulnerabilities
   */
  async analyze(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];

    // Run security checks
    findings.push(...await this.checkSQLInjection(context));
    findings.push(...await this.checkXSS(context));
    findings.push(...await this.checkPathTraversal(context));
    findings.push(...await this.checkCommandInjection(context));
    findings.push(...await this.checkInsecureCrypto(context));
    findings.push(...await this.checkHardcodedSecrets(context));
    findings.push(...await this.checkInsecureRandom(context));
    findings.push(...await this.checkUnsafeEval(context));

    return findings;
  }

  /**
   * Check for SQL injection vulnerabilities
   */
  private async checkSQLInjection(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for string concatenation in SQL queries
      if (/(?:SELECT|INSERT|UPDATE|DELETE|DROP).*\+.*/.test(line) ||
          /(?:query|execute|raw)\s*\(\s*[`'"].*\$\{/.test(line)) {
        findings.push({
          id: `sec-sql-${index}`,
          severity: 'critical',
          category: 'security',
          message: 'Potential SQL injection vulnerability',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use parameterized queries or prepared statements',
          autoFixable: false,
          references: [
            'CWE-89: SQL Injection',
            'https://owasp.org/www-community/attacks/SQL_Injection',
          ],
        });
      }
    });

    return findings;
  }

  /**
   * Check for XSS vulnerabilities
   */
  private async checkXSS(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for dangerouslySetInnerHTML in React
      if (/dangerouslySetInnerHTML/.test(line)) {
        findings.push({
          id: `sec-xss-${index}`,
          severity: 'high',
          category: 'security',
          message: 'Potential XSS vulnerability with dangerouslySetInnerHTML',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Sanitize HTML content using DOMPurify or similar library',
          autoFixable: false,
          references: [
            'CWE-79: Cross-site Scripting (XSS)',
            'https://owasp.org/www-community/attacks/xss/',
          ],
        });
      }

      // Check for innerHTML usage
      if (/\.innerHTML\s*=/.test(line) && !/\.innerHTML\s*=\s*[`'"]/.test(line)) {
        findings.push({
          id: `sec-xss-inner-${index}`,
          severity: 'high',
          category: 'security',
          message: 'Potential XSS vulnerability with innerHTML',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use textContent or sanitize the HTML',
          autoFixable: false,
          references: ['CWE-79: Cross-site Scripting (XSS)'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for path traversal vulnerabilities
   */
  private async checkPathTraversal(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for unsanitized path joins
      if (/(?:readFile|writeFile|unlink|rmdir|mkdir)\s*\([^)]*\+/.test(line) ||
          /path\.join\([^)]*req\.|path\.join\([^)]*params\./.test(line)) {
        findings.push({
          id: `sec-path-${index}`,
          severity: 'high',
          category: 'security',
          message: 'Potential path traversal vulnerability',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Validate and sanitize file paths. Use path.resolve() and check if result is within allowed directory',
          autoFixable: false,
          references: [
            'CWE-22: Path Traversal',
            'https://owasp.org/www-community/attacks/Path_Traversal',
          ],
        });
      }
    });

    return findings;
  }

  /**
   * Check for command injection vulnerabilities
   */
  private async checkCommandInjection(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for exec with user input
      if (/(?:exec|spawn|execSync|spawnSync)\s*\([^)]*\$\{|(?:exec|spawn|execSync|spawnSync)\s*\([^)]*\+/.test(line)) {
        findings.push({
          id: `sec-cmd-${index}`,
          severity: 'critical',
          category: 'security',
          message: 'Potential command injection vulnerability',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Avoid executing shell commands with user input. Use execFile() with array arguments or validate/sanitize input',
          autoFixable: false,
          references: [
            'CWE-78: Command Injection',
            'https://owasp.org/www-community/attacks/Command_Injection',
          ],
        });
      }
    });

    return findings;
  }

  /**
   * Check for insecure cryptography
   */
  private async checkInsecureCrypto(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for weak hash algorithms
      if (/crypto\.createHash\s*\(\s*['"](?:md5|sha1)['"]/.test(line)) {
        findings.push({
          id: `sec-crypto-${index}`,
          severity: 'high',
          category: 'security',
          message: 'Use of weak cryptographic hash algorithm',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use SHA-256 or stronger: crypto.createHash("sha256")',
          autoFixable: false,
          references: [
            'CWE-327: Use of a Broken or Risky Cryptographic Algorithm',
          ],
        });
      }

      // Check for weak encryption
      if (/crypto\.createCipher\(/.test(line)) {
        findings.push({
          id: `sec-cipher-${index}`,
          severity: 'high',
          category: 'security',
          message: 'createCipher is deprecated and insecure',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use crypto.createCipheriv() with a random IV',
          autoFixable: false,
          references: ['CWE-327: Use of a Broken or Risky Cryptographic Algorithm'],
        });
      }
    });

    return findings;
  }

  /**
   * Check for hardcoded secrets
   */
  private async checkHardcodedSecrets(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Skip comments and imports
      if (line.trim().startsWith('//') || line.trim().startsWith('import')) {
        return;
      }

      // Check for API keys, tokens, passwords
      const secretPatterns = [
        { pattern: /(?:api[_-]?key|apikey)\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'API key' },
        { pattern: /(?:secret|token)\s*[=:]\s*['"][a-zA-Z0-9]{20,}['"]/, type: 'Secret token' },
        { pattern: /(?:password|passwd|pwd)\s*[=:]\s*['"][^'"]{6,}['"]/, type: 'Password' },
        { pattern: /(?:private[_-]?key)\s*[=:]\s*['"]/, type: 'Private key' },
        { pattern: /(?:aws|amazon)[_-]?(?:secret|access)[_-]?key/i, type: 'AWS credentials' },
      ];

      secretPatterns.forEach((sp) => {
        if (sp.pattern.test(line)) {
          findings.push({
            id: `sec-secret-${index}`,
            severity: 'critical',
            category: 'security',
            message: `Potential hardcoded ${sp.type} detected`,
            file: context.file,
            line: index + 1,
            code: line.trim().replace(/['"][^'"]*['"]/, '\'***\''), // Mask the secret
            suggestion: 'Use environment variables or a secrets manager instead',
            autoFixable: false,
            references: [
              'CWE-798: Use of Hard-coded Credentials',
            ],
          });
        }
      });
    });

    return findings;
  }

  /**
   * Check for insecure random number generation
   */
  private async checkInsecureRandom(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for Math.random() in security contexts
      if (/Math\.random\(\)/.test(line) &&
          (/token|secret|password|key|salt|nonce|session/i.test(line))) {
        findings.push({
          id: `sec-random-${index}`,
          severity: 'high',
          category: 'security',
          message: 'Math.random() is not cryptographically secure',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Use crypto.randomBytes() for security-sensitive random values',
          autoFixable: false,
          references: [
            'CWE-338: Use of Cryptographically Weak PRNG',
          ],
        });
      }
    });

    return findings;
  }

  /**
   * Check for unsafe eval usage
   */
  private async checkUnsafeEval(context: ReviewContext): Promise<ReviewFinding[]> {
    const findings: ReviewFinding[] = [];
    const lines = context.content.split('\n');

    lines.forEach((line, index) => {
      // Check for eval() or Function constructor
      if (/\beval\s*\(|new\s+Function\s*\(/.test(line) && !line.trim().startsWith('//')) {
        findings.push({
          id: `sec-eval-${index}`,
          severity: 'critical',
          category: 'security',
          message: 'Use of eval() or Function constructor is dangerous',
          file: context.file,
          line: index + 1,
          code: line.trim(),
          suggestion: 'Avoid eval(). Use JSON.parse() for data or refactor to avoid dynamic code execution',
          autoFixable: false,
          references: [
            'CWE-95: Improper Neutralization of Directives in Dynamically Evaluated Code',
          ],
        });
      }
    });

    return findings;
  }
}
