/**
 * Secret Detector - Detects hardcoded secrets and sensitive information
 */

import * as fs from 'fs';
import { SecretFinding, SecretType, SecretPattern } from './types';

export class SecretDetector {
  private patterns: SecretPattern[];

  constructor() {
    this.patterns = this.initializePatterns();
  }

  /**
   * Detect secrets in code
   */
  detectSecrets(code: string, filePath: string): SecretFinding[] {
    const findings: SecretFinding[] = [];
    const lines = code.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      for (const pattern of this.patterns) {
        const matches = line.matchAll(
          new RegExp(pattern.pattern, pattern.pattern.flags + 'g')
        );

        for (const match of matches) {
          findings.push({
            type: this.getSecretType(pattern.name),
            file: filePath,
            line: i + 1,
            match: match[0],
            severity: pattern.severity,
            masked: this.maskSecret(match[0]),
            remediation: this.getRemediation(pattern.name),
          });
        }
      }
    }

    return findings;
  }

  /**
   * Detect secrets in file
   */
  detectSecretsInFile(filePath: string): SecretFinding[] {
    try {
      const code = fs.readFileSync(filePath, 'utf-8');
      return this.detectSecrets(code, filePath);
    } catch (error) {
      return [];
    }
  }

  /**
   * Initialize secret detection patterns
   */
  private initializePatterns(): SecretPattern[] {
    return [
      // AWS Access Key
      {
        name: 'AWS Access Key',
        pattern: /AKIA[0-9A-Z]{16}/,
        severity: 'critical',
      },

      // AWS Secret Key
      {
        name: 'AWS Secret Key',
        pattern: /aws[_-]?secret[_-]?access[_-]?key['"]?\s*[:=]\s*['"][A-Za-z0-9/+=]{40}['"]/i,
        severity: 'critical',
      },

      // GitHub Token
      {
        name: 'GitHub Token',
        pattern: /ghp_[A-Za-z0-9]{36}/,
        severity: 'critical',
      },

      // GitHub OAuth Token
      {
        name: 'GitHub OAuth Token',
        pattern: /gho_[A-Za-z0-9]{36}/,
        severity: 'critical',
      },

      // Stripe API Key
      {
        name: 'Stripe API Key',
        pattern: /sk_live_[A-Za-z0-9]{24,}/,
        severity: 'critical',
      },

      // Stripe Publishable Key
      {
        name: 'Stripe Publishable Key',
        pattern: /pk_live_[A-Za-z0-9]{24,}/,
        severity: 'high',
      },

      // Generic API Key
      {
        name: 'Generic API Key',
        pattern: /(?:api[_-]?key|apikey|api[_-]?secret)['"]?\s*[:=]\s*['"][A-Za-z0-9_\-]{20,}['"]/i,
        severity: 'high',
      },

      // Private Key
      {
        name: 'Private Key',
        pattern: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
        severity: 'critical',
      },

      // Generic Password
      {
        name: 'Hardcoded Password',
        pattern: /(?:password|passwd|pwd)['"]?\s*[:=]\s*['"][^'"\s]{8,}['"]/i,
        severity: 'high',
      },

      // Database Connection String
      {
        name: 'Database Connection String',
        pattern: /(?:mongodb|postgres|mysql):\/\/[^\s'"]+:[^\s'"]+@[^\s'"]+/i,
        severity: 'critical',
      },

      // JWT Token
      {
        name: 'JWT Token',
        pattern: /eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}/,
        severity: 'high',
      },

      // Slack Token
      {
        name: 'Slack Token',
        pattern: /xox[baprs]-[A-Za-z0-9-]{10,}/,
        severity: 'critical',
      },

      // Google API Key
      {
        name: 'Google API Key',
        pattern: /AIza[A-Za-z0-9_-]{35}/,
        severity: 'high',
      },

      // Twilio API Key
      {
        name: 'Twilio API Key',
        pattern: /SK[A-Za-z0-9]{32}/,
        severity: 'high',
      },

      // SendGrid API Key
      {
        name: 'SendGrid API Key',
        pattern: /SG\.[A-Za-z0-9_-]{22}\.[A-Za-z0-9_-]{43}/,
        severity: 'high',
      },

      // MailChimp API Key
      {
        name: 'MailChimp API Key',
        pattern: /[A-Za-z0-9]{32}-us[0-9]{1,2}/,
        severity: 'medium',
      },

      // npm Token
      {
        name: 'npm Token',
        pattern: /npm_[A-Za-z0-9]{36}/,
        severity: 'critical',
      },

      // Docker Auth
      {
        name: 'Docker Auth',
        pattern: /"auth"\s*:\s*"[A-Za-z0-9+/=]{20,}"/,
        severity: 'high',
      },

      // Generic Secret
      {
        name: 'Generic Secret',
        pattern: /(?:secret|token|key)['"]?\s*[:=]\s*['"][A-Za-z0-9_\-+/=]{32,}['"]/i,
        severity: 'medium',
      },

      // SSH Private Key
      {
        name: 'SSH Private Key',
        pattern: /-----BEGIN OPENSSH PRIVATE KEY-----/,
        severity: 'critical',
      },

      // Azure Storage Key
      {
        name: 'Azure Storage Key',
        pattern: /AccountKey=[A-Za-z0-9+/=]{88}/,
        severity: 'critical',
      },

      // Facebook Access Token
      {
        name: 'Facebook Access Token',
        pattern: /EAACEdEose0cBA[A-Za-z0-9]+/,
        severity: 'high',
      },

      // Twitter Access Token
      {
        name: 'Twitter Access Token',
        pattern: /[1-9][0-9]+-[A-Za-z0-9]{40}/,
        severity: 'high',
      },
    ];
  }

  /**
   * Get secret type from pattern name
   */
  private getSecretType(patternName: string): SecretType {
    const mapping: Record<string, SecretType> = {
      'AWS Access Key': 'aws-key',
      'AWS Secret Key': 'aws-key',
      'GitHub Token': 'github-token',
      'GitHub OAuth Token': 'github-token',
      'Stripe API Key': 'stripe-key',
      'Generic API Key': 'api-key',
      'Private Key': 'private-key',
      'Hardcoded Password': 'password',
      'Database Connection String': 'connection-string',
      'JWT Token': 'token',
      'SSH Private Key': 'private-key',
    };

    return mapping[patternName] || 'generic-secret';
  }

  /**
   * Mask secret for safe display
   */
  private maskSecret(secret: string): string {
    if (secret.length <= 8) {
      return '***';
    }

    const visible = Math.min(4, Math.floor(secret.length * 0.2));
    const prefix = secret.substring(0, visible);
    const suffix = secret.substring(secret.length - visible);

    return `${prefix}${'*'.repeat(secret.length - visible * 2)}${suffix}`;
  }

  /**
   * Get remediation advice for secret type
   */
  private getRemediation(patternName: string): string {
    const remediations: Record<string, string> = {
      'AWS Access Key':
        'Immediately rotate this AWS access key and store in environment variables or AWS Secrets Manager',
      'AWS Secret Key':
        'Immediately rotate this AWS secret key and store in environment variables or AWS Secrets Manager',
      'GitHub Token':
        'Revoke this GitHub token immediately and regenerate. Use GitHub Secrets for CI/CD',
      'Stripe API Key':
        'Revoke this Stripe key immediately and regenerate. Store in environment variables',
      'Generic API Key':
        'Remove this API key from code and store in environment variables or secret manager',
      'Private Key':
        'Remove private key from repository. Regenerate key pair if compromised',
      'Hardcoded Password':
        'Remove password from code and use environment variables or secret manager',
      'Database Connection String':
        'Move connection string to environment variables. Rotate credentials if exposed',
      'JWT Token':
        'Remove JWT token from code. These should be generated at runtime',
      'npm Token': 'Revoke npm token and use npmrc or environment variables',
    };

    return (
      remediations[patternName] ||
      'Remove secret from code and store securely in environment variables or secret management service'
    );
  }

  /**
   * Check if file should be scanned
   */
  shouldScanFile(filePath: string): boolean {
    const excludePatterns = [
      /node_modules/,
      /\.git\//,
      /dist\//,
      /build\//,
      /\.min\.js$/,
      /\.map$/,
      /package-lock\.json$/,
      /yarn\.lock$/,
    ];

    return !excludePatterns.some((pattern) => pattern.test(filePath));
  }

  /**
   * Scan directory for secrets
   */
  scanDirectory(directoryPath: string): SecretFinding[] {
    const findings: SecretFinding[] = [];

    const scanRecursive = (dir: string) => {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = `${dir}/${entry.name}`;

        if (entry.isDirectory()) {
          if (this.shouldScanFile(fullPath)) {
            scanRecursive(fullPath);
          }
        } else if (entry.isFile()) {
          if (this.shouldScanFile(fullPath)) {
            const fileFindings = this.detectSecretsInFile(fullPath);
            findings.push(...fileFindings);
          }
        }
      }
    };

    scanRecursive(directoryPath);
    return findings;
  }
}
