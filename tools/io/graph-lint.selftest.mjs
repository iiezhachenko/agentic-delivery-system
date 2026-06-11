#!/usr/bin/env node
// Both-directions self-test for the IO-graph lint (verify mandate — the oracle).
// graph-lint gates the data-flow + PR2 contract chain -> a buggy lint lets drift ship.
// forward: REAL repo data -> zero violations, schema files all present, generated chain == frozen.
// reverse: 5 planted defects each provoke >=1 violation (consumed-not-produced, unknown-role,
//   unknown-group, chain-drift, schema-file-missing).
// Exits 0 all-green, 1 any-fail. Zero deps, mirrors resolve.selftest.mjs.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import {
  generateContracts, lintGraph, checkSchemaFiles,
  loadMeta, loadManifest, loadFrozenContracts, deriveKnownRoles, deepEqual,
} from "./graph-lint.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, "..", "..");
const REGISTRY_DIR = path.join(ROOT, "schemas");

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };

// deep clone via JSON (meta/manifest are plain JSON — safe).
const clone = (o) => JSON.parse(JSON.stringify(o));
// any violation of a given check present?
const hasCheck = (res, check) => res.violations.some(v => v.check === check);

// --- load REAL repo data ----------------------------------------------------
const META = loadMeta(REGISTRY_DIR);
const MANIFEST = loadManifest(path.join(ROOT, "io", "io-manifest.json"));
const FROZEN = loadFrozenContracts(path.join(ROOT, ".hld", "skeleton", "contracts.json"));
const KNOWN = deriveKnownRoles(path.join(ROOT, "prompts"));

// ===========================================================================
// FORWARD (known-good PASS) — real graph is clean.
// ===========================================================================
{
  const res = lintGraph({ meta: META, manifest: MANIFEST, knownRoles: KNOWN, frozenContracts: FROZEN });
  ok(res.violations.length === 0, `forward: real graph zero violations (got ${res.violations.length}: ${JSON.stringify(res.violations)})`);
  ok(checkSchemaFiles(META, REGISTRY_DIR).length === 0, "forward: all schema files exist on disk");
  ok(deepEqual(generateContracts(META), FROZEN), "forward: generated chain deep-equals frozen contracts.json");
}

// ===========================================================================
// REVERSE 1 — consumed-not-produced: clear a producer of a still-consumed schema.
// ===========================================================================
{
  const m = clone(META);
  // 02-extraction is consumed by GAP-DETECT/SYNTHESIZE/SLICE-EXTRACT; drop its producer.
  m["02-extraction"].produced_by = [];
  const res = lintGraph({ meta: m, manifest: MANIFEST, knownRoles: KNOWN, frozenContracts: FROZEN });
  ok(hasCheck(res, "pr2-closure"), "reverse: consumed-not-produced -> pr2-closure violation");
}

// ===========================================================================
// REVERSE 2 — unknown-role: inject a bogus consumer.
// ===========================================================================
{
  const m = clone(META);
  m["02-extraction"].consumed_by.push("ZZZ-NOT-A-ROLE");
  const res = lintGraph({ meta: m, manifest: MANIFEST, knownRoles: KNOWN, frozenContracts: FROZEN });
  ok(hasCheck(res, "roles-resolve"), "reverse: unknown-role in consumed_by -> roles-resolve violation");
}

// ===========================================================================
// REVERSE 3 — unknown-group: inject a bogus group-id string into a role's always.
// ===========================================================================
{
  const man = clone(MANIFEST);
  man.roles["IMPLEMENT"].always.push("no-such-group");
  const res = lintGraph({ meta: META, manifest: man, knownRoles: KNOWN, frozenContracts: FROZEN });
  ok(hasCheck(res, "group-refs-resolve"), "reverse: unknown-group ref -> group-refs-resolve violation");
}

// ===========================================================================
// REVERSE 4 — chain-drift: drop every 04-build schema -> phases lose a stage.
// ===========================================================================
{
  const m = clone(META);
  for (const id of Object.keys(m)) if (m[id].path.startsWith("04-build/")) delete m[id];
  const res = lintGraph({ meta: m, manifest: MANIFEST, knownRoles: KNOWN, frozenContracts: FROZEN });
  ok(hasCheck(res, "contracts-match"), "reverse: dropped 04-build phase -> contracts-match violation");
}

// ===========================================================================
// REVERSE 5 — schema-file-missing: synthetic registry referencing a dead path.
// ===========================================================================
{
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "graphlint-selftest-"));
  const synthMeta = { "ghost": { path: "99-ghost/ghost.schema.json", version: 1, produced_by: ["IMPLEMENT"], consumed_by: ["INTEGRATE"] } };
  fs.writeFileSync(path.join(dir, "_meta.json"), JSON.stringify(synthMeta));
  const missing = checkSchemaFiles(synthMeta, dir);
  ok(missing.length >= 1, "reverse: synthetic dead schema path -> checkSchemaFiles >=1");
}

console.log(`\ngraph-lint selftest: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
