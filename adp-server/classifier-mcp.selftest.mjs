#!/usr/bin/env node
// Regression: CLASSIFIER end-to-end via REAL MCP tool surface (adp-server/tools/index.js).
// Both directions: GOOD (reproduce golden) + DEFECT (confidence 0.5 → caught).
// Exit 0 = all pass; exit 1 = any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adp_next, adp_classify_derive, adp_derive, adp_submit } from "./tools/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${msg}`); }
};

// --- fixtures ---------------------------------------------------------------
const good = JSON.parse(fs.readFileSync(path.join(here, "_regression/classifier-good.primitives.json"), "utf8"));
const defect = JSON.parse(fs.readFileSync(path.join(here, "_regression/classifier-defect.primitives.json"), "utf8"));
const golden = JSON.parse(fs.readFileSync(path.join(ROOT, "_fixtures/greenfield-clean/.aprd/01-classification.json"), "utf8"));

// out dir for produced artifacts
const outDir = path.join(here, "_regression/out");
fs.mkdirSync(outDir, { recursive: true });

// ---------------------------------------------------------------------------
// Step 1 — packet assembly (real adp_next)
// ---------------------------------------------------------------------------
console.log("=== Step 1: packet assembly (adp_next) ===");
{
  const packet = await adp_next(
    { role: "CLASSIFIER", state: {}, schemaId: "01-classification", computed: { request_ref: ".aprd/00-raw-request.md" } },
    { root: ROOT }
  );
  const hasInput = Array.isArray(packet.inputs) && packet.inputs.some(i => i.path === ".aprd/00-raw-request.md");
  ok(hasInput, `inputs must contain .aprd/00-raw-request.md; got ${JSON.stringify(packet.inputs)}`);
  ok(packet.shell.request_ref === ".aprd/00-raw-request.md",
    `shell.request_ref expected ".aprd/00-raw-request.md", got ${packet.shell.request_ref}`);
  console.log(`  inputs contains .aprd/00-raw-request.md: ${hasInput}`);
  console.log(`  shell.request_ref: ${packet.shell.request_ref}`);
  console.log(`  Step 1: ${fail === 0 ? "PASS" : "FAIL"}`);
}

const step1Result = fail === 0 ? "PASS" : "FAIL";

// ---------------------------------------------------------------------------
// Step 2 — zero determinism in role primitives
// ---------------------------------------------------------------------------
console.log("\n=== Step 2: zero determinism in role primitives ===");
const DERIVED_KEYS = ["overall_confidence", "needs_confirmation", "escape", "confirmation_questions"];
let step2Fail = 0;
{
  for (const [label, prim] of [["good", good], ["defect", defect]]) {
    for (const key of DERIVED_KEYS) {
      const absent = !(key in prim);
      if (!absent) { step2Fail++; fail++; console.log(`  FAIL: ${label} primitives must NOT have key "${key}"`); }
      else pass++;
    }
    for (const sr of prim.subrequests || []) {
      const noId = !("id" in sr);
      if (!noId) { step2Fail++; fail++; console.log(`  FAIL: ${label} subrequest must NOT have "id"`); }
      else pass++;
    }
  }
  console.log(`  derived keys absent from both fixtures: ${step2Fail === 0}`);
  console.log(`  Step 2: ${step2Fail === 0 ? "PASS" : "FAIL"}`);
}

