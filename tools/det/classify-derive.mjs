#!/usr/bin/env node
// Deterministic derived fields for .aprd/01-classification.json.
// Moves all deterministic work OUT of CLASSIFIER role prompt INTO spine (ADR-0038/D38).
// Pure compute core + thin CLI. Zero deps, ESM, no I/O in core.
// Usage: node classify-derive.mjs '<primitives-json>' [--threshold N]

// --- deriveClassification: primitives -> deterministic completion ------------------
// primitives = { subrequests: [{ text, class, confidence, reason }, ...], is_compound }
// opts = { threshold = 0.80, playbooked = [...] }
// Returns fields deterministically computable from primitives; caller splices in
// request_ref + confirmation_questions (role-authored judgment prose).
export function deriveClassification(primitives, opts = {}) {
  const threshold = typeof opts.threshold === "number" ? opts.threshold : 0.80;
  const playbooked = Array.isArray(opts.playbooked)
    ? opts.playbooked
    : ["greenfield", "feature-add", "bugfix", "audit"];

  const { subrequests: rawSRs, is_compound } = primitives;

  // Mint stable ids SR1, SR2, … by order.
  const subrequests = rawSRs.map((sr, i) => ({
    id: `SR${i + 1}`,
    text: sr.text,
    class: sr.class,
    confidence: sr.confidence,
    reason: sr.reason,
  }));

  // overall_confidence = min over subrequest confidences (weakest link).
  const overall_confidence = subrequests.length === 1
    ? subrequests[0].confidence
    : Math.min(...subrequests.map(sr => sr.confidence));

  // Unplaybooked = subrequests whose class is not in playbooked list.
  const unplaybookedSRs = subrequests.filter(sr => !playbooked.includes(sr.class));

  // needs_confirmation = low-confidence OR compound OR any unplaybooked.
  const needs_confirmation =
    overall_confidence < threshold ||
    is_compound === true ||
    unplaybookedSRs.length > 0;

  // escape = null if all playbooked; else structured halt signal.
  let escape = null;
  if (unplaybookedSRs.length > 0) {
    const classNames = [...new Set(unplaybookedSRs.map(sr => sr.class))].join(", ");
    escape = {
      unplaybooked_subrequests: unplaybookedSRs.map(sr => sr.id),
      note: `Classes [${classNames}] lack authored playbooks; pipeline halts pending client confirmation.`,
    };
  }

  return {
    is_compound,
    subrequests,
    overall_confidence,
    needs_confirmation,
    confirmation_questions: [],
    escape,
  };
}

// --- CLI ------------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error("usage: node classify-derive.mjs '<primitives-json>' [--threshold N]");
    process.exit(2);
  }
  const primitivesRaw = args[0];
  let primitives;
  try {
    primitives = JSON.parse(primitivesRaw);
  } catch (e) {
    console.error(`bad primitives JSON: ${e.message}`);
    process.exit(2);
  }
  const threshIdx = args.indexOf("--threshold");
  const opts = {};
  if (threshIdx !== -1) {
    const n = Number(args[threshIdx + 1]);
    if (!Number.isFinite(n)) { console.error(`bad threshold: ${args[threshIdx + 1]}`); process.exit(2); }
    opts.threshold = n;
  }
  let result;
  try { result = deriveClassification(primitives, opts); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}
