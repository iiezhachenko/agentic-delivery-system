---
id: ADR-0031
title: Reranker ledger hygiene — prune merged-wave records at STEP 0.1
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: CR-010
---

## Decision

- **D31 — Prune the reranker ledger (`.roadmap/08-rerank.json`) of records for workstreams that are complete + accepted + merged. Auto at STEP 0.1 after reconcile; collapse-with-git-trail; preserve live records.**
  Context (CR-010): the ledger accumulated forever — `completed[]` (26 rows, mirrored again in `coverage.completed[]`) + a ~20 KB `_note` of `roadmap_version` 6→31 history. Stale records bury live state. The ledger is **informational ordering, not the source of truth** (D20 — the loop derives the frontier from on-disk sentinels, never from this file), so merged records are pure noise: removing them loses nothing the loop relies on.

  **"Merged" = the operative new condition.** A wave is prunable only when it is complete + accepted + **merged to the stable branch** — proven mechanically by its `done_sentinel` existing on `master` (`git cat-file -e master:<sentinel>`). Accept alone is not enough (a gate-accepted but unmerged local branch wave still lives only on the feature branch); merge is the durable, branch-shared signal.

  **Decisions:**
  1. **Trigger = STEP 0.1, auto (R-LH-3).** Prune fires right after `git merge origin/main --ff-only` succeeds — the natural point where merged waves enter the working branch. Idempotent: an already-pruned ledger re-runs to a no-op (last-writer-wins, D20 guarantee 4). Never touches the disk-derived frontier (D20) — only the informational ledger.
  2. **Prune merged-only; preserve live (R-LH-1/R-LH-2).** Remove `completed[]` rows whose `done_sentinel` is on master + their `coverage.completed[]` mirror. NEVER prune `remaining_sequence`, `remaining_ranked`, open `coverage.deferred_findings`, `coverage.missing`/`duplicated`, or live `in_progress`. Open carry-forward is sacred — a deferred finding (I6/I7/I8, C8) is unfinished work, not a merged wave.
  3. **Collapse, git is the trail (retention).** Reset `_note` to a generated one-line current-state pointer; drop the 6→31 history. The audit trail is git history (old `_note` recoverable) + the shipped artifacts on disk (D20). No sidecar archive file.
  4. **Mechanical spine tool, controller-direct (P3).** Logic lives in `tools/det/prune-ledger.mjs` (D22 sanctioned helper) — pure `pruneLedger(ledger, mergedSentinels)` + git-backed CLI — not a stochastic role prompt. Authored directly by the controller (RM11 carve-out: the orchestrator IS the control loop; W7/W8/W18 precedent). Both-directions selftest is the verify (auto-joins the W8 pack gate sweep).

  **Tradeoffs considered:**
  - *Keep accumulating (status quo) — rejected.* Unbounded growth; ~20 KB of dead history per the time this CR was filed, buries live state, costs tokens on every ingest. The whole point of the CR.
  - *Prune on accept (not merge) — rejected.* An accepted-but-unmerged wave lives only on its feature branch; pruning it on accept would drop a record while the work is still in flight on master's view. Merge is the durable cross-branch truth. Operator chose merge (Q2).
  - *Archive-then-collapse — rejected (Q3).* A sidecar `.roadmap/_archive/` would be a second home for facts git already keeps (AB-economy + drift source). Collapse + git-trail is the economy default. Reopen if an off-git, in-repo audit of pruned waves is ever required.
  - *Validate against strict `08-rerank.schema.json` — N/A.* The self-host ledger is a deliberate repurposing (entries = prompt-builds, not product slices), informational not schema-validated; prune preserves its self-host shape, not the strict slice schema.

  **Consequences:** `tools/det/prune-ledger.mjs` + `prune-ledger.selftest.mjs` + `_fixtures/ledger-prune/` oracle; `prompts/_orchestrator.md` STEP 0.1 prune step; `components.json` LEDGER-PRUNE (inline_orchestrator, det-tool-backed, no prompt file); `contracts.json` STEP-0.1 postcondition (generated-frozen — via `graph-lint.mjs::generateContracts` constant + regen); skeleton.lock v9 + adr.lock v11. First prune collapses W0–W23 (all on master) → ledger v32. Regression-guard = all `tools/**/*.selftest.mjs` + economy-lint corpus green + existing oracles untouched.
  **Reopen if:** an off-git in-repo audit of pruned waves is wanted (→ archive sidecar), the generic orchestrator needs product-slice ledger-prune (→ follow-up CR), or `_note` drift-class lessons need a durable canon home (→ separate canon-home CR — out of scope here).
