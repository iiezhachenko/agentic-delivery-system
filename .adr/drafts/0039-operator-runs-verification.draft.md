---
id: ADR-0039
title: Operator runs every demo — agent never self-runs the proof it presents (iron law)
status: Draft
date: 2026-06-13
class: self-host
scope: global
mode: governance
source: operator-directed
supersedes: null
superseded_by: null
cr: null
---

## Decision

- **D39 — Operator runs every demo; agent never runs the demo/proof it presents (iron law).**
  Context: during the MCP-modernization reference build (CR-023–026), the agent demonstrated working behavior by RUNNING its own proofs (selftests, the live MCP loop, raw-protocol chains) and narrating "it passes / it works." Operator ruled this invalid: an agent running its own acceptance proof = self-grading. The human is the sole verifying oracle for demos.

  **Decision:** Any demonstration or acceptance verification of working behavior is **operator-executed, always**. At every gate the agent's entire job re: proof = hand the operator EXPLICIT, copy-pasteable reproducible steps (exact commands + exact expected output), then STOP. The operator executes, observes, confirms. Agent-run output is NEVER the acceptance proof.

  **Composes with prior canon:** extends "LLM reconciles/verifies, never authors truth", D3 (deliverable = file on disk, not chat reply), D20 (disk source of truth), the operator gate, and adversarial-role separation. The new sharpening: the agent may not substitute its own execution for the operator's verification of working software.

  **Scope:** binds every launcher (`/evolve`, `/deliver`) + every gate + every "show it works" moment. NO exception — no "but I already ran it", no scripting shortcut that replays an agent-run result as the proof. Internal clean-room build-loop selftests still run during authoring (part of the build), but they are NOT the demo; the demo the human signs off on is operator-reproduced.

  **Failure mode closed:** agent narrates a self-run "tests pass" → human trusts an unverified or cherry-picked result → false confidence ships. Fix: nothing is "verified" until the human ran the supplied steps.

  **Frozen homes (always-on enforcement):** `CLAUDE.md` § "Verification authority" (loaded every session, overrides default behavior) + `.claude/agents/adp-orchestrator.md` gate rule (governs both loops). This ADR = the decision-of-record/provenance.

  **Tradeoffs considered:**
  - *Operator-run demos — CHOSEN.* Human is the verifying oracle; eliminates agent self-grading. Cost: a round-trip per gate (agent presents steps → human runs → human confirms). Worth it: verification integrity is load-bearing for an autonomous delivery pipeline.
  - *Agent-run demos with transcript — REJECTED.* Agent showing its own passing run is unfalsifiable to the human (cherry-pick / fake / stale-process risk) — the exact "scripting shenanigans" failure the operator flagged.

  **Consequences:** orchestrator + loop bodies present reproducible steps at gates, never self-run proofs. adr-index.json: ADR-0039 entry added on accept; `adr_counts.rendered` → 39. adr.lock → v20 on formal sign (this draft promoted to `.adr/log/` at the accept gate).

  **Reopen if:** a context emerges where operator-execution is impossible AND an alternative non-self-grading oracle exists (e.g. an independent third-party verifier outside the agent) — even then the agent itself is never the verifier of its own output.
