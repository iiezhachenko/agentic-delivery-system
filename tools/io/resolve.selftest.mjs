#!/usr/bin/env node
// Both-directions self-test for the IO resolver (mirror verify mandate, 03-io-resolver-spec).
// Resolver decides what seeds the clean-room -> a buggy resolver makes every verify lie.
// forward: fixed (role,state) -> expected path set (golden) on a synthetic fixture tree.
// reverse: planted-wrong state caught (skeleton-build pulls NO slices/ path).
// error paths: unfilled placeholder, dead lock-indirection, zero-match required glob -> throw.
// determinism: same (manifest,state,disk) -> byte-identical list twice.
// Exits 0 all-green, 1 any-fail. Zero deps, mirrors economy-lint/selftest.mjs.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { resolve, loadManifest, ResolveError } from "./resolve.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const MANIFEST = loadManifest(path.resolve(here, "..", "..", "io", "io-manifest.json"));

let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };

// --- synthetic fixture tree -------------------------------------------------
// Minimal disk that exercises IMPLEMENT's full 4-way set + error paths.
function buildTree(spec) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "io-selftest-"));
  for (const [rel, body] of Object.entries(spec)) {
    const abs = path.join(root, rel);
    fs.mkdirSync(path.dirname(abs), { recursive: true });
    fs.writeFileSync(abs, body);
  }
  return root;
}

const APRD_LOCK = JSON.stringify({ artifact: "aprd.v5.frozen.md", status: "frozen" });
const TREE = {
  ".adr/adr.lock": "{}",
  ".adr/log/0001-stack.md": "# stack",
  ".adr/log/0002-persistence.md": "# db",
  ".hld/skeleton.lock": "{}",
  ".hld/skeleton/components.json": "{}",
  ".hld/skeleton/contracts.json": "{}",
  ".hld/skeleton/data-model.json": "{}",
  ".aprd/aprd.lock": APRD_LOCK,
  ".aprd/aprd.v5.frozen.md": "# what v5",
  ".aprd/diagnosis.json": "{}",
  ".aprd/baseline-map.json": "{}",
  ".build/skeleton/build-plan.json": "{}",
  ".build/skeleton/build-record.json": "{}",
  ".build/skeleton/oracle/oracle.lock": "{}",
  ".build/skeleton/oracle/oracle.json": "{}",
  ".build/skeleton/oracle/contract/test_ct1.py": "x",
  ".build/skeleton/oracle/contract/conftest.py": "x",
  ".build/slices/S4/build-plan.json": "{}",
  ".build/slices/S4/build-record.json": "{}",
  ".build/slices/S4/oracle/oracle.lock": "{}",
  ".build/slices/S4/oracle/oracle.json": "{}",
  ".build/slices/S4/oracle/contract/test_ct2.py": "x",
  ".build/slices/S4/oracle/contract/conftest.py": "x",
  ".build/slices/S4/oracle/reproduction/test_repro.py": "x",
  ".roadmap/08-rerank.json": "{}",
  "src/freelancer_app/__init__.py": "",
  "src/freelancer_app/web_ingress/app.py": "x",
};

const root = buildTree(TREE);
const paths = (role, state) =>
  resolve(MANIFEST, { role, ...state }, { root }).resolved.map(r => r.path).sort();
const has = (set, p) => set.includes(p);
const anySlice = (set) => set.some(p => p.includes("/slices/"));

// ===========================================================================
// FORWARD 1 — IMPLEMENT skeleton-build: full skeleton set, ZERO slice paths.
// ===========================================================================
{
  const s = paths("IMPLEMENT", { mode: "skeleton-build", scope: "skeleton" });
  ok(has(s, ".adr/adr.lock"), "skeleton: frozen_frame adr.lock present");
  ok(has(s, ".hld/skeleton/components.json"), "skeleton: frozen_frame components present");
  ok(has(s, ".adr/log/0001-stack.md") && has(s, ".adr/log/0002-persistence.md"),
     "skeleton: ADR-body glob expanded to both bodies");
  ok(has(s, ".build/skeleton/oracle/oracle.lock"), "skeleton: frozen_oracle {scope}=skeleton filled");
  ok(has(s, ".build/skeleton/oracle/contract/test_ct1.py"), "skeleton: contract glob expanded");
  ok(has(s, ".build/skeleton/build-plan.json"), "skeleton: build-plan present");
  ok(has(s, ".build/skeleton/build-record.json"), "skeleton: optional build-record present (exists)");
  // REVERSE direction (planted-wrong guard): skeleton mode MUST NOT leak any slice path.
  ok(!anySlice(s), "skeleton: NO slices/ path leaks (reverse-direction guard)");
}

// ===========================================================================
// FORWARD 2 (GOLDEN) — IMPLEMENT slice-build + bugfix @ S4:
//   MUST include diagnosis + reproduction + src/**; MUST NOT include baseline-map.
// ===========================================================================
{
  const s = paths("IMPLEMENT", { mode: "slice-build", class: "bugfix", scope: "slices/S4", slice: "S4" });
  ok(has(s, ".aprd/diagnosis.json"), "bugfix: diagnosis.json present");
  ok(has(s, ".build/slices/S4/oracle/reproduction/test_repro.py"), "bugfix: reproduction test glob present");
  ok(has(s, "src/freelancer_app/web_ingress/app.py"), "bugfix: src/** glob present");
  ok(has(s, ".aprd/aprd.v5.frozen.md"), "bugfix: current_what lock-indirection -> aprd.v5.frozen.md");
  ok(has(s, ".build/slices/S4/oracle/oracle.lock"), "bugfix: frozen_oracle {scope}=slices/S4 filled");
  ok(has(s, ".build/slices/S4/build-plan.json"), "bugfix: slice build-plan {slice}=S4 filled");
  ok(has(s, ".build/skeleton/oracle/oracle.json"), "bugfix: inherited skeleton oracle.json present");
  ok(!has(s, ".aprd/baseline-map.json"), "bugfix: baseline-map ABSENT (feature-add only) — class discrimination");
}

