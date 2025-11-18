# Tutorial 1: Installation Guide

Complete guide to installing and configuring Taurus CLI on your system.

## Prerequisites

Before installing Taurus CLI, ensure you have:

- **Node.js** 18.0.0 or higher
- **npm** 9.0.0 or higher
- **Git** (for cloning the repository)
- **Anthropic API Key**

### Check Your Environment

```bash
# Check Node.js version (should be 18+)
node --version

# Check npm version (should be 9+)
npm --version

# Check Git
git --version
```

**Don't have Node.js?** Download from https://nodejs.org/

## Step 1: Get an Anthropic API Key

1. Visit https://console.anthropic.com
2. Sign up or log in
3. Navigate to API Keys section
4. Click "Create Key"
5. Copy your API key (starts with `sk-ant-`)
6. Store it securely - you'll need it soon!

## Step 2: Clone the Repository

```bash
# Clone the repository
git clone https://github.com/az9713/taurus-cli.git

# Navigate into the directory
cd taurus-cli

# Check you're in the right place
ls -la
# You should see: src/, package.json, README.md, etc.
```

## Step 3: Install Dependencies

```bash
# Install all required packages
npm install

# This will install:
# - @anthropic-ai/sdk (Claude API)
# - chalk (colored terminal output)
# - commander (CLI framework)
# - And 10+ other dependencies

# Wait for installation to complete (usually 30-60 seconds)
```

**Troubleshooting:**
- If you see `EACCES` errors, try: `sudo npm install` (Linux/Mac)
- If you see network errors, check your internet connection
- If you see version conflicts, delete `node_modules/` and try again

## Step 4: Build the Project

```bash
# Compile TypeScript to JavaScript
npm run build

# This creates the dist/ directory with compiled code
# Should complete without errors
```

**Expected output:**
```
> taurus-cli@1.0.0 build
> tsc

[No output means success!]
```

## Step 5: Link for Global Access (Optional)

This allows you to run `taurus` from anywhere:

```bash
# Create a global symlink
npm link

# Now you can run 'taurus' from any directory
```

**Alternative:** Run directly without linking:
```bash
# From the taurus-cli directory
node dist/index.js

# Or use npm script
npm start
```

## Step 6: Configure Your API Key

### Option A: Environment Variable (Recommended)

**Linux/Mac:**
```bash
# Add to your ~/.bashrc or ~/.zshrc
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Reload your shell
source ~/.bashrc  # or source ~/.zshrc

# Verify it's set
echo $ANTHROPIC_API_KEY
```

**Windows (PowerShell):**
```powershell
# Add to your PowerShell profile
$env:ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Make it permanent
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-your-key-here', 'User')
```

### Option B: Configuration File

```bash
# Create config directory
mkdir -p ~/.taurus

# Create config file
cat > ~/.taurus/config.yaml << 'EOF'
# Taurus CLI Configuration
apiKey: sk-ant-your-key-here
model: claude-sonnet-4-5-20250929
maxTokens: 8096
temperature: 1.0
hooksEnabled: true
mcpServers: []
EOF

# Set proper permissions (important!)
chmod 600 ~/.taurus/config.yaml
```

### Option C: .env File (For Development)

```bash
# In the taurus-cli directory
cp .env.example .env

# Edit the file
nano .env  # or use your favorite editor

# Add your key
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Save and exit
```

## Step 7: Verify Installation

```bash
# Check version
taurus --version
# Should output: 1.0.0

# Try the help command
taurus --help
# Should show available commands

# Initialize a test project
mkdir ~/taurus-test
cd ~/taurus-test
taurus init
# Should create .taurus/ directory
```

## Step 8: Test Your First Session

```bash
# Start Taurus
taurus chat

# You should see:
# 🐂 Taurus CLI - Claude Code Clone
# Type your message or command. Use Ctrl+C to exit.
#
# taurus>

# Try a simple command:
taurus> Hello! Can you help me test my Taurus installation?

# Claude should respond!
# Press Ctrl+C to exit when done
```

## Verification Checklist

✅ **Node.js 18+** installed
✅ **Repository cloned** successfully
✅ **Dependencies installed** (npm install)
✅ **Project built** (npm run build)
✅ **Global link created** (npm link) - optional
✅ **API key configured** (environment variable or config file)
✅ **taurus --version** works
✅ **taurus init** creates files
✅ **taurus chat** starts successfully
✅ **First message** gets a response

