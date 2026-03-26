# Sanitization SOP - Pre-Deployment Verification

**Standard Operating Procedure for npm Publishing**

Version: 1.0.0  
Last Updated: 2026-03-22  
Owner: Angioz  
Status: ACTIVE

---

## 🎯 Purpose

Ensure NO personal information, credentials, or sensitive data are published to npm before each release.

---

## 📋 Pre-Deployment Checklist

**MANDATORY: Run before every npm publish**

### Phase 1: Automated Scanning (Script-Based)

```bash
npm run sanitize
```

This runs:
1. ✅ Secrets detection (API keys, tokens, passwords)
2. ✅ Environment variable leaks
3. ✅ Credential patterns
4. ✅ .npmignore verification
5. ✅ Package contents validation

**Expected Output:**
```
✅ No secrets found
✅ No credentials detected
✅ .npmignore properly configured
✅ Safe to publish
```

**If ANY WARNING:** Stop immediately. Review findings before proceeding.

---

### Phase 2: Manual Review (Required)

**1. Verify .npmignore Excludes All Sensitive Paths**

```bash
npm pack --dry-run
```

Should NOT include:
- ❌ `.env*` files
- ❌ `.claude/`, `.gemini/`, `.qwen/`
- ❌ `_bmad/`, `_bmad-output/`
- ❌ `gaps/`, `GAP_REPORT.md`
- ❌ `agents/` (unless public)
- ❌ `.mcp.json`
- ❌ `src/` (TypeScript source)
- ❌ `tsconfig.json`

Should ONLY include:
- ✅ `dist/` (compiled JavaScript)
- ✅ `README.md`
- ✅ `LICENSE`
- ✅ `package.json`

**Action:** If anything unexpected appears, update `.npmignore`

---

**2. Audit Source Code Comments**

```bash
# Look for sensitive comments
grep -r "TODO\|FIXME\|HACK\|DEBUG" src/ | grep -i "password\|token\|secret\|key\|api"
```

**Expected:** No results

**If found:** Remove or sanitize the comment before publishing.

---

**3. Scan Author/Repository Info**

```bash
cat package.json | grep -E '"author"|"repository"|"homepage"'
```

Verify:
- [ ] Author name/email is correct and public
- [ ] Repository URL points to public GitHub
- [ ] Homepage URL is public and correct
- [ ] No personal email addresses you want private

---

**4. Review README for Sensitive Content**

```bash
cat README.md | head -100
```

Check for:
- [ ] No hardcoded credentials
- [ ] No personal contact info (if you want privacy)
- [ ] No internal links to private resources
- [ ] No temporary URLs or debug endpoints
- [ ] No personal notes or TODOs

---

**5. Verify Build Output**

```bash
npm run build
find dist/ -type f | wc -l
file dist/index.js
```

**Expected:**
- dist/ contains only `.js` and `.js.map` files
- dist/index.js starts with `#!/usr/bin/env node`
- No other file types (no `.env`, no `.yaml`, no source files)

---

### Phase 3: Pre-Publish Verification

```bash
# Final check: list what will actually be published
npm pack --dry-run --verbose

# Verify tarball contents
tar -tzf legal-knowledge-mcp-1.0.0.tgz | head -20
```

**Expected contents:**
```
package/dist/
package/dist/index.js
package/dist/tools/
package/README.md
package/LICENSE
package/package.json
```

No other files should appear.

---

### Phase 4: Final Approval Gate

Before running `npm publish`:

```
CHECKLIST:
[ ] npm run sanitize passed
[ ] npm pack --dry-run shows only: dist/, README.md, LICENSE
[ ] No secrets/credentials in output
[ ] No personal information in package
[ ] Author/repository info is correct
[ ] README is sanitized
[ ] Build succeeds (npm run build)
[ ] dist/index.js has shebang
[ ] Version number is correct in package.json
```

**If ANY item unchecked:** DO NOT PUBLISH. Fix first.

---

## 🚀 Publishing (After All Phases Pass)

```bash
# Verify you're logged in
npm whoami

# Publish to npm
npm publish

# Verify on npm
npm view legal-knowledge-mcp
```

---

## 🔒 Security Policies

**NEVER publish if:**
- ❌ Any `.env` files are included
- ❌ Any credentials/API keys found in code
- ❌ Any personal information not intended for public
- ❌ Source TypeScript files included (only dist/ allowed)
- ❌ Internal project files included (_bmad/, gaps/, etc.)
- ❌ AI tool configs included (.claude/, .gemini/, etc.)

**ALWAYS verify:**
- ✅ npm run sanitize passes
- ✅ npm pack --dry-run shows correct contents
- ✅ All tests pass (if applicable)
- ✅ Version number is incremented
- ✅ CHANGELOG.md is updated

---

## 📝 Automated Script

The `scripts/sanitize.sh` script automates Phase 1.

**Run before every publish:**

```bash
npm run sanitize
```

**Or directly:**

```bash
bash scripts/sanitize.sh
```

---

## 📋 Issue Resolution

### "Secrets detected in code"

**Action:**
1. Review the file/line reported
2. Remove or mask the sensitive content
3. Do NOT commit the sensitive data
4. Re-run `npm run sanitize`

### ".npmignore not excluding properly"

**Action:**
1. Add the pattern to `.npmignore`
2. Run `npm pack --dry-run` to verify
3. Re-run `npm run sanitize`

### "dist/ contains unexpected files"

**Action:**
1. Check `tsconfig.json` compilation settings
2. Run `npm run build` to recompile
3. Verify `dist/` contains only `.js` and `.js.map`

---

## 🔄 Integration with CI/CD (Future)

This SOP can be automated in GitHub Actions:

```yaml
- name: Sanitize Package
  run: npm run sanitize
  
- name: Verify Package Contents
  run: npm pack --dry-run
  
- name: Publish (on main branch)
  if: github.ref == 'refs/heads/main'
  run: npm publish
```

---

## 📞 Questions?

If you encounter issues:
1. Run `npm run sanitize` to diagnose
2. Check `.npmignore` for proper exclusions
3. Review this SOP for Phase 2 manual checks
4. Create GitHub issue with findings

---

**Status: APPROVED FOR DEPLOYMENT**  
Effective: 2026-03-22