#!/usr/bin/env node
// adp-server/response-size.selftest.mjs — assert slim tool responses (ADR-0038/CR-024).
// Mirrors selftest idiom: assert + report + exit nonzero on fail.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { adp_status, adp_derive } from "./tools/index.js";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; console.log(`  PASS: ${msg}`); }
  else       { fail++; console.log(`  FAIL: ${msg}`); }
};

// === adp_status size + shape ===
console.log("=== adp_status slim response ===");
{
  const result = await adp_status({}, { root: ROOT });
  const json = JSON.stringify(result);
  const chars = json.length;
  console.log(`  adp_status char count: ${chars} (was ~43415)`);
  ok(chars < 2000, `adp_status JSON < 2000 chars (got ${chars})`);
  ok(result.frontier !== undefined, "frontier field present");
  ok(result.frontier !== null, "frontier is not null (frontier exists in rerank)");
  ok(result.frontier?.id === "W31i-T01-CLASSIFIER",
    `frontier.id === "W31i-T01-CLASSIFIER" (got ${result.frontier?.id})`);
  ok(typeof result.done_count === "number", `done_count is number (got ${typeof result.done_count})`);
  ok(typeof result.remaining_count === "number", `remaining_count is number (got ${typeof result.remaining_count})`);
  ok(!("done" in result), 'no "done" array key (full array removed)');
  ok(!("remaining" in result), 'no "remaining" array key (full array removed)');
}

// === adp_derive size + shape ===
console.log("\n=== adp_derive slim response ===");
{
  const tmpPath = path.join(os.tmpdir(), `adp-derive-selftest-${Date.now()}.json`);
  // minimal greenfield primitives for 01-classification
  const primitives = {
    is_compound: false,
    subrequests: [{ class: "architecture", summary: "build a thing", confidence: 0.95 }],
  };
  const result = await adp_derive(
    {
      schemaId: "01-classification",
      primitives,
      shell: { request_ref: ".aprd/00-raw-request.md" },
      output_path: path.relative(ROOT, tmpPath),
    },
    { root: ROOT }
  );
  const json = JSON.stringify(result);
  const chars = json.length;
  console.log(`  adp_derive char count: ${chars}`);
  ok(chars < 1500, `adp_derive JSON < 1500 chars (got ${chars})`);
  ok(!("artifact" in result), 'no top-level "artifact" key in derive response');
  ok("output_path" in result, '"output_path" key present');
  ok("needs_confirmation" in result, '"needs_confirmation" key present');
  ok("escape" in result, '"escape" key present');
  // cleanup temp
  try { fs.unlinkSync(tmpPath); } catch {}
}

// === summary ===
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
