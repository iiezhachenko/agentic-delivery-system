#!/usr/bin/env node
// Tier-1 emitter: deterministic VERDICT AGGREGATOR for VERIFY-OUTPUT (ADR-0026/D26).
// Sibling of verdict.mjs (verdict = f(results)), richer: per-AC AND-rollup + 5-layer rollup.
//
// SCOPE (operator decision): VERIFY-OUTPUT "re-run ladder -> pass/fail" needs runtime/LLM
//   judgment = NOT deterministic. So this emitter does NOT run pytest + does NOT author trace
//   prose. It owns the PURE aggregation: given (a) oracle ladder INVENTORY + (b) per-test
//   RESULTS map (pass/fail per test id), compute the verdict structure.
// LLM island = per-test pass/fail inputs + trace narration. Code island = this aggregation.
//
// Aggregation rules (encode VERIFY-OUTPUT overall-verdict + 5-layer ladder):
//   contract layer = all contract_tests pass (n/a if [])
//   flow layer     = all flow_tests pass (n/a if [])
//   acceptance     = per AC: visible AND held_out; layer = all AC verdicts pass (n/a if [])
//   class_ext      = all class_ext entries pass (n/a if [] -> not materialized)
//   nfr            = all M* wired (vacuous pass if mechanisms == [])
//   overall verdict = every APPLICABLE layer pass AND every M* wired -> "verified" else "blocked"
// Slice mode adds: inherited_oracle (carry refs, re_run:false), skeleton_fidelity
//   (breached:false when no frozen/skeleton test appears in results set).
//
// Zero deps, ESM, deterministic, pure-fns + thin CLI. Mirrors verdict.mjs / validate.mjs idiom.
// Usage: node verify-output.mjs <fixtureDir> [skeleton|slice <sliceId>]  -> prints JSON.
import fs from "node:fs";
import path from "node:path";
import { intersect } from "../coverage.mjs";

// --- LAYER VOCAB per mode -------------------------------------------------------
// skeleton golden uses pass|fail; slice golden uses green|red. n/a shared.
// nfr vacuous: skeleton "pass", slice "pass-vacuous" (golden-faithful).
const VOCAB = {
  skeleton: { pass: "pass",  fail: "fail",  nfrVacuous: "pass" },
  slice:    { pass: "green", fail: "red",   nfrVacuous: "pass-vacuous" },
};

// --- resultOf: normalize a result entry -> "pass"|"fail" --------------------------
// entry = "pass" string OR { result:"pass", ... } object (carries assertion tally). Missing
//   or anything not "pass" = fail (a result owed but absent = not green).
function resultOf(entry) {
  const r = entry && typeof entry === "object" ? entry.result : entry;
  return r === "pass" ? "pass" : "fail";
}

// --- allPass: every id in ids maps to a "pass" result -----------------------------
function allPass(ids, resultMap) {
  return ids.every(id => resultOf(resultMap[id]) === "pass");
}

// --- layerVerdict: empty inventory -> n/a; else pass|fail per allPass -------------
function layerVerdict(ids, resultMap, V) {
  if (ids.length === 0) return "n/a";
  return allPass(ids, resultMap) ? V.pass : V.fail;
}

// --- acVerdict: per-AC = visible AND held_out (B7 anti-overfit AND-rollup) ---------
// returns "pass"|"green" when both pass else "fail"|"red".
function acVerdict(acResult, V) {
  const v = acResult && acResult.visible === "pass";
  const h = acResult && acResult.held_out === "pass";
  return v && h ? V.pass : V.fail;
}

