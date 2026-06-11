#!/usr/bin/env node
// Gate verdict = f(issue count) for all 6 pipeline gates (doc-00 §B "Gates").
// Pure rule: gate blocked iff issue count > 0 (or blocking_count > 0), else positive label.
// Positive labels DIFFER per gate (confirmed enums from schemas):
//   00-critique clean|blocked · 02-conflicts(RECONCILE) coherent|blocked (blocking_count)
//   02-critique clean|blocked · 03-reconcile/03-hld-critique clean|blocked
//   04-verification(VERIFY-OUTPUT) verified|blocked (any-red→blocked, doc-00)
//   04-build-critique clean|blocked.
// Pure core fn + thin CLI. Zero deps, ESM, deterministic. Mirrors validate.mjs idiom.
// Usage: node verdict.mjs <gate> <issueCount>  → prints verdict, exit 0/1/2.

// --- GATES: gate -> {pass, fail} positive/blocked label pair --------------------
export const GATES = {
  "00-critique":     { pass: "clean",    fail: "blocked" },
  "02-conflicts":    { pass: "coherent", fail: "blocked" },  // RECONCILE; reads blocking_count
  "02-critique":     { pass: "clean",    fail: "blocked" },
  "03-reconcile":    { pass: "clean",    fail: "blocked" },
  "03-hld-critique": { pass: "clean",    fail: "blocked" },
  "04-verification": { pass: "verified", fail: "blocked" },  // VERIFY-OUTPUT; any-red→blocked
  "04-build-critique": { pass: "clean",  fail: "blocked" },
};

// --- countIssues: read .issues?.length or .blocking_count from an artifact -------
// blocking_count wins when present (02-conflicts carries it); else issues[].length.
export function countIssues(obj) {
  if (obj && typeof obj === "object") {
    if (typeof obj.blocking_count === "number") return obj.blocking_count;
    if (Array.isArray(obj.issues)) return obj.issues.length;
  }
  return 0;
}

// --- computeVerdict: gate + count(or counts-bag) -> positive|blocked label --------
// count > 0 → fail label; else pass label. Accepts a number, or an artifact obj
// (then countIssues reads it). Unknown gate → throw.
export function computeVerdict(gate, issueCountOrCounts) {
  const g = GATES[gate];
  if (!g) throw new Error(`unknown gate: ${gate}`);
  const n = typeof issueCountOrCounts === "number"
    ? issueCountOrCounts
    : countIssues(issueCountOrCounts);
  return n > 0 ? g.fail : g.pass;
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [gate, countRaw] = process.argv.slice(2);
  if (!gate || countRaw === undefined) {
    console.error("usage: node verdict.mjs <gate> <issueCount>");
    process.exit(2);
  }
  const n = Number(countRaw);
  if (!Number.isFinite(n)) { console.error(`bad issueCount: ${countRaw}`); process.exit(2); }
  let v;
  try { v = computeVerdict(gate, n); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  const blocked = GATES[gate].fail === v;
  console.log(`${gate} → ${v} (${n} issues)`);
  process.exit(blocked ? 1 : 0);
}
