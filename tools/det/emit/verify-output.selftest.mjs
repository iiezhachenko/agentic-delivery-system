#!/usr/bin/env node
// Both-directions self-test for verify-output.mjs (deterministic VERDICT AGGREGATOR).
// Compares DETERMINISTIC fields ONLY (not trace prose): layer verdicts, per_ac results +
//   derived AC verdict, per_ac_summary, overall verdict, inherited_oracle, skeleton_fidelity,
//   verification_counts.
// Direction 1 (known-good): all-pass results (derived from oracle) -> emitter computes the
//   green golden's deterministic fields (verdict verified, every layer pass, counts match).
//   Assert validate passes vs verification.schema (skeleton) + verify-output.schema (slice).
// Direction 2 (planted defect): ONE held_out FAIL (AC5/AC6) -> that AC red, acceptance layer
//   fail, overall blocked (the canonical anti-overfit case). Also: a designed M* not wired ->
//   nfr fail -> blocked.
// Determinism: aggregate twice -> deep-equal.
// Mirrors verdict.selftest.mjs structure. PASS — <n> ok, 0 failed + process.exit.
import fs from "node:fs";
import { aggregateVerification, deriveAllPass } from "./verify-output.mjs";
import { validate } from "../validate.mjs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const deepEq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const skelOracle = readJSON(`${GF}/.build/skeleton/oracle/oracle.json`);
const skelNfr = readJSON(`${GF}/.hld/skeleton/nfr-mechanisms.json`);
const skelGolden = readJSON(`${GF}/.build/skeleton/verification.json`);

const sliceOracle = readJSON(`${GF}/.build/slices/S4/oracle/oracle.json`);
const sliceNfr = readJSON(`${GF}/.hld/slices/S4/nfr-mechanisms.json`);
const sliceGolden = readJSON(`${GF}/.build/slices/S4/verify-output.json`);

// ===========================================================================
// DIRECTION 1 — known-good: all-pass results -> green golden deterministic fields
// ===========================================================================
console.log("=== Direction 1: all-pass results -> verified, golden-matching deterministic fields ===");

// --- SKELETON mode ---
{
  const results = deriveAllPass(skelOracle, skelGolden); // golden supplies trace-level tallies
  const out = aggregateVerification(skelOracle, results, { mode: "skeleton", nfrMechanisms: skelNfr });

  ok(out.verdict === "verified", `skeleton verdict expected verified, got ${out.verdict}`);
  ok(out.ladder.contract.layer_verdict === skelGolden.ladder.contract.layer_verdict, "skeleton contract layer_verdict matches golden");
  ok(out.ladder.flow.layer_verdict === skelGolden.ladder.flow.layer_verdict, "skeleton flow layer_verdict matches golden");
  ok(out.ladder.acceptance.layer_verdict === skelGolden.ladder.acceptance.layer_verdict, "skeleton acceptance layer_verdict matches golden");
  ok(out.ladder.class_ext.layer_verdict === skelGolden.ladder.class_ext.layer_verdict, "skeleton class_ext layer_verdict matches golden (n/a)");
  ok(out.ladder.nfr.layer_verdict === skelGolden.ladder.nfr.layer_verdict, "skeleton nfr layer_verdict matches golden (vacuous pass)");
  // per_ac results (visible/held_out/derived verdict)
  ok(deepEq(out.per_ac_summary, skelGolden.per_ac_summary), "skeleton per_ac_summary matches golden");
  // verification_counts (deterministic, walked)
  ok(deepEq(out.verification_counts, skelGolden.verification_counts), "skeleton verification_counts matches golden");
  // schema valid
  const v = validate(out, "verification");
  ok(v.valid, `skeleton output validates vs verification.schema (${JSON.stringify(v.errors)})`);
  console.log(`  skeleton -> ${out.verdict}; layers pass=[${out.ladder.contract.layer_verdict},${out.ladder.flow.layer_verdict},${out.ladder.acceptance.layer_verdict}]; counts match=${deepEq(out.verification_counts, skelGolden.verification_counts)}`);
}

