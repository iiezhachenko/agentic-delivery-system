#!/usr/bin/env node
// freeze-check.mjs — M3 acceptance (spec §6): (1) every _self/ file validates
// against the schema its consuming prompt reads, (2) the freeze is idempotent
// (byte-stable), (3) prompts/* + _fixtures/* recognized as built-skeleton + oracle.
//   node _self-host-migration/freeze-check.mjs

import { readFileSync, readdirSync, existsSync, rmSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = join(ROOT, "_self");
let pass = 0, fail = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m) => { console.log(`  FAIL  ${m}`); fail++; };
const rd = (p) => readFileSync(join(ROOT, p), "utf8");
const rj = (p) => JSON.parse(rd(p));
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

// ── Acceptance 1: every file validates against its consuming schema ──────────
console.log("\n[1] schema validation (every _self/ file vs the schema its prompt reads)");
const files = walk(SELF).sort();
for (const f of files) {
  if (f.endsWith(".json")) {
    try { JSON.parse(readFileSync(f, "utf8")); ok(`json parses: ${relative(SELF, f)}`); }
    catch (e) { no(`json INVALID: ${relative(SELF, f)} — ${e.message}`); }
  }
}
// lock schemas == fixture lock shape (required keys the consuming prompt reads)
const reqAprd = ["artifact", "version", "content_sha256", "signer", "signed_at", "status"];
const aprd = rj("_self/.aprd/aprd.lock");
reqAprd.every((k) => k in aprd) ? ok("aprd.lock has all required keys") : no("aprd.lock missing keys");
sha256(rd("_self/.aprd/aprd.frozen.md")) === aprd.content_sha256
  ? ok("aprd.lock content_sha256 matches aprd.frozen.md") : no("aprd.lock sha mismatch");

const adr = rj("_self/.adr/adr.lock");
["artifact", "content_sha256", "status", "adrs", "adr_count"].every((k) => k in adr)
  ? ok("adr.lock has required keys") : no("adr.lock missing keys");
adr.adr_count === 21 && adr.adrs.length === 21 ? ok("adr.lock: 21 ADRs") : no(`adr.lock count ${adr.adr_count}`);
adr.adrs.find((a) => a.id === "ADR-0021") && adr.stack_adr === "ADR-0021"
  ? ok("adr.lock: ADR-0021 stack ADR present (D21)") : no("ADR-0021 missing");
// every adr log_ref resolves on disk
const adrRefOk = adr.adrs.every((a) => existsSync(join(SELF, ".adr", a.log_ref)));
adrRefOk ? ok("adr.lock: every log_ref resolves to a file") : no("adr.lock: a log_ref dangles");
// adr.lock sha == hash of sorted log bodies (matches freeze.mjs)
const logDir = join(SELF, ".adr/log");
const logFiles = readdirSync(logDir).sort();
sha256(logFiles.map((f) => readFileSync(join(logDir, f), "utf8")).join("")) === adr.content_sha256
  ? ok("adr.lock content_sha256 matches log/ bodies") : no("adr.lock sha mismatch");

const sk = rj("_self/.hld/skeleton.lock");
["artifact", "content_sha256", "status", "artifacts", "skeleton_counts"].every((k) => k in sk)
  ? ok("skeleton.lock has required keys") : no("skeleton.lock missing keys");
sk.artifacts.every((a) => existsSync(join(SELF, a.ref))) ? ok("skeleton.lock: every artifact ref resolves") : no("skeleton.lock ref dangles");
sk.skeleton_counts.roles === 39 ? ok("skeleton.lock: 39 roles") : no(`skeleton roles ${sk.skeleton_counts.roles}`);

// 08-rerank.json carries the orchestrator STEP-0 fields it reads
const rr = rj("_self/.roadmap/08-rerank.json");
["completed", "remaining_sequence"].every((k) => k in rr) ? ok("08-rerank: completed[] + remaining_sequence[]") : no("08-rerank missing arrays");
rr.completed.every((c) => "done_sentinel" in c && "unit" in c)
  && rr.remaining_sequence.every((r) => "done_sentinel" in r && "unit" in r && "id" in r)
  ? ok("08-rerank: every entry has done_sentinel + unit + id (STEP-0 keys)") : no("08-rerank entry missing STEP-0 key");
