---
id: ADR-0033
title: Controller zero-write + clean-room separation of concerns (supersedes D32)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: ADR-0032
superseded_by: null
cr: CR-012
---

## Decision

- **D33 — Controller zero-write guarantee (R-CW-1) + orchestrator loop-control-only (R-CW-2) + step-runner authors+verifies (R-CW-3). Corrects D32's monolithic R-CW-1 by splitting into three precise requirements.**
  Context (CR-012): D32 defined R-CW-1 as "controller zero-write for prose" — combining the overarching zero-write constraint with two sub-behaviors (orchestrator is loop-control-only; step-runner is the author+verifier). Monolithic statement was imprecise: listed permitted ops inline with prose exclusion, making R-CW-1 read as a permitted-list rule rather than a guarantee. CR-012 operator gate split the three concerns.

  **Decisions:**
  1. **R-CW-1 — Controller zero-write guarantee (overarching).** Controller (orchestrator) never authors or writes deliverable content. Permitted controller-direct writes = mechanical deterministic ops ONLY: git ops · spine tool shell-outs (`node tools/<tool>.mjs`) · lock re-sign + index updates per spine tooling · scratch→destination promotion. Everything else routes through step-runner clean-room.
  2. **R-CW-2 — Orchestrator loop-control-only.** Orchestrator role = pick / dispatch / verify / gate / promote. Does not author content at any layer. No exception for meta artifacts (rule text, ADR rationale, CR prose) — stochastic authoring → step-runner.
  3. **R-CW-3 — Step-runner authors and verifies.** All prose artifacts authored by step-runner clean-room subagent. Verifier = separate step-runner spawn (runner never grades own output). Controller dispatches; step-runner authors; separate verifier confirms.

  **Tradeoffs considered:**
  - *Keep D32 R-CW-1 monolithic, rely on context — rejected.* Monolithic rule mixes permitted-list (mechanical ops) with prohibition (prose authoring). Citing "R-CW-1" in downstream artifacts forces readers to decode which half applies. Split yields two cite-able sub-requirements (R-CW-2/R-CW-3) with clear roles.
  - *Replace R-CW-1 id, introduce R-CW-1a/1b/1c — rejected.* Operator directed: keep R-CW-1 id so existing citations stay valid. Rewrite meaning, preserve id. R-CW-2/R-CW-3 are net-new ids with no prior citations to break.
  - *Amend D32 body — rejected.* D32 body is frozen/immutable (immutability rule). Correction = new ADR superseding D32, not body edit. ADR-0032 body stays frozen, untouched.

  **Consequences:** `prompts/_orchestrator.md` RULES section updated (R-CW-1 rewording + sub-requirements added). `.claude/agents/adp-orchestrator.md` Run step 4 updated. adr-index.json: ADR-0033 entry added + ADR-0032 entry gains `"superseded_by": "ADR-0033"`. adr.lock v13. R-CW-1 id preserved — existing citations remain valid with corrected meaning. D32 body frozen, untouched.
  **Reopen if:** sub-requirements need further decomposition; generic orchestrator needs explicit R-CW parallel (separate CR); a new permitted mechanical-op class needs R-CW-1 permitted-list amendment.
