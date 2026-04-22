// Tests for Code.js — NY tax table benefit recapture (MFJ).
//
// Run with:   node Code.test.js
//
// Code.js targets Google Apps Script and has no module.exports. We load
// it into a vm sandbox so it runs unmodified and we can reach in for the
// public functions.

const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const assert = require('node:assert');

const CODE_PATH = path.join(__dirname, 'Code.js');
const sandbox = {};
vm.createContext(sandbox);
vm.runInContext(fs.readFileSync(CODE_PATH, 'utf8'), sandbox, { filename: CODE_PATH });
const { getNYIncomeTax } = sandbox;

// ──────────────────────────────────────────────────────────────────────
// Tiny test runner — avoids a package.json / devDependency.
// ──────────────────────────────────────────────────────────────────────
const tests = [];
function test(name, fn) { tests.push({ name, fn }); }
function approxEquals(actual, expected, tolerance, msg) {
  assert.ok(
    Math.abs(actual - expected) <= tolerance,
    `${msg}: expected ${expected} ±${tolerance}, got ${actual}`
  );
}

// ──────────────────────────────────────────────────────────────────────
// Acceptance case: real 2025 MFJ filed return (from the bug report).
// NY taxable income $1,022,424 → actual filed tax $70,036.
// WS 3 MFJ: bracketed + 1,140 + 2,747 × phase-in(=1.0).
// ──────────────────────────────────────────────────────────────────────
test('2025 MFJ $1,022,424 → $70,036 ±1 (fully recaptured, WS 3)', () => {
  approxEquals(getNYIncomeTax(1022424, 2025), 70036, 1, '1022424 MFJ 2025');
});

// ──────────────────────────────────────────────────────────────────────
// Spec test cases.
// ──────────────────────────────────────────────────────────────────────
test('2025 MFJ $995,512 → $68,192 ±1 (flat 6.85% band, WS 3)', () => {
  approxEquals(getNYIncomeTax(995512, 2025), 68192, 1, '995512 MFJ 2025');
});

test('2025 MFJ $400,000 → WS 3 published value', () => {
  // WS 3 MFJ (TI in $323,200–$2,155,350): bracketed + $1,140 + $2,747 × 1.0
  // bracketed = 0.04·17,150 + 0.045·6,450 + 0.0525·4,300 + 0.055·133,650
  //           + 0.06·161,650 + 0.0685·76,800
  //           = 686 + 290.25 + 225.75 + 7,350.75 + 9,699 + 5,260.80
  //           = 23,512.55
  // tax      = 23,512.55 + 1,140 + 2,747 = 27,399.55
  approxEquals(getNYIncomeTax(400000, 2025), 27399.55, 0.5, '400000 MFJ 2025');
});

test('2025 MFJ $50,000 → straight bracket (no recapture)', () => {
  // 0.04·17,150 + 0.045·6,450 + 0.0525·4,300 + 0.055·22,100
  // = 686 + 290.25 + 225.75 + 1,215.50 = 2,417.50
  assert.strictEqual(getNYIncomeTax(50000, 2025), 2417.50);
});

test('2025 MFJ $107,000 → straight bracket (below phase-in)', () => {
  // 0.04·17,150 + 0.045·6,450 + 0.0525·4,300 + 0.055·79,100
  // = 686 + 290.25 + 225.75 + 4,350.50 = 5,552.50
  assert.strictEqual(getNYIncomeTax(107000, 2025), 5552.50);
});

// Exact phase-in boundary: $107,650 — still straight bracket (NYAGI must be > $107,650).
test('2025 MFJ $107,650 → straight bracket (phase-in boundary)', () => {
  // 0.04·17,150 + 0.045·6,450 + 0.0525·4,300 + 0.055·79,750
  // = 686 + 290.25 + 225.75 + 4,386.25 = 5,588.25
  assert.strictEqual(getNYIncomeTax(107650, 2025), 5588.25);
});

// ──────────────────────────────────────────────────────────────────────
// Year coverage: 2023, 2024 share coefficients with 2025.
// ──────────────────────────────────────────────────────────────────────
test('2024 MFJ $1,022,424 matches 2025 (same coefficients)', () => {
  assert.strictEqual(getNYIncomeTax(1022424, 2024), getNYIncomeTax(1022424, 2025));
});

test('2023 MFJ $1,022,424 matches 2025 (same coefficients)', () => {
  assert.strictEqual(getNYIncomeTax(1022424, 2023), getNYIncomeTax(1022424, 2025));
});

test('2026 MFJ unchanged (bracketed only; no recapture table yet)', () => {
  // 2026 brackets differ from 2023-2025 and have no published recapture
  // table. getNYIncomeTax must still work for 2026 and return the plain
  // bracketed tax (pre-fix behavior) — this preserves existing callers.
  // 2026 at $50,000:
  // 0.039·17,150 + 0.044·6,450 + 0.0515·4,300 + 0.054·22,100
  // = 668.85 + 283.80 + 221.45 + 1,193.40 = 2,367.50
  assert.strictEqual(getNYIncomeTax(50000, 2026), 2367.50);
});

// ──────────────────────────────────────────────────────────────────────
// Edge cases.
// ──────────────────────────────────────────────────────────────────────
test('WS 6 cliff: 2025 MFJ $30M → flat 10.9% × TI', () => {
  // NYAGI > $25M: tax = 0.109 × 30,000,000 = 3,270,000
  assert.strictEqual(getNYIncomeTax(30000000, 2025), 3270000);
});

// ──────────────────────────────────────────────────────────────────────
// Run.
// ──────────────────────────────────────────────────────────────────────
let passed = 0;
let failed = 0;
for (const { name, fn } of tests) {
  try {
    fn();
    console.log(`  ok  ${name}`);
    passed++;
  } catch (e) {
    console.error(`  FAIL ${name}`);
    console.error(`       ${e.message}`);
    failed++;
  }
}
console.log(`\n${passed}/${tests.length} passed` + (failed ? `, ${failed} failed` : ''));
process.exit(failed === 0 ? 0 : 1);
