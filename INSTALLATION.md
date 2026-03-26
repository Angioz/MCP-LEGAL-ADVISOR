# Legal Knowledge MCP - Professional Installation Guide

This guide covers **3 supported installation methods** with troubleshooting for each.

---

## ⚠️ System Requirements

Before installing, verify:

```bash
# Check Node.js version (must be 18+)
node --version

# Check npm version
npm --version
```

If Node.js is not installed, download from [nodejs.org](https://nodejs.org/) (LTS recommended).

---

## 📦 Installation Method 1: Global npm (Recommended for Claude Desktop)

**Best for:** Claude Desktop users, single installation

### Step 1: Install the Package

```bash
npm install -g legal-knowledge-mcp
```

**Verify installation:**
```bash
which legal-knowledge-mcp    # macOS/Linux
where legal-knowledge-mcp    # Windows PowerShell
```

### Step 2: Configure Claude Desktop

**Location of settings file:**
- **macOS/Linux:** `~/.claude/settings.json`
- **Windows:** `%APPDATA%\Claude\settings.json`

**Add to your settings.json:**

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "legal-knowledge-mcp"
    }
  }
}
```

### Step 3: Restart Claude Desktop

Close Claude Desktop completely and reopen it. The server will connect automatically.

**Verify it works:**
- Open Claude Desktop
- Ask: `"What are the requirements to form an SRL in Italy?"`
- You should see the legal tools available

---

## 🔧 Installation Method 2: From Source (For Development/Troubleshooting)

**Best for:** Contributors, development, debugging installation issues

### Step 1: Clone Repository

```bash
git clone https://github.com/Angioz/MCP-LEGAL-ADVISOR.git
cd MCP-LEGAL-ADVISOR
```

### Step 2: Build the Server

```bash
npm install
npm run build
```

**Verify compilation succeeded:**
```bash
ls dist/index.js  # Should exist and have content
```

### Step 3: Test the Server

```bash
node dist/index.js
```

**Expected output:**
```
Legal Knowledge MCP server running on stdio
```

Press `Ctrl+C` to stop.

### Step 4: Configure Claude to Use Local Version

**macOS/Linux/Windows PowerShell:**

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "node",
      "args": ["/absolute/path/to/MCP-LEGAL-ADVISOR/dist/index.js"]
    }
  }
}
```

**Windows Command Prompt:**

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "node",
      "args": ["C:\\Users\\YourUsername\\path\\to\\MCP-LEGAL-ADVISOR\\dist\\index.js"]
    }
  }
}
```

---

## ⚡ Installation Method 3: npx (No Installation)

**Best for:** Quick testing, one-off usage

```bash
# Test the server (doesn't install globally)
npx legal-knowledge-mcp

# Expected output:
# Legal Knowledge MCP server running on stdio
```

**For Claude Desktop with npx:**

```json
{
  "mcpServers": {
    "legal-knowledge": {
      "command": "npx",
      "args": ["-y", "legal-knowledge-mcp"]
    }
  }
}
```

---

## 🔍 Troubleshooting

### Issue: "command not found: legal-knowledge-mcp"

**Cause:** Global npm bin directory not in PATH.

**Fix:**

**macOS/Linux:**
```bash
# Find npm bin directory
npm config get prefix

# Add to ~/.zshrc or ~/.bashrc
export PATH="$PATH:$(npm config get prefix)/bin"

# Reload shell
source ~/.zshrc  # or ~/.bashrc
```

**Windows:**
```powershell
# Find npm bin directory
npm config get prefix
# Usually: C:\Users\{username}\AppData\Roaming\npm

