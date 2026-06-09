# Task P0 — Re-skin foundation (generic canon + generic orchestrator)

> SELF-CONTAINED. Everything needed inline. No other file required.

## Register (binds this task + every file you write)
Terse caveman. Substance stays, fluff dies. Pattern: [thing] [action] [reason]. Drop articles/filler/hedging. Applies to ALL prose: chat, artifact bodies, code comments. Literal/uncorrupted: JSON/YAML keys+values, identifiers (`R*`/`AC*`/`ADR-*`), code syntax.

## Context — what system is
**Agentic Delivery Pipeline (ADP)** = library of executable AI prompts driving a SW project rough-request→verified-software. 5 phases: understand→plan→decide→design→build. Consumer = client/product-owner, no eng background, drives via 3 checkpoints (A questions · B roadmap · C demo). Finish line = accepted demo on staging.

This repo is ADP built ON ITSELF (self-host). We now pack the RUNTIME for end-users. Problem: current canon + orchestrator are SELF-HOST-flavored (deliverable pinned = this prompt lib, phases frozen). End-user delivery needs GENERIC variants.

## INVARIANT — self-host MUST stay operational `[hard constraint]`
ADP devs run by cloning repo + starting harness at repo root. That path MUST keep working unchanged. Therefore this task is **strictly ADDITIVE: new sibling files only. NEVER edit/delete root `CLAUDE.md` or `prompts/_orchestrator.md`.** Generic copies = NEW files beside originals.

## Scope — 2 NEW files

### P0.1 — `canon/CLAUDE.generic.md` `[NEW]`
Generic always-on rules for end-user projects.
- **Source material** = root `CLAUDE.md` (read it). Strip self-host specifics; keep universal canon.
- **KEEP:** caveman register (verbatim, it's universal), phase order (understand→plan→decide→design→build), artifact conventions (artifacts land on disk = source of truth, IDs thread R→AC→S→ADR→C→CT→F→commit), never-overwrite-frozen, verify-before-done, one-role-one-prompt, LLM reconciles-never-authors-truth, adversarial-roles-stay-hostile, author-against-DRY-skeleton economy rules.
- **DROP:** self-host project specifics — deliverable = "library of executable AI prompts", references to building THIS repo, `.aprd/aprd.frozen.md` / `.hld/skeleton.frozen.md` as THIS project's frozen trees, `code-canon/agentic-delivery-pipeline.md` self-host stack, the "Where things live" table rows that name self-host trees as the deliverable. Reframe: deliverable = the USER's software; pipeline GENERATES `.aprd .adr .hld .roadmap` fresh in user repo.
- **Zero** `self-host` / `agentic-delivery-pipeline` / `.aprd.frozen`-style self-host tokens.

### P0.2 — `prompts/_orchestrator.generic.md` `[NEW]`
Generic delivery control loop.
- **Source material** = `prompts/_orchestrator.md` (read it, 115 lines). Self-host copy = control loop with deliverable pinned (ADR-0021 target `code-canon/agentic-delivery-pipeline.md`), workspace root `.`, frozen phases 0–3.
- **Generic behavior:** drive aPRD→roadmap→ADR→HLD→build LIVE on user request. ALL 5 phases run live (not frozen subset). Deliverable-target + workspace-root taken from LAUNCHER (parameters), NOT pinned. Greenfield + brownfield same (brownfield reads existing code first).
- **Prefer PARAMETERIZE over fork** (less divergence). The self-host orchestrator already abstracts workspace-root + deliverable-target — lean on that. Fork only if frozen-phase coupling too deep to express as params.
- Role prompts lazy-loaded from disk per step (lean context, no preload of ~39 prompts).
- Pack will map this `_orchestrator.generic.md` → `payload/prompts/_orchestrator.md` (canonical name) via manifest path-mapping (P2). So author under `.generic.md` suffix; self-host `_orchestrator.md` stays byte-identical.

## Tooling — economy-lint (your gate)
Repo has zero-dep linter: `node tools/economy-lint/lint.mjs <files>` checks caveman + economy. Run on both NEW files. Path-type inference uses path substrings (`/prompts/`, `/.adr/`) — your new files live under `prompts/` and `canon/` so inference behaves.

## Steps
1. Read root `CLAUDE.md` + `prompts/_orchestrator.md` (sources to re-skin).
2. Write `canon/CLAUDE.generic.md` (P0.1).
3. Write `prompts/_orchestrator.generic.md` (P0.2).
4. Run `node tools/economy-lint/lint.mjs canon/CLAUDE.generic.md prompts/_orchestrator.generic.md` → must pass.
5. `grep -iE 'self-host|agentic-delivery-pipeline|aprd\.frozen|ADR-0021' canon/CLAUDE.generic.md prompts/_orchestrator.generic.md` → must be EMPTY.
6. `git status` → confirm root `CLAUDE.md` + `prompts/_orchestrator.md` UNMODIFIED (only 2 new files added).

## Done-bar
- Both NEW files exist + lint clean (caveman + economy).
- Zero self-host tokens in generic copies (step 5 empty).
- Generic orchestrator describes all 5 phases live, deliverable-target + workspace-root parameterized.
- Regression: `git status` shows root `CLAUDE.md` + `prompts/_orchestrator.md` UNMODIFIED.

## Deps
None — first task, blocks ALL others (P1 launcher refs generic canon; P2 manifest lists re-skinned files).
