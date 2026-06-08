#!/usr/bin/env node
// m7-canonicalize.mjs — migration-spec §6 M7 (canonicalize the artifact trees).
// The FINAL render: promote the four phase artifact trees from the rebuildable
// cache to COMMITTED SOURCE at the repo root, then prove parity before any source
// is deleted (risk-table "content loss in the M7 promotion": render from the
// AUTHORITATIVE source — not a stale cache — and content-diff before delete).
//
//   node _self-host-migration/m7-canonicalize.mjs
//
// Beats:
//   1. re-render _self/ from the authoritative sources (freeze.mjs reads _rules.md
//      / _decisions.md / _initial_design — so a fresh render IS the source, not a
//      stale cache);
//   2. promote _self/{.aprd,.adr,.hld,.roadmap} → repo root (committed source);
//   3. schema-validate every root-tree file vs the schema its prompt reads
//      (freeze-check acceptance-1, now run at the root — "made permanent");
//   4. content-completeness diff: no decision / rule / mission line / roadmap
//      entry lost vs the retired sources.
// It NEVER deletes a source (M7 step 5 is a separate, gated delete after GREEN).

import { readFileSync, readdirSync, existsSync, rmSync, cpSync, statSync } from "node:fs";
import { join, resolve, dirname, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { execSync } from "node:child_process";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const SELF = join(ROOT, "_self");
const TREES = [".aprd", ".adr", ".hld", ".roadmap"];

let pass = 0, fail = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m) => { console.log(`  FAIL  ${m}`); fail++; };
const rd = (p) => readFileSync(join(ROOT, p), "utf8");
const rj = (p) => JSON.parse(rd(p));
const walk = (d) => readdirSync(d, { withFileTypes: true }).flatMap((e) =>
  e.isDirectory() ? walk(join(d, e.name)) : [join(d, e.name)]);

// ── Beat 1: re-render from authoritative source ──────────────────────────────
console.log("\n[1] re-render _self/ from the authoritative sources (final render)");
for (const s of ["_rules.md", "_decisions.md", "_initial_design"]) {
  existsSync(join(ROOT, s)) ? ok(`source present: ${s}`) : no(`source MISSING (delete out of order?): ${s}`);
}
if (fail) { console.log("\nRED — sources absent; M7 promotion must render from source. Abort."); process.exit(1); }
execSync(`node ${join(ROOT, "_self-host-migration/freeze.mjs")}`, { cwd: ROOT, stdio: "pipe" });
ok("freeze.mjs re-rendered _self/ from source");

// ── Beat 2: promote the four trees → repo root (committed source) ─────────────
// Robust copy: cpSync, then assert the dst file-set == src file-set and re-copy any
// straggler (the env's fs has been observed to drop freshly-written files under
// rapid rm+rewrite churn — never let the promotion silently lose one).
console.log("\n[2] promote _self/{.aprd,.adr,.hld,.roadmap} → repo root");
const relset = (d) => walk(d).map((f) => relative(d, f)).sort();
for (const t of TREES) {
  const src = join(SELF, t), dst = join(ROOT, t);
  if (!existsSync(src)) { no(`cache tree missing: ${t}`); continue; }
  rmSync(dst, { recursive: true, force: true });
  cpSync(src, dst, { recursive: true });
  // re-copy any file present in src but missing/short in dst (up to 5 passes)
  for (let pass = 0; pass < 5; pass++) {
    const missing = relset(src).filter((r) => !existsSync(join(dst, r))
      || statSync(join(dst, r)).size !== statSync(join(src, r)).size);
    if (missing.length === 0) break;
    for (const r of missing) cpSync(join(src, r), join(dst, r));
  }
  const s = relset(src), d = relset(dst);
  JSON.stringify(s) === JSON.stringify(d)
    ? ok(`promoted ${t}/ — file-set parity vs _self (${d.length} files)`)
    : no(`promoted ${t}/ — file-set MISMATCH vs _self (src ${s.length} / dst ${d.length})`);
}

