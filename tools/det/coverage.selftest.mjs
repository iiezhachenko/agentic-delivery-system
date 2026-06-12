#!/usr/bin/env node
// Both-directions self-test for coverage.mjs (bijection / membership / single-owner / intersect).
// Direction 1 (GOLDEN where it exercises the rule): greenfield 02-slices coverage — every
//   requirement covered exactly once across slices (single-owner-ish); synthetic for the rest.
// Direction 2: break a bijection (orphan + double) → flagged; 2-owner entity → flagged;
//   membership mocked when dep absent. Determinism: byte-identical twice.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { bijection, bucketCoverage, singleOwner, membership, intersect } from "./coverage.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");
const GF = `${ROOT}/_fixtures/greenfield-clean`;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ===========================================================================
// DIRECTION 1 — known-good set-ops
// ===========================================================================
console.log("=== Direction 1: known-good set-ops ===");
// bijection: 3 edges, one CT* each → ok, no orphan/double
{
  const edges = ["e1", "e2", "e3"];
  const ctRefs = ["e1", "e2", "e3"];  // each edge contracted once
  const r = bijection(edges, ctRefs);
  ok(r.ok && r.orphans.length === 0 && r.doubles.length === 0, `clean bijection: ${JSON.stringify(r)}`);
  console.log(`  bijection(3 edges,3 CT refs) → ok=${r.ok}`);
}
// GOLDEN single-owner: every ACCEPTANCE criterion appears in exactly one slice's acceptance[]
//   (AC* are slice-exclusive in this fixture; R9/R10 are deliberately shared across S3+S4, so
//   requirements are NOT single-owner — exercised as a Direction-2 case below).
{
  const slicesDoc = readJSON(`${GF}/.roadmap/02-slices.json`);
  const acTotal = slicesDoc.coverage.acceptance_total;
  const ownsLists = slicesDoc.slices.map(s => s.acceptance);
  const r = singleOwner(acTotal, ownsLists);
  ok(r.ok, `golden acceptance single-owner expected ok, got ${JSON.stringify(r)}`);
  console.log(`  golden 02-slices: ${acTotal.length} acceptance criteria each owned once → ok=${r.ok}`);
}
// bucketCoverage: covered / deferred / gap partition
{
  const r = bucketCoverage(["C1", "C2", "C3"], ["C1"], ["C2"]);
  ok(JSON.stringify(r) === JSON.stringify({ covered: ["C1"], deferred: ["C2"], gap: ["C3"] }), `bucket ${JSON.stringify(r)}`);
  console.log(`  bucketCoverage → covered=${r.covered} deferred=${r.deferred} gap=${r.gap}`);
}
// membership: dep in build_set → real, else mocked
{
  ok(membership("C1", ["C1", "C2"]) === "real", "C1 in build set → real");
  ok(membership("C9", ["C1", "C2"]) === "mocked", "C9 absent → mocked");
  console.log(`  membership real/mocked verified`);
}
// intersect: demonstrable = flow.traces ∩ verified
{
  const r = intersect(["AC1", "AC2", "AC3"], ["AC2", "AC3", "AC9"]);
  ok(JSON.stringify(r) === JSON.stringify(["AC2", "AC3"]), `intersect ${JSON.stringify(r)}`);
  console.log(`  intersect([AC1,AC2,AC3],[AC2,AC3,AC9]) → ${JSON.stringify(r)}`);
}

// ===========================================================================
// DIRECTION 2 — planted defects: bijection/owner breaks flagged
// ===========================================================================
console.log("\n=== Direction 2: planted defects → flagged ===");
// orphan edge (no CT*) + double (two CT* on one edge)
{
  const edges = ["e1", "e2", "e3"];
  const ctRefs = ["e1", "e1"];  // e1 twice (double), e2 orphan, e3 orphan
  const r = bijection(edges, ctRefs);
  ok(!r.ok, "broken bijection not ok");
  ok(r.doubles.includes("e1"), "double e1 flagged");
  ok(r.orphans.includes("e2") && r.orphans.includes("e3"), "orphans e2,e3 flagged");
  console.log(`  broken bijection → orphans=${JSON.stringify(r.orphans)} doubles=${JSON.stringify(r.doubles)}`);
}
// GOLDEN multi-owner: requirements R9/R10 appear in both S3 and S4 → singleOwner flags them
{
  const slicesDoc = readJSON(`${GF}/.roadmap/02-slices.json`);
  const reqTotal = slicesDoc.coverage.requirements_total;
  const r = singleOwner(reqTotal, slicesDoc.slices.map(s => s.requirements));
  ok(!r.ok && r.multi.includes("R9") && r.multi.includes("R10"), `golden shared R9/R10 must flag multi, got ${JSON.stringify(r.multi)}`);
  console.log(`  golden 02-slices requirements: shared R9/R10 → multi=${JSON.stringify(r.multi)}`);
}
// 2-owner entity: E1 owned by two owners
{
  const r = singleOwner(["E1", "E2"], [["E1", "E2"], ["E1"]]);
  ok(!r.ok && r.multi.includes("E1"), `2-owner E1 must flag, got ${JSON.stringify(r)}`);
  console.log(`  E1 in 2 owner lists → multi=${JSON.stringify(r.multi)}`);
}
// orphan entity: E3 owned by nobody
{
  const r = singleOwner(["E1", "E3"], [["E1"]]);
  ok(!r.ok && r.orphans.includes("E3"), `orphan E3 must flag, got ${JSON.stringify(r)}`);
  console.log(`  E3 owned by nobody → orphans=${JSON.stringify(r.orphans)}`);
}
// gap in bucketCoverage: item in neither set → gap (would be a coverage hole)
{
  const r = bucketCoverage(["C1"], [], []);
  ok(r.gap.includes("C1"), "C1 in neither set → gap");
  console.log(`  uncovered C1 → gap=${JSON.stringify(r.gap)}`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = JSON.stringify(bijection(["e1", "e2"], ["e1"]));
  const b = JSON.stringify(bijection(["e1", "e2"], ["e1"]));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