// ===========================================================================
// FORWARD 3 — IMPLEMENT slice-build + feature-add @ S4:
//   MUST include baseline-map + src/**; MUST NOT include diagnosis.
// ===========================================================================
{
  const s = paths("IMPLEMENT", { mode: "slice-build", class: "feature-add", scope: "slices/S4", slice: "S4" });
  ok(has(s, ".aprd/baseline-map.json"), "feature-add: baseline-map present");
  ok(has(s, "src/freelancer_app/web_ingress/app.py"), "feature-add: src/** glob present");
  ok(has(s, ".aprd/aprd.v5.frozen.md"), "feature-add: current_what lock-indirection present");
  ok(!has(s, ".aprd/diagnosis.json"), "feature-add: diagnosis ABSENT (bugfix only) — class discrimination");
}

// ===========================================================================
// DEDUPE — current_what pulled by both slice-build and feature-add: appears once.
// ===========================================================================
{
  const s = resolve(MANIFEST, { role: "IMPLEMENT", mode: "slice-build", class: "feature-add", scope: "slices/S4", slice: "S4" }, { root }).resolved;
  const n = s.filter(r => r.path === ".aprd/aprd.v5.frozen.md").length;
  ok(n === 1, `dedupe: current_what resolved path appears once (got ${n})`);
}

// ===========================================================================
// DETERMINISM — same (state,disk) twice -> byte-identical.
// ===========================================================================
{
  const a = JSON.stringify(paths("IMPLEMENT", { mode: "slice-build", class: "bugfix", scope: "slices/S4", slice: "S4" }));
  const b = JSON.stringify(paths("IMPLEMENT", { mode: "slice-build", class: "bugfix", scope: "slices/S4", slice: "S4" }));
  ok(a === b, "determinism: identical output across two runs");
}

// ===========================================================================
// ERROR PATHS — each must throw ResolveError (exit-1 class), named.
// ===========================================================================
function throwsResolve(fn, msg) {
  try { fn(); fail++; console.log(`  FAIL: ${msg} — expected ResolveError, none thrown`); }
  catch (e) { if (e instanceof ResolveError) pass++; else { fail++; console.log(`  FAIL: ${msg} — wrong error: ${e.message}`); } }
}
// E1: unfilled {slice} (slice-build fires, but state.slice absent).
throwsResolve(
  () => resolve(MANIFEST, { role: "IMPLEMENT", mode: "slice-build", scope: "slices/S4" }, { root }),
  "error: unfilled {slice} placeholder");
// E2: dead lock-indirection (aprd.lock missing 'artifact' field).
{
  const r2 = buildTree({ ".aprd/aprd.lock": "{}", ".roadmap/06-foundation-cut.json": "{}", ".adr/adr.lock": "{}", ".adr/log/0001-x.md": "x" });
  throwsResolve(
    () => resolve(MANIFEST, { role: "DECISION-EXTRACT" }, { root: r2 }),
    "error: dead lock-indirection (no artifact field)");
}
// E3: zero-match required glob (skeleton contract dir empty).
{
  const r3b = buildTree({
    ".adr/adr.lock": "{}", ".adr/log/0001-x.md": "x", ".hld/skeleton.lock": "{}",
    ".aprd/aprd.lock": APRD_LOCK,
    ".hld/skeleton/components.json": "{}", ".hld/skeleton/contracts.json": "{}", ".hld/skeleton/data-model.json": "{}",
    ".build/skeleton/oracle/oracle.lock": "{}", ".build/skeleton/oracle/oracle.json": "{}",
    ".build/skeleton/oracle/contract/.keep": "",          // dir exists, no .py at all
    ".build/skeleton/build-plan.json": "{}",
  });
  throwsResolve(
    () => resolve(MANIFEST, { role: "IMPLEMENT", mode: "skeleton-build", scope: "skeleton" }, { root: r3b }),
    "error: zero-match required glob (contract/*.py)");
}

// ===========================================================================
// COVERAGE — every role in manifest resolves without crashing on a present
//   tree for at least its always-set (smoke: catches unknown-group typos).
// ===========================================================================
{
  let smokeFail = 0;
  for (const role of Object.keys(MANIFEST.roles)) {
    try { resolve(MANIFEST, { role }, { root }); }
    catch (e) {
      // ResolveError from missing required glob/indirection is acceptable here
      // (always-set may need state); a non-ResolveError (e.g. unknown group) is a manifest bug.
      if (!(e instanceof ResolveError)) { smokeFail++; console.log(`  FAIL: role ${role} manifest bug: ${e.message}`); }
    }
  }
  ok(smokeFail === 0, "coverage: no manifest structural bug (unknown group / bad ref) across all roles");
}

console.log(`\nio-resolver selftest: ${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