// --- aggregateVerification: the CORE pure fn ------------------------------------
// oracleManifest = parsed oracle.json (ladder inventory per layer + inherited_oracle).
// resultsMap = per-test results: { contract:{<OCT-id>:"pass"}, flow:{<OF-id>:"pass"},
//   acceptance:{<OA-id>:{visible,held_out}}, class_ext:{<id>:"pass"} }.
// opts: { mode:"skeleton"|"slice", nfrMechanisms, inherited }.
// Returns the verificationObject (deterministic fields; trace prose NOT authored here).
export function aggregateVerification(oracleManifest, resultsMap, opts = {}) {
  const mode = opts.mode === "slice" ? "slice" : "skeleton";
  const V = VOCAB[mode];
  const r = resultsMap || {};
  const rc = r.contract || {};
  const rf = r.flow || {};
  const ra = r.acceptance || {};
  const rx = r.class_ext || {};

  const contractTests = oracleManifest.contract_tests || [];
  const flowTests = oracleManifest.flow_tests || [];
  const acTests = oracleManifest.acceptance_tests || [];
  const classExt = oracleManifest.class_ext || [];
  const mechanisms = (opts.nfrMechanisms && opts.nfrMechanisms.mechanisms) || [];

  // --- layer verdicts ---
  const contractIds = contractTests.map(t => t.id);
  const flowIds = flowTests.map(t => t.id);
  const classExtIds = classExt.map(t => t.id);

  const contractV = layerVerdict(contractIds, rc, V);
  const flowV = layerVerdict(flowIds, rf, V);
  const classExtV = layerVerdict(classExtIds, rx, V);

  // acceptance: per-AC AND-rollup -> layer = all AC verdicts pass.
  // res.visible/held_out are pass|fail. Optional res.visible_count/held_out_count carry the
  //   sub-test pass tally (LLM island detail: an AC may split into N visible sub-tests) — used
  //   only for verification_counts; default 1 (one visible + one held_out test per AC).
  const perAc = acTests.map(t => {
    const res = ra[t.id] || {};
    const vis = res.visible === "pass" ? "pass" : (res.visible || "fail");
    const ho = res.held_out === "pass" ? "pass" : (res.held_out || "fail");
    return {
      oracle_id: t.id,
      ac: t.target,
      req_ref: t.req_ref,
      visible: vis,
      held_out: ho,
      // sub-test pass tallies (drive counts): explicit count, else 1 when that side passed
      visible_count: typeof res.visible_count === "number" ? res.visible_count : (vis === "pass" ? 1 : 0),
      held_out_count: typeof res.held_out_count === "number" ? res.held_out_count : (ho === "pass" ? 1 : 0),
      verdict: acVerdict(res, V),
    };
  });
  const acceptanceV = acTests.length === 0
    ? "n/a"
    : (perAc.every(a => a.verdict === V.pass) ? V.pass : V.fail);

  // --- nfr: every M* wired; vacuous pass when mechanisms == [] ---
  const nfrFail = mechanisms.some(m => !m.wired);
  const nfrV = mechanisms.length === 0 ? V.nfrVacuous : (nfrFail ? V.fail : V.pass);

  // --- applicable layers + pass/fail rollup (walk, don't estimate) ---
  // applicable = layers not "n/a"; class_ext n/a (greenfield) drops out.
  const layers = [
    { name: "contract", v: contractV },
    { name: "flow", v: flowV },
    { name: "acceptance", v: acceptanceV },
    { name: "class_ext", v: classExtV },
    { name: "nfr", v: nfrV },
  ];
  // applicable = layers whose verdict is a real pass/fail: drop "n/a" (unmaterialized) AND
  //   "pass-vacuous" (slice nfr w/ no M*). Skeleton labels vacuous nfr "pass" -> counts as
  //   applicable; slice labels it "pass-vacuous" -> excluded. Faithful to both goldens.
  const applicable = layers.filter(l => l.v !== "n/a" && l.v !== "pass-vacuous");
  const failed = applicable.filter(l => l.v === V.fail);

  // --- overall verdict: every applicable layer pass AND every M* wired ---
  const verdict = failed.length === 0 ? "verified" : "blocked";

  // --- counts (walked) ---
  const contractAssertions = contractTests.reduce(
    (n, t) => n + 1 + (t.failure_tests ? t.failure_tests.length : 0), 0);
  const flowAssertions = flowTests.reduce((n, t) => {
    // happy + failure assertion tally is trace-level detail (LLM island), NOT in oracle
    // inventory. Carried via results: rf[id] either "pass" (-> default 2: happy+failure) or
    // { result, assertions:<N> } supplying the real per-assertion count.
    const fr = rf[t.id];
    if (fr && typeof fr === "object" && typeof fr.assertions === "number") return n + fr.assertions;
    return n + 2;
  }, 0);
  // sub-test pass tallies (slice AC6 = 3 visible + 3 held_out sub-tests); skeleton = 1 each.
  const visiblePassed = perAc.reduce((n, a) => n + a.visible_count, 0);
  const heldOutPassed = perAc.reduce((n, a) => n + a.held_out_count, 0);

  // slice carries inherited_tests_not_run between mechanisms_checked + layers_* (golden order).
  const isSlice = mode === "slice";
  const inheritedCount = isSlice ? ((oracleManifest.inherited_oracle || {}).inherited_tests || []).length : 0;
  const counts = {
    contract_tests: contractTests.length,
    contract_assertions: contractAssertions,
    flow_assertions: flowAssertions,
    acceptance_acs: acTests.length,
    acceptance_visible_passed: visiblePassed,
    acceptance_held_out_passed: heldOutPassed,
    class_ext_layers: classExtIds.length,
    mechanisms_checked: mechanisms.length,
    ...(isSlice ? { inherited_tests_not_run: inheritedCount } : {}),
    layers_applicable: applicable.length,
    layers_passed: applicable.length - failed.length,
    layers_failed: failed.length,
  };

  // --- assemble verification object (mode-specific shape; deterministic fields) ---
  // contract/flow tests[] = id-keyed rows (schema-required arrays); trace prose left to LLM.
  const resultStr = (id, map) => resultOf(map[id]) === "pass" ? V.pass : V.fail;
  const ladder = {
    contract: {
      layer_verdict: contractV,
      tests: contractTests.map(t => ({ id: t.id, target: t.target, result: resultStr(t.id, rc) })),
    },
    flow: {
      layer_verdict: flowV,
      tests: flowTests.map(t => ({ id: t.id, target: t.target, result: resultStr(t.id, rf) })),
    },
    acceptance: { layer_verdict: acceptanceV, per_ac: assemblePerAc(perAc, mode) },
    class_ext: { layer_verdict: classExtV },
    nfr: { layer_verdict: nfrV },
  };

  const out = {
    class: oracleManifest.class || "greenfield",
    mode: mode === "slice" ? "slice-build" : "skeleton-build",
    verification_method: "static-trace",
    ladder,
    per_ac_summary: assemblePerAcSummary(perAc, mode),
    verdict,
    escape: verdict === "verified" ? null : assembleEscape(perAc, layers, V),
    verification_counts: counts,
  };

  if (mode === "skeleton") {
    out.slice = oracleManifest.skeleton_id;
  } else {
    out.slice_id = oracleManifest.slice_id;
    out.slice_name = oracleManifest.slice_name;
    out.flow = oracleManifest.slice_flow;
    out.inherited_oracle = assembleInherited(oracleManifest, opts.inherited);
    out.skeleton_fidelity = assembleFidelity(oracleManifest, resultsMap);
  }

  return out;
}

