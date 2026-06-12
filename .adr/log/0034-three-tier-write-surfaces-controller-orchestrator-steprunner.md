---
id: ADR-0034
title: Three-tier write surfaces — controller zero-write, orchestrator mechanical-write, step-runner authoring (supersedes D33)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: ADR-0033
superseded_by: null
cr: CR-013
---

## Decision

- **D34 — Three-tier write surfaces: controller zero-write, orchestrator mechanical-write, step-runner authoring. Corrects D33's conflation of controller and orchestrator.**
  Context (CR-013): D33 decision item 1 wrote "Controller (orchestrator)" — parenthetical equates two distinct entities — and placed the mechanical-write carve-out (git ops, spine shell-outs, lock/index re-sign, scratch→promotion) under R-CW-1 scoped to "Controller". Wrong: controller = the Claude Code session from which `/evolve` is invoked. It writes nothing. The mechanical writes belong to the orchestrator (adp-orchestrator agent). CR-012 gate answers perpetuated the conflation. CR-013 kills it by establishing three entities with non-overlapping write surfaces.

  **Decisions:**
  1. **R-CW-1 — Controller zero-write (rewritten, id preserved).** Controller = Claude Code session (`/evolve` invocation point). Writes NOTHING: no git ops, no spine tool shell-outs, no lock/index writes, no scratch→destination promotion, no prose, no code, no fixtures. Entire surface = (a) escalation gate to Operator, (b) break-glass route. Nothing else.
  2. **R-CW-2 — Orchestrator mechanical-write permitted (rewritten, id preserved).** Orchestrator = adp-orchestrator agent. Controls loop: pick / dispatch / verify / gate / promote. PERMITTED writes: git ops (checkout/merge/commit/push) · spine tool shell-outs (`node tools/<tool>.mjs`) · lock re-sign + index updates per spine tooling · STEP 6 scratch→destination promotion. PROHIBITED: authoring any prose, code, or fixtures — all such authoring → step-runner.
  3. **R-CW-3 — Step-runner authors and verifies (unchanged).** All prose artifacts authored by step-runner clean-room subagent. Verifier = separate step-runner spawn (runner never grades own output). Controller dispatches; step-runner authors; separate verifier confirms.

  **Tradeoffs considered:**
  - *Keep D33 text, annotate the conflation — rejected.* D33 body is frozen/immutable (immutability rule). Annotation would require body edit. Correction = new ADR superseding D33.
  - *Amend D33 body — rejected.* Frozen (immutability rule). Same rejection as D32→D33 precedent.
  - *Replace R-CW-1/2/3 ids, introduce new ids — rejected.* Operator directed: preserve all three R-ids so existing citations remain valid. Rewrite meanings, preserve ids.
  - *Merge controller + orchestrator into one entity — rejected.* They are structurally distinct: controller = the human-facing Claude Code session that can escalate to the Operator; orchestrator = the adp-orchestrator subagent that drives the loop. Conflating them obscures accountability for write operations.

  **Consequences:** `prompts/_orchestrator.md` RULES: R-CW-1 rewritten (controller = zero writes, no mechanical-write list, no "(orchestrator)" parenthetical); R-CW-2 rewritten (orchestrator owns mechanical writes); R-CW-3 citation updated D33→D34, content unchanged. `.claude/agents/adp-orchestrator.md` Run step 4: R-CW-1/2/3 (D34) — this agent IS the orchestrator (R-CW-2); controller is a separate entity (R-CW-1). adr-index.json: ADR-0034 entry added; ADR-0033 gains superseded_by="ADR-0034"; rendered=34. adr.lock v14, sha256 over 34 log bodies.
  **Reopen if:** break-glass route needs explicit R-id; further controller/orchestrator decomposition needed; generic orchestrator needs explicit R-CW parallel (separate CR).
