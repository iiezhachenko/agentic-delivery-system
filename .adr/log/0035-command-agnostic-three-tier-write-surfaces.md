---
id: ADR-0035
title: Command-agnostic three-tier write surfaces — corrects /evolve leak in shared spine (supersedes D34)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: ADR-0034
superseded_by: null
cr: CR-014
---

## Decision

- **D35 — Command-agnostic three-tier write surfaces. Corrects D34's `/evolve`-name leak in the shared spine.**
  Context (CR-014): D34/CR-013 fixed the controller/orchestrator conflation but introduced a new defect: R-CW-1 in `.claude/agents/adp-orchestrator.md` (SHARED agent invoked by BOTH `/evolve` AND `/deliver`) hard-coded "controller = `/evolve` session" — naming one command as the canonical definition in a file shared by both launchers. D34 also left `prompts/_orchestrator.generic.md` (the `/deliver` loop body) without any R-CW coverage. CR-014 corrects both: R-CW text in the shared spine rewritten command-agnostically; generic loop gains R-CW citation.

  **Decisions:**
  1. **R-CW-1 — Controller zero-write (rewritten, id preserved).** Controller = the Claude Code session that invokes an ADP launcher — `/evolve` (self-host) OR `/deliver` (end-user delivery); NEITHER is canonical, the rule is identical for both. Controller writes NOTHING: no git ops, no spine tool shell-outs, no lock/index writes, no scratch→destination promotion, no prose, no code, no fixtures. Entire surface = (a) escalation gate to Operator, (b) break-glass route.
  2. **R-CW-2 — Orchestrator loop-control-only (id preserved, substance unchanged).** Orchestrator = the adp-orchestrator agent (shared by both launchers). PERMITTED writes: git ops (checkout/merge/commit/push) · spine tool shell-outs (`node tools/<tool>.mjs`) · lock re-sign + index updates per spine tooling · scratch→destination promotion. PROHIBITED: authoring any prose, code, or fixtures — all such authoring → step-runner.
  3. **R-CW-3 — Step-runner authors + verifies (unchanged).** Step-runner authors ALL artifact content; verifier = separate step-runner spawn (runner never grades own output).

  **Tradeoffs considered:**
  - *Amend D34 body — rejected.* Frozen/immutable (immutability rule). Correction = supersede.
  - *Name both commands explicitly — rejected.* Naming both `/evolve` AND `/deliver` adds coupling to command names. Command-agnostic framing ("the Claude Code session that invokes an ADP launcher") is more stable.
  - *Keep /evolve reference as scope context in shared agent — rejected.* `.claude/agents/adp-orchestrator.md` is invoked by both launchers; no single command is its launcher. The self-host loop body may note its own launcher as scope context — the shared agent may not.

  **Consequences:** `.claude/agents/adp-orchestrator.md` Run step 4: R-CW-1 rewritten command-agnostic (both launchers named in enumeration, neither as definition). `prompts/_orchestrator.md` RULES: R-CW-1 definition made command-neutral; self-host scope context retained as parenthetical. `prompts/_orchestrator.generic.md` RULES: R-CW-1/2/3 citation added. adr-index.json: ADR-0035 entry added; ADR-0034 gains superseded_by="ADR-0035"; rendered=35. adr.lock v15, sha256 over 35 log bodies.
  **Reopen if:** break-glass route needs explicit R-id; additional shared-spine agents need R-CW coverage; further launcher decomposition needed.
