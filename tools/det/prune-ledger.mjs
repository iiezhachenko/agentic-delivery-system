#!/usr/bin/env node
// Reranker ledger hygiene (R-LH-1/2/3, D31/CR-010). Pure deterministic CODE, no LLM.
// Prunes completed[] rows whose done_sentinel is present on master (= complete + accepted +
//   merged) from the informational reranker ledger (.roadmap/08-rerank.json). Collapses _note
//   to a one-line current-state pointer (retention = git is the trail). PRESERVES
//   remaining_sequence/remaining_ranked + open coverage.deferred_findings + missing/duplicated
//   (R-LH-2 — merged-only prune). Idempotent (R-LH-3): nothing merged → no-op, no version bump.
// Ledger is informational ordering, NOT the source of truth (D20) — prune never alters the
//   disk-derived frontier; the loop derives the frontier from disk sentinels, never this file.
// Core pruneLedger() is pure (ledger + mergedSentinels Set → pruned ledger + audit) so the
//   selftest exercises synthetic data off-disk; only CLI touches disk + git. Mirrors
//   validate.mjs/route.mjs idiom (zero deps, ESM, exit codes).
// Usage: node prune-ledger.mjs <ledger-path> [--root <dir>] [--ref <git-ref>] [--dry-run] [--json]
//   exit 0 = ok (written, or no-op) / 1 = error / 2 = usage.
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

// --- pruneLedger: PURE. (ledger, mergedSentinels:Set<string>) → {ledger, pruned:[id], kept:[id], changed} ---
// A completed[] row is prunable iff its done_sentinel ∈ mergedSentinels. Everything else verbatim.
export function pruneLedger(ledger, mergedSentinels) {
  const completed = Array.isArray(ledger.completed) ? ledger.completed : [];
  const isMerged = (row) => row && typeof row.done_sentinel === "string" && mergedSentinels.has(row.done_sentinel);
  const prunedRows = completed.filter(isMerged);
  const keptRows = completed.filter((r) => !isMerged(r));
  const prunedIds = prunedRows.map((r) => r.id);

  // idempotent (R-LH-3): nothing merged → return input unchanged, no version bump, no _note rewrite.
  if (prunedRows.length === 0) {
    return { ledger, pruned: [], kept: keptRows.map((r) => r.id), changed: false };
  }

  const out = { ...ledger };          // shallow clone; replace only touched fields (R-LH-2 preserves the rest)
  out.completed = keptRows;

  // mirror the prune in coverage.completed[] (id list); preserve deferred_findings + remaining_ranked + missing/duplicated.
  if (out.coverage && Array.isArray(out.coverage.completed)) {
    const prunedIdSet = new Set(prunedIds);
    out.coverage = { ...out.coverage, completed: out.coverage.completed.filter((id) => !prunedIdSet.has(id)) };
  }

  out.roadmap_version = (typeof ledger.roadmap_version === "number" ? ledger.roadmap_version : 0) + 1;

  // collapse _note (retention: git is the trail). Generated, deterministic from inputs.
  const remaining = Array.isArray(out.remaining_sequence)
    ? out.remaining_sequence.length
    : (out.coverage && Array.isArray(out.coverage.remaining_ranked) ? out.coverage.remaining_ranked.length : 0);
  const deferred = (out.coverage && Array.isArray(out.coverage.deferred_findings))
    ? out.coverage.deferred_findings.map((f) => f.id)
    : [];
  out._note = `roadmap_version ${out.roadmap_version} (D31/CR-010 ledger-prune): pruned ${prunedRows.length} merged+accepted+complete wave(s) [${prunedIds.join(", ")}] — done_sentinel present on master. Live: remaining=${remaining}, kept-completed=${keptRows.length}, deferred=[${deferred.join(", ")}]. Retention = git is the trail (R-LH-2/D20: ledger is informational ordering, not the source of truth; loop derives frontier from disk sentinels). Prior version history recoverable from git.`;

  return { ledger: out, pruned: prunedIds, kept: keptRows.map((r) => r.id), changed: true };
}

