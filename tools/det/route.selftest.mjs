#!/usr/bin/env node
// Both-directions self-test for route.mjs (TRIAGE 2-axis + DIAGNOSE 4-gate).
// Direction 1: golden greenfield .adr/02-triage.json — recompute route from (blast_radius,
//   cut_status), assert == golden route for every DP row. DIAGNOSE: known signals → expected verdict.
// Direction 2: planted defect — flip cut_status / inject flaky / break stall → route flips.
// Determinism: same input → byte-identical twice. Mirrors validate.selftest.mjs structure.
import fs from "node:fs";
import { triageRoute, cutStatus, diagnoseRoute, K } from "./route.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// ===========================================================================
// DIRECTION 1 (GOLDEN) — recompute TRIAGE route, assert == golden every DP
// ===========================================================================
console.log("=== Direction 1: golden 02-triage route recompute ===");
{
  const triage = readJSON(`${GF}/.adr/02-triage.json`);
  for (const row of triage.triage) {
    const got = triageRoute({ blast_radius: row.blast_radius, cut_status: row.cut_status });
    ok(got === row.route, `${row.id}: recomputed ${got} != golden ${row.route}`);
  }
  console.log(`  recomputed route for ${triage.triage.length} DPs, all match golden`);
}
// cut_status lookup from foundation-cut golden: FD needed_by ∋ skeleton → in-cut
{
  const cut = readJSON(`${GF}/.roadmap/06-foundation-cut.json`);
  const skel = readJSON(`${GF}/.adr/02-triage.json`).skeleton_id;  // "S1"
  const fd1 = cut.foundation_cut.foundational_decisions.find(f => f.id === "FD1");
  ok(cutStatus(fd1, skel) === "in-cut", `FD1 needed_by ${JSON.stringify(fd1.needed_by)} vs ${skel} → expected in-cut`);
  console.log(`  cutStatus(FD1, ${skel}) → ${cutStatus(fd1, skel)}`);
}
// DIAGNOSE known-good: genuine stalled routable contract defect → escape Phase 3
{
  const r = diagnoseRoute({ flaky: false, signature_changed: false, pass_count_rose: false, misread: false,
    same_signature_attempts: 3, net_new_passes: 0, classification: "contract", routable: true });
  ok(r.verdict === "escape" && r.target_phase === "Phase 3", `contract stall → expected escape/Phase 3, got ${JSON.stringify(r)}`);
  console.log(`  diagnose(contract,stall,routable) → ${r.verdict}/${r.target_phase}`);
}
// DIAGNOSE: misread → self-heal (gate 3)
{
  const r = diagnoseRoute({ misread: true, classification: "contract" });
  ok(r.verdict === "self-heal" && r.gates_to_verdict === 3, `misread → expected self-heal@gate3, got ${JSON.stringify(r)}`);
  console.log(`  diagnose(misread) → ${r.verdict} gate ${r.gates_to_verdict}`);
}
// DIAGNOSE: progressing (pass-count rose) → self-heal (gate 2)
{
  const r = diagnoseRoute({ pass_count_rose: true });
  ok(r.verdict === "self-heal" && r.gates_to_verdict === 2, `progressing → expected self-heal@gate2, got ${JSON.stringify(r)}`);
}
// DIAGNOSE: each classification routes to its phase (pure map)
{
  const want = { contract: "Phase 3", decision: "Phase 2", WHAT: "Phase 0", "missing-foundation": "Phase 1" };
  for (const [cls, phase] of Object.entries(want)) {
    const r = diagnoseRoute({ same_signature_attempts: 3, net_new_passes: 0, classification: cls, routable: true });
    ok(r.target_phase === phase, `${cls} → expected ${phase}, got ${r.target_phase}`);
  }
  console.log(`  classification→phase map verified (4)`);
}

// ===========================================================================
// DIRECTION 2 — planted defects: route MUST flip / catch
// ===========================================================================
console.log("\n=== Direction 2: planted defects → route flips/caught ===");
// flip cut_status in-cut → not-yet: resolution_queue → slice_deferred
{
  const before = triageRoute({ blast_radius: "foundational", cut_status: "in-cut" });
  const after = triageRoute({ blast_radius: "foundational", cut_status: "not-yet" });
  ok(before === "resolution_queue" && after === "slice_deferred" && before !== after,
     `cut_status flip: ${before} -> ${after}`);
  console.log(`  cut_status in-cut→not-yet: ${before} → ${after}`);
}
// foundational point missing cut_status → throw (axis-2 required)
{
  let threw = false;
  try { triageRoute({ blast_radius: "foundational", cut_status: null }); } catch { threw = true; }
  ok(threw, "foundational + null cut_status throws");
}
// unknown blast_radius → throw
{
  let threw = false;
  try { triageRoute({ blast_radius: "critical" }); } catch { threw = true; }
  ok(threw, "unknown blast_radius throws");
}
// DIAGNOSE: inject flaky → must flip to flaky-quarantine even with stall signals
{
  const r = diagnoseRoute({ flaky: true, same_signature_attempts: 3, net_new_passes: 0, classification: "contract", routable: true });
  ok(r.verdict === "flaky-quarantine", `flaky must short-circuit to quarantine, got ${r.verdict}`);
  console.log(`  flaky injected → ${r.verdict} (caught, no escape)`);
}
// DIAGNOSE: break stall (attempts < K) → escape downgrades to self-heal
{
  const r = diagnoseRoute({ same_signature_attempts: K - 1, net_new_passes: 0, classification: "contract", routable: true });
  ok(r.verdict === "self-heal", `attempts<${K} must downgrade escape→self-heal, got ${r.verdict}`);
  console.log(`  stall broken (attempts=${K - 1}) → ${r.verdict} (no false escape)`);
}
// DIAGNOSE: non-routable escape → downgrade to self-heal (builder bug)
{
  const r = diagnoseRoute({ same_signature_attempts: 3, net_new_passes: 0, classification: "contract", routable: false });
  ok(r.verdict === "self-heal", `non-routable must downgrade, got ${r.verdict}`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const sig = { same_signature_attempts: 3, net_new_passes: 0, classification: "decision", routable: true };
  const a = JSON.stringify(diagnoseRoute(sig));
  const b = JSON.stringify(diagnoseRoute(sig));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
