# PUBLISH SOP - Standard Operating Procedure

**STATUS: ACTIVE — Load this at every session start**
**Last verified: 2026-03-26**

---

## The 5-Step Publish Process

### Step 1 — Sanitize (automated)
```bash
npm run sanitize
```
✅ Must pass with 0 errors before proceeding.

### Step 2 — Verify package contents
```bash
npm pack --dry-run
```
Must contain ONLY:
- dist/ (compiled JS)
- README.md
- LICENSE
- package.json

### Step 3 — Verify npm login
```bash
npm whoami
# Expected: tony.macbot
```
If not logged in:
```bash
npm login
# Then set token:
npm config set //registry.npmjs.org/:_authToken YOUR_TOKEN
```

### Step 4 — Publish
```bash
npm publish
```

### Step 5 — Verify live
```bash
npm view legal-knowledge-mcp
```

---

## Version Bumping (Before Publishing Updates)

```bash
npm version patch   # 1.0.0 → 1.0.1  (bug fix)
npm version minor   # 1.0.0 → 1.1.0  (new feature)
npm version major   # 1.0.0 → 2.0.0  (breaking change)
```

---

## Security Rules — Non-Negotiable

- ❌ NEVER publish if sanitize fails
- ❌ NEVER commit npm tokens to git
- ❌ NEVER skip the sanitize step
- ✅ ALWAYS run npm run sanitize first
- ✅ ALWAYS verify npm pack --dry-run before publishing
- ✅ ALWAYS verify with npm view after publishing

---

## npm Account Details

- **Username**: tony.macbot
- **Package**: legal-knowledge-mcp
- **Token type**: Granular Access Token (Automation, Bypass 2FA)
- **Token expires**: 2026-06-24
- **Token location**: ~/.npmrc (system only, not in project)
- **Renew at**: https://www.npmjs.com/settings/tony.macbot/tokens

---

## What Gets Published (Verified)

```
legal-knowledge-mcp@1.0.0
├── dist/          ← compiled JavaScript (13 tools)
├── README.md      ← public documentation
├── LICENSE        ← MIT
└── package.json   ← metadata
```

**Never published:** src/, .env, .claude/, .gemini/, _bmad/, gaps/, tsconfig.json

---

## Files Reference

- `scripts/sanitize.js` — automated sanitization script
- `SANITIZATION_SOP.md` — full SOP documentation
- `DEPLOYMENT_REFERENCE.md` — quick reference card
- `INSTALLATION.md` — user installation guide