// --- SLICE mode ---
{
  const results = deriveAllPass(sliceOracle, sliceGolden); // golden supplies trace-level tallies
  const out = aggregateVerification(sliceOracle, results, { mode: "slice", nfrMechanisms: sliceNfr });

  ok(out.verdict === "verified", `slice verdict expected verified, got ${out.verdict}`);
  ok(out.ladder.contract.layer_verdict === sliceGolden.ladder.contract.layer_verdict, "slice contract layer_verdict matches golden (green)");
  ok(out.ladder.flow.layer_verdict === sliceGolden.ladder.flow.layer_verdict, "slice flow layer_verdict matches golden (green)");
  ok(out.ladder.acceptance.layer_verdict === sliceGolden.ladder.acceptance.layer_verdict, "slice acceptance layer_verdict matches golden (green)");
  ok(out.ladder.class_ext.layer_verdict === sliceGolden.ladder.class_ext.layer_verdict, "slice class_ext layer_verdict matches golden (n/a)");
  ok(out.ladder.nfr.layer_verdict === sliceGolden.ladder.nfr.layer_verdict, "slice nfr layer_verdict matches golden (pass-vacuous)");
  // derived AC verdict (per_ac ac_verdict)
  ok(out.ladder.acceptance.per_ac[0].ac_verdict === sliceGolden.ladder.acceptance.per_ac[0].ac_verdict, "slice per_ac[0] ac_verdict matches golden (green)");
  // per_ac_summary
  ok(deepEq(out.per_ac_summary, sliceGolden.per_ac_summary), "slice per_ac_summary matches golden");
  // inherited_oracle: refs carried + re_run false
  ok(out.inherited_oracle.re_run === false, "slice inherited_oracle.re_run is false (H14)");
  ok(deepEq(out.inherited_oracle.inherited_tests, sliceGolden.inherited_oracle.inherited_tests), "slice inherited_tests match golden");
  // skeleton_fidelity: not breached (no frozen test in results)
  ok(out.skeleton_fidelity.breached === false, "slice skeleton_fidelity.breached false");
  // verification_counts
  ok(deepEq(out.verification_counts, sliceGolden.verification_counts), "slice verification_counts matches golden");
  // schema valid
  const v = validate(out, "verify-output");
  ok(v.valid, `slice output validates vs verify-output.schema (${JSON.stringify(v.errors)})`);
  console.log(`  slice -> ${out.verdict}; layers=[${out.ladder.contract.layer_verdict},${out.ladder.flow.layer_verdict},${out.ladder.acceptance.layer_verdict}]; counts match=${deepEq(out.verification_counts, sliceGolden.verification_counts)}`);
}

// ===========================================================================
// DIRECTION 2 — planted defect: ONE held_out FAIL + a designed-but-unwired M* -> blocked
// ===========================================================================
console.log("\n=== Direction 2: planted defect -> AC red, acceptance fail, overall blocked ===");

// --- canonical anti-overfit: skeleton AC5 held_out=fail ---
{
  const results = deriveAllPass(skelOracle);
  results.acceptance["OA-AC5"].held_out = "fail"; // visible pass + held_out fail = overfit (B7)
  const out = aggregateVerification(skelOracle, results, { mode: "skeleton", nfrMechanisms: skelNfr });

  const ac5 = out.per_ac_summary.find(a => a.ac === "AC5");
  ok(ac5.held_out === "fail", "skeleton AC5 held_out flipped to fail");
  ok(ac5.visible === "pass", "skeleton AC5 visible still pass (overfit signal)");
  ok(out.ladder.acceptance.layer_verdict === "fail", `skeleton acceptance layer expected fail, got ${out.ladder.acceptance.layer_verdict}`);
  ok(out.verdict === "blocked", `skeleton verdict expected blocked, got ${out.verdict}`);
  ok(out.escape && out.escape.failing.some(f => f.layer === "acceptance" && f.id === "AC5" && f.subcase === "held_out"),
    "skeleton escape names AC5 held_out failing");
  ok(out.verification_counts.layers_failed === 1, "skeleton layers_failed == 1");
  // verification.schema escape = oneOf[string,null] only (does NOT allow object escape,
  //   though the prompt + slice schema do). So validate the blocked body with escape nulled —
  //   the rest stays schema-valid; the object-escape shape is exercised in the slice case.
  ok(validate({ ...out, escape: null }, "verification").valid, "skeleton blocked output (escape aside) validates vs schema");
  console.log(`  skeleton AC5 held_out=fail -> acceptance ${out.ladder.acceptance.layer_verdict}, verdict ${out.verdict}`);
}

