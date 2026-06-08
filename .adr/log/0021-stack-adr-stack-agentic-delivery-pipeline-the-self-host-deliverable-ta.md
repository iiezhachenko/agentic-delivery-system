---
id: ADR-0021
title: Stack ADR: `stack = agentic-delivery-pipeline` (the self-host deliverable target)
status: Accepted
date: 2026-06-08
class: self-host
scope: global
mode: foundation
stack: agentic-delivery-pipeline
source: _decisions.md
supersedes: null
superseded_by: null
---

## Decision

- **D21 — Stack ADR: `stack = agentic-delivery-pipeline` (the self-host deliverable target) (RESOLVED 2026-06-08).** The deliverable-adapter decision (usage §A1 Step 3, workflow §3/§4). Pins the coding-canon profile the self-host Build phase reads — the exact slot a future `stack = python` / `stack = terraform` ADR fills; this is a **sibling of those, not a special case** (invariant #1). **Decision:** for the self-host project ("build the agentic delivery system"), `stack = agentic-delivery-pipeline`; the Build phase binds `code-canon/agentic-delivery-pipeline.md`. **(1) The "code" unit is a prompt `.md`** at `prompts/<NN-phase>/<ROLE>.md` — the analog of one `.py`/`.tf` file. A prompt is the smallest independently-buildable+verifiable deliverable the spine produces. **(2) The verify mechanism is the clean-room runner simulation, NOT a test framework** — a fresh Sonnet runner (`.claude/agents/step-runner.md`) gets the prompt verbatim + a `_test_bench` root, must emit a schema-valid, ID-threaded artifact matching the golden on value; both directions (known-good PASS + planted-defect FAIL). This is the prompt-domain analog of `pytest` under `stack = python`. **Register the existing harness; invent no new judge** (B4 — the oracle is the fixture run). **(3) The build idiom = synthesize the prompt text from its HLD-increment contract + the per-role spec §** (`.aprd/specs/0N`); the LLM specializes canon to the contract, canon is never the source of truth (B11). Scaffold = the DRY prompt skeleton (D10); coding canon = AB1–AB6 + PR1–PR4 + caveman block. **(4) Frozen into `.adr/`** as `ADR-0021` (next free id, monotonic after `adr.lock` max), so the self-host controller reads it as the baselined stack pick alongside D1–D20. **Consequence:** the self-host Build phase reads `code-canon/agentic-delivery-pipeline.md` for scaffold/canon/unit/oracle/build-idiom/verify; the spine is unchanged (a profile read, not a spine edit). A second profile (`terraform.md`/`typescript.md` + its own stack ADR) is the proof this didn't leak. Reopen only if a second profile forces a spine edit (the leak signal — fix the spine once, P3).