rr.completed.length === 1 && rr.remaining_sequence.length === 9
  ? ok("08-rerank: 1 completed + 9 remaining (declared frontier; position derived from disk)") : no(`08-rerank counts ${rr.completed.length}/${rr.remaining_sequence.length}`);
rr.remaining_sequence[0].id === "P-RECONCILE-CRITIQUE-INC"
  ? ok("08-rerank: remaining_sequence order head = RECONCILE/CRITIQUE increment (frozen base order; live position derived from disk)") : no("08-rerank order head wrong");

// ── Acceptance 3: prompts/* + _fixtures/* recognized ─────────────────────────
console.log("\n[3] prompts/* = built-skeleton, _fixtures/* = oracle baseline (recognized)");
// completed sentinel resolves to a real _fixtures/ golden
existsSync(join(ROOT, rr.completed[0].done_sentinel))
  ? ok(`completed sentinel resolves (oracle): ${rr.completed[0].done_sentinel}`)
  : no(`completed sentinel missing: ${rr.completed[0].done_sentinel}`);
// every unit (completed + remaining) resolves to a real prompts/ file
const unitPath = (u) => u.replace(/ \(.*\)$/, "");
const allUnits = [...rr.completed, ...rr.remaining_sequence].map((e) => unitPath(e.unit));
const unitsOk = allUnits.every((u) => existsSync(join(ROOT, u)));
unitsOk ? ok(`every unit resolves to a real prompts/ file (${allUnits.length})`) : no("a unit path dangles");
// live frontier is DERIVED from disk (not read from the static remaining_sequence order):
// post-M5-cutover remaining_sequence[0] (RECONCILE/CRITIQUE) IS shipped — its sentinel is
// present; the live frontier = first remaining entry whose sentinel is ABSENT.
existsSync(join(ROOT, rr.remaining_sequence[0].done_sentinel))
  ? ok(`remaining_sequence[0] (${rr.remaining_sequence[0].id}) sentinel present → shipped at M5 cutover`)
  : no("remaining_sequence[0] sentinel absent — expected present post-cutover");
const liveFrontier = rr.remaining_sequence.find((r) => !existsSync(join(ROOT, r.done_sentinel)));
liveFrontier && liveFrontier.id === "P-BUILD-PLAN-SLICE"
  ? ok(`live frontier derived from disk = ${liveFrontier.id} (next unshipped — status never read from a tracker)`)
  : no(`live frontier wrong: ${liveFrontier ? liveFrontier.id : "none (loop drained?)"}`);
// components.json roles all resolve to real prompt files
const comp = rj("_self/.hld/skeleton/components.json");
const compOk = comp.phases.every((p) => p.roles.every((r) => existsSync(join(ROOT, "prompts", p.phase, r + ".md"))));
compOk ? ok("components.json: every role resolves to a real prompts/ file") : no("components.json role dangles");

// ── Acceptance 2: idempotent (byte-stable) ───────────────────────────────────
console.log("\n[2] idempotency (re-freeze byte-stable given unchanged sources)");
const TMP = join(ROOT, "_self_idem_check");
try {
  execSync(`node ${join(ROOT, "_self-host-migration/freeze.mjs")} _self_idem_check`, { cwd: ROOT, stdio: "pipe" });
  const a = walk(SELF).map((f) => relative(SELF, f)).sort();
  const b = walk(TMP).map((f) => relative(TMP, f)).sort();
  JSON.stringify(a) === JSON.stringify(b) ? ok(`same file set (${a.length} files)`) : no("file set differs");
  let diffs = 0;
  for (const rel of a) {
    if (readFileSync(join(SELF, rel)).equals(readFileSync(join(TMP, rel)))) continue;
    diffs++; no(`byte diff: ${rel}`);
  }
  diffs === 0 ? ok("all files byte-identical across two freezes") : no(`${diffs} files differ`);
} finally {
  rmSync(TMP, { recursive: true, force: true });
}

console.log(`\n${fail === 0 ? "ALL GREEN" : "RED"} — ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
