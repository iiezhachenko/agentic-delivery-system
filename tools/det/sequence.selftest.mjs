#!/usr/bin/env node
// Both-directions self-test for sequence.mjs (topo-sort + priority; RE-RANK anti-thrash).
// Direction 1 (GOLDEN): feed greenfield 02-slices.json + skeleton S1; assert emitted order
//   == golden 05-sequence.json order [S1,S4,S2,S3] + cost_proxy + dependency_check.
// Direction 2: plant a dep CYCLE → dependency_defect; dangling dep → flagged; skeleton-with-deps
//   → skeleton_is_root false. RE-RANK: synthetic priority tiebreak + anti-thrash unchanged.
// Determinism: same input → byte-identical twice. Mirrors validate.selftest.mjs structure.
import fs from "node:fs";
import { sequence, rerank, costProxy, hasMaterialChange } from "./sequence.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const clone = (o) => JSON.parse(JSON.stringify(o));

const slices = readJSON(`${GF}/.roadmap/02-slices.json`).slices;

// ===========================================================================
// DIRECTION 1 (GOLDEN) — emitted order == golden 05-sequence
// ===========================================================================
console.log("=== Direction 1: golden 05-sequence order ===");
{
  const golden = readJSON(`${GF}/.roadmap/05-sequence.json`);
  const res = sequence(slices, { skeletonId: "S1" });
  ok(res.verdict === "sequenced", `verdict expected sequenced, got ${res.verdict}`);
  const gotOrder = res.sequence.map(r => r.id);
  const goldOrder = golden.sequence.map(r => r.id);
  ok(JSON.stringify(gotOrder) === JSON.stringify(goldOrder), `order ${JSON.stringify(gotOrder)} != golden ${JSON.stringify(goldOrder)}`);
  console.log(`  order ${JSON.stringify(gotOrder)} == golden`);
  // cost_proxy + skeleton flag + position match golden per row
  for (const g of golden.sequence) {
    const r = res.sequence.find(x => x.id === g.id);
    ok(r.position === g.position, `${g.id} position ${r.position} != golden ${g.position}`);
    ok(r.cost_proxy === g.cost_proxy, `${g.id} cost_proxy ${r.cost_proxy} != golden ${g.cost_proxy}`);
    ok(r.skeleton === g.skeleton, `${g.id} skeleton ${r.skeleton} != golden ${g.skeleton}`);
  }
  ok(res.dependency_check.acyclic === true && res.dependency_check.skeleton_is_root === true,
     "dependency_check acyclic+skeleton_is_root true");
  ok(res.coverage.missing.length === 0 && res.coverage.duplicated.length === 0, "full coverage, no missing/dup");
  console.log(`  per-row position/cost_proxy/skeleton match golden; coverage complete`);
}

// ===========================================================================
// DIRECTION 2 — planted defects: cycle / dangling / skeleton-with-deps
// ===========================================================================
console.log("\n=== Direction 2: planted slicing defects → flagged ===");
// cycle: make S1 depend on S2 (S2 deps S1) → cycle
{
  const bad = clone(slices);
  bad.find(s => s.id === "S1").depends_on = ["S2"];
  const res = sequence(bad, { skeletonId: "S1" });
  ok(res.verdict === "dependency_defect", `cycle expected dependency_defect, got ${res.verdict}`);
  ok(res.dependency_check.acyclic === false && res.dependency_check.cycles.length > 0, "cycle recorded");
  ok(res.sequence.length === 0, "dependency_defect emits empty sequence");
  console.log(`  cycle S1→S2→…→S1 → ${res.verdict}, cycle ${JSON.stringify(res.dependency_check.cycles[0])}`);
}
// dangling: S2 depends on a non-existent S9
{
  const bad = clone(slices);
  bad.find(s => s.id === "S2").depends_on = ["S1", "S9"];
  const res = sequence(bad, { skeletonId: "S1" });
  ok(res.verdict === "dependency_defect", `dangling expected dependency_defect, got ${res.verdict}`);
  ok(res.dependency_check.dangling_depends_on.includes("S9"), "dangling S9 flagged");
  console.log(`  dangling S2→S9 → ${res.verdict}, dangling ${JSON.stringify(res.dependency_check.dangling_depends_on)}`);
}
// skeleton-with-deps: S1 (skeleton) carries a depends_on → skeleton_is_root false
{
  const bad = clone(slices);
  bad.find(s => s.id === "S1").depends_on = ["S4"];
  const res = sequence(bad, { skeletonId: "S1" });
  ok(res.verdict === "dependency_defect", `skeleton-with-deps expected dependency_defect, got ${res.verdict}`);
  ok(res.dependency_check.skeleton_is_root === false, "skeleton_is_root false flagged");
  console.log(`  skeleton S1 carries deps → ${res.verdict}, skeleton_is_root=${res.dependency_check.skeleton_is_root}`);
}

