#!/usr/bin/env node
// Both-directions self-test for verdict.mjs (gate verdict = f(issue count)).
// Direction 1: known-good → correct positive label for every gate (0 issues → pass label;
//   read golden 04-conflicts blocking_count + 08-critique issues from greenfield-clean).
// Direction 2: planted defect → flips (inject issue → blocked) for every gate.
// Determinism: same input → byte-identical twice. Mirrors validate.selftest.mjs structure.
import fs from "node:fs";
import { computeVerdict, countIssues, GATES } from "./verdict.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ===========================================================================
// DIRECTION 1 — known-good: zero issues → each gate's positive label
// ===========================================================================
console.log("=== Direction 1: zero issues → positive label per gate ===");
for (const [gate, { pass: pos }] of Object.entries(GATES)) {
  const v = computeVerdict(gate, 0);
  ok(v === pos, `${gate}: 0 issues expected ${pos}, got ${v}`);
  console.log(`  ${gate} 0 issues → ${v}`);
}

// golden-backed: 04-conflicts (RECONCILE) clean greenfield has blocking_count 0 → coherent
{
  const conflicts = readJSON(`${GF}/.adr/04-conflicts.json`);
  ok(countIssues(conflicts) === 0, `04-conflicts golden blocking_count expected 0, got ${countIssues(conflicts)}`);
  ok(computeVerdict("02-conflicts", conflicts) === "coherent", "04-conflicts golden → coherent");
  console.log(`  golden 04-conflicts (blocking_count=${countIssues(conflicts)}) → ${computeVerdict("02-conflicts", conflicts)}`);
}
// golden-backed: 08-critique clean greenfield has empty issues[] → clean
{
  const crit = readJSON(`${GF}/.aprd/08-critique.json`);
  ok(countIssues(crit) === 0, `08-critique golden issues expected 0, got ${countIssues(crit)}`);
  ok(computeVerdict("00-critique", crit) === "clean", "08-critique golden → clean");
  console.log(`  golden 08-critique (issues=${countIssues(crit)}) → ${computeVerdict("00-critique", crit)}`);
}

// ===========================================================================
// DIRECTION 2 — planted defect: inject ≥1 issue → blocked, every gate
// ===========================================================================
console.log("\n=== Direction 2: planted issue → blocked per gate ===");
for (const gate of Object.keys(GATES)) {
  const v = computeVerdict(gate, 1);
  ok(v === "blocked", `${gate}: 1 issue expected blocked, got ${v}`);
  console.log(`  ${gate} 1 issue → ${v}`);
}
// planted on golden: inject an issue into 08-critique → flips clean→blocked
{
  const crit = readJSON(`${GF}/.aprd/08-critique.json`);
  crit.issues = [{ id: "X", category: "planted", target_ref: "R1", problem: "x", fix_hint: "x" }];
  ok(computeVerdict("00-critique", crit) === "blocked", "08-critique +1 issue → blocked");
  console.log(`  golden 08-critique +1 planted issue → ${computeVerdict("00-critique", crit)}`);
}
// blocking_count drives 02-conflicts even with empty issues[]
{
  const obj = { issues: [], blocking_count: 2 };
  ok(computeVerdict("02-conflicts", obj) === "blocked", "02-conflicts blocking_count=2 → blocked");
  ok(countIssues(obj) === 2, "countIssues prefers blocking_count over issues[]");
}
// unknown gate throws
{
  let threw = false;
  try { computeVerdict("99-bogus", 0); } catch { threw = true; }
  ok(threw, "unknown gate throws");
  console.log(`  unknown gate → ${threw ? "throws OK" : "FAIL"}`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = JSON.stringify(Object.keys(GATES).map(g => computeVerdict(g, 0)));
  const b = JSON.stringify(Object.keys(GATES).map(g => computeVerdict(g, 0)));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
