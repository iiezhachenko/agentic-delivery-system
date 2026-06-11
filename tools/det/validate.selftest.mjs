#!/usr/bin/env node
// Both-directions self-test for schema registry + validator.
// Direction 1: EVERY golden artifact in greenfield-clean + brownfield-bugfix validates clean.
//   Walks ALL *.json under each tree, maps file → registry id, asserts valid===true.
//   Any rejected golden = FAIL printing path + errors.
//   Files that are not pipeline artifacts (test oracle metadata) are EXPLICITLY skipped.
// Direction 2: planted shape-defect on golden → INVALID (≥1 per phase).
// Determinism check: same input → same result twice.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { validate } from "./validate.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY = path.resolve(here, "..", "..", "schemas");
const FIXTURES_GF = "/workspace/_fixtures/greenfield-clean";
const FIXTURES_BF = "/workspace/_fixtures/brownfield-bugfix";
const FIXTURES_GC = "/workspace/_fixtures/greenfield-canon";

const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "schema-selftest-"));
let pass = 0, fail = 0;

function ok(cond, msg) {
  if (cond) { pass++; } else { fail++; console.log(`  FAIL: ${msg}`); }
}

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function cloneJSON(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function runValidate(instance, id) {
  return validate(instance, id, { registryDir: REGISTRY });
}

// ---------------------------------------------------------------------------
// STEM→ID MAPPING
// ---------------------------------------------------------------------------
// Returns registry id string, or null if file should be SKIPPED.
// SKIP-LIST (explicit, documented):
//   - expected-verdict.json: test oracle metadata, not a pipeline artifact.
//     Shape is a project-specific doc (defect, invariant, seed, load_bearing_assertion,
//     expected_verdict, etc.) with no registered schema. Not a VERIFY-OUTPUT/CRITIQUE output.
//   - sources.json under .aprd/03-grounding/: ad-hoc source manifest, no registered schema.
//   - manifests/*.json: tool config files (eslint, tsconfig), not pipeline artifacts.
const SKIP_LIST = new Map([
  ["expected-verdict.json", "test-oracle metadata — not a pipeline artifact, no registered schema"],
  ["sources.json",          "grounding source manifest — not a pipeline artifact, no registered schema"],
  ["eslint.config.json",    "tool config manifest — not a pipeline artifact"],
  ["tsconfig.base.json",    "tool config manifest — not a pipeline artifact"],
]);

function stemToId(absPath) {
  const stem = path.basename(absPath);

  // explicit skip-list (checked by basename)
  if (SKIP_LIST.has(stem)) return null;

  // defect fixtures: blocked/flagged artifacts are still schema-valid
  //   verify-output.blocked.json → verify-output
  if (stem === "verify-output.blocked.json") return "verify-output";
  //   critique.flagged.json → build-critique
  if (stem === "critique.flagged.json") return "build-critique";

  // DP<n>.json → option-set
  if (/^DP\d+\.json$/.test(stem)) return "option-set";
  // DP<n>.decision.json → decision
  if (/^DP\d+\.decision\.json$/.test(stem)) return "decision";

  // index.json under .adr/03-options/ → option-index
  if (stem === "index.json" && absPath.includes("/.adr/03-options/")) return "option-index";
  // decisions-index.json → decisions-index
  if (stem === "decisions-index.json") return "decisions-index";
  // adr-index.json → adr-index
  if (stem === "adr-index.json") return "adr-index";

  // .hld/**/critique.json → hld-critique
  if (stem === "critique.json" && absPath.includes("/.hld/")) return "hld-critique";
  // .build/**/critique.json → build-critique
  if (stem === "critique.json" && absPath.includes("/.build/")) return "build-critique";

  // derive id from stem (strip .json)
  const id = stem.replace(/\.json$/, "");

  // known registry ids that map directly from stem
  const KNOWN = new Set([
    "01-classification","02-extraction","04-gaps","07-assumptions","08-critique",
    "baseline-map","diagnosis","rules-extracted","rules-reconciled","rules-verified",
    "02-slices","03-verticality","04-skeleton","05-sequence","06-foundation-cut",
    "07-sequence-reviewed","08-rerank",
    "01-decision-points","02-triage","04-conflicts","05-critique",
    "deferred-decisions","decision",
    "build-dag","components","contracts","data-model","flows","nfr-mechanisms",
    "reconcile","test-specs",
    "build-plan","build-record","demo","integration-record","mutation-certification",
    "oracle","verification","verify-output","build-diagnosis","economy-audit",
  ]);
  if (KNOWN.has(id)) return id;

  // unrecognised: fail-open by returning null (will be listed as unrecognised, not crashed)
  return `__UNKNOWN__:${stem}`;
}

// ---------------------------------------------------------------------------
// DIRECTION 1 — walk ALL *.json in greenfield-clean + brownfield-bugfix
// ---------------------------------------------------------------------------
console.log("=== Direction 1: golden artifacts → valid ===");

let dir1Validated = 0;
const dir1Skipped = []; // { file, reason }

function walkDir(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
    .sort((a, b) => a.name < b.name ? -1 : 1);
  const result = [];
  for (const e of entries) {
    const full = path.join(dir, e.name);
    if (e.isDirectory()) {
      result.push(...walkDir(full));
    } else if (e.name.endsWith(".json")) {
      result.push(full);
    }
  }
  return result;
}

const dir1Trees = [FIXTURES_GF, FIXTURES_BF];
for (const treeRoot of dir1Trees) {
  const allFiles = walkDir(treeRoot);
  for (const absPath of allFiles) {
    const id = stemToId(absPath);
    const rel = absPath.replace(treeRoot + "/", "");

    if (id === null) {
      // explicit skip
      const stem = path.basename(absPath);
      const reason = SKIP_LIST.get(stem) || "skip-listed";
      dir1Skipped.push({ file: absPath, reason });
      continue;
    }

    if (id.startsWith("__UNKNOWN__")) {
      fail++;
      console.log(`  FAIL (no mapping): ${rel} — could not map to registry id`);
      continue;
    }

    let instance;
    try { instance = readJSON(absPath); }
    catch (e) { fail++; console.log(`  FAIL (read): ${rel} — ${e.message}`); continue; }

    const r = runValidate(instance, id);
    if (r.valid) {
      console.log(`  ${rel} → ${id} valid`);
      pass++;
      dir1Validated++;
    } else {
      fail++;
      console.log(`  FAIL: ${rel} → ${id}`);
      r.errors.slice(0, 3).forEach(e => console.log(`    [${e.keyword}] ${e.path}: ${e.msg}`));
    }
  }
}

// also validate greenfield-canon grounding chain (not in main walk trees)
const gcPairs = [
  [`${FIXTURES_GC}/.aprd/03-grounding/rules-extracted.json`, "rules-extracted"],
  [`${FIXTURES_GC}/.aprd/03-grounding/rules-reconciled.json`, "rules-reconciled"],
  [`${FIXTURES_GC}/.aprd/03-grounding/rules-verified.json`, "rules-verified"],
];
for (const [absPath, id] of gcPairs) {
  let instance;
  try { instance = readJSON(absPath); }
  catch (e) { fail++; console.log(`  FAIL (read): ${id} @ ${absPath}: ${e.message}`); continue; }
  const r = runValidate(instance, id);
  const rel = absPath.replace(FIXTURES_GC + "/", "greenfield-canon/");
  if (r.valid) {
    console.log(`  ${rel} → ${id} valid`);
    pass++;
    dir1Validated++;
  } else {
    fail++;
    console.log(`  FAIL: ${rel} → ${id}`);
    r.errors.slice(0, 3).forEach(e => console.log(`    [${e.keyword}] ${e.path}: ${e.msg}`));
  }
}

// also validate greenfield build-reds diagnosis (skeleton-tested in original)
const buildRedsDiagnosis = "/workspace/_fixtures/greenfield-build-reds/.build/slices/S4/diagnosis.json";
try {
  const inst = readJSON(buildRedsDiagnosis);
  const r = runValidate(inst, "build-diagnosis");
  if (r.valid) {
    console.log(`  greenfield-build-reds/.build/slices/S4/diagnosis.json → build-diagnosis valid`);
    pass++;
    dir1Validated++;
  } else {
    fail++;
    console.log(`  FAIL: greenfield-build-reds diagnosis.json → build-diagnosis`);
    r.errors.slice(0, 3).forEach(e => console.log(`    [${e.keyword}] ${e.path}: ${e.msg}`));
  }
} catch (e) {
  fail++;
  console.log(`  FAIL (read): greenfield-build-reds diagnosis: ${e.message}`);
}

console.log(`\ndirection-1: ${dir1Validated} golden validated clean, ${dir1Skipped.length} skipped (listed):`);
for (const { file, reason } of dir1Skipped) {
  console.log(`  SKIP: ${file.replace("/workspace/_fixtures/", "")} — ${reason}`);
}

// ---------------------------------------------------------------------------
// DIRECTION 2 — planted defects MUST be invalid (≥1 per phase)
// ---------------------------------------------------------------------------
console.log("\n=== Direction 2: planted defects → invalid ===");

const dir2Cases = [
  // 00-aprd phase defects
  {
    id: "01-classification",
    file: `${FIXTURES_GF}/.aprd/01-classification.json`,
    label: "delete needs_confirmation (required key missing)",
    mutate: (obj) => { delete obj.needs_confirmation; return obj; },
    keyword: "required",
  },
  {
    id: "02-extraction",
    file: `${FIXTURES_GF}/.aprd/02-extraction.json`,
    label: "explicit_requirements[0].inferred set to true (const:false violated)",
    mutate: (obj) => { obj.explicit_requirements[0].inferred = true; return obj; },
    keyword: "const",
  },
  {
    id: "04-gaps",
    file: `${FIXTURES_GF}/.aprd/04-gaps.json`,
    label: "gap blast_radius set to 'critical' (not in enum)",
    mutate: (obj) => { obj.gaps[0].blast_radius = "critical"; return obj; },
    keyword: "enum",
  },
  {
    id: "07-assumptions",
    file: `${FIXTURES_GF}/.aprd/07-assumptions.json`,
    label: "assumptions[0].source set to 'invented' (not in enum)",
    mutate: (obj) => { obj.assumptions[0].source = "invented"; return obj; },
    keyword: "enum",
  },
  {
    id: "08-critique",
    file: `${FIXTURES_GF}/.aprd/08-critique.json`,
    label: "verdict set to 'unknown' (not in enum)",
    mutate: (obj) => { obj.verdict = "unknown"; return obj; },
    keyword: "enum",
  },
  // 01-roadmap phase defects
  {
    id: "02-slices",
    file: `${FIXTURES_GF}/.roadmap/02-slices.json`,
    label: "slices[0].value set to 'critical' (not in enum)",
    mutate: (obj) => { obj.slices[0].value = "critical"; return obj; },
    keyword: "enum",
  },
  {
    id: "03-verticality",
    file: `${FIXTURES_GF}/.roadmap/03-verticality.json`,
    label: "delete verdict (required key missing)",
    mutate: (obj) => { delete obj.verdict; return obj; },
    keyword: "required",
  },
  {
    id: "08-rerank",
    file: `${FIXTURES_GF}/.roadmap/08-rerank.json`,
    label: "delete roadmap_version (required key missing)",
    mutate: (obj) => { delete obj.roadmap_version; return obj; },
    keyword: "required",
  },
  // 02-adr phase defects
  {
    id: "01-decision-points",
    file: `${FIXTURES_GF}/.adr/01-decision-points.json`,
    label: "decision_points[0].candidate_blast_radius set to 'critical' (not in enum)",
    mutate: (obj) => { obj.decision_points[0].candidate_blast_radius = "critical"; return obj; },
    keyword: "enum",
  },
  {
    id: "04-conflicts",
    file: `${FIXTURES_GF}/.adr/04-conflicts.json`,
    label: "verdict set to 'unknown' (not in enum)",
    mutate: (obj) => { obj.verdict = "unknown"; return obj; },
    keyword: "enum",
  },
  {
    id: "adr-index",
    file: `${FIXTURES_GF}/.adr/adr-index.json`,
    label: "delete adr_counts (required key missing)",
    mutate: (obj) => { delete obj.adr_counts; return obj; },
    keyword: "required",
  },
  // 03-hld phase defects — skeleton mode
  {
    id: "components",
    file: `${FIXTURES_GF}/.hld/skeleton/components.json`,
    label: "components[0].id pattern broken (not ^C[0-9]+$)",
    mutate: (obj) => { obj.components[0].id = "COMP1"; return obj; },
    keyword: "pattern",
  },
  {
    id: "contracts",
    file: `${FIXTURES_GF}/.hld/skeleton/contracts.json`,
    label: "contracts[0].kind set to 'webhook' (not in enum)",
    mutate: (obj) => { obj.contracts[0].kind = "webhook"; return obj; },
    keyword: "enum",
  },
  {
    id: "hld-critique",
    file: `${FIXTURES_GF}/.hld/skeleton/critique.json`,
    label: "verdict set to 'partial' (not in enum)",
    mutate: (obj) => { obj.verdict = "partial"; return obj; },
    keyword: "enum",
  },
  // 03-hld phase defects — slice mode (extra: pattern on slice-mode components)
  {
    id: "components",
    file: `${FIXTURES_GF}/.hld/slices/S4/components.json`,
    label: "delete class (required key missing in slice components)",
    mutate: (obj) => { delete obj.class; return obj; },
    keyword: "required",
  },
  // 04-build phase defects — skeleton mode
  {
    id: "build-plan",
    file: `${FIXTURES_GF}/.build/skeleton/build-plan.json`,
    label: "delete build_units (required key missing)",
    mutate: (obj) => { delete obj.build_units; return obj; },
    keyword: "required",
  },
  {
    id: "demo",
    file: `${FIXTURES_GF}/.build/skeleton/demo/demo.json`,
    label: "client_response set to 'maybe' (not in enum)",
    mutate: (obj) => { obj.client_response = "maybe"; return obj; },
    keyword: "enum",
  },
  {
    id: "verification",
    file: `${FIXTURES_GF}/.build/skeleton/verification.json`,
    label: "verdict set to 'partial' (not in enum)",
    mutate: (obj) => { obj.verdict = "partial"; return obj; },
    keyword: "enum",
  },
  {
    id: "verify-output",
    file: `${FIXTURES_GF}/.build/slices/S4/verify-output.json`,
    label: "delete slice_id (required key missing)",
    mutate: (obj) => { delete obj.slice_id; return obj; },
    keyword: "required",
  },
  {
    id: "build-diagnosis",
    file: "/workspace/_fixtures/greenfield-build-reds/.build/slices/S4/diagnosis.json",
    label: "verdict set to 'error' (not in enum)",
    mutate: (obj) => { obj.verdict = "error"; return obj; },
    keyword: "enum",
  },
  // 04-build phase defects — slice mode (extra)
  {
    id: "build-record",
    file: `${FIXTURES_GF}/.build/slices/S4/build-record.json`,
    label: "delete class (required key missing in slice build-record)",
    mutate: (obj) => { delete obj.class; return obj; },
    keyword: "required",
  },
  {
    id: "oracle",
    file: `${FIXTURES_GF}/.build/slices/S4/oracle/oracle.json`,
    label: "delete class (required key missing in slice oracle)",
    mutate: (obj) => { delete obj.class; return obj; },
    keyword: "required",
  },
  {
    id: "mutation-certification",
    file: `${FIXTURES_GF}/.build/slices/S4/oracle/mutation-certification.json`,
    label: "delete high_blast_components (required key missing in slice mutation-cert)",
    mutate: (obj) => { delete obj.high_blast_components; return obj; },
    keyword: "required",
  },
  {
    id: "verify-output",
    file: `${FIXTURES_BF}/defects/no-repro-flip/verify-output.blocked.json`,
    label: "verdict set to 'inconclusive' (not in enum) in blocked verify-output",
    mutate: (obj) => { obj.verdict = "inconclusive"; return obj; },
    keyword: "enum",
  },
  {
    id: "build-critique",
    file: `${FIXTURES_BF}/defects/off-blast-radius/critique.flagged.json`,
    label: "delete verdict (required key missing) in flagged critique",
    mutate: (obj) => { delete obj.verdict; return obj; },
    keyword: "required",
  },
  // Mode-structure defects (direction-2 extension: D14-discriminated enforcement)
  // .hld: components skeleton mode missing skeleton-required key
  {
    id: "components",
    file: `${FIXTURES_GF}/.hld/skeleton/components.json`,
    label: "skeleton-mode: delete components (mode-required structural key missing)",
    mutate: (obj) => { delete obj.components; return obj; },
    keyword: "required",
  },
  // .hld: components increment mode missing increment-required key
  {
    id: "components",
    file: `${FIXTURES_GF}/.hld/slices/S4/components.json`,
    label: "increment-mode: delete introduced_components (mode-required structural key missing)",
    mutate: (obj) => { delete obj.introduced_components; return obj; },
    keyword: "required",
  },
  // .build: build-plan skeleton-build mode missing skeleton-required key
  {
    id: "build-plan",
    file: `${FIXTURES_GF}/.build/skeleton/build-plan.json`,
    label: "skeleton-build mode: delete walking_skeleton_flow (mode-required key missing)",
    mutate: (obj) => { delete obj.walking_skeleton_flow; return obj; },
    keyword: "required",
  },
  // .build: integration-record slice-build mode missing slice-required key
  {
    id: "integration-record",
    file: `${FIXTURES_GF}/.build/slices/S4/integration-record.json`,
    label: "slice-build mode: delete slice_path (mode-required structural key missing)",
    mutate: (obj) => { delete obj.slice_path; return obj; },
    keyword: "required",
  },
];

for (const { id, file, label, mutate, keyword } of dir2Cases) {
  let base;
  try { base = readJSON(file); }
  catch (e) { fail++; console.log(`  FAIL (read): ${id} defect (${label}): ${e.message}`); continue; }
  const mutated = mutate(cloneJSON(base));
  const r = runValidate(mutated, id);
  const hit = r.errors.some(e => e.keyword === keyword);
  const status = !r.valid && hit ? "invalid OK" : "FAIL";
  console.log(`  ${id} defect (${label}) → ${status}`);
  ok(!r.valid, `${id} (${label}): expected invalid, got valid`);
  ok(hit, `${id} (${label}): expected keyword "${keyword}" in errors, got [${r.errors.map(e=>e.keyword).join(",")}]`);
}

// ---------------------------------------------------------------------------
// DIRECTION 2 INVERSE SANITY — discriminator must NOT over-fire
// A skeleton-mode golden lacking increment-mode required keys must still be valid.
// ---------------------------------------------------------------------------
console.log("\n=== Direction 2 inverse sanity: discriminator does not over-fire ===");
{
  // skeleton components golden has no introduced_components — must still validate clean
  const skelComp = readJSON(`${FIXTURES_GF}/.hld/skeleton/components.json`);
  const noIntroduced = cloneJSON(skelComp);
  delete noIntroduced.introduced_components; // not present anyway, but explicit
  const r = runValidate(noIntroduced, "components");
  ok(r.valid, `skeleton components without introduced_components: expected valid (discriminator must not over-fire), got errors: ${r.errors.map(e=>e.keyword).join(",")}`);
  console.log(`  skeleton components missing introduced_components → ${r.valid ? "valid OK (no over-fire)" : "FAIL (over-fire)"}`);
}
{
  // skeleton-build build-plan golden has no slice_id — must still validate clean
  const skelBP = readJSON(`${FIXTURES_GF}/.build/skeleton/build-plan.json`);
  const noSliceId = cloneJSON(skelBP);
  delete noSliceId.slice_id;
  const r = runValidate(noSliceId, "build-plan");
  ok(r.valid, `skeleton-build build-plan without slice_id: expected valid (discriminator must not over-fire), got errors: ${r.errors.map(e=>e.keyword).join(",")}`);
  console.log(`  skeleton-build build-plan missing slice_id → ${r.valid ? "valid OK (no over-fire)" : "FAIL (over-fire)"}`);
}

// ---------------------------------------------------------------------------
// DETERMINISM — same input → byte-identical result twice
// ---------------------------------------------------------------------------
console.log("\n=== Determinism check ===");
{
  const gf_class = readJSON(`${FIXTURES_GF}/.aprd/01-classification.json`);
  const a = JSON.stringify(runValidate(gf_class, "01-classification"));
  const b = JSON.stringify(runValidate(gf_class, "01-classification"));
  ok(a === b, "determinism: two runs differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

// cleanup
fs.rmSync(tmp, { recursive: true, force: true });

const dir2Count = dir2Cases.length;
console.log(`\ndirection-2: ${dir2Count} defect cases`);
console.log(`${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
