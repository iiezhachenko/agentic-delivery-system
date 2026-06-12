---
id: ADR-0032
title: Controller zero-write guarantee — prose authoring routes through step-runner
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: CR-011
---

## Decision

- **D32 — Controller-direct writes permitted ONLY for mechanical deterministic ops (git, spine tool shell-outs, lock/index updates, scratch→promotion). Rule prose, ADR bodies, CR docs = stochastic authoring → step-runner clean-room, never hand-authored by controller.**
  Context (CR-011): P3 controller-direct carve-out (RM11: orchestrator IS the control loop, not a stochastic-island deliverable) currently does NOT distinguish between (a) mechanical spine ops and (b) stochastic prose authoring. Result: controller could hand-author rule text, ADR bodies, CR docs — contradicts zero-write guarantee (RM11: controller picks/dispatches/verifies/gates/promotes, never authors). CR-011 operator gate rationale: "change must model the discipline it codifies."

  **Decisions:**
  1. **Permitted controller-direct class = mechanical deterministic ops.** Git ops (fetch, merge, checkout, commit, push), spine tool shell-outs (`node tools/<tool>.mjs` — D22 sanctioned helpers), lock re-sign + index update per spine tooling (adr.lock, skeleton.lock), scratch→destination promotion (atomic move of runner-authored artifact). NOT stochastic prose authoring.
  2. **Rule prose, ADR bodies, CR docs → step-runner clean-room.** Those artifacts route through the same clean-room pipeline as any deliverable, even when the controller is modifying the control loop itself. No exception for "meta" artifacts.
  3. **P3 precedent (CR-006, W7/W8/W18) preserved for mechanical wiring edits.** Explicitly does NOT extend to prose authoring of decision rationale. P3 applies to mechanical git ops, spine shell-outs, lock updates — NOT to stochastic LLM authoring.
  4. **R-CW-1 formalizes the constraint.** Binds orchestrator RULES section (`prompts/_orchestrator.md`) + adp-orchestrator Run section (`.claude/agents/adp-orchestrator.md`). Cited in both.

  **Tradeoffs considered:**
  - *Allow controller-direct prose authoring for "meta" artifacts (rule/ADR/CR docs) — rejected.* Contradicts zero-write principle — the system must model the discipline it enforces. Special-casing meta artifacts erodes the boundary: if controller hand-authors ADR rationale, the clean-room guarantee corrupts. The operator gate demanded: "change must model discipline it codifies."
  - *Restrict further: prohibit even mechanical controller-direct ops (git/spine/lock) — rejected.* Mechanical ops have no LLM authoring component — deterministic, auditable, no stochastic failure mode. Git ops (merge, commit) and spine tool shell-outs (D22 sanctioned helpers) are pure execution, not prose generation. Prohibiting them adds spawn overhead with zero quality benefit. P3 carve-out for mechanical ops is sound; the gap was prose-authoring ambiguity, not mechanical ops.
  - *Keep P3 as-is, rely on discipline — rejected.* Implicit trust that controller "knows" not to prose-author is exactly the failure mode CR-011 closes. Explicit rule + R-id makes the boundary enforceable + citable. Absence of prohibition = permission in practice.

  **Consequences:** RULES section in `prompts/_orchestrator.md` gains permitted-writes enumeration (git ops · spine tool shell-outs · lock/index updates · scratch→promotion) + prose exclusion (rule prose, ADR bodies, CR docs → step-runner). `.claude/agents/adp-orchestrator.md` Run step 4 gains same constraint. adr-index.json gains ADR-0032 entry, adr.lock v12. Regression-guard = existing selftests + economy-lint corpus unaffected (no spine logic change, only rule prose + agent instruction prose).
  **Reopen if:** a new mechanical op class needs explicit permit (→ amend D32 permitted list with rationale); the generic orchestrator needs an explicit parallel rule (→ follow-up CR for `_orchestrator.generic.md`, currently implicit); a "meta-artifact prose" carve-out is reconsidered (→ reopen with justification why modeling-the-discipline is no longer load-bearing).