// ---------------------------------------------------------------------------
// Step 3 — GOOD direction (adp_classify_derive + adp_submit)
// ---------------------------------------------------------------------------
console.log("\n=== Step 3: GOOD direction ===");
let step3Fail = fail;
{
  const derived = await adp_classify_derive({ primitives: good }, { root: ROOT });
  ok(derived.needs_confirmation === false, `needs_confirmation expected false, got ${derived.needs_confirmation}`);
  ok(derived.escape === null, `escape expected null, got ${JSON.stringify(derived.escape)}`);
  ok(derived.subrequests[0].id === "SR1", `subrequests[0].id expected SR1, got ${derived.subrequests[0].id}`);
  console.log(`  adp_classify_derive: needs_confirmation=${derived.needs_confirmation} escape=${derived.escape} id=${derived.subrequests[0].id}`);

  // adp_derive: server writes artifact (determinism + splice + write)
  const drGood = await adp_derive(
    {
      schemaId: "01-classification",
      primitives: good,
      shell: { request_ref: ".aprd/00-raw-request.md" },
      output_path: "adp-server/_regression/out/good.classification.json",
    },
    { root: ROOT }
  );
  ok(drGood.needs_confirmation === false, `adp_derive good: needs_confirmation expected false, got ${drGood.needs_confirmation}`);
  console.log(`  adp_derive (good): needs_confirmation=${drGood.needs_confirmation} escape=${drGood.escape}`);

  // adp_submit: pure gate — validate written artifact
  const r = await adp_submit(
    {
      artifactPath: "adp-server/_regression/out/good.classification.json",
      schemaId: "01-classification",
    },
    { root: ROOT }
  );
  ok(r.verdict === "pass", `submit verdict expected "pass", got "${r.verdict}" errors=${JSON.stringify(r.errors)}`);
  console.log(`  adp_submit verdict: ${r.verdict}`);

  // load produced artifact + check load-bearing parity with golden
  const produced = JSON.parse(fs.readFileSync(path.join(ROOT, "adp-server/_regression/out/good.classification.json"), "utf8"));
  ok(produced.is_compound === golden.is_compound,
    `is_compound: produced=${produced.is_compound} golden=${golden.is_compound}`);
  ok(produced.subrequests.length === golden.subrequests.length,
    `subrequest count: produced=${produced.subrequests.length} golden=${golden.subrequests.length}`);
  ok(produced.subrequests[0].class === golden.subrequests[0].class,
    `subrequests[0].class: produced=${produced.subrequests[0].class} golden=${golden.subrequests[0].class}`);
  ok(produced.subrequests[0].id === golden.subrequests[0].id,
    `subrequests[0].id: produced=${produced.subrequests[0].id} golden=${golden.subrequests[0].id}`);
  ok(produced.needs_confirmation === golden.needs_confirmation,
    `needs_confirmation: produced=${produced.needs_confirmation} golden=${golden.needs_confirmation}`);
  ok(produced.escape === golden.escape,
    `escape: produced=${JSON.stringify(produced.escape)} golden=${JSON.stringify(golden.escape)}`);
  ok((produced.confirmation_questions || []).length === (golden.confirmation_questions || []).length,
    `confirmation_questions.length: produced=${(produced.confirmation_questions||[]).length} golden=${(golden.confirmation_questions||[]).length}`);

  const thisStep = fail - step3Fail;
  console.log(`  parity with golden: is_compound=${produced.is_compound} subreq_count=${produced.subrequests.length} class=${produced.subrequests[0].class} id=${produced.subrequests[0].id} needs_confirmation=${produced.needs_confirmation} escape=${produced.escape} confirm_q_len=${(produced.confirmation_questions||[]).length}`);
  console.log(`  Step 3 MATCH: ${thisStep === 0 ? "PASS" : "FAIL"}`);
}

// ---------------------------------------------------------------------------
// Step 4 — DEFECT direction (discrimination)
// ---------------------------------------------------------------------------
console.log("\n=== Step 4: DEFECT direction ===");
let step4Fail = fail;
{
  const derivedD = await adp_classify_derive({ primitives: defect }, { root: ROOT });
  ok(derivedD.needs_confirmation === true,
    `defect: needs_confirmation expected true (conf 0.5 < 0.80), got ${derivedD.needs_confirmation}`);
  console.log(`  adp_classify_derive (defect): needs_confirmation=${derivedD.needs_confirmation}`);

  // adp_derive: server writes defect artifact
  const drDefect = await adp_derive(
    {
      schemaId: "01-classification",
      primitives: defect,
      shell: { request_ref: ".aprd/00-raw-request.md" },
      output_path: "adp-server/_regression/out/defect.classification.json",
    },
    { root: ROOT }
  );
  ok(drDefect.needs_confirmation === true,
    `adp_derive defect: needs_confirmation expected true, got ${drDefect.needs_confirmation}`);
  console.log(`  adp_derive (defect): needs_confirmation=${drDefect.needs_confirmation}`);

  // adp_submit: pure gate — validate written artifact
  const rD = await adp_submit(
    {
      artifactPath: "adp-server/_regression/out/defect.classification.json",
      schemaId: "01-classification",
    },
    { root: ROOT }
  );
  console.log(`  adp_submit (defect) verdict: ${rD.verdict} errors=${JSON.stringify(rD.errors)}`);

  // load defect artifact + assert diverges from golden on needs_confirmation
  const producedD = JSON.parse(fs.readFileSync(path.join(ROOT, "adp-server/_regression/out/defect.classification.json"), "utf8"));
  const diverges = producedD.needs_confirmation === true && golden.needs_confirmation === false;
  ok(diverges,
    `defect artifact must diverge: defect.needs_confirmation=${producedD.needs_confirmation} golden.needs_confirmation=${golden.needs_confirmation}`);
  console.log(`  DIVERGE check: defect.needs_confirmation=${producedD.needs_confirmation} vs golden.needs_confirmation=${golden.needs_confirmation} → defect caught: ${diverges}`);
  console.log(`  Step 4: ${(fail - step4Fail) === 0 ? "PASS" : "FAIL"}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n============================`);
console.log(`SUMMARY: ${pass} assertions passed, ${fail} failed`);
console.log(fail === 0 ? "RESULT: PASS" : "RESULT: FAIL");
process.exit(fail === 0 ? 0 : 1);