// ===========================================================================
// PRIORITY COMPARATOR — synthetic frontier tie-break (value > risk > cost > index)
// ===========================================================================
console.log("\n=== Priority comparator (synthetic frontier) ===");
{
  // all depend only on skeleton S0 → all in frontier together; order by priority.
  const syn = [
    { id: "S0", name: "skel", value: "high", retires_risk: null, depends_on: [], requirements: [], acceptance: [] },
    { id: "S1", name: "low-val", value: "low", retires_risk: null, depends_on: ["S0"], requirements: ["R"], acceptance: [] },
    { id: "S2", name: "high-norisk-cheap", value: "high", retires_risk: null, depends_on: ["S0"], requirements: ["R"], acceptance: [] },
    { id: "S3", name: "high-risk", value: "high", retires_risk: "A1", depends_on: ["S0"], requirements: ["R","R2"], acceptance: ["AC"] },
  ];
  const res = sequence(syn, { skeletonId: "S0" });
  // expect S0 pinned, then S3 (high+risk) > S2 (high, no risk) > S1 (low)
  ok(JSON.stringify(res.sequence.map(r => r.id)) === JSON.stringify(["S0", "S3", "S2", "S1"]),
     `priority order got ${JSON.stringify(res.sequence.map(r => r.id))}`);
  console.log(`  value→risk→cost→index order → ${JSON.stringify(res.sequence.map(r => r.id))}`);
  ok(costProxy(syn[3]) === 3, `costProxy S3 expected 3, got ${costProxy(syn[3])}`);
}

// ===========================================================================
// RE-RANK — anti-thrash gate: no material change → unchanged
// ===========================================================================
console.log("\n=== RE-RANK anti-thrash gate ===");
{
  // prev + current are comparable slice-body lists (id+value+risk+depends_on); rerank
  // gates on material change between them (RE-RANK anti-thrash).
  const same = slices.map(s => ({ id: s.id, value: s.value, retires_risk: s.retires_risk, depends_on: s.depends_on }));
  const prev = same.map(s => ({ ...s }));
  ok(hasMaterialChange(same, same) === false, "identical → no material change");
  const r1 = rerank(prev, same, { skeletonId: "S1" });
  ok(r1.verdict === "unchanged", `no material change → expected unchanged, got ${r1.verdict}`);
  console.log(`  identical input → ${r1.verdict} (anti-thrash holds)`);
  // material change: remove a dep on S3 → re_ranked
  const changed = clone(same);
  changed.find(s => s.id === "S3").depends_on = ["S1", "S4"];  // removed S2
  ok(hasMaterialChange(same, changed) === true, "removed dep → material change");
  const r2 = rerank(prev, changed, { skeletonId: "S1" });
  ok(r2.verdict === "re_ranked", `material change → expected re_ranked, got ${r2.verdict}`);
  console.log(`  removed S3→S2 dep → ${r2.verdict} (material change licenses move)`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = JSON.stringify(sequence(slices, { skeletonId: "S1" }));
  const b = JSON.stringify(sequence(slices, { skeletonId: "S1" }));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