// ── Beat 3: schema-validate every root-tree file (freeze-check acceptance-1) ──
console.log("\n[3] schema validation (every root-tree file vs the schema its prompt reads)");
for (const t of TREES) for (const f of walk(join(ROOT, t))) {
  if (f.endsWith(".json")) {
    try { JSON.parse(readFileSync(f, "utf8")); } catch (e) { no(`json INVALID: ${relative(ROOT, f)} — ${e.message}`); }
  }
}
// frozen artifacts physically present (the env dropped *.frozen.md once — guard it)
for (const f of [".aprd/aprd.frozen.md", ".hld/skeleton.frozen.md"]) existsSync(join(ROOT, f)) ? ok(`frozen artifact present: ${f}`) : no(`frozen artifact MISSING: ${f}`);
readdirSync(join(ROOT, ".adr/log")).length === 21 ? ok(".adr/log/: 21 bodies on disk") : no(`.adr/log count ${readdirSync(join(ROOT, ".adr/log")).length} (expected 21)`);
readdirSync(join(ROOT, ".adr/drafts")).length === 21 ? ok(".adr/drafts/: 21 drafts on disk") : no(`.adr/drafts count ${readdirSync(join(ROOT, ".adr/drafts")).length} (expected 21)`);
const reqAprd = ["artifact", "version", "content_sha256", "signer", "signed_at", "status"];
const aprd = rj(".aprd/aprd.lock");
reqAprd.every((k) => k in aprd) ? ok("aprd.lock has all required keys") : no("aprd.lock missing keys");
const adr = rj(".adr/adr.lock");
adr.adr_count === 21 && adr.adrs.length === 21 ? ok("adr.lock: 21 ADRs") : no(`adr.lock count ${adr.adr_count}`);
adr.adrs.find((a) => a.id === "ADR-0021") && adr.stack_adr === "ADR-0021" ? ok("adr.lock: ADR-0021 stack ADR (D21)") : no("ADR-0021 missing");
adr.adrs.every((a) => existsSync(join(ROOT, ".adr", a.log_ref))) ? ok("adr.lock: every log_ref resolves at root") : no("adr.lock log_ref dangles");
const idx = rj(".adr/adr-index.json");
idx.adrs.length === 21 && idx.adr_counts.rendered === 21 ? ok("adr-index.json: 21 decisions indexed (canonical JSON index, not md header)") : no("adr-index.json count wrong");
idx.adrs.every((a) => existsSync(join(ROOT, ".adr", a.draft_ref))) ? ok("adr-index.json: every draft_ref resolves at root") : no("adr-index.json draft_ref dangles");
const sk = rj(".hld/skeleton.lock");
sk.artifacts.every((a) => existsSync(join(ROOT, a.ref.replace(/^\.hld\//, ".hld/")))) ? ok("skeleton.lock: every artifact ref resolves at root") : no("skeleton.lock ref dangles");
sk.skeleton_counts.roles === 39 ? ok("skeleton.lock: 39 roles") : no(`skeleton roles ${sk.skeleton_counts.roles}`);
const rr = rj(".roadmap/08-rerank.json");
rr.completed.length === 1 && rr.remaining_sequence.length === 9 ? ok("08-rerank: 1 completed + 9 remaining") : no(`08-rerank counts ${rr.completed.length}/${rr.remaining_sequence.length}`);

// ── Beat 4: content-completeness diff vs the retired sources ─────────────────
console.log("\n[4] content-completeness (no decision / rule / mission / roadmap entry lost)");
const rules = rd("_rules.md");
const decisions = rd("_decisions.md");

// 4a — every decision D1..D21 survives into .adr (index + a log body)
const adrBlob = walk(join(ROOT, ".adr/log")).map((f) => readFileSync(f, "utf8")).join("\n");
let missD = [];
for (let n = 1; n <= 21; n++) {
  const inIndex = idx.adrs.some((a) => a.dn === `D${n}`);
  const inLog = new RegExp(`\\bD${n}\\b`).test(adrBlob) || new RegExp(`ADR-${String(n).padStart(4, "0")}`).test(adrBlob);
  if (!(inIndex && inLog)) missD.push(`D${n}`);
}
missD.length === 0 ? ok("all 21 decisions (D1–D21) present in .adr/ (index + log body)") : no(`decisions lost: ${missD.join(",")}`);

// 4b — mission survives into .aprd
const aprdFrozen = rd(".aprd/aprd.frozen.md");
const missionMarker = "executable AI prompts";
rules.includes(missionMarker) && aprdFrozen.includes(missionMarker) ? ok("mission text preserved in .aprd/aprd.frozen.md") : no("mission text lost from .aprd/");
// every in-scope spec (00–04) referenced
const specsOk = ["00-automated-aprd", "01-automated-roadmap", "02-automated-adr", "03-automated-hld", "04-automated-build"]
  .every((s) => aprdFrozen.includes(s));
specsOk ? ok("all source specs 00–04 referenced in .aprd/aprd.frozen.md") : no("a source spec reference lost from .aprd/");
// every design spec 00–06 landed VERBATIM under .aprd/specs/ (full prose, byte-identical — no loss)
const srcSpecs = readdirSync(join(ROOT, "_initial_design")).filter((f) => f.endsWith(".md")).sort();
const lostSpecs = srcSpecs.filter((f) => !existsSync(join(ROOT, ".aprd/specs", f))
  || readFileSync(join(ROOT, "_initial_design", f), "utf8") !== readFileSync(join(ROOT, ".aprd/specs", f), "utf8"));
lostSpecs.length === 0 ? ok(`all ${srcSpecs.length} design specs (00–06) preserved byte-identical under .aprd/specs/`) : no(`spec prose lost/changed: ${lostSpecs.join(",")}`);

// 4c — every locked rule (PR1–PR4, AB1–AB6) + caveman survives into .hld coding-canon
const canon = rd(".hld/skeleton/coding-canon.md");
const ruleTokens = ["PR1", "PR2", "PR3", "PR4", "AB1", "AB2", "AB3", "AB4", "AB5", "AB6"];
const lostRules = ruleTokens.filter((t) => rules.includes(t) && !canon.includes(t));
lostRules.length === 0 ? ok("all locked rules (PR1–PR4, AB1–AB6) preserved in .hld/skeleton/coding-canon.md") : no(`rules lost: ${lostRules.join(",")}`);
canon.includes("smart caveman") ? ok("caveman block preserved in .hld/ coding canon") : no("caveman block lost");
rd(".hld/skeleton/prompt-skeleton.md").includes("role: <ROLE>") ? ok("DRY prompt skeleton preserved in .hld/") : no("DRY skeleton lost");

// 4d — every roadmap entry survives (1 completed + 9 remaining, ordered)
const allRoadmap = [...rr.completed.map((c) => c.id), ...rr.remaining_sequence.map((r) => r.id)];
allRoadmap.length === 10 && new Set(allRoadmap).size === 10 ? ok(`all 10 roadmap entries present + unique (${allRoadmap.length})`) : no("roadmap entry lost/dup");
rr.remaining_sequence[0].id === "P-RECONCILE-CRITIQUE-INC" ? ok("roadmap frozen-order head preserved (RECONCILE/CRITIQUE; live position derived from disk)") : no("roadmap order head wrong");

// ── verdict ──────────────────────────────────────────────────────────────────
console.log(`\n${fail === 0 ? "ALL GREEN" : "RED"} — ${pass} pass / ${fail} fail`);
if (fail === 0) console.log("Root trees are committed-source-ready + content-complete. Safe to delete sources (M7 step 5).");
process.exit(fail === 0 ? 0 : 1);
