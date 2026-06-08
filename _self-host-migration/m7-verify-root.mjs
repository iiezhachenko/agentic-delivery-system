#!/usr/bin/env node
// m7-verify-root.mjs — M7 acceptance, ROOT-ONLY. Depends on neither the retired
// sources nor the _self/ cache (both gone/dying): validates the committed root
// trees stand on their own. Run any time post-M7.
//   node _self-host-migration/m7-verify-root.mjs

import { readFileSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let pass = 0, fail = 0;
const ok = (m) => { console.log(`  PASS  ${m}`); pass++; };
const no = (m) => { console.log(`  FAIL  ${m}`); fail++; };
const rd = (p) => readFileSync(join(ROOT, p), "utf8");
const rj = (p) => JSON.parse(rd(p));
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");

console.log("\n[root-trees present + members]");
for (const f of [
  "CLAUDE.md", ".aprd/aprd.frozen.md", ".aprd/aprd.lock",
  ".adr/adr.lock", ".adr/adr-index.json",
  ".hld/skeleton.frozen.md", ".hld/skeleton.lock", ".hld/skeleton/prompt-skeleton.md",
  ".roadmap/roadmap.md", ".roadmap/08-rerank.json",
]) existsSync(join(ROOT, f)) ? ok(f) : no(`MISSING ${f}`);
readdirSync(join(ROOT, ".adr/log")).length === 21 ? ok(".adr/log: 21 bodies") : no(`.adr/log ${readdirSync(join(ROOT, ".adr/log")).length}`);
readdirSync(join(ROOT, ".adr/drafts")).length === 21 ? ok(".adr/drafts: 21 drafts") : no(`.adr/drafts ${readdirSync(join(ROOT, ".adr/drafts")).length}`);
readdirSync(join(ROOT, ".aprd/specs")).length === 7 ? ok(".aprd/specs: 7 design specs") : no(`.aprd/specs ${readdirSync(join(ROOT, ".aprd/specs")).length}`);

console.log("\n[lock hashes match their artifacts — frozen artifacts un-tampered]");
const aprd = rj(".aprd/aprd.lock");
sha256(rd(".aprd/aprd.frozen.md")) === aprd.content_sha256 ? ok("aprd.lock sha == aprd.frozen.md") : no("aprd.lock sha MISMATCH");
const adr = rj(".adr/adr.lock");
const logDir = join(ROOT, ".adr/log");
const logHash = sha256(readdirSync(logDir).sort().map((f) => readFileSync(join(logDir, f), "utf8")).join(""));
logHash === adr.content_sha256 ? ok("adr.lock sha == sorted log/ bodies") : no("adr.lock sha MISMATCH");
adr.adr_count === 21 && adr.adrs.every((a) => existsSync(join(ROOT, ".adr", a.log_ref))) ? ok("adr.lock: 21 ADRs, all log_refs resolve") : no("adr.lock count/ref");
const sk = rj(".hld/skeleton.lock");
const skelDir = join(ROOT, ".hld/skeleton");
const skelHash = sha256(readdirSync(skelDir).sort().map((f) => readFileSync(join(skelDir, f), "utf8")).join("") + rd(".hld/skeleton.frozen.md"));
skelHash === sk.content_sha256 ? ok("skeleton.lock sha == skeleton/* + skeleton.frozen.md") : no("skeleton.lock sha MISMATCH");

console.log("\n[index + roadmap]");
const idx = rj(".adr/adr-index.json");
idx.adrs.length === 21 && idx.adr_counts.rendered === 21 ? ok("adr-index.json: 21 (canonical JSON index)") : no("adr-index count");
const rr = rj(".roadmap/08-rerank.json");
rr.completed.length === 1 && rr.remaining_sequence.length === 9 ? ok("08-rerank: 1 completed + 9 remaining") : no("08-rerank counts");

console.log("\n[sources retired — root is the source now]");
for (const s of ["_decisions.md", "_rules.md", "_initial_design"]) !existsSync(join(ROOT, s)) ? ok(`retired: ${s}`) : no(`STILL PRESENT: ${s}`);

console.log(`\n${fail === 0 ? "ALL GREEN" : "RED"} — ${pass} pass / ${fail} fail`);
process.exit(fail === 0 ? 0 : 1);
