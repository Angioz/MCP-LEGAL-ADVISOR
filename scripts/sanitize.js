#!/usr/bin/env node
/**
 * SANITIZATION SCRIPT - Pre-npm Publishing Verification
 * Cross-platform (Windows/Mac/Linux) - Node.js version
 * Usage: npm run sanitize  OR  node scripts/sanitize.js
 */

import { execSync } from 'child_process';
import { existsSync, readdirSync, statSync, readFileSync } from 'fs';
import { join, extname } from 'path';

const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const BLUE = '\x1b[34m';
const RESET = '\x1b[0m';

let errors = 0;
let warnings = 0;
let passed = 0;

function ok(msg) { console.log(`${GREEN}✓ ${msg}${RESET}`); passed++; }
function warn(msg) { console.log(`${YELLOW}⚠ ${msg}${RESET}`); warnings++; }
function fail(msg) { console.log(`${RED}✗ ${msg}${RESET}`); errors++; }
function section(msg) { console.log(`\n${BLUE}[${msg}]${RESET}\n${'─'.repeat(55)}`); }

console.log(`${BLUE}${'═'.repeat(60)}${RESET}`);
console.log(`${BLUE}  SANITIZATION CHECK - Pre-npm Publishing Verification${RESET}`);
console.log(`${BLUE}${'═'.repeat(60)}${RESET}`);

// ── PHASE 1: Secrets Scanning ────────────────────────────────
section('PHASE 1: Scanning for Secrets & Credentials');

const SECRET_PATTERNS = [
  /API[_-]?KEY\s*[:=]\s*['"][^'"]{8,}/i,
  /AUTH[_-]?TOKEN\s*[:=]\s*['"][^'"]{8,}/i,
  /PASSWORD\s*[:=]\s*['"][^'"]{4,}/i,
  /SECRET\s*[:=]\s*['"][^'"]{8,}/i,
  /PRIVATE[_-]?KEY\s*[:=]\s*['"][^'"]{8,}/i,
  /ACCESS[_-]?KEY\s*[:=]\s*['"][^'"]{8,}/i,
];

function scanDir(dir) {
  if (!existsSync(dir)) return [];
  const results = [];
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, file.name);
    if (file.isDirectory()) {
      if (file.name !== 'node_modules' && file.name !== '.git') {
        results.push(...scanDir(full));
      }
    } else if (['.ts', '.js', '.json', '.yaml', '.yml', '.env'].includes(extname(file.name))) {
      results.push(full);
    }
  }
  return results;
}

let secretsFound = 0;
const srcFiles = scanDir('src');
for (const file of srcFiles) {
  const content = readFileSync(file, 'utf8');
  for (const pattern of SECRET_PATTERNS) {
    if (pattern.test(content)) {
      fail(`Potential secret in: ${file}`);
      secretsFound++;
    }
  }
}
if (secretsFound === 0) ok('No API keys, tokens, or passwords detected');

// ── PHASE 2: .env Files ──────────────────────────────────────
section('PHASE 2: Checking for .env File Leaks');

const envFiles = ['.env', '.env.local', '.env.production'].filter(existsSync);
if (envFiles.length === 0) {
  ok('No .env files in root directory');
} else {
  fail(`.env files found: ${envFiles.join(', ')}`);
}

// ── PHASE 3: .npmignore Verification ────────────────────────
section('PHASE 3: Verifying .npmignore Configuration');

if (!existsSync('.npmignore')) {
  fail('.npmignore file missing');
} else {
  ok('.npmignore file exists');
  const npmignore = readFileSync('.npmignore', 'utf8');
  const required = ['.env', '.claude', '.gemini', '.qwen', '_bmad', 'gaps/', 'GAP_REPORT', 'src/', 'tsconfig'];
  for (const pattern of required) {
    if (npmignore.includes(pattern)) {
      ok(`  Excludes: ${pattern}`);
    } else {
      warn(`  Missing exclusion: ${pattern}`);
    }
  }
}

// ── PHASE 4: Build Output ────────────────────────────────────
section('PHASE 4: Verifying Build Output');

if (!existsSync('dist')) {
  fail('dist/ directory not found — run: npm run build');
} else {
  ok('dist/ directory exists');

  function getAllFiles(dir) {
    const results = [];
    for (const file of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, file.name);
      if (file.isDirectory()) results.push(...getAllFiles(full));
      else results.push(full);
    }
    return results;
  }

  const distFiles = getAllFiles('dist');
  const allowed = ['.js', '.map', '.ts']; // .d.ts files are .ts extension
  const unexpected = distFiles.filter(f => !allowed.includes(extname(f)));
  if (unexpected.length === 0) {
    ok('dist/ contains only .js, .map, and .d.ts files');
  } else {
    fail(`Unexpected files in dist/:\n  ${unexpected.join('\n  ')}`);
  }

  const indexJs = 'dist/index.js';
  if (existsSync(indexJs)) {
    const firstLine = readFileSync(indexJs, 'utf8').split('\n')[0];
    if (firstLine.includes('#!/usr/bin/env node')) {
      ok('dist/index.js has correct shebang');
    } else {
      fail('dist/index.js missing shebang (#!/usr/bin/env node)');
    }
  } else {
    fail('dist/index.js not found');
  }
}

// ── PHASE 5: package.json Validation ────────────────────────
section('PHASE 5: Validating package.json');

const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
const requiredFields = ['name', 'version', 'description', 'main', 'bin', 'license'];
for (const field of requiredFields) {
  if (pkg[field]) ok(`Field present: ${field}`);
  else fail(`Missing field: ${field}`);
}
if (pkg.files && pkg.files.includes('dist')) {
  ok('files field includes dist/');
} else {
  warn('files field should include dist/');
}

// ── PHASE 6: Sensitive File Types ───────────────────────────
section('PHASE 7: Checking for Sensitive File Types');

const sensitivePatterns = ['.pem', '.key', '.pfx', '.p12'];
let sensitiveFound = 0;

function checkSensitive(dir) {
  if (!existsSync(dir)) return;
  for (const file of readdirSync(dir, { withFileTypes: true })) {
    if (file.name === 'node_modules' || file.name === '.git') continue;
    const full = join(dir, file.name);
    if (file.isDirectory()) checkSensitive(full);
    else if (sensitivePatterns.includes(extname(file.name))) {
      fail(`Sensitive file found: ${full}`);
      sensitiveFound++;
    }
  }
}
checkSensitive('.');
if (sensitiveFound === 0) ok('No credential files detected');

// ── SUMMARY ─────────────────────────────────────────────────
console.log(`\n${BLUE}${'═'.repeat(60)}${RESET}`);
console.log(`${BLUE}  SANITIZATION REPORT${RESET}`);
console.log(`${BLUE}${'═'.repeat(60)}${RESET}`);
console.log(`Checks Passed: ${GREEN}${passed}${RESET}`);
console.log(`Warnings:      ${YELLOW}${warnings}${RESET}`);
console.log(`Errors:        ${RED}${errors}${RESET}\n`);

if (errors === 0) {
  console.log(`${GREEN}✓✓✓ SANITIZATION PASSED ✓✓✓${RESET}`);
  console.log(`${GREEN}Safe to publish to npm${RESET}\n`);
  process.exit(0);
} else {
  console.log(`${RED}✗✗✗ SANITIZATION FAILED ✗✗✗${RESET}`);
  console.log(`${RED}DO NOT PUBLISH - Fix ${errors} error(s) above first${RESET}\n`);
  process.exit(1);
}
