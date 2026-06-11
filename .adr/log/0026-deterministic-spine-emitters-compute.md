---
id: ADR-0026
title: Deterministic spine — Tier-1 emitters + verdict/route/sequence/id/coverage compute
status: Accepted
date: 2026-06-11
class: self-host
scope: global
mode: foundation
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D26 — Deterministic decisions + whole-mechanical artifacts move from LLM tokens into `tools/det/` code.**
  Context (doc 00): deterministic decisions are embedded in ~every step — verdict-from-count, route-from-axes, topo-sort, monotonic-id, set-membership/bijection, threshold compare. All computable; all currently LLM tokens. ~10 steps are ~whole-mechanical (Tier 1); ~12 carry a liftable deterministic substage (Tier 2). **Extends D22** at scale — each module is a D22 instance (deterministic, disk-in/disk-out, no-LLM, profile-registered, FLAGS-never-authors, both-directions self-proving); `lint.mjs`/`pack.mjs` were the first two, this is the spine.
  **Decision:**
  1. **Compute modules.** `tools/det/{verdict,route,sequence,idgen,coverage,prefill}.mjs`:
     - `verdict.mjs` — `verdict = f(issue count)` for all 6 gates.
     - `route.mjs` — TRIAGE 2-axis · DIAGNOSE 4-gate discriminator.
     - `sequence.mjs` — topo-sort + value×risk/cost priority (SEQUENCE / RE-RANK).
     - `idgen.mjs` — monotonic `ADR-NNNN` / high-water `max()`.
     - `coverage.mjs` — bijection / membership / walk-to-count.
     - `prefill.mjs` — write the schema shell, fill mechanical fields (ids/counts/verdict/route), mark the judgment holes the LLM fills.
  2. **Tier-1 emitters.** `tools/det/emit/*.mjs` (baseline-map, build-plan, derive-tests, verify-output, …) emit the whole artifact end-to-end — no prompt, no schema in prose. The role's prompt **retires** (D27 scope); the role keeps its **sentinel** + a one-line `components.json` note, so "shipped" stays = artifact on disk and one-role-one-prompt (D1) holds via the sentinel.
  3. **LLM scoped to the islands.** Code does NOT touch judgment — it wraps it (resolve in, prefill shell, validate out). Stochastic stays exactly: fork-finding (GAP-DETECT/DECISION-EXTRACT), fact-vs-gap (EXTRACT), AC authoring (SYNTHESIZE), option scoring (EVALUATE-DECIDE/OPTION-GEN), clustering (SLICE-EXTRACT/SKELETON-IDENTIFY), LLD (IMPLEMENT/INTEGRATE), defect detection (CRITIQUE bodies), narration (DEMO-GEN/QUESTION-GEN). The shell shrinks the LLM's job to exactly these holes.
  4. **FLAG-not-fix preserved, mechanically.** Code computes routes/verdicts; defects still route upstream, never patched — the spine can't author a fix it has no field for.
  **Consequences:** ~10 Tier-1 steps become code (no LLM); ~12 Tier-2 substages computed not generated; all 39 schema-validated (D24). Orchestrator STEP-4.1 gains prefill+compute around the LLM fill (W7). Every module ships a both-directions selftest in the `pack.mjs` gate — same bar as a prompt. **Reopen if** a "deterministic" decision proves to need genuine judgment — it moves back into a prompt/island, and the module retires from the spine (D22 reopen clause).
