#!/usr/bin/env node
// Regression: GAP-DETECT end-to-end via REAL MCP tool surface (adp-server/tools/index.js).
// Both directions: GOOD (architecture gap → disposition=ask, gap_counts.architecture=1)
//                 + DEFECT (cosmetic gap → disposition=assume, gap_counts.architecture=0).
// Closes RC-2: asserts artifact present in adp_derive response (not just output_path).
// Exit 0 = all pass; exit 1 = any failure.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adp_derive } from "./tools/index.js";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${msg}`); }
};

const outDir = path.join(here, "_regression/out");
fs.mkdirSync(outDir, { recursive: true });

// good primitives: architecture blast_radius → disposition=ask
const goodPrimitives = {
  gaps: [{
    gap: "Auth mechanism unspecified",
    refs: ["R1"],
    interpretations: ["oauth provider", "email+password in-house"],
    recommended_default: "email+password in-house",
    blast_radius: "architecture",
    reason: "oauth adds external identity-provider dependency, changes user data model",
  }],
  dismissed_unknowns: [],
};

// defect primitives: cosmetic blast_radius → disposition=assume (discriminator)
const defectPrimitives = {
  gaps: [{
    gap: "Auth mechanism unspecified",
    refs: ["R1"],
    interpretations: ["oauth provider", "email+password in-house"],
    recommended_default: "email+password in-house",
    blast_radius: "cosmetic",   // PLANTED DEFECT: wrong tier
    reason: "oauth adds external identity-provider dependency, changes user data model",
  }],
  dismissed_unknowns: [],
};

// ---------------------------------------------------------------------------
// Direction A — GOOD: architecture gap
// ---------------------------------------------------------------------------
console.log("=== Direction A: GOOD (architecture gap) ===");
{
  const result = await adp_derive(
    { schemaId: "04-gaps", primitives: goodPrimitives, output_path: "adp-server/_regression/out/good.04-gaps.json" },
    { root: ROOT }
  );
  ok(result.output_path === "adp-server/_regression/out/good.04-gaps.json",
    `output_path expected set, got: ${result.output_path}`);
  ok(result.artifact != null,
    `artifact must be present in response (RC-2 fix) — got null/undefined`);
  const a = result.artifact;
  ok(a && a.gaps && a.gaps.length === 1,
    `artifact.gaps.length expected 1, got ${a && a.gaps ? a.gaps.length : "MISSING"}`);
  ok(a && a.gaps && a.gaps[0].id === "G1",
    `gaps[0].id expected "G1", got "${a && a.gaps && a.gaps[0] ? a.gaps[0].id : "MISSING"}"`);
  ok(a && a.gaps && a.gaps[0].disposition === "ask",
    `gaps[0].disposition expected "ask", got "${a && a.gaps && a.gaps[0] ? a.gaps[0].disposition : "MISSING"}"`);
  ok(a && a.gap_counts && a.gap_counts.architecture === 1,
    `gap_counts.architecture expected 1, got ${a && a.gap_counts ? a.gap_counts.architecture : "MISSING"}`);
  ok(a && a.gap_counts && a.gap_counts.cosmetic === 0,
    `gap_counts.cosmetic expected 0, got ${a && a.gap_counts ? a.gap_counts.cosmetic : "MISSING"}`);
  // verify file written
  const written = JSON.parse(fs.readFileSync(path.join(ROOT, "adp-server/_regression/out/good.04-gaps.json"), "utf8"));
  ok(written.gaps[0].id === "G1", `written file: gaps[0].id expected "G1", got "${written.gaps[0].id}"`);
  ok(written.gaps[0].disposition === "ask", `written file: disposition expected "ask", got "${written.gaps[0].disposition}"`);
  console.log(`  gaps[0].id=${a && a.gaps && a.gaps[0] ? a.gaps[0].id : "?"} disposition=${a && a.gaps && a.gaps[0] ? a.gaps[0].disposition : "?"} gap_counts.architecture=${a && a.gap_counts ? a.gap_counts.architecture : "?"}`);
  console.log(`  Direction A: ${fail === 0 ? "PASS" : "FAIL"}`);
}

// ---------------------------------------------------------------------------
// Direction B — DEFECT: cosmetic gap (discriminator — must diverge from A)
// output_path passed → write/splice path exercised in BOTH directions.
// ---------------------------------------------------------------------------
console.log("\n=== Direction B: DEFECT (cosmetic gap planted) ===");
let dirAFail = fail;
{
  const result = await adp_derive(
    { schemaId: "04-gaps", primitives: defectPrimitives, output_path: "adp-server/_regression/out/defect.04-gaps.json" },
    { root: ROOT }
  );
  ok(result.output_path === "adp-server/_regression/out/defect.04-gaps.json",
    `output_path expected set, got: ${result.output_path}`);
  ok(result.artifact != null,
    `artifact must be present in response (RC-2 fix)`);
  const a = result.artifact;
  ok(a && a.gaps && a.gaps[0].disposition === "assume",
    `defect: disposition expected "assume" (cosmetic), got "${a && a.gaps && a.gaps[0] ? a.gaps[0].disposition : "MISSING"}"`);
  ok(a && a.gap_counts && a.gap_counts.architecture === 0,
    `defect: gap_counts.architecture expected 0, got ${a && a.gap_counts ? a.gap_counts.architecture : "MISSING"}`);
  ok(a && a.gap_counts && a.gap_counts.cosmetic === 1,
    `defect: gap_counts.cosmetic expected 1, got ${a && a.gap_counts ? a.gap_counts.cosmetic : "MISSING"}`);
  // verify file written + spliced to disk
  const written = JSON.parse(fs.readFileSync(path.join(ROOT, "adp-server/_regression/out/defect.04-gaps.json"), "utf8"));
  ok(written.gaps[0].disposition === "assume", `written file: disposition expected "assume", got "${written.gaps[0].disposition}"`);
  ok(written.gap_counts.cosmetic === 1, `written file: gap_counts.cosmetic expected 1, got ${written.gap_counts.cosmetic}`);
  const diverges = a && a.gaps && a.gaps[0].disposition === "assume"; // vs "ask" in Direction A
  ok(diverges, `defect must diverge from good on disposition (assume vs ask)`);
  console.log(`  gaps[0].disposition=${a && a.gaps && a.gaps[0] ? a.gaps[0].disposition : "?"} gap_counts.architecture=${a && a.gap_counts ? a.gap_counts.architecture : "?"} cosmetic=${a && a.gap_counts ? a.gap_counts.cosmetic : "?"}`);
  console.log(`  DIVERGE check: defect.disposition=assume vs good.disposition=ask → caught: ${diverges}`);
  console.log(`  Direction B: ${(fail - dirAFail) === 0 ? "PASS" : "FAIL"}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n============================`);
console.log(`SUMMARY: ${pass} assertions passed, ${fail} failed`);
console.log(fail === 0 ? "RESULT: PASS" : "RESULT: FAIL");
process.exit(fail === 0 ? 0 : 1);
