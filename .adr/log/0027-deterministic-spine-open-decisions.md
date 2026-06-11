---
id: ADR-0027
title: Deterministic-spine open decisions — output grade · Tier-1 retirement · CR batching
status: Accepted
date: 2026-06-11
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
---

## Decision

- **D27 — Resolve the three deterministic-spine open decisions (doc 04 / CR-002 §5).** Operator-approved defaults; grounds D24/D25/D26. **Extends D22.**
  1. **Structured-output grade = enforce on Claude · validate-after+retry on Kiro.**
     Constrained decode is strongest on the runtime target (Claude/Sonnet); Kiro lacks equivalent constrained decode, so validate-after + bounded retry. JSON-Schema + the path-list stay the portable contract either way → harness-neutral (D21) intact. Forces no spine fork — `tools/det/validate.mjs` is shared; each adapter wires its own grade. Trade: mild Claude-side harness coupling, accepted for the reliability win.
  2. **Tier-1 retirement = retire the prompt; keep sentinel + components.json note.**
     A Tier-1 role's artifact is owned end-to-end by its `tools/det/emit/*.mjs` emitter (D26) → the prompt is removed (not kept as a thin caller). The role keeps its **sentinel** (so "shipped" still = artifact on disk) + a one-line `components.json` note recording emitter ownership (audit trail). One-role-one-prompt (D1) holds via the sentinel — the role identity survives, the stochastic prompt does not. Rejected "keep a thin prompt that calls the emitter" — it re-introduces a stochastic hop for zero judgment.
  3. **CR batching = one mega-W0 canon CR, then code/prompt waves.**
     All canon amendments (AB3/AB5/PR2 + prompt-skeleton + the two new frozen classes) land in ONE version bump (W0 / CR-002), re-signing every affected lock in a single event — avoids a half-amended canon where some prompts reference a registry the skeleton doesn't yet sanction. The code (W1–W5) + prompt-reauthor (W6) + orchestrator (W7) + pack (W8) waves follow, each one self-slice-loop pass.
  **Consequences:** unblocks the ADR set (D24/D25/D26 reference these as settled). Defaults may be overridden at the intake operator gate. **Reopen if** an adapter cannot honor its assigned grade, or a retired Tier-1 role later regains a judgment hole (then it returns as a prompt-bearing role, D26 reopen).
