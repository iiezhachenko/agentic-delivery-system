---
id: ADR-0022
title: Deterministic helper tools — sanctioned component class; spine may shell out
status: Proposed
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
---

## Decision

- **D22 — Deterministic helper tools are a sanctioned component CLASS; the spine may shell out to them.**
  Context: the pipeline is 100%-prompt-driven today — every gate (incl. verify, `code-canon` field 6) is an
  agent reading a prompt; no deterministic executable code exists in the committed tree. Some checks are
  cheapest + only sound as deterministic code: same input MUST yield the same verdict (an agent running regex
  is NOT deterministic), and they belong BEFORE the expensive LLM/clean-room pass (P5 cheapest-source-first).
  **Decision (tool-agnostic):** the orchestrator and any phase gate MAY invoke a **deterministic helper tool**
  via Bash. This establishes a reusable component CLASS, not a one-off — the economy LINT (T04) is merely the
  FIRST instance. Every such tool MUST satisfy one contract:
  1. **Deterministic** — same input → byte-identical output. No network, no clock, no randomness.
  2. **Disk-in / disk-out** — reads target artifact(s), writes a schema-valid JSON verdict to a declared path;
     same disk-truth contract as every gate artifact (D3/D20). Atomic write (temp→rename, D20 g2).
  3. **NO LLM** — pure regex/heuristic/AST/schema logic. No model call (keeps it cheap + reproducible). A check
     needing model judgment belongs in a prompt/agent, NOT here.
  4. **Registered in the stack profile, never special-cased in the spine** — the tool + its parameters/thresholds
     live in `code-canon/<stack>.md` (field 6, beside the clean-room runner). Per-artifact-type / per-stack
     config is profile DATA, not hard-code. Spine reads the profile; wiring a tool forces no spine edit
     (invariant #1, P3). A sibling stack drops its own tools under its profile.
  5. **Non-authoritative — FLAGS, never authors truth** — emits a verdict only; a `blocked`/fail result routes
     to re-author (DELETE/REWRITE, never ADD — AB9), exactly like a failed clean-room verify. The LLM still
     reconciles/verifies; the tool is a cheap pre-filter, never the source of truth (P11).
  6. **Self-proving (both-directions)** — ships a self-test proving it discriminates (known-good → pass,
     planted-defect → fail) before it is trusted, same mandate as the behavior verifier.
  **Home:** `tools/<tool-name>/` (committed). Deterministic helpers a future stack/project needs drop beside it.
  **First instance:** economy LINT — `tools/economy-lint/` (T04): Layer-1 structural economy checks (C1–C9 over
  AB1–AB9) → `lint.json`, ahead of the Layer-2 clean-room runner. **Future instances** the class anticipates
  (illustrative, not exhaustive): JSON-schema validators, ID-thread (`R→AC→…→commit`) checkers, build-DAG
  cycle detectors, formatters. Each: add under `tools/`, register in the profile, satisfy the contract above —
  no spine change.
  **Consequences:** orchestrator STEP 4 gains a step-0 (run the registered deterministic pre-filters on the
  scratch artifact → verdict JSON; blocked → re-author + skip the expensive sim; clean → proceed to AUDIT then
  clean-room). `code-canon` field 6 (verify mechanism) documents the deterministic pre-filter layer ahead of the
  clean-room runner, and lists the registered tools per stack. **Reopen if** a tool proves non-deterministic or
  starts needing model judgment — that capability moves into a prompt/agent, and the tool is retired from the
  class.
