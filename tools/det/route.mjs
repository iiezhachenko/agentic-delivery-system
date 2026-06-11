#!/usr/bin/env node
// Routing = f(axes): TRIAGE 2-axis (prompts/02-adr/TRIAGE.md Rule 4) +
//   DIAGNOSE 4-gate discriminator (prompts/04-build/DIAGNOSE.md "The decision").
// Pure core fns + thin CLI. Zero deps, ESM, deterministic. Mirrors validate.mjs idiom.
//
// TRIAGE route = f(blast_radius, cut_status) — 4-queue partition (TRIAGE.md:50-52):
//   foundational + in-cut → resolution_queue
//   foundational + not-yet → slice_deferred
//   local → deferred_queue
//   trivial → convention
// cut_status lookup: foundational decision in-cut iff its needed_by includes skeleton.
//
// DIAGNOSE ordered 4-gate (DIAGNOSE.md:81-88): gate1 flaky→flaky-quarantine;
//   gate2 signature-changed OR pass-count-rose→self-heal (progressing);
//   gate3 misread→self-heal; else classify→route by classification→target_phase.
//   Stall = K=3 same-signature + 0 net-new passes → escape (when genuine defect).
// Usage: node route.mjs triage <blast_radius> <cut_status> | node route.mjs diagnose <json-signals>

export const K = 3;  // stall threshold: K same-signature attempts, 0 net-new passes (DIAGNOSE.md:82)

// --- TRIAGE: route = f(blast_radius, cut_status) ----------------------------
// blast_radius ∈ foundational|local|trivial; cut_status ∈ in-cut|not-yet|null (foundational only).
const TRIAGE_QUEUE = {
  "foundational|in-cut": "resolution_queue",
  "foundational|not-yet": "slice_deferred",
  "local": "deferred_queue",
  "trivial": "convention",
};

export function triageRoute({ blast_radius, cut_status }) {
  if (blast_radius === "foundational") {
    const key = `foundational|${cut_status}`;
    const q = TRIAGE_QUEUE[key];
    if (!q) throw new Error(`foundational point needs cut_status in-cut|not-yet, got: ${cut_status}`);
    return q;
  }
  const q = TRIAGE_QUEUE[blast_radius];
  if (!q) throw new Error(`unknown blast_radius: ${blast_radius}`);
  return q;
}

// --- cut_status lookup: foundational decision in-cut iff needed_by ∋ skeleton ----
// FD = { needed_by:[...] }. (TRIAGE.md:39 — cut_ref names FD whose needed_by includes skeleton_id.)
export function cutStatus(fd, skeletonId) {
  const needed = (fd && fd.needed_by) || [];
  return needed.includes(skeletonId) ? "in-cut" : "not-yet";
}

// --- DIAGNOSE: classification → target_phase (pure fn, DIAGNOSE.md:86-88/98) -----
export const CLASSIFICATION_PHASE = {
  "my-code": "self-heal",            // → verifying role (self-heal), not an upstream phase
  "contract": "Phase 3",
  "decision": "Phase 2",
  "WHAT": "Phase 0",
  "missing-foundation": "Phase 1",
};

// --- DIAGNOSE: ordered 4-gate discriminator (first match wins) ------------------
// signals: { flaky, signature_changed, pass_count_rose, same_signature_attempts,
//            net_new_passes, misread, classification, routable }
// returns { verdict, classification, target_phase, gates_to_verdict }.
export function diagnoseRoute(signals) {
  const s = signals || {};
  // gate1: flaky → quarantine (never escapes, never counts — DIAGNOSE.md:81)
  if (s.flaky) {
    return { verdict: "flaky-quarantine", classification: null, target_phase: null, gates_to_verdict: 1 };
  }
  // gate2: progressing (signature changed OR pass-count rose) → self-heal (DIAGNOSE.md:82)
  if (s.signature_changed || s.pass_count_rose) {
    return { verdict: "self-heal", classification: "my-code", target_phase: "self-heal", gates_to_verdict: 2 };
  }
  // gate3: misread (frozen artifact satisfiable, impl misread) → self-heal my-code (DIAGNOSE.md:83)
  if (s.misread) {
    return { verdict: "self-heal", classification: "my-code", target_phase: "self-heal", gates_to_verdict: 3 };
  }
  // gate4: genuine defect — classify → route by pure map (DIAGNOSE.md:84-88).
  // Escape only on STALL: K same-signature + 0 net-new passes (DIAGNOSE.md:82), AND
  //   routable (frozen_ref + concrete change). Else downgrade to self-heal (DIAGNOSE.md:89).
  const cls = s.classification;
  const phase = CLASSIFICATION_PHASE[cls];
  if (cls === undefined || phase === undefined) {
    throw new Error(`gate4 needs classification in ${Object.keys(CLASSIFICATION_PHASE).join("|")}, got: ${cls}`);
  }
  if (phase === "self-heal") {
    // classified my-code at gate4 = code wrong, route back (not an escape)
    return { verdict: "self-heal", classification: "my-code", target_phase: "self-heal", gates_to_verdict: 4 };
  }
  const stalled = (s.same_signature_attempts || 0) >= K && (s.net_new_passes || 0) === 0;
  if (!stalled || s.routable === false) {
    // not a confirmed stall, or non-routable escape = builder bug → downgrade (DIAGNOSE.md:82,89)
    return { verdict: "self-heal", classification: "my-code", target_phase: "self-heal", gates_to_verdict: 4 };
  }
  return { verdict: "escape", classification: cls, target_phase: phase, gates_to_verdict: 4 };
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [kind, ...rest] = process.argv.slice(2);
  try {
    if (kind === "triage") {
      const [blast_radius, cut_status] = rest;
      if (!blast_radius) { console.error("usage: node route.mjs triage <blast_radius> [cut_status]"); process.exit(2); }
      const q = triageRoute({ blast_radius, cut_status: cut_status === "null" ? null : cut_status });
      console.log(q);
      process.exit(0);
    } else if (kind === "diagnose") {
      const raw = rest[0];
      if (!raw) { console.error("usage: node route.mjs diagnose '<json-signals>'"); process.exit(2); }
      const out = diagnoseRoute(JSON.parse(raw));
      console.log(JSON.stringify(out));
      process.exit(0);
    } else {
      console.error("usage: node route.mjs <triage|diagnose> ...");
      process.exit(2);
    }
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(2);
  }
}