## Common Installation Issues

### Issue: "command not found: taurus"

**Solution:**
```bash
# Option 1: Run npm link again
cd ~/taurus-cli
npm link

# Option 2: Add to PATH manually
echo 'export PATH="$PATH:./node_modules/.bin"' >> ~/.bashrc
source ~/.bashrc

# Option 3: Use full path
node ~/taurus-cli/dist/index.js
```

### Issue: "API key not found"

**Solution:**
```bash
# Verify environment variable is set
echo $ANTHROPIC_API_KEY

# If empty, set it
export ANTHROPIC_API_KEY="sk-ant-your-key-here"

# Or use config file (see Option B above)
```

### Issue: "Cannot find module '@anthropic-ai/sdk'"

**Solution:**
```bash
# Delete node_modules and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

### Issue: TypeScript compilation errors

**Solution:**
```bash
# Ensure you're using the right Node version
node --version  # Must be 18+

# Clean and rebuild
rm -rf dist
npm run build
```

### Issue: Permission denied errors

**Solution:**
```bash
# Fix npm permissions (Linux/Mac)
sudo chown -R $USER ~/.npm
sudo chown -R $USER ~/taurus-cli

# Or use sudo for install (not recommended)
sudo npm install
```

## Directory Structure

After installation, you should have:

```
taurus-cli/
├── dist/                  # Compiled JavaScript (created by build)
├── src/                   # TypeScript source code
├── examples/              # Example configurations
├── tutorials/             # Tutorial files (you're reading one!)
├── node_modules/          # Dependencies
├── package.json          # Project configuration
├── tsconfig.json         # TypeScript configuration
└── README.md             # Main documentation
```

Your home directory should have:

```
~/.taurus/
├── config.yaml           # Optional: Your configuration
├── sessions/             # Saved conversation sessions
└── [Will be created on first run]
```

## Optional: Install MCP Servers

MCP servers extend Taurus with additional capabilities. Install these if you plan to use MCP features:

```bash
# Filesystem access
npm install -g @modelcontextprotocol/server-filesystem

# GitHub integration
npm install -g @modelcontextprotocol/server-github

# Database access (PostgreSQL)
npm install -g @modelcontextprotocol/server-postgres

# Test an MCP server
npx -y @modelcontextprotocol/server-filesystem ~/Documents
# Press Ctrl+C to stop the test
```

**Note:** You don't need these right now. We'll cover MCP in [Tutorial 6](./06-mcp-integration.md).

## Next Steps

✅ **Installation complete!**

Now you're ready to:

1. **[Quick Start Guide](./02-quickstart.md)** - Learn basic usage
2. **[Slash Commands Tutorial](./04-slash-commands.md)** - Create custom commands
3. **[Hooks Tutorial](./03-hooks.md)** - Automate your workflow

## Configuration Reference

### Basic Configuration (~/.taurus/config.yaml)

```yaml
# API Settings
apiKey: sk-ant-your-key-here           # Your Anthropic API key
model: claude-sonnet-4-5-20250929      # Claude model to use

# Generation Settings
maxTokens: 8096                         # Maximum response length
temperature: 1.0                        # Creativity (0.0-1.0)

# Features
hooksEnabled: true                      # Enable hooks system
mcpServers: []                          # MCP servers (empty for now)

# Paths
workingDirectory: .                     # Current directory
sessionDirectory: ~/.taurus/sessions    # Where to save sessions
```

### Environment Variables

```bash
# Required
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Optional
DEBUG=true                              # Enable debug logging
TAURUS_CONFIG_DIR=~/.taurus            # Custom config directory
```

## Update Instructions

To update Taurus CLI to the latest version:

```bash
# Navigate to taurus-cli directory
cd ~/taurus-cli

# Pull latest changes
git pull origin main

# Reinstall dependencies
npm install

# Rebuild
npm run build

# Done!
```

## Uninstallation

If you need to remove Taurus CLI:

```bash
# Unlink global command
npm unlink -g taurus-cli

# Delete the repository
rm -rf ~/taurus-cli

# Remove configuration (optional)
rm -rf ~/.taurus

# Remove environment variable
# Edit ~/.bashrc or ~/.zshrc and remove the ANTHROPIC_API_KEY line
```

---

**Installation complete! 🎉**

**Next:** [Quick Start Guide](./02-quickstart.md) - Learn to use Taurus effectively
