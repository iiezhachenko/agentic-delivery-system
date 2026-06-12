---
name: self-host
description: Run the delivery pipeline on its own project — author the next unshipped prompt
argument-hint: "[optional: status | a specific ROLE to target, else RE-RANK picks the next]"
---
Thin launcher. Hand `$ARGUMENTS` to the **adp-orchestrator** agent with the self-host params below; it reads the loop body + runs it, spawning `step-runner` for clean-room verify, pausing at the value/parity gate. Do nothing else here.

Params:
- LOOP_BODY = `prompts/_orchestrator.md` (the self-host control loop — phases 0–3 frozen, only Build runs live).
- ENGINE_ROOT = `.` · WORKSPACE_ROOT = `.` (engine + frozen trees coincide on the self-project).
- DELIVERABLE_TARGET = `code-canon/agentic-delivery-pipeline.md` (stack pinned by `ADR-0021`/`D21`).
- dispatch arg = `$ARGUMENTS`: empty → build next prompt (STEP 0 → STEP 6); `status` (or "what's next") → render derived state + name next unshipped prompt, write nothing; `<ROLE>` → target that prompt instead of letting RE-RANK pick.

State derived from disk (scan `prompts/` + `_fixtures/` + locks; never a tracker). Orchestrator + runner = Sonnet (loop trusted, Opus external-judge retired).
