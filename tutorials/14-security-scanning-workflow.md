# Tutorial 14: Security Vulnerability Scanning Workflow

Learn how to identify and fix security vulnerabilities in your codebase using Taurus CLI's comprehensive security scanner with OWASP Top 10 coverage.

## 📋 What You'll Learn

- How to scan code for security vulnerabilities
- Detecting hardcoded secrets and credentials
- Scanning dependencies for known vulnerabilities
- Understanding OWASP Top 10 vulnerabilities
- Fixing common security issues
- Integrating security scans into CI/CD
- Best practices for secure coding

## ⏱️ Estimated Time

40-60 minutes

## 🎯 Prerequisites

- Completed [Quick Start Guide](./02-quickstart.md)
- Basic understanding of web security concepts
- A codebase to scan (or use our vulnerable examples)

## 📚 Table of Contents

1. [Understanding Security Scanning](#understanding-security-scanning)
2. [Setting Up Security Scanner](#setting-up-security-scanner)
3. [Running Your First Security Scan](#running-your-first-security-scan)
4. [Understanding Vulnerability Types](#understanding-vulnerability-types)
5. [Fixing Common Vulnerabilities](#fixing-common-vulnerabilities)
6. [Scanning for Secrets](#scanning-for-secrets)
7. [Dependency Vulnerability Scanning](#dependency-vulnerability-scanning)
8. [Security Audit & Best Practices](#security-audit--best-practices)
9. [CI/CD Integration](#cicd-integration)

---

## Understanding Security Scanning

Taurus CLI's Security Scanner performs multiple types of analysis:

### Static Code Analysis
Detects vulnerabilities in your source code:
- SQL Injection
- Cross-Site Scripting (XSS)
- Command Injection
- Path Traversal
- Insecure Cryptography
- And 40+ more vulnerability patterns

### Dependency Scanning
Checks your dependencies for known vulnerabilities:
- npm audit integration
- CVE database lookups
- Outdated package detection
- License compliance checking

### Secret Detection
Finds hardcoded credentials:
- AWS Access Keys
- GitHub Tokens
- API Keys
- Passwords
- Private Keys
- Database Connection Strings

### OWASP Top 10 Coverage

The scanner covers all OWASP Top 10 2021 categories:
1. Broken Access Control
2. Cryptographic Failures
3. Injection
4. Insecure Design
5. Security Misconfiguration
6. Vulnerable Components
7. Identification and Authentication Failures
8. Software and Data Integrity Failures
9. Security Logging and Monitoring Failures
10. Server-Side Request Forgery (SSRF)

---

## Setting Up Security Scanner

### Step 1: Configure in `.taurus/config.json`

```json
{
  "securityScanner": {
    "enabled": true,
    "scanTypes": [
      "static-analysis",
      "dependency-scan",
      "secret-detection",
      "best-practices"
    ],
    "severity": {
      "minimum": "medium",
      "failOnSeverity": ["critical", "high"]
    },
    "staticAnalysis": {
      "enabled": true,
      "rules": [],
      "excludePatterns": ["node_modules/**", "dist/**", "**/*.test.ts"]
    },
    "dependencyScanning": {
      "enabled": true,
      "sources": ["npm-audit", "github-advisory"],
      "autoUpdate": false
    },
    "secretDetection": {
      "enabled": true,
      "patterns": [],
      "excludeFiles": ["**/*.test.ts", "**/*.example.*", "**/.env.example"]
    },
    "reporting": {
      "formats": ["text", "json", "html"],
      "outputDir": "./security-reports",
      "includeRemediation": true,
      "groupBy": "severity"
    }
  }
}
```

### Step 2: Verify Configuration

```bash
npx taurus
```

```
> /config securityScanner.enabled
true
```

---

## Running Your First Security Scan

### Complete Security Scan

**In Taurus CLI:**

```
Perform a complete security scan of my project and show me all vulnerabilities.
```

The scanner will analyze:
- All source code files for vulnerabilities
- Package dependencies for known CVEs
- Configuration files for secrets
- Code for security best practices

### Example Output

```
Security Scan Report
===================

Summary:
- Total Issues: 12
- Critical: 2
- High: 4
- Medium: 5
- Low: 1
- Status: ❌ FAILED

Critical Vulnerabilities:

1. SQL Injection via String Concatenation
   Severity: CRITICAL
   File: src/database/users.ts:45
   OWASP: A03-Injection
   CWE: CWE-89

   Code:
   const query = `SELECT * FROM users WHERE id = ${userId}`;

   Description:
   SQL query constructed using string concatenation with user input.
   An attacker could manipulate the userId parameter to execute
   arbitrary SQL commands.

   Remediation:
   1. Replace string concatenation with parameterized queries
   2. Use ORM or query builder with parameterization
   3. Validate and sanitize all user inputs
   4. Apply principle of least privilege to database user

   References:
   - https://owasp.org/www-community/vulnerabilities/sql-injection
   - https://cheatsheetseries.owasp.org/SQL_Injection

2. Hardcoded AWS Access Key
   Severity: CRITICAL
   File: src/config/aws.ts:12
   OWASP: A02-Cryptographic Failures

   Masked: AKIA***************ER45

   Remediation:
   - Immediately rotate this AWS access key
   - Store in environment variables or AWS Secrets Manager
   - Add pre-commit hooks to prevent secret commits
   - Scan git history for exposed credentials
```

### Scan Specific Files

```
Scan the src/auth/ directory for security vulnerabilities, focusing on authentication and authorization issues.
```

### Scan by Type

```
Run only secret detection on my entire codebase. I want to make sure we haven't committed any API keys or passwords.
```

---

## Understanding Vulnerability Types

### 1. SQL Injection (Critical)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: String concatenation
async function getUser(userId: string) {
  const query = `SELECT * FROM users WHERE id = '${userId}'`;
  return db.query(query);
}

// Attack: userId = "1' OR '1'='1"
// Resulting query: SELECT * FROM users WHERE id = '1' OR '1'='1'
// Returns ALL users!
```

**Secure Code:**

```typescript
// ✅ SECURE: Parameterized query
async function getUser(userId: string) {
  const query = 'SELECT * FROM users WHERE id = $1';
  return db.query(query, [userId]);
}

// Or using ORM
async function getUser(userId: string) {
  return await User.findOne({ where: { id: userId } });
}
```

### 2. Cross-Site Scripting (XSS) (High)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: Direct HTML injection
function displayUserComment(comment: string) {
  document.getElementById('comments').innerHTML = comment;
}

// Attack: comment = "<script>alert('XSS')</script>"
// Executes arbitrary JavaScript in user's browser
```

**Secure Code:**

```typescript
// ✅ SECURE: Use textContent or sanitize
function displayUserComment(comment: string) {
  const element = document.getElementById('comments');
  element.textContent = comment; // Automatically escapes HTML
}

// Or sanitize with DOMPurify
import DOMPurify from 'dompurify';

function displayUserComment(comment: string) {
  const clean = DOMPurify.sanitize(comment);
  document.getElementById('comments').innerHTML = clean;
}
```

### 3. Command Injection (Critical)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: Shell command with user input
import { exec } from 'child_process';

function convertImage(filename: string) {
  exec(`convert ${filename} output.png`);
}

// Attack: filename = "input.jpg; rm -rf /"
// Executes: convert input.jpg; rm -rf / output.png
```

**Secure Code:**

```typescript
// ✅ SECURE: Use execFile with argument array
import { execFile } from 'child_process';

function convertImage(filename: string) {
  // Validate filename first
  if (!/^[a-zA-Z0-9._-]+$/.test(filename)) {
    throw new Error('Invalid filename');
  }

  execFile('convert', [filename, 'output.png'], (error, stdout, stderr) => {
    if (error) throw error;
  });
}
```

### 4. Path Traversal (High)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: User-controlled file path
import { readFile } from 'fs/promises';

async function getFile(filename: string) {
  return await readFile(`./uploads/${filename}`, 'utf-8');
}

// Attack: filename = "../../../etc/passwd"
// Reads: ./uploads/../../../etc/passwd = /etc/passwd
```

**Secure Code:**

```typescript
// ✅ SECURE: Validate and normalize path
import { readFile } from 'fs/promises';
import path from 'path';

async function getFile(filename: string) {
  // Resolve to absolute path
  const uploadDir = path.resolve('./uploads');
  const filePath = path.resolve(uploadDir, filename);

  // Ensure file is within upload directory
  if (!filePath.startsWith(uploadDir)) {
    throw new Error('Access denied');
  }

  return await readFile(filePath, 'utf-8');
}
```

### 5. Weak Cryptography (Medium)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: MD5 is cryptographically broken
import crypto from 'crypto';

function hashPassword(password: string) {
  return crypto.createHash('md5').update(password).digest('hex');
}
```

**Secure Code:**

```typescript
// ✅ SECURE: Use bcrypt or argon2
import bcrypt from 'bcrypt';

async function hashPassword(password: string) {
  const saltRounds = 10;
  return await bcrypt.hash(password, saltRounds);
}

async function verifyPassword(password: string, hash: string) {
  return await bcrypt.compare(password, hash);
}
```

### 6. Broken Access Control (High)

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: No authorization check
app.delete('/api/users/:id', async (req, res) => {
  await User.delete(req.params.id);
  res.json({ success: true });
});

// Any authenticated user can delete any other user!
```

**Secure Code:**

```typescript
// ✅ SECURE: Check authorization
app.delete('/api/users/:id', requireAuth, async (req, res) => {
  const targetUserId = req.params.id;
  const currentUserId = req.user.id;

  // Users can only delete their own account, unless admin
  if (targetUserId !== currentUserId && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  await User.delete(targetUserId);
  res.json({ success: true });
});
```

---

## Fixing Common Vulnerabilities

### Guided Fix with Taurus

**Ask Taurus to help fix a specific vulnerability:**

```
The security scan found SQL injection in src/database/users.ts:45. Show me the vulnerable code and provide a secure fix using parameterized queries.
```

**Taurus will:**
1. Read the vulnerable code
2. Explain the vulnerability
3. Provide secure alternative
4. Update the code
5. Verify the fix

### Example: Fixing SQL Injection

**Before:**
```typescript
async function getUserByEmail(email: string) {
  const query = `SELECT * FROM users WHERE email = '${email}'`;
  const result = await db.query(query);
  return result.rows[0];
}
```

**After fix:**
```typescript
async function getUserByEmail(email: string) {
  // Parameterized query prevents SQL injection
  const query = 'SELECT * FROM users WHERE email = $1';
  const result = await db.query(query, [email]);
  return result.rows[0];
}
```

### Bulk Fix Multiple Issues

```
The security scan found 5 instances of hardcoded secrets in config files. Move all of them to environment variables and update the code to read from process.env.
```

---

## Scanning for Secrets

### Common Secret Types Detected

- AWS Access Keys (`AKIA...`)
- GitHub Personal Access Tokens (`ghp_...`)
- Stripe API Keys (`sk_live_...`)
- Generic API Keys
- Private Keys (RSA, SSH, etc.)
- Passwords in code
- Database connection strings
- JWT tokens
- OAuth tokens

### Example: Secret Detection

**Vulnerable Code:**

```typescript
// ❌ VULNERABLE: Hardcoded secrets
const AWS_ACCESS_KEY = 'AKIAIOSFODNN7EXAMPLE';
const AWS_SECRET_KEY = 'wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY';

const stripe = require('stripe')('sk_live_51H0...');

const db = {
  host: 'localhost',
  user: 'admin',
  password: 'SuperSecret123!',
  database: 'myapp'
};
```

**Security Scan Output:**

```
Secret Detection Results:

[CRITICAL] AWS Access Key
File: src/config/aws.ts:12
Masked: AKIA***************MPLE

[CRITICAL] AWS Secret Key
File: src/config/aws.ts:13
Masked: wJal***************EKEY

[CRITICAL] Stripe Live API Key
File: src/config/stripe.ts:5
Masked: sk_l***************H0

[HIGH] Hardcoded Password
File: src/config/database.ts:18
Masked: Supe***************23!

Remediation:
All secrets must be removed from source code immediately.
1. Rotate all exposed credentials
2. Move secrets to environment variables
3. Use secret management service (AWS Secrets Manager, HashiCorp Vault)
4. Add pre-commit hooks to prevent future leaks
```

### Secure Alternative

```typescript
// ✅ SECURE: Use environment variables
import AWS from 'aws-sdk';

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_REGION
});

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const db = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
};
```

**Create `.env.example` (safe to commit):**

```bash
# AWS Configuration
AWS_ACCESS_KEY_ID=your_access_key_here
AWS_SECRET_ACCESS_KEY=your_secret_key_here
AWS_REGION=us-east-1

# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...

# Database Configuration
DB_HOST=localhost
DB_USER=myapp_user
DB_PASSWORD=your_password_here
DB_NAME=myapp_db
```

**Add `.env` to `.gitignore`:**

```
# Environment variables
.env
.env.local
.env.*.local
```

---

## Dependency Vulnerability Scanning

### Scan Dependencies

```
Scan my npm dependencies for known vulnerabilities and show me which ones need updates.
```

### Example Output

```
Dependency Vulnerabilities:

[HIGH] lodash@4.17.15
CVE: CVE-2020-8203
CVSS Score: 7.4
Vulnerability: Prototype Pollution

Description:
Versions of lodash prior to 4.17.19 are vulnerable to prototype
pollution. The function zipObjectDeep can be tricked into adding
or modifying properties of Object.prototype.

Affected: lodash@4.17.15
Fixed in: lodash@4.17.21
Patch Available: Yes

Remediation:
  npm install lodash@4.17.21

[CRITICAL] express@4.16.4
CVE: CVE-2022-24999
CVSS Score: 9.8
Vulnerability: Open Redirect

Description:
Express.js versions before 4.17.3 are vulnerable to open redirect
attacks via the `res.redirect()` function.

Affected: express@4.16.4
Fixed in: express@4.18.0
Patch Available: Yes

Remediation:
  npm install express@4.18.0
```

### Auto-Update Dependencies

```
Update all dependencies with high or critical vulnerabilities to their latest secure versions. Show me what changed.
```

### Check for Outdated Packages

```
Show me all outdated npm packages and recommend which ones to update based on security and compatibility.
```

---

## Security Audit & Best Practices

### Run Security Audit

```
Perform a comprehensive security audit of my application and give me a security score.
```

### Example Audit Report

```
Security Audit Report
====================

Overall Security Score: 72/100

Status: ⚠️ NEEDS IMPROVEMENT

Security Checks:

✅ PASSED: Package.json exists
✅ PASSED: Gitignore file exists
✅ PASSED: HTTPS enforced in production
✅ PASSED: Security headers configured
✅ PASSED: Input validation implemented
❌ FAILED: No environment template (.env.example)
❌ FAILED: Secrets found in git history
❌ FAILED: No rate limiting on API endpoints
❌ FAILED: Missing CSRF protection
⚠️  WARNING: Outdated dependencies (12)
⚠️  WARNING: No security.txt file

Recommendations (Priority Order):

[CRITICAL] Remove secrets from git history
Impact: Exposed credentials can lead to complete system compromise
Implementation:
  1. Use git-filter-branch or BFG Repo-Cleaner
  2. Rotate all exposed credentials
  3. Force push cleaned history
  4. Notify team members
Effort: High

[HIGH] Implement CSRF protection
Impact: Prevents cross-site request forgery attacks
Implementation:
  1. Use csurf middleware for Express
  2. Include CSRF token in forms
  3. Validate token on state-changing requests
Effort: Medium

[HIGH] Add rate limiting
Impact: Prevents brute force and DoS attacks
Implementation:
  1. Use express-rate-limit middleware
  2. Configure limits per endpoint
  3. Add Redis for distributed rate limiting
Effort: Low

[MEDIUM] Update outdated dependencies
Impact: Reduces exposure to known vulnerabilities
Implementation:
  1. Run npm audit fix
  2. Test thoroughly after updates
  3. Update breaking changes manually
Effort: Medium
```

### Security Best Practices Checklist

```
Review my codebase against the OWASP Top 10 and create a checklist of what I'm doing right and what needs improvement.
```

---

## CI/CD Integration

### GitHub Actions Security Workflow

Create `.github/workflows/security.yml`:

```yaml
name: Security Scan

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    # Run security scan daily at 2 AM
    - cron: '0 2 * * *'

jobs:
  security-scan:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0  # Full history for secret scanning

      - uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install Dependencies
        run: npm ci

      - name: Run Security Scan
        run: |
          npx taurus --non-interactive << 'EOF'
          Perform a complete security scan:
          1. Static analysis for vulnerabilities
          2. Dependency scanning
          3. Secret detection
          4. Best practices check

          Fail the build if critical or high severity issues are found.
          Generate reports in JSON, HTML, and SARIF formats.
          EOF

      - name: Upload Security Report
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-report
          path: security-reports/

      - name: Upload SARIF to GitHub
        if: always()
        uses: github/codeql-action/upload-sarif@v2
        with:
          sarif_file: security-reports/scan.sarif

      - name: Comment PR with Security Summary
        if: github.event_name == 'pull_request'
        uses: actions/github-script@v6
        with:
          script: |
            const fs = require('fs');
            const report = JSON.parse(fs.readFileSync('security-reports/scan.json', 'utf8'));

            const summary = `## 🔒 Security Scan Results

            - **Total Issues:** ${report.summary.totalIssues}
            - **Critical:** ${report.summary.bySeverity.critical} 🔴
            - **High:** ${report.summary.bySeverity.high} 🟠
            - **Medium:** ${report.summary.bySeverity.medium} 🟡
            - **Low:** ${report.summary.bySeverity.low} ⚪

            **Status:** ${report.summary.passed ? '✅ PASSED' : '❌ FAILED'}

            [View Full Report](https://github.com/${{ github.repository }}/actions/runs/${{ github.run_id }})
            `;

            github.rest.issues.createComment({
              issue_number: context.issue.number,
              owner: context.repo.owner,
              repo: context.repo.repo,
              body: summary
            });
```

### Pre-commit Hook for Secret Detection

Create `.taurus/hooks/pre-commit-security.sh`:

```bash
#!/bin/bash

echo "🔍 Running security checks..."

# Get staged files
STAGED_FILES=$(git diff --cached --name-only --diff-filter=ACM | grep -E '\.(ts|js|json|yml|yaml)$')

if [ -z "$STAGED_FILES" ]; then
  echo "✅ No files to scan"
  exit 0
fi

# Scan for secrets in staged files
echo "Checking for hardcoded secrets..."

HAS_SECRETS=false
for file in $STAGED_FILES; do
  # Check for common secret patterns
  if grep -qE 'AKIA[0-9A-Z]{16}' "$file" 2>/dev/null; then
    echo "❌ AWS Access Key found in $file"
    HAS_SECRETS=true
  fi

  if grep -qE 'ghp_[a-zA-Z0-9]{36}' "$file" 2>/dev/null; then
    echo "❌ GitHub Token found in $file"
    HAS_SECRETS=true
  fi

  if grep -qiE 'password\s*=\s*["\'][^"\']{8,}["\']' "$file" 2>/dev/null; then
    echo "❌ Hardcoded password found in $file"
    HAS_SECRETS=true
  fi
done

if [ "$HAS_SECRETS" = true ]; then
  echo ""
  echo "❌ COMMIT REJECTED: Secrets detected in staged files"
  echo "Please remove all hardcoded credentials and use environment variables"
  exit 1
fi

echo "✅ No secrets detected"
exit 0
```

Make executable:

```bash
chmod +x .taurus/hooks/pre-commit-security.sh
```

---

## Best Practices

### 1. Scan Early and Often

- Run security scans during development
- Integrate into CI/CD pipeline
- Schedule regular automated scans
- Scan before every release

### 2. Fix by Priority

**Priority Order:**
1. **Critical**: Stop everything, fix immediately
2. **High**: Fix before next release
3. **Medium**: Fix in current sprint
4. **Low**: Add to backlog

### 3. Use Defense in Depth

Don't rely on a single security measure:

```typescript
// Layer 1: Input validation
function validateUserId(userId: string): boolean {
  return /^[0-9]+$/.test(userId);
}

// Layer 2: Parameterized query
async function getUser(userId: string) {
  if (!validateUserId(userId)) {
    throw new Error('Invalid user ID');
  }

  const query = 'SELECT * FROM users WHERE id = $1';
  return await db.query(query, [userId]);
}

// Layer 3: Least privilege
// Database user has SELECT only, not DELETE/UPDATE
```

### 4. Never Trust User Input

Always validate and sanitize:

```typescript
import validator from 'validator';

function processUserInput(data: any) {
  // Validate
  if (!validator.isEmail(data.email)) {
    throw new Error('Invalid email');
  }

  // Sanitize
  const email = validator.normalizeEmail(data.email);
  const name = validator.escape(data.name);

  return { email, name };
}
```

### 5. Keep Dependencies Updated

```bash
# Check for updates weekly
npm outdated

# Update with care
npm update

# Audit for vulnerabilities
npm audit

# Fix automatically (review changes!)
npm audit fix
```

### 6. Use Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet());  // Sets various security headers

app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"],
    scriptSrc: ["'self'"],
    imgSrc: ["'self'", 'data:', 'https:'],
  }
}));
```

### 7. Log Security Events

```typescript
import winston from 'winston';

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  defaultMeta: { service: 'security' },
  transports: [
    new winston.transports.File({ filename: 'security.log' })
  ]
});

// Log failed login attempts
app.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await authenticateUser(email, password);
    res.json({ success: true, user });
  } catch (error) {
    securityLogger.warn('Failed login attempt', {
      email,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      timestamp: new Date()
    });
    res.status(401).json({ error: 'Invalid credentials' });
  }
});
```

---

## Common Pitfalls

### ❌ Pitfall 1: Ignoring Low Severity Issues

**Problem:** "It's just a low severity issue, I'll fix it later"

**Why it's dangerous:** Multiple low severity issues can be chained together for a critical exploit.

**Solution:** Address all issues, prioritize by severity but don't ignore low severity.

### ❌ Pitfall 2: Suppressing Warnings Without Review

**Problem:** Marking findings as "false positive" without investigation

**Solution:** Always investigate, document why it's safe, and get peer review.

### ❌ Pitfall 3: Rotating Secrets After Commit

**Problem:** Committing a secret, then rotating it

**Why it's dangerous:** Git history preserves the old secret forever.

**Solution:**
1. Remove from git history using BFG or git-filter-branch
2. Then rotate the secret
3. Force push cleaned history

### ❌ Pitfall 4: Security Through Obscurity

**Problem:** "Nobody will find this endpoint, it's not documented"

**Solution:** Assume attackers will find everything. Implement proper authentication and authorization.

---

## Next Steps

Now that you've mastered security scanning:

1. ✅ **Scan your codebase**: Run a complete security audit
2. ✅ **Fix critical issues**: Address all critical and high severity findings
3. ✅ **Automate**: Set up CI/CD security checks
4. ✅ **Learn more**:
   - [Database Migration Workflow](./15-database-migration-workflow.md)
   - [OWASP Top 10](https://owasp.org/Top10/)
   - [OWASP Cheat Sheets](https://cheatsheetseries.owasp.org/)

---

**Ready to manage database schemas? Continue to [Database Migration Workflow](./15-database-migration-workflow.md) →**
