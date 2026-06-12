#!/usr/bin/env node
// Both-directions self-test for baseline-map.mjs (BASELINE-MAP det emitter).
// Verify bar = DETERMINISTIC fields only (behavior-over-byte; conventions prose tolerated):
//   id_high_water (every namespace max), integration_seams (set {at,kind,contract_ref}),
//   existing_oracle.suites (set) + must_stay_green, frozen_locks (path->status).
// Direction 1 (known-good): emitter det-fields == golden for brownfield-feature AND -bugfix;
//   validateFile passes vs baseline-map schema.
// Direction 2 (planted defect): mutate a SOURCE in a scratch copy (raise an R-id / drop a
//   seam component's realizes_seam / flip a lock status) -> emitter det-field FLAGS the change.
// Determinism: emit twice -> deep-equal. Mirrors verdict.selftest.mjs / coverage.selftest.mjs.
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { emit, idHighWater, integrationSeams } from "./baseline-map.mjs";
import { validateFile } from "../validate.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const FIX = `${ROOT}/_fixtures`;
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// compare det-fields of emitted map vs golden. Returns list of diff strings (empty = match).
function detDiff(got, golden) {
  const diffs = [];
  // id_high_water: every namespace in golden must match (compare per spec+golden keys)
  const keys = new Set([...Object.keys(golden.id_high_water), ...Object.keys(got.id_high_water)]);
  for (const k of keys) {
    if (got.id_high_water[k] !== golden.id_high_water[k])
      diffs.push(`id_high_water.${k}: got ${got.id_high_water[k]} != golden ${golden.id_high_water[k]}`);
  }
  // integration_seams: set of "at|kind|contract_ref"
  const seamKey = (s) => `${s.at}|${s.kind}|${s.contract_ref}`;
  const gotSeams = new Set(got.integration_seams.map(seamKey));
  const goldSeams = new Set(golden.integration_seams.map(seamKey));
  for (const s of goldSeams) if (!gotSeams.has(s)) diffs.push(`integration_seams missing: ${s}`);
  for (const s of gotSeams) if (!goldSeams.has(s)) diffs.push(`integration_seams extra: ${s}`);
  // existing_oracle.suites: set + must_stay_green
  const gotSu = new Set(got.existing_oracle.suites);
  const goldSu = new Set(golden.existing_oracle.suites);
  for (const s of goldSu) if (!gotSu.has(s)) diffs.push(`oracle suite missing: ${s}`);
  for (const s of gotSu) if (!goldSu.has(s)) diffs.push(`oracle suite extra: ${s}`);
  if (got.existing_oracle.must_stay_green !== golden.existing_oracle.must_stay_green)
    diffs.push(`must_stay_green mismatch`);
  // frozen_locks: path->status (compare golden's baseline lock entries)
  for (const [p, st] of Object.entries(golden.frozen_locks)) {
    if (got.frozen_locks[p] !== st) diffs.push(`frozen_locks.${p}: got ${got.frozen_locks[p]} != golden ${st}`);
  }
  return diffs;
}

// ===========================================================================
// DIRECTION 1 — known-good: emitter det-fields == golden, both brownfield classes
// ===========================================================================
console.log("=== Direction 1: emitter det-fields == golden (feature + bugfix) ===");
for (const fixture of ["brownfield-feature", "brownfield-bugfix"]) {
  const root = path.join(FIX, fixture);
  const got = emit(root);
  const golden = readJSON(path.join(root, ".aprd", "baseline-map.json"));
  const diffs = detDiff(got, golden);
  ok(diffs.length === 0, `${fixture} det-fields match golden — diffs: ${JSON.stringify(diffs)}`);
  console.log(`  ${fixture}: id_high_water match=${diffs.filter(d => d.startsWith("id_high")).length === 0}` +
    ` seams=${got.integration_seams.length} suites=${JSON.stringify(got.existing_oracle.suites)}`);
  // emitted map valid vs schema
  const tmp = path.join(os.tmpdir(), `bm-${fixture}.json`);
  fs.writeFileSync(tmp, JSON.stringify(got));
  const v = validateFile(tmp, "baseline-map");
  ok(v.valid, `${fixture} emitted map valid vs schema — errors: ${JSON.stringify(v.errors)}`);
  fs.unlinkSync(tmp);
  console.log(`  ${fixture}: schema valid=${v.valid}`);
}