# Add to System Environment Variables:
# 1. Right-click "This PC" → Properties
# 2. Advanced system settings
# 3. Environment Variables
# 4. Add npm bin directory to PATH
# 5. Restart PowerShell
```

---

### Issue: "Connection refused" in Claude Desktop

**Cause:** MCP configuration error or server crash.

**Fix:**

1. **Verify server runs manually:**
   ```bash
   legal-knowledge-mcp
   # Should output: "Legal Knowledge MCP server running on stdio"
   ```

2. **Check Claude configuration:**
   - Ensure `settings.json` is valid JSON (use [jsonlint.com](https://jsonlint.com))
   - No trailing commas
   - Correct file path for your OS

3. **Restart Claude Desktop:**
   - Close completely (not just minimize)
   - Reopen

4. **Check MCP panel:**
   - In Claude Desktop, look for MCP panel
   - Should show "legal-knowledge" as "Connected"

---

### Issue: "legal-knowledge-mcp is not available yet"

**Cause:** npm package not published or installation is using wrong version.

**Fix:**

**Option A: Update npm**
```bash
npm install -g npm@latest
npm install -g legal-knowledge-mcp@latest
```

**Option B: Use source installation**
```bash
git clone https://github.com/Angioz/MCP-LEGAL-ADVISOR.git
cd MCP-LEGAL-ADVISOR
npm install && npm run build
# Then configure Claude to use local dist/index.js
```

---

### Issue: "TypeError: Cannot find module"

**Cause:** Dependencies not installed.

**Fix:**

**If using global install:**
```bash
npm uninstall -g legal-knowledge-mcp
npm install -g legal-knowledge-mcp
```

**If using source:**
```bash
cd MCP-LEGAL-ADVISOR
rm -rf node_modules
npm install
npm run build
```

---

### Issue: No tools appear in Claude

**Cause:** Server is running but tools not loading.

**Fix:**

1. **Check Claude's debug logs:**
   - Look in Claude Desktop's MCP panel for error messages

2. **Verify server directly:**
   ```bash
   legal-knowledge-mcp
   # Should show: "Legal Knowledge MCP server running on stdio"
   ```

3. **Check Node.js version:**
   ```bash
   node --version
   # Must be 18.0.0 or higher
   ```

4. **Restart everything:**
   - Stop the server (Ctrl+C)
   - Close Claude Desktop completely
   - Reopen Claude Desktop

---

### Issue: "EACCES: permission denied" (macOS/Linux)

**Cause:** npm global directory permissions.

**Fix:**

```bash
# Option 1: Fix npm permissions (recommended)
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
export PATH=~/.npm-global/bin:$PATH
# Add to ~/.zshrc or ~/.bashrc

# Option 2: Use sudo (not recommended)
sudo npm install -g legal-knowledge-mcp
```

---

### Issue: Works on macOS/Linux but not on Windows

**Cause:** Path separators or Command Prompt vs PowerShell differences.

**Fix:**

1. **Use forward slashes in paths:**
   ```json
   {
     "command": "node",
     "args": ["C:/Users/YourUsername/path/to/dist/index.js"]
   }
   ```

2. **Use PowerShell instead of Command Prompt:**
   - Launch PowerShell as Administrator
   - Run npm commands there

3. **Verify Node.js is accessible:**
   ```powershell
   node --version
   npm --version
   ```

---

## ✅ Verification Checklist

Use this to verify everything is working:

- [ ] Node.js 18+ is installed (`node --version`)
- [ ] legal-knowledge-mcp is installed globally (`npm list -g legal-knowledge-mcp`)
- [ ] Server runs manually (`legal-knowledge-mcp`)
- [ ] Claude settings.json is valid JSON (no syntax errors)
- [ ] MCP entry exists in settings.json
- [ ] Claude Desktop is restarted
- [ ] MCP panel shows "Connected"
- [ ] Can see legal tools in Claude's tool list
- [ ] Can make a query: `"What is EU GDPR?"`

---

## 🆘 Still Having Issues?

1. **Check GitHub Issues:** [MCP-LEGAL-ADVISOR Issues](https://github.com/Angioz/MCP-LEGAL-ADVISOR/issues)
2. **Create a new issue** with:
   - Your OS and Node.js version
   - Exact error message
   - Steps you followed
   - Output of `npm list -g legal-knowledge-mcp`

---

## 📚 Additional Resources

- [MCP Specification](https://modelcontextprotocol.io/)
- [Claude Desktop Documentation](https://claude.ai/download)
- [Node.js Documentation](https://nodejs.org/docs/)

---

*Last updated: 2026-03-22*