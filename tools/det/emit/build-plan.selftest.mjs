#!/usr/bin/env node
// Both-directions self-test for build-plan.mjs (deterministic BUILD-PLAN emitter).
// Judged on DETERMINISTIC fields only (behavior-over-byte): build_set, build_order,
//   parallel_groups, per-unit consumes_seams/provides_contracts/mocked_deps, mock_map,
//   coverage sets, build_plan_counts. LLM prose (name/slice_name) not asserted.
// Direction 1 (known-good): emitter output's det fields == golden, greenfield skeleton + S4;
//   + validateFile passes against build-plan schema.
// Direction 2 (planted-defect): corrupt build_set membership (flip real→mocked) + drop a
//   build_order entry → comparison FLAGS the mismatch (proves check discriminates good/bad).
// Determinism: emit twice → deep-equal. Mirrors coverage.selftest.mjs structure.
import fs from "node:fs";
import { emitBuildPlan } from "./build-plan.mjs";
import { validateFile } from "../validate.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
const BF = "/workspace/_fixtures/brownfield-feature";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const J = (x) => JSON.stringify(x);

// --- detEqual: compare DETERMINISTIC fields of two build-plans -----------------
// Returns { ok, diffs[] }. Skips LLM prose (name/slice_name). Compares unit-level
//   component/wave/provides_contracts/consumes_seams/mocked_deps/status.
function detEqual(got, gold) {
  const diffs = [];
  const topFields = [
    "class", "mode", "build_set", "build_order", "parallel_groups",
    "later_slice_components", "mock_map", "lock_set", "coverage",
    "structural_defects", "build_plan_counts",
    "skeleton_id", "walking_skeleton_flow",          // skeleton-build
    "slice_id", "slice_flow", "prior_built_components", // slice-build
  ];
  for (const k of topFields) {
    if (!(k in gold)) continue;
    if (J(got[k]) !== J(gold[k])) diffs.push(`${k}: got ${J(got[k])} != gold ${J(gold[k])}`);
  }
  const gu = got.build_units || [], xu = gold.build_units || [];
  if (gu.length !== xu.length) diffs.push(`build_units length ${gu.length} != ${xu.length}`);
  for (let i = 0; i < xu.length; i++) {
    for (const f of ["component", "wave", "provides_contracts", "consumes_seams", "mocked_deps", "status"]) {
      if (J(gu[i]?.[f]) !== J(xu[i][f])) diffs.push(`unit[${i}].${f}: got ${J(gu[i]?.[f])} != gold ${J(xu[i][f])}`);
    }
  }
  return { ok: diffs.length === 0, diffs };
}

// ===========================================================================
// DIRECTION 1 — known-good: emitter det fields == golden
// ===========================================================================
console.log("=== Direction 1: emitter == golden (deterministic fields) ===");
const cases = [
  { label: "greenfield skeleton", root: GF, opts: { mode: "skeleton-build" }, gold: `${GF}/.build/skeleton/build-plan.json` },
  { label: "greenfield S4 slice", root: GF, opts: { mode: "slice-build", sliceId: "S4" }, gold: `${GF}/.build/slices/S4/build-plan.json` },
  { label: "brownfield-feature skeleton", root: BF, opts: { mode: "skeleton-build" }, gold: `${BF}/.build/skeleton/build-plan.json` },
  { label: "brownfield-feature S4 slice", root: BF, opts: { mode: "slice-build", sliceId: "S4" }, gold: `${BF}/.build/slices/S4/build-plan.json` },
];
for (const c of cases) {
  const got = emitBuildPlan(c.root, c.opts);
  const gold = readJSON(c.gold);
  const r = detEqual(got, gold);
  ok(r.ok, `${c.label} det-fields mismatch: ${r.diffs.join(" | ")}`);
  console.log(`  ${c.label} → ${r.ok ? "match" : "DIFF(" + r.diffs.length + ")"}`);
}

// schema-valid: write emitter output, validateFile against registry id 'build-plan'
{
  const tmpA = "/tmp/bp-selftest-skel.json", tmpB = "/tmp/bp-selftest-s4.json";
  fs.writeFileSync(tmpA, JSON.stringify(emitBuildPlan(GF, { mode: "skeleton-build" }), null, 2));
  fs.writeFileSync(tmpB, JSON.stringify(emitBuildPlan(GF, { mode: "slice-build", sliceId: "S4" }), null, 2));
  const va = validateFile(tmpA, "build-plan"), vb = validateFile(tmpB, "build-plan");
  ok(va.valid, `skeleton output schema-invalid: ${J(va.errors)}`);
  ok(vb.valid, `S4 output schema-invalid: ${J(vb.errors)}`);
  console.log(`  schema validate skeleton=${va.valid} S4=${vb.valid}`);
}

// dispatch: disk-state mode dispatch (no override). greenfield has skeleton plan present →
//   slice-build; only S4 has increment artifacts AND it is already planned on disk → STOP (null).
{
  const out = emitBuildPlan(GF);
  ok(out === null, `disk dispatch: skeleton present + only-ready S4 already planned → STOP (null), got ${J(out && out.mode)}`);
  console.log(`  disk-state dispatch (skeleton present, S4 already planned) → STOP=${out === null}`);
}

// ===========================================================================
// DIRECTION 2 — planted defects → comparison FLAGS them
// ===========================================================================
console.log("\n=== Direction 2: planted defects → flagged ===");
// defect A: corrupt build_set membership → flips a real seam to mocked (C2 dropped from skeleton set)
{
  const gold = readJSON(`${GF}/.build/skeleton/build-plan.json`);
  const corrupt = JSON.parse(JSON.stringify(emitBuildPlan(GF, { mode: "skeleton-build" })));
  // drop C2 from build_set membership → C6's CT8 seam (dep C2) reclassifies real→mocked
  const c6 = corrupt.build_units.find((u) => u.component === "C6");
  const seam = c6.consumes_seams.find((s) => s.dep === "C2");
  seam.status = "mocked";
  c6.mocked_deps = ["C2", ...c6.mocked_deps];
  const r = detEqual(corrupt, gold);
  ok(!r.ok, "flipped C2 real→mocked must flag");
  ok(r.diffs.some((d) => d.includes("consumes_seams")), `seam-status flip must surface in diff, got ${J(r.diffs)}`);
  console.log(`  flip C6→C2 real→mocked → flagged (${r.diffs.length} diffs)`);
}
// defect B: drop a build_order entry → comparison flags build_order + build_units length
{
  const gold = readJSON(`${GF}/.build/skeleton/build-plan.json`);
  const corrupt = JSON.parse(JSON.stringify(emitBuildPlan(GF, { mode: "skeleton-build" })));
  corrupt.build_order = corrupt.build_order.filter((c) => c !== "C2");
  corrupt.build_units = corrupt.build_units.filter((u) => u.component !== "C2");
  const r = detEqual(corrupt, gold);
  ok(!r.ok && r.diffs.some((d) => d.startsWith("build_order")), `dropped build_order entry must flag, got ${J(r.diffs)}`);
  console.log(`  drop C2 from build_order → flagged (${r.diffs.length} diffs)`);
}
// defect C: corrupt INPUT — feed slice-build a build_set that mislabels a later-slice dep as real
//   simulated by mutating coverage counts → counts mismatch surfaces
{
  const gold = readJSON(`${GF}/.build/slices/S4/build-plan.json`);
  const corrupt = JSON.parse(JSON.stringify(emitBuildPlan(GF, { mode: "slice-build", sliceId: "S4" })));
  corrupt.build_plan_counts.real_seams = 99;  // wrong count
  const r = detEqual(corrupt, gold);
  ok(!r.ok && r.diffs.some((d) => d.startsWith("build_plan_counts")), `bad count must flag, got ${J(r.diffs)}`);
  console.log(`  corrupt build_plan_counts.real_seams → flagged`);
}
// sanity: detEqual on identical objects → ok (no false positive)
{
  const got = emitBuildPlan(GF, { mode: "slice-build", sliceId: "S4" });
  const r = detEqual(got, got);
  ok(r.ok, "identical → no false positive");
  console.log(`  identical compare → ok=${r.ok}`);
}

// ===========================================================================
// DETERMINISM — emit twice → deep-equal (byte-identical serialization)
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = J(emitBuildPlan(GF, { mode: "skeleton-build" }));
  const b = J(emitBuildPlan(GF, { mode: "skeleton-build" }));
  ok(a === b, "skeleton determinism: two runs differ");
  const c = J(emitBuildPlan(GF, { mode: "slice-build", sliceId: "S4" }));
  const d = J(emitBuildPlan(GF, { mode: "slice-build", sliceId: "S4" }));
  ok(c === d, "slice determinism: two runs differ");
  console.log(`  determinism skeleton=${a === b ? "stable" : "DRIFT"} slice=${c === d ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
