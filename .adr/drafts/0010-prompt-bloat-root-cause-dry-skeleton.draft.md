---
id: ADR-0010
title: Prompt bloat root cause + DRY skeleton
status: Proposed
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: _decisions.md
supersedes: null
superseded_by: null
---

## Decision

- **D10 — Prompt bloat root cause + DRY skeleton (RESOLVED 2026-06-07).** Prompts ran 114–252 lines; substance ~⅓. **Root cause: the old skeleton mandated 3–5 homes per fact** (mandate + task-steps + grounding + field-rules restating one rule; escapes + step-1 + stop restating one guard; `format:` essays re-speccing upstream schemas; role prose narrating the mandate). No single-source-of-truth rule existed — same disease that ballooned this tracker once. **Fix:** rewrote the Standard prompt skeleton to a DRY structure + added binding authoring rules **AB1–AB6** (one home per fact: guards→escapes only; schema→inline comments only, no Field-rules section; grounding→one Rules bullet; `format:`→one clause; role≤3 lines). Substance invariant — only duplication dies. **DONE: all 26 Phase 0–3 prompts retrofitted to DRY (4433→3135 lines, −29%; biggest single RESOLVE-LOCAL 253→192, MODEL-DATA 198→128). Every load-bearing rule preserved per the retrofit agents; structural sanity verified (all 26 keep Register block + frontmatter + escapes + schema/template + Stop).** **Re-test SKIPPED by operator call across the board — goldens NOT regenerated; behavior assumed preserved until a re-run.** Author all NEW prompts (MAP-NFR onward) DRY from the start. Gated re-test still owed before re-promote (compression must not change behavior) — run via `_pipeline-run.md` (full chain) or per-step clean-room (orchestrator STEP 4 / `step-runner`; the hand-loop `_prompt-run.md` was retired at M6). **Subagents sandbox-cwd to `agentic-systems/`; launch EVERY runner/verifier via the `step-runner` agent (`.claude/agents/step-runner.md`, Sonnet/High).**