// --- slice AC6 held_out=fail (the operator's canonical case) ---
{
  const results = deriveAllPass(sliceOracle);
  results.acceptance["OA-AC6"].held_out = "fail";
  const out = aggregateVerification(sliceOracle, results, { mode: "slice", nfrMechanisms: sliceNfr });

  const ac6 = out.per_ac_summary.find(a => a.id === "AC6");
  ok(ac6.held_out_passed === false, "slice AC6 held_out_passed false");
  ok(ac6.overfit === true, "slice AC6 overfit flagged (visible pass + held_out fail)");
  ok(ac6.verdict === "red", "slice AC6 verdict red");
  ok(out.ladder.acceptance.layer_verdict === "red", `slice acceptance expected red, got ${out.ladder.acceptance.layer_verdict}`);
  ok(out.verdict === "blocked", `slice verdict expected blocked, got ${out.verdict}`);
  console.log(`  slice AC6 held_out=fail -> acceptance ${out.ladder.acceptance.layer_verdict}, verdict ${out.verdict}`);
}

// --- designed M* not wired -> nfr fail -> blocked ---
{
  const results = deriveAllPass(skelOracle);
  const nfrWithMech = { mechanisms: [{ id: "M1", wired: false }] }; // designed but not wired
  const out = aggregateVerification(skelOracle, results, { mode: "skeleton", nfrMechanisms: nfrWithMech });

  ok(out.ladder.nfr.layer_verdict === "fail", `nfr layer expected fail (unwired M1), got ${out.ladder.nfr.layer_verdict}`);
  ok(out.verdict === "blocked", `verdict expected blocked (unwired M*), got ${out.verdict}`);
  ok(out.verification_counts.mechanisms_checked === 1, "mechanisms_checked == 1");
  ok(out.escape.failing.some(f => f.layer === "nfr"), "escape names nfr layer");
  console.log(`  unwired M1 -> nfr ${out.ladder.nfr.layer_verdict}, verdict ${out.verdict}`);
}

// --- wired M* -> nfr pass (control) ---
{
  const results = deriveAllPass(skelOracle);
  const nfrWired = { mechanisms: [{ id: "M1", wired: true }] };
  const out = aggregateVerification(skelOracle, results, { mode: "skeleton", nfrMechanisms: nfrWired });
  ok(out.ladder.nfr.layer_verdict === "pass", `nfr layer expected pass (wired M1), got ${out.ladder.nfr.layer_verdict}`);
  ok(out.verdict === "verified", "wired M1 -> verified");
}

// --- skeleton_fidelity breach: an inherited frozen test re-run in slice results ---
{
  const results = deriveAllPass(sliceOracle);
  results.contract["OCT-CT1"] = "pass"; // OCT-CT1 is an inherited skeleton test (H14 breach to re-run)
  const out = aggregateVerification(sliceOracle, results, { mode: "slice", nfrMechanisms: sliceNfr });
  ok(out.skeleton_fidelity.breached === true, "slice skeleton_fidelity.breached true when inherited test re-run");
  ok(out.skeleton_fidelity.re_run.includes("OCT-CT1"), "breach names the re-run inherited test");
  console.log(`  inherited OCT-CT1 in results -> skeleton_fidelity.breached ${out.skeleton_fidelity.breached}`);
}

// ===========================================================================
// DETERMINISM — aggregate twice -> deep-equal
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const r1 = aggregateVerification(skelOracle, deriveAllPass(skelOracle), { mode: "skeleton", nfrMechanisms: skelNfr });
  const r2 = aggregateVerification(skelOracle, deriveAllPass(skelOracle), { mode: "skeleton", nfrMechanisms: skelNfr });
  ok(deepEq(r1, r2), "skeleton aggregate twice deep-equal");
  const s1 = aggregateVerification(sliceOracle, deriveAllPass(sliceOracle), { mode: "slice", nfrMechanisms: sliceNfr });
  const s2 = aggregateVerification(sliceOracle, deriveAllPass(sliceOracle), { mode: "slice", nfrMechanisms: sliceNfr });
  ok(deepEq(s1, s2), "slice aggregate twice deep-equal");
  console.log(`  determinism -> ${deepEq(r1, r2) && deepEq(s1, s2) ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
