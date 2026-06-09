---
name: deliver
description: Run delivery pipeline on a request (aPRD → roadmap → ADR → HLD → build)
argument-hint: "<your request in plain language> | status | <PHASE>/<ROLE>"
---
Thin launcher. Hand `$ARGUMENTS` to **adp-orchestrator** agent; run pipeline, pause at 3 client gates (clarifying questions · roadmap · per-slice demo).

Params orchestrator sets:
- WORKSPACE_ROOT = `$CLAUDE_PROJECT_DIR` (operator project root). All phase trees write here.
- DELIVERABLE_TARGET = stack/canon profile under `$CLAUDE_PROJECT_DIR/.claude/adp/code-canon/`.
- MODE = `brownfield` if user code already present, else `greenfield`.
- dispatch arg = `$ARGUMENTS`: empty → advance next pending step; `status` → render derived state, write nothing; `<PHASE>/<ROLE>` → target that step.

Orchestrator = controller (pick / dispatch / verify / gate / promote); spawns `adp-step-runner` per step. State derived from disk; resume re-derives frontier. Do nothing else here.