// --- sentinelOnRef: is <sentinel> present at <ref>? Handles " | "-split alternatives (any present = yes). ---
// Placeholder paths (contain "<") are unverifiable → false (conservative: preserve, never prune on a guess).
function sentinelOnRef(sentinel, ref, root) {
  const alts = String(sentinel).split("|").map((s) => s.trim()).filter(Boolean);
  for (const p of alts) {
    if (p.includes("<")) continue;
    try {
      execFileSync("git", ["cat-file", "-e", `${ref}:${p}`], { cwd: root, stdio: "pipe" });
      return true;
    } catch { /* absent at ref → try next alternative */ }
  }
  return false;
}

// --- refExists: does the git ref resolve? (master may be absent on a fresh local-only clone.) ---
function refExists(ref, root) {
  try { execFileSync("git", ["rev-parse", "--verify", "--quiet", ref], { cwd: root, stdio: "pipe" }); return true; }
  catch { return false; }
}

// --- CLI ---
function main(argv) {
  const args = argv.slice(2);
  if (args.length === 0 || args.includes("-h") || args.includes("--help")) {
    console.error("usage: node prune-ledger.mjs <ledger-path> [--root <dir>] [--ref <git-ref>] [--dry-run] [--json]");
    return 2;
  }
  const opt = { root: ".", ref: null, dryRun: false, json: false, ledgerPath: null };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--root") opt.root = args[++i];
    else if (a === "--ref") opt.ref = args[++i];
    else if (a === "--dry-run") opt.dryRun = true;
    else if (a === "--json") opt.json = true;
    else if (!a.startsWith("--") && !opt.ledgerPath) opt.ledgerPath = a;
  }
  if (!opt.ledgerPath) { console.error("error: ledger path required"); return 2; }
  const root = path.resolve(opt.root);
  const ledgerAbs = path.isAbsolute(opt.ledgerPath) ? opt.ledgerPath : path.join(root, opt.ledgerPath);

  let ledger;
  try { ledger = JSON.parse(fs.readFileSync(ledgerAbs, "utf8")); }
  catch (e) { console.error(`error: cannot read ledger ${ledgerAbs}: ${e.message}`); return 1; }

  // pick ref: explicit --ref, else master, else main; error if none resolves (can't prove "merged").
  let ref = opt.ref;
  if (!ref) ref = refExists("master", root) ? "master" : (refExists("main", root) ? "main" : null);
  if (!ref || !refExists(ref, root)) {
    console.error(`error: git ref unresolved (tried ${opt.ref || "master/main"}); cannot determine merged state — skipping prune.`);
    return 1;
  }

  // gather mergedSentinels: completed rows whose done_sentinel is present on the stable ref.
  const completed = Array.isArray(ledger.completed) ? ledger.completed : [];
  const merged = new Set();
  for (const row of completed) {
    if (row && typeof row.done_sentinel === "string" && sentinelOnRef(row.done_sentinel, ref, root)) {
      merged.add(row.done_sentinel);
    }
  }

  const { ledger: out, pruned, kept, changed } = pruneLedger(ledger, merged);

  if (!changed) {
    const msg = `prune-ledger: no merged waves on ${ref} — no-op (idempotent). kept ${kept.length} completed.`;
    if (opt.json) console.log(JSON.stringify({ changed: false, ref, pruned, kept }));
    else console.log(msg);
    return 0;
  }

  if (opt.dryRun) {
    if (opt.json) console.log(JSON.stringify({ changed: true, dryRun: true, ref, pruned, kept }));
    else console.log(`prune-ledger (dry-run): would prune ${pruned.length} on ${ref} [${pruned.join(", ")}]; keep ${kept.length}.`);
    return 0;
  }

  // atomic write: temp then rename (D20 guarantee 2).
  const tmp = `${ledgerAbs}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(out, null, 2) + "\n");
  fs.renameSync(tmp, ledgerAbs);
  if (opt.json) console.log(JSON.stringify({ changed: true, ref, pruned, kept, roadmap_version: out.roadmap_version }));
  else console.log(`prune-ledger: pruned ${pruned.length} merged wave(s) on ${ref} [${pruned.join(", ")}]; kept ${kept.length}; ledger → v${out.roadmap_version}.`);
  return 0;
}

// run as CLI only (not when imported by selftest).
if (path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1] || "")) {
  process.exit(main(process.argv));
}
