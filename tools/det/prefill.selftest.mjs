#!/usr/bin/env node
// Both-directions self-test for prefill.mjs (schema shell + mechanical fill + judgment holes).
// Direction 1: prefill a real registry schema; (a) mechanical fields from `computed` land in
//   shell; (b) judgment leaves collected as holes (null); (c) THE CONTRACT — shell with holes
//   filled MUST validate against the schema (uses validate.mjs).
// Direction 2: planted defect — a hole left wrong-typed / mechanical field omitted makes the
//   filled shell FAIL validation (the skeleton is load-bearing). Unknown schemaId throws.
// Determinism: same input → byte-identical twice. Mirrors validate.selftest.mjs structure.
import { prefill, loadSchemaById } from "./prefill.mjs";
import { validate } from "./validate.mjs";

const REGISTRY = "/workspace/schemas";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };

// ===========================================================================
// DIRECTION 1 — mechanical fill + holes + the validation contract
// ===========================================================================
console.log("=== Direction 1: shell mechanical fill + holes + validates ===");
{
  // 08-critique: verdict (enum), issue_count (int) mechanical; refs + issues[] are holes.
  const computed = { verdict: "clean", issue_count: 0, class: "greenfield" };
  const { shell, holes } = prefill("08-critique", computed, { registryDir: REGISTRY });
  ok(shell.verdict === "clean", "mechanical verdict filled from computed");
  ok(shell.issue_count === 0, "mechanical issue_count filled from computed");
  ok(shell.class === "greenfield", "mechanical class filled from computed");
  // judgment string leaves are holes, left null
  ok(shell.aprd_ref === null && holes.includes("/aprd_ref"), "aprd_ref is a null hole");
  ok(Array.isArray(shell.issues) && holes.includes("/issues"), "issues[] is a hole (LLM authored)");
  console.log(`  08-critique shell: ${holes.length} holes ${JSON.stringify(holes)}`);

  // THE CONTRACT: fill the holes with LLM-grade values → MUST validate against schema.
  const filled = JSON.parse(JSON.stringify(shell));
  filled.aprd_ref = ".aprd/aprd.frozen.md";
  filled.assumptions_ref = ".aprd/07-assumptions.json";
  filled.gaps_ref = ".aprd/04-gaps.json";
  // issues stays [] (clean draft — valid empty array)
  const r = validate(filled, "08-critique", { registryDir: REGISTRY });
  ok(r.valid, `filled shell must validate, errors: ${JSON.stringify(r.errors)}`);
  console.log(`  filled 08-critique shell validates → ${r.valid}`);
}
{
  // 02-triage: mechanical refs/class/skeleton_id + empty queue arrays; triage_counts nested object.
  const computed = {
    decision_points_ref: ".adr/01-decision-points.json",
    foundation_cut_ref: ".roadmap/06-foundation-cut.json",
    class: "greenfield", skeleton_id: "S1",
    resolution_queue: [], slice_deferred: [], deferred_queue: [], conventions: [], cut_gaps: [],
  };
  const { shell, holes } = prefill("02-triage", computed, { registryDir: REGISTRY });
  ok(shell.skeleton_id === "S1", "02-triage skeleton_id mechanical");
  ok(Array.isArray(shell.triage) && holes.includes("/triage"), "triage[] is a hole");
  // triage_counts is a nested object of integer leaves → those leaves are holes
  ok(typeof shell.triage_counts === "object" && shell.triage_counts !== null, "triage_counts object shell present");
  ok(holes.includes("/triage_counts/total"), "nested integer leaf total is a hole");
  // fill: triage rows + counts → must validate
  const filled = JSON.parse(JSON.stringify(shell));
  filled.triage = [];
  filled.triage_counts = { total: 0, foundational_in_cut: 0, foundational_not_yet: 0, local: 0, trivial: 0 };
  const r = validate(filled, "02-triage", { registryDir: REGISTRY });
  ok(r.valid, `filled 02-triage must validate, errors: ${JSON.stringify(r.errors)}`);
  console.log(`  02-triage shell: ${holes.length} holes; filled validates → ${r.valid}`);
}

// ===========================================================================
// DIRECTION 2 — planted defects: skeleton load-bearing, unknown schema throws
// ===========================================================================
console.log("\n=== Direction 2: planted defects → caught ===");
{
  // mechanical verdict OMITTED from computed → left as null hole → filling wrong-type breaks enum.
  const { shell } = prefill("08-critique", { issue_count: 0 }, { registryDir: REGISTRY });
  ok(shell.verdict === null, "verdict left null when absent from computed");
  // plant: LLM fills verdict with a non-enum value → MUST fail validation (skeleton enforced)
  const bad = JSON.parse(JSON.stringify(shell));
  bad.verdict = "maybe";  // not in enum clean|blocked
  bad.aprd_ref = "x"; bad.assumptions_ref = "x"; bad.gaps_ref = "x";
  const r = validate(bad, "08-critique", { registryDir: REGISTRY });
  ok(!r.valid && r.errors.some(e => e.keyword === "enum"), `bad verdict must fail enum, got ${JSON.stringify(r.errors.map(e=>e.keyword))}`);
  console.log(`  planted non-enum verdict → validation ${r.valid ? "FAIL(passed!)" : "caught"}`);
}
{
  // plant: required mechanical field omitted entirely → shell still carries the key as a hole,
  // but if the LLM leaves a required string hole null, validation must catch wrong type.
  const { shell } = prefill("02-triage", { class: "greenfield" }, { registryDir: REGISTRY });
  const bad = JSON.parse(JSON.stringify(shell));
  bad.skeleton_id = 5;  // required string, planted as integer
  const r = validate(bad, "02-triage", { registryDir: REGISTRY });
  ok(!r.valid, "planted integer skeleton_id must fail (required string)");
  console.log(`  planted integer skeleton_id → ${r.valid ? "FAIL(passed!)" : "caught"}`);
}
{
  // unknown schemaId throws
  let threw = false;
  try { prefill("no-such-schema", {}, { registryDir: REGISTRY }); } catch { threw = true; }
  ok(threw, "unknown schemaId throws");
  console.log(`  unknown schemaId → ${threw ? "throws OK" : "FAIL"}`);
}
{
  // FLAG-not-fix: prefill output carries no field to author a fix into — holes are null skeletons.
  const { shell, holes } = prefill("08-critique", { verdict: "clean", issue_count: 0 }, { registryDir: REGISTRY });
  const everyHoleNullOrEmpty = holes.every(ptr => {
    const seg = ptr.split("/").filter(Boolean);
    let cur = shell;
    for (const s of seg) cur = cur[s];
    return cur === null || (Array.isArray(cur) && cur.length === 0);
  });
  ok(everyHoleNullOrEmpty, "every hole is null or empty array (no authored content)");
  console.log(`  FLAG-not-fix: all ${holes.length} holes null/empty → ${everyHoleNullOrEmpty}`);
}

// ===========================================================================
// DETERMINISM — same input → byte-identical twice
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const computed = { verdict: "clean", issue_count: 0 };
  const a = JSON.stringify(prefill("08-critique", computed, { registryDir: REGISTRY }));
  const b = JSON.stringify(prefill("08-critique", computed, { registryDir: REGISTRY }));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
  // loadSchemaById smoke
  ok(loadSchemaById("08-critique", REGISTRY).$id === "08-critique", "loadSchemaById resolves");
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
