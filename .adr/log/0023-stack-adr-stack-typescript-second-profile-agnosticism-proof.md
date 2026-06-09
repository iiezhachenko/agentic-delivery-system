---
id: ADR-0023
title: Stack ADR: `stack = typescript` (second canon profile — agnosticism proof)
status: Accepted
date: 2026-06-09
class: self-host
scope: global
mode: foundation
stack: typescript
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D23 — Stack ADR: `stack = typescript` (second canon profile, the agnosticism proof) (RESOLVED 2026-06-09).** Sibling of `D21` (`stack = agentic-delivery-pipeline`), NOT a special case (invariant #1). Pins a SECOND coding-canon profile the Build phase can read, proving the spine is deliverable-agnostic. **Decision:** a TypeScript project binds `code-canon/typescript.md`; it fills the same six fields against a real TS toolchain. **(1) "code" unit = one `.ts` module** at `src/<area>/<module>.ts` — analog of one prompt `.md` (D21) / one `.tf` resource. **(2) verify mechanism = `tsc --noEmit` (typecheck) THEN `node --test`/`vitest` against the live build**, both directions (known-good PASS + planted-defect FAIL); the `stack=typescript` analog of D21's clean-room sim / `stack=python`'s `pytest`. Deterministic pre-filters (eslint + prettier --check + economy-lint `{artifact-type: ts}`, D22) run ahead (P5). **Register tools; invent no new judge** (B4). **(3) build idiom = synthesize TS source from HLD-increment contract + per-role spec §** (B11). **(4) Frozen as `ADR-0023`** (next free id, monotonic after `adr.lock` max 22). **Consequence:** the Build phase reads `code-canon/typescript.md` for scaffold/canon/unit/oracle/build-idiom/verify; spine UNCHANGED — a profile read, not a spine edit. Running a tiny TS greenfield through the unchanged orchestrator + role prompts, passing its own `tsc`+tests verify with zero engine edits, IS the M12 Part-2 agnosticism proof. **Reopen if** wiring this profile forces a spine edit — that is the leak signal; fix the spine once (P3, read verify-method/build-idiom from the target), never patch the profile to dodge it.
