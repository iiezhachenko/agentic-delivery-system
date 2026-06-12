#!/usr/bin/env node
// Both-directions self-test for prune-ledger.mjs (R-LH-1/2/3, D31/CR-010).
// Direction 1 (GOLDEN): pruneLedger(input, merged={A,B}) == expected/08-rerank.json — merged pruned,
//   unmerged-C preserved, remaining_sequence + open deferred_findings preserved, _note collapsed, v+1.
// Direction 2 (DISCRIMINATION): flip merged-status → output flips (merged-detection drives prune,
//   not a hardcoded id); preserve-invariant holds for ANY merged set (R-LH-2); idempotent re-run =
//   no-op (R-LH-3); empty merged set (pre-merge) = no-op; same input → byte-identical twice.
// Pure-fn test — no git, reads _fixtures/ledger-prune/ goldens. Mirrors route.selftest.mjs structure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { pruneLedger } from "./prune-ledger.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const FX = `${ROOT}/_fixtures/ledger-prune`;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b || typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => deepEqual(a[k], b[k]));
}

const input = readJSON(`${FX}/input/08-rerank.json`);
const expected = readJSON(`${FX}/expected/08-rerank.json`);
const mergedAB = new Set(readJSON(`${FX}/merged-sentinels.json`).merged); // {merged-a, merged-b}

// ===========================================================================
// DIRECTION 1 (GOLDEN) — prune with merged={A,B}, assert == expected
// ===========================================================================
console.log("=== Direction 1: golden prune (merged A+B) == expected ===");
{
  const { ledger, pruned, kept, changed } = pruneLedger(clone(input), mergedAB);
  ok(changed === true, `expected changed:true, got ${changed}`);
  ok(deepEqual(ledger, expected), "pruned ledger != expected golden");
  ok(JSON.stringify(pruned) === JSON.stringify(["WX-MERGED-A", "WX-MERGED-B"]), `pruned ids ${JSON.stringify(pruned)}`);
  ok(JSON.stringify(kept) === JSON.stringify(["WX-UNMERGED-C"]), `kept ids ${JSON.stringify(kept)}`);
  console.log(`  pruned ${pruned.length}, kept ${kept.length}, golden match`);
}

// ===========================================================================
// DIRECTION 2 (DISCRIMINATION) — flip merged-status, invariants, idempotency
// ===========================================================================
console.log("=== Direction 2: discrimination + invariants ===");

// (a) flip merged-status: mark C merged too → C also pruned (proves detection drives it, not a hardcode).
{
  const mergedAll = new Set([...mergedAB, "src/unmerged-c.txt"]);
  const { ledger, pruned } = pruneLedger(clone(input), mergedAll);
  ok(ledger.completed.length === 0, `all-merged → completed should be empty, got ${ledger.completed.length}`);
  ok(pruned.includes("WX-UNMERGED-C"), "flipping C to merged should prune C — it did not (hardcode smell)");
  console.log(`  flip C→merged: completed now ${ledger.completed.length}, pruned ${pruned.length}`);
}

// (b) preserve-invariant (R-LH-2): remaining_sequence + open deferred_findings survive ANY prune.
{
  const mergedAll = new Set(["src/merged-a.txt", "src/merged-b.txt", "src/unmerged-c.txt"]);
  const { ledger } = pruneLedger(clone(input), mergedAll);
  ok(deepEqual(ledger.remaining_sequence, input.remaining_sequence), "remaining_sequence mutated by prune (R-LH-2 violated)");
  ok(deepEqual(ledger.coverage.deferred_findings, input.coverage.deferred_findings), "open deferred_findings dropped by prune (R-LH-2 violated)");
  ok(deepEqual(ledger.coverage.missing, input.coverage.missing) && deepEqual(ledger.coverage.duplicated, input.coverage.duplicated), "missing/duplicated mutated");
  console.log("  remaining_sequence + open deferred_findings preserved through full prune");
}

// (c) idempotency (R-LH-3): re-prune the expected golden with same merged set → no-op (A/B already gone).
{
  const { ledger, changed, pruned } = pruneLedger(clone(expected), mergedAB);
  ok(changed === false, `re-prune of pruned ledger should be no-op, got changed:${changed}`);
  ok(pruned.length === 0, `idempotent re-run pruned ${pruned.length} (expected 0)`);
  ok(deepEqual(ledger, expected), "no-op re-prune mutated the ledger");
  console.log("  idempotent: re-prune of pruned ledger is a no-op");
}

// (d) empty merged set (pre-merge state): nothing on master yet → no-op, no version bump (R-LH-3).
{
  const { ledger, changed } = pruneLedger(clone(input), new Set());
  ok(changed === false, "empty merged set should be no-op (nothing merged yet)");
  ok(ledger.roadmap_version === input.roadmap_version, "no-op must not bump roadmap_version");
  console.log("  empty merged set (pre-merge): no-op, version unchanged");
}

// (e) determinism: same input → byte-identical output twice.
{
  const a = JSON.stringify(pruneLedger(clone(input), mergedAB).ledger);
  const b = JSON.stringify(pruneLedger(clone(input), mergedAB).ledger);
  ok(a === b, "non-deterministic: two runs differ");
  console.log("  deterministic: two runs byte-identical");
}

console.log(`\nprune-ledger selftest: ${pass} passed, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