// --- assemblePerAc: per-mode per_ac row shape (golden-faithful) ------------------
function assemblePerAc(perAc, mode) {
  if (mode === "skeleton") {
    return perAc.map(a => ({
      ac: a.ac, req_ref: a.req_ref,
      visible: { result: a.visible },
      held_out: { result: a.held_out },
    }));
  }
  return perAc.map(a => ({
    id: a.oracle_id, target: a.ac, req_ref: a.req_ref,
    visible: { result: a.visible },
    held_out: { result: a.held_out },
    ac_verdict: a.verdict,
  }));
}

// --- assemblePerAcSummary: the flattened §8 per-AC report ------------------------
function assemblePerAcSummary(perAc, mode) {
  if (mode === "skeleton") {
    return perAc.map(a => ({ ac: a.ac, visible: a.visible, held_out: a.held_out }));
  }
  return perAc.map(a => ({
    id: a.ac,
    oracle_test_id: a.oracle_id,
    req_ref: a.req_ref,
    visible_passed: a.visible === "pass",
    held_out_passed: a.held_out === "pass",
    overfit: a.visible === "pass" && a.held_out !== "pass",
    verdict: a.verdict,
  }));
}

// --- assembleInherited: carry frozen-skeleton refs, re_run:false (H14) -----------
function assembleInherited(oracleManifest, inheritedOpt) {
  const io = oracleManifest.inherited_oracle || inheritedOpt || {};
  return {
    skeleton_oracle_ref: io.oracle_json_ref || ".build/skeleton/oracle/oracle.json",
    skeleton_oracle_lock_ref: io.oracle_lock_ref || ".build/skeleton/oracle/oracle.lock",
    inherited_tests: io.inherited_tests || [],
    frozen_verified: io.frozen_verified !== false,
    re_run: false,
  };
}

// --- assembleFidelity: breached iff a frozen/skeleton test appears in results set --
// inherited tests must NOT be re-run; their presence in the slice results = a breach (H14).
function assembleFidelity(oracleManifest, resultsMap) {
  const io = oracleManifest.inherited_oracle || {};
  const inherited = io.inherited_tests || [];
  const r = resultsMap || {};
  const ranIds = [
    ...Object.keys(r.contract || {}),
    ...Object.keys(r.flow || {}),
    ...Object.keys(r.acceptance || {}),
    ...Object.keys(r.class_ext || {}),
  ];
  const reRun = intersect(inherited, ranIds);
  return { breached: reRun.length > 0, inherited_tests: inherited, re_run: reRun };
}

