---
id: ADR-0008
title: RE-RANK vs SEQUENCE-REVIEW ordering + interactive-prompt design
status: Accepted
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: _decisions.md
supersedes: null
superseded_by: null
---

## Decision

- **D8 — RE-RANK vs SEQUENCE-REVIEW ordering + interactive-prompt design (RESOLVED 2026-06-07).** **Author SEQUENCE-REVIEW now, defer RE-RANK** (option b). Why: RE-RANK has a forward dep on the Phase-3 real component DAG (schema not locked) — authoring against a stub risks churn; SEQUENCE-REVIEW reads `05-sequence.json` (no forward dep) and finishes the Phase-1 client surface. RE-RANK authored out of phase order, after Phase 3 locks, reading the confirmed `07-sequence-reviewed.json` as its base. **Interactive-prompt design pattern (reusable for every later client gate — Phase 4 demo, etc.):** an `interactive:true` prompt is **two-phase in one session** — Phase A autonomous (read input, render the client-facing artifact to disk, present, PAUSE, never fabricate the human's reply) + Phase B (on the client's reply, validate/apply, write the confirmed artifact). Phase A ALWAYS lands a disk deliverable so the clean-room runner (no human) has something to verify; the confirmed artifact is Phase B only. Clean-room test = Phase-A run (no reply) verifies the presentation; Phase-B paths tested by spawning the runner with a simulated `[CLIENT REPLY] …` appended (the real session's second turn collapsed into the paste). **Window note:** SEQUENCE-REVIEW reads 05, so its true producer is SEQUENCE — the positional N-1 (FOUNDATION-CUT) is a sibling consumer of 05, NOT a producer for it; root the e2e window at the real data-chain (SKELETON-IDENTIFY→SEQUENCE→SEQUENCE-REVIEW), not the literal step-index neighbors.
