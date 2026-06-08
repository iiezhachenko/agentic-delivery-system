---
name: self-host
description: Run the delivery pipeline on its own project — author the next unshipped prompt
argument-hint: "[optional: status | a specific ROLE to target, else RE-RANK picks the next]"
---
Run the orchestrator (`prompts/_orchestrator.md`) with **workspace root the repo root (`.`)** and
**deliverable target `code-canon/agentic-delivery-pipeline.md`** (the stack pinned by `ADR-0021`/`D21`).

Phases 0–3 are the committed root trees (`.aprd .adr .hld .roadmap`) — the orchestrator reads them
like any project's trees; do **NOT** re-run aPRD/Roadmap/ADR/HLD. Only the Build phase runs live.

Pass `$ARGUMENTS` to the orchestrator as its mode:
- empty → build the next prompt (STEP 0 → STEP 6).
- `status` (or "what's next") → render derived state + name the next unshipped prompt, write nothing.
- a `<ROLE>` → target that prompt instead of letting RE-RANK pick.

Let RE-RANK pick the next unshipped prompt from `.roadmap/08-rerank.json` (state derived from
disk — scan `prompts/` + `_fixtures/` + locks; never read a tracker). IMPLEMENT authors the `.md` into a
scratch path, the clean-room runner (`.claude/agents/step-runner.md`, Sonnet/High, `_test_bench` root,
both directions) verifies it against `_fixtures/`, then **pause at the operator gate (value/parity)** before
promoting it to `prompts/`.

Orchestrator runs **Sonnet** — the loop is trusted, so the earlier Opus external-judge pass is retired.
