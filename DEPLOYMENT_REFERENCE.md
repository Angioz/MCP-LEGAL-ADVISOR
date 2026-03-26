# 🚀 DEPLOYMENT REFERENCE CARD

**Quick 3-step process to safely publish to npm**

---

## STEP 1: Run Sanitization Check

```bash
npm run sanitize
```

**Expected output:**
```
✓✓✓ SANITIZATION PASSED ✓✓✓
Safe to publish to npm
```

**If ERROR (red text):** Stop. Fix issues. Re-run sanitize.

---

## STEP 2: Verify Package Contents

```bash
npm pack --dry-run
```

**Should show ONLY:**
```
legal-knowledge-mcp@1.0.0
├── dist/
├── README.md
├── LICENSE
└── package.json
```

---

## STEP 3: Publish

```bash
npm publish
```

**Verify:**
```bash
npm view legal-knowledge-mcp
```

---

## ⚠️ GATE CHECKLIST

Before running `npm publish`, verify:

```
□ npm run sanitize = PASSED (all green)
□ npm pack --dry-run = Correct files only
□ dist/index.js has shebang (#!/usr/bin/env node)
□ No .env, .claude/, _bmad/ in package
□ Version incremented in package.json
□ npm whoami = logged in
```

**All checked?** → Proceed with `npm publish`

**Any unchecked?** → DO NOT PUBLISH. Fix first.

---

## 📚 Full Documentation

- `SANITIZATION_SOP.md` - Detailed SOP
- `INSTALLATION.md` - Installation guide for users
- `DEPLOYMENT_CHECKLIST.md` - Full pre-publish checklist

---

## 🆘 Troubleshooting

**Sanitization fails:**
```bash
npm run sanitize
# Review errors, fix, re-run
```

**Build issues:**
```bash
npm run build
# Check dist/index.js exists
```

**Permission denied on scripts:**
```bash
chmod +x scripts/sanitize.sh
npm run sanitize
```

---

**Status: READY FOR DEPLOYMENT**