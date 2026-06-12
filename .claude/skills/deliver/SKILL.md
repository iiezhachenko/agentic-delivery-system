---
name: deliver
description: Run the delivery pipeline on a request (aPRD → roadmap → ADR → HLD → build) — canonical end-user path, dogfooded from the checkout
argument-hint: "<request in plain language> --root <EXTERNAL dir> [--stack <profile>] | status"
---
Thin launcher. Hand `$ARGUMENTS` to the **adp-orchestrator** agent with the generic params below; it runs the full 5-phase loop, pausing at the 3 client gates (A clarifying questions · B roadmap · C per-slice demo). Do nothing else here.

Params:
- LOOP_BODY = `prompts/_orchestrator.generic.md` (all 5 phases run LIVE — no frozen subset).
- RUN_CANON = `canon/CLAUDE.generic.md` (deliverable = user software; governs the run over the repo's self-host-flavored root `CLAUDE.md`).
- ENGINE_ROOT = `.` (role library + spine + canon read from the checkout).
- **WORKSPACE_ROOT = the `--root <dir>` arg — MUST be external.** All phase trees (`.aprd .roadmap .adr .hld` + product code) write there. **The orchestrator HALTs if WORKSPACE_ROOT resolves to the repo root** (would clobber the factory's frozen trees). No `--root` → ask the operator for an external target; never default to `.`.
- DELIVERABLE_TARGET = the `--stack <profile>` arg under `code-canon/` (e.g. `code-canon/typescript.md`); default = ask.
- MODE = `brownfield` if the external root already has product code, else `greenfield`.
- dispatch arg (the request text / `status`): empty → advance next pending step; `status` → render derived state from the external root, write nothing; `<PHASE>/<ROLE>` → target that step.

Note: in this repo `/deliver` exists for parity/dogfooding the canonical path; for real end-user delivery, `npx adp init` installs ADP into the target project (`docs/generic-usage-guide.md`).