// ===========================================================================
// DIRECTION 2 — planted defects on a scratch copy of the source -> emitter FLAGS
// ===========================================================================
console.log("\n=== Direction 2: planted source defects → det-field flags change ===");

// scratch root = recursive copy of feature fixture (so we may mutate sources safely)
function copyTree(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyTree(s, d);
    else fs.copyFileSync(s, d);
  }
}
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "bm-scratch-"));
const root = path.join(scratch, "proj");
copyTree(path.join(FIX, "brownfield-feature"), root);
const baseline = emit(root);

// defect A: inject a higher R-id (R99) into the frozen baseline aprd -> R high-water rises
{
  const aprd = path.join(root, ".aprd", "aprd.frozen.md");
  fs.appendFileSync(aprd, "\n- R99: planted higher requirement id\n");
  const hw = idHighWater(root);
  ok(hw.R === 99, `planted R99 must raise R high-water (got ${hw.R})`);
  ok(hw.R !== baseline.id_high_water.R, "R high-water changed vs baseline");
  console.log(`  planted R99 → R high-water ${baseline.id_high_water.R} → ${hw.R}`);
  // restore
  fs.copyFileSync(path.join(FIX, "brownfield-feature", ".aprd", "aprd.frozen.md"), aprd);
}

// defect B: drop a seam component's realizes_seam (C6 ingress) -> seam disappears
{
  const compPath = path.join(root, ".hld", "skeleton", "components.json");
  const comps = readJSON(compPath);
  const c6 = comps.components.find((c) => c.id === "C6");
  c6.realizes_seam = [];
  fs.writeFileSync(compPath, JSON.stringify(comps));
  const seams = integrationSeams(root);
  const hasIngress = seams.some((s) => s.at === "C6" && s.kind === "ingress");
  ok(!hasIngress, "dropping C6.realizes_seam removes the ingress seam");
  console.log(`  dropped C6 realizes_seam → ingress seam present=${hasIngress}`);
  // restore
  fs.copyFileSync(path.join(FIX, "brownfield-feature", ".hld", "skeleton", "components.json"), compPath);
}

// defect C: flip a baseline lock status frozen->draft -> emitter records the non-frozen status
{
  const lockPath = path.join(root, ".hld", "skeleton.lock");
  const lock = readJSON(lockPath);
  lock.status = "draft";
  fs.writeFileSync(lockPath, JSON.stringify(lock));
  const map = emit(root);
  ok(map.frozen_locks[".hld/skeleton.lock"] === "draft", "flipped lock status surfaces as draft");
  ok(map.frozen_locks[".hld/skeleton.lock"] !== baseline.frozen_locks[".hld/skeleton.lock"],
    "lock status changed vs baseline");
  console.log(`  flipped skeleton.lock status → ${map.frozen_locks[".hld/skeleton.lock"]}`);
  fs.copyFileSync(path.join(FIX, "brownfield-feature", ".hld", "skeleton.lock"), lockPath);
}

// ===========================================================================
// DETERMINISM — emit twice → deep-equal (byte-identical JSON)
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = JSON.stringify(emit(path.join(FIX, "brownfield-feature")));
  const b = JSON.stringify(emit(path.join(FIX, "brownfield-feature")));
  ok(a === b, "determinism: two emits differ");
  console.log(`  determinism → ${a === b ? "stable" : "DRIFT"}`);
}

// cleanup scratch
fs.rmSync(scratch, { recursive: true, force: true });

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