// --- assembleEscape: blocked -> failing[] from red layers/ACs (FLAG, no fix) ------
function assembleEscape(perAc, layers, V) {
  const failing = [];
  for (const l of layers) {
    if (l.v !== V.fail) continue;
    if (l.name === "acceptance") {
      for (const a of perAc) {
        if (a.verdict !== V.fail) continue;
        const subcase = a.held_out !== "pass" ? "held_out" : "visible";
        failing.push({ layer: "acceptance", id: a.ac, subcase });
      }
    } else {
      failing.push({ layer: l.name });
    }
  }
  return { failing, classification: "my-code", route: "self-heal → DIAGNOSE" };
}

// --- deriveAllPass: build an all-pass results map from oracle inventory -----------
// Direction-1 helper: every contract/flow/AC/class_ext test -> "pass". Used by selftest
// + CLI to reproduce the green golden (the known-good ladder = every result green).
// Optional `golden` (a prior verification.json) supplies the trace-level tallies the oracle
//   inventory lacks: flow per-assertion count + AC visible/held_out sub-test count. Those are
//   LLM-island detail; pulling them from the golden's own ladder = the legit known-good input
//   (operator: "derive all-pass from the golden's own ladder").
export function deriveAllPass(oracleManifest, golden) {
  const r = { contract: {}, flow: {}, acceptance: {}, class_ext: {} };
  for (const t of oracleManifest.contract_tests || []) r.contract[t.id] = "pass";
  for (const t of oracleManifest.flow_tests || []) {
    const a = golden && flowAssertionCount(golden, t.id);
    r.flow[t.id] = a ? { result: "pass", assertions: a } : "pass";
  }
  for (const t of oracleManifest.acceptance_tests || []) {
    const c = golden && acSubtestCounts(golden, t.id, t.target);
    r.acceptance[t.id] = c
      ? { visible: "pass", held_out: "pass", visible_count: c.visible, held_out_count: c.held_out }
      : { visible: "pass", held_out: "pass" };
  }
  for (const t of oracleManifest.class_ext || []) r.class_ext[t.id] = "pass";
  return r;
}

// --- flowAssertionCount: sum happy+failure assertion rows for a flow in the golden ----
function flowAssertionCount(golden, flowId) {
  const tests = golden.ladder && golden.ladder.flow && golden.ladder.flow.tests;
  if (!Array.isArray(tests)) return 0;
  const t = tests.find(x => x.id === flowId);
  if (!t) return 0;
  const h = (t.happy && t.happy.assertions && t.happy.assertions.length) || (t.happy ? 1 : 0);
  const f = (t.failure && t.failure.assertions && t.failure.assertions.length) || (t.failure ? 1 : 0);
  return h + f;
}

// --- acSubtestCounts: visible/held_out sub-test pass tally for an AC in the golden ----
function acSubtestCounts(golden, acOracleId, acTarget) {
  const perAc = golden.ladder && golden.ladder.acceptance && golden.ladder.acceptance.per_ac;
  if (!Array.isArray(perAc)) return null;
  const a = perAc.find(x => x.id === acOracleId || x.ac === acTarget || x.target === acTarget);
  if (!a) return null;
  const side = (s) => (s && Array.isArray(s.tests)) ? s.tests.length : 1;
  return { visible: side(a.visible), held_out: side(a.held_out) };
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [fixtureDir, modeArg, sliceId] = process.argv.slice(2);
  if (!fixtureDir) {
    console.error("usage: node verify-output.mjs <fixtureDir> [skeleton|slice <sliceId>]");
    process.exit(2);
  }
  const mode = modeArg === "slice" ? "slice" : "skeleton";
  const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
  let oraclePath, nfrPath;
  if (mode === "skeleton") {
    oraclePath = path.join(fixtureDir, ".build/skeleton/oracle/oracle.json");
    nfrPath = path.join(fixtureDir, ".hld/skeleton/nfr-mechanisms.json");
  } else {
    const sid = sliceId || "S4";
    oraclePath = path.join(fixtureDir, `.build/slices/${sid}/oracle/oracle.json`);
    nfrPath = path.join(fixtureDir, `.hld/slices/${sid}/nfr-mechanisms.json`);
  }
  let oracle, nfr;
  try { oracle = readJSON(oraclePath); nfr = readJSON(nfrPath); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  const results = deriveAllPass(oracle);
  const out = aggregateVerification(oracle, results, { mode, nfrMechanisms: nfr });
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
