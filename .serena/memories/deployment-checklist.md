# Deployment Checklist - Pre-npm Publishing

**MANDATORY: Must complete before ANY npm publish**

## 🔒 Phase 1: Security Sanitization (Automated)

```bash
npm run sanitize
```

**Status Required:** ✅ PASSED (green output)

If FAILED (red errors):
- DO NOT PROCEED
- Fix issues identified in sanitization report
- Re-run until PASSED

---

## 📋 Phase 2: Manual Verification

### 2.1 Verify Package Contents
```bash
npm pack --dry-run
```

**Must show ONLY:**
- ✅ dist/ (JavaScript files)
- ✅ README.md
- ✅ LICENSE
- ✅ package.json

**Must NOT include:**
- ❌ src/ (TypeScript)
- ❌ .env files
- ❌ .claude/, .gemini/, .qwen/
- ❌ _bmad/, gaps/
- ❌ tsconfig.json

### 2.2 Verify Build Output
```bash
npm run build
ls dist/index.js
file dist/index.js | grep -i executable
```

**Must show:**
- ✅ dist/index.js exists
- ✅ Starts with `#!/usr/bin/env node`

### 2.3 Audit Critical Files

**1. Check package.json**
```bash
grep -E '"author"|"version"|"repository"' package.json
```
- ✅ Author info is public (or anonymized if preferred)
- ✅ Version is incremented
- ✅ Repository points to public GitHub

**2. Check README.md**
```bash
head -50 README.md
```
- ✅ No hardcoded credentials
- ✅ No personal contact info (unless intentional)
- ✅ No debug URLs or endpoints

**3. Check .npmignore**
```bash
cat .npmignore
```
- ✅ Includes: .env, .claude/, .gemini/, _bmad/, gaps/, src/, tsconfig.json
- ✅ Does NOT exclude: dist/

---

## 🚀 Phase 3: Pre-Publish Test

```bash
# Verify logged in
npm whoami

# Test publish (dry-run)
npm pack
```

**Expected:** legal-knowledge-mcp-1.0.0.tgz created

---

## ✅ Phase 4: Go/No-Go Decision

**GATE CHECKLIST - Must be 100% complete:**

- [ ] `npm run sanitize` = PASSED (no errors)
- [ ] `npm pack --dry-run` shows correct files only
- [ ] dist/index.js has shebang
- [ ] No .env, .claude/, _bmad/ in package
- [ ] package.json has correct metadata
- [ ] README is sanitized
- [ ] Version is incremented
- [ ] npm login verified (`npm whoami`)

**If ANY item unchecked:** DO NOT PUBLISH

---

## 🎯 Publish (After All Phases Pass)

```bash
npm publish
```

**Verify on npm:**
```bash
npm view legal-knowledge-mcp
```

---

## 📝 Documentation References

- **SOP Details:** See SANITIZATION_SOP.md
- **Automated Script:** bash scripts/sanitize.sh
- **Installation Guide:** INSTALLATION.md

---

**Status:** ACTIVE  
**Last Updated:** 2026-03-22  
**Responsible:** Angioz