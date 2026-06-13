#!/usr/bin/env node
// Self-test for classify-derive.mjs — 4 cases covering parity, low-conf, compound, unplaybooked.
// Exit 0 = all pass; exit 1 = any failure. Mirrors verdict.selftest.mjs idiom.
import { deriveClassification } from "./classify-derive.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${msg}`); }
};

// ---------------------------------------------------------------------------
// Case 1 — parity with greenfield-clean golden
// primitives mirror the golden's single greenfield subrequest.
// ---------------------------------------------------------------------------
console.log("=== Case 1: parity with greenfield-clean golden ===");
{
  const primitives = {
    subrequests: [{
      text: "We want a web app where freelancers can log their billable hours against client projects and export a monthly PDF invoice. No existing system — we're starting from scratch. Should support multiple currencies. Ideally live in a couple of months.",
      class: "greenfield",
      confidence: 0.95,
      reason: "'No existing system — we're starting from scratch' is an explicit greenfield declaration.",
    }],
    is_compound: false,
  };
  const result = deriveClassification(primitives);
  ok(result.overall_confidence === 0.95, `overall_confidence expected 0.95, got ${result.overall_confidence}`);
  ok(result.needs_confirmation === false, `needs_confirmation expected false, got ${result.needs_confirmation}`);
  ok(result.escape === null, `escape expected null, got ${JSON.stringify(result.escape)}`);
  ok(result.subrequests[0].id === "SR1", `subrequests[0].id expected SR1, got ${result.subrequests[0].id}`);
  ok(result.is_compound === false, `is_compound expected false, got ${result.is_compound}`);
  ok(Array.isArray(result.confirmation_questions) && result.confirmation_questions.length === 0,
    "confirmation_questions expected empty array");
  console.log(`  overall_confidence=${result.overall_confidence} needs_confirmation=${result.needs_confirmation} escape=${result.escape} id=${result.subrequests[0].id}`);
}

// ---------------------------------------------------------------------------
// Case 2 — low confidence → needs_confirmation true
// confidence 0.6 < default threshold 0.80
// ---------------------------------------------------------------------------
console.log("\n=== Case 2: low confidence → needs_confirmation ===");
{
  const primitives = {
    subrequests: [{
      text: "Fix the login bug.",
      class: "bugfix",
      confidence: 0.6,
      reason: "Bug mentioned.",
    }],
    is_compound: false,
  };
  const result = deriveClassification(primitives);
  ok(result.needs_confirmation === true, `needs_confirmation expected true, got ${result.needs_confirmation}`);
  ok(result.overall_confidence === 0.6, `overall_confidence expected 0.6, got ${result.overall_confidence}`);
  ok(result.escape === null, `escape expected null for playbooked class, got ${JSON.stringify(result.escape)}`);
  ok(result.subrequests[0].id === "SR1", `id expected SR1, got ${result.subrequests[0].id}`);
  console.log(`  overall_confidence=${result.overall_confidence} needs_confirmation=${result.needs_confirmation}`);
}

// ---------------------------------------------------------------------------
// Case 3 — compound → needs_confirmation true, ids SR1 + SR2
// both subrequests high-confidence + playbooked
// ---------------------------------------------------------------------------
console.log("\n=== Case 3: compound → needs_confirmation, ids SR1 SR2 ===");
{
  const primitives = {
    subrequests: [
      { text: "Build new dashboard.", class: "greenfield", confidence: 0.92, reason: "net-new." },
      { text: "Add export feature.", class: "feature-add", confidence: 0.91, reason: "additive." },
    ],
    is_compound: true,
  };
  const result = deriveClassification(primitives);
  ok(result.needs_confirmation === true, `needs_confirmation expected true (compound), got ${result.needs_confirmation}`);
  ok(result.is_compound === true, `is_compound expected true, got ${result.is_compound}`);
  ok(result.subrequests[0].id === "SR1", `subrequests[0].id expected SR1, got ${result.subrequests[0].id}`);
  ok(result.subrequests[1].id === "SR2", `subrequests[1].id expected SR2, got ${result.subrequests[1].id}`);
  ok(result.overall_confidence === 0.91, `overall_confidence expected 0.91 (min), got ${result.overall_confidence}`);
  ok(result.escape === null, `escape expected null (all playbooked), got ${JSON.stringify(result.escape)}`);
  console.log(`  is_compound=${result.is_compound} needs_confirmation=${result.needs_confirmation} ids=${result.subrequests.map(s=>s.id).join(",")}`);
}

// ---------------------------------------------------------------------------
// Case 4 — unplaybooked class → escape non-null, needs_confirmation true
// class "refactor" not in default playbooked list
// ---------------------------------------------------------------------------
console.log("\n=== Case 4: unplaybooked class → escape + needs_confirmation ===");
{
  const primitives = {
    subrequests: [{
      text: "Refactor the auth module.",
      class: "refactor",
      confidence: 0.88,
      reason: "Structural rework, no new features.",
    }],
    is_compound: false,
  };
  const result = deriveClassification(primitives);
  ok(result.needs_confirmation === true, `needs_confirmation expected true (unplaybooked), got ${result.needs_confirmation}`);
  ok(result.escape !== null, `escape expected non-null, got null`);
  ok(
    Array.isArray(result.escape?.unplaybooked_subrequests) &&
    result.escape.unplaybooked_subrequests.includes("SR1"),
    `escape.unplaybooked_subrequests expected to contain SR1, got ${JSON.stringify(result.escape?.unplaybooked_subrequests)}`
  );
  ok(typeof result.escape?.note === "string" && result.escape.note.length > 0,
    "escape.note expected non-empty string");
  ok(result.escape?.note.includes("refactor"),
    `escape.note expected to mention class name "refactor", got: ${result.escape?.note}`);
  console.log(`  escape=${JSON.stringify(result.escape)}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
