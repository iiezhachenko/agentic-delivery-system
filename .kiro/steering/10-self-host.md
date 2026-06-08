# Self-host: build the system on itself
- Workspace root is the repo root (`.`). Read phases 0–3 from the committed root trees
  `.aprd .adr .hld .roadmap`. Do NOT re-run aPRD/Roadmap/ADR/HLD — they are committed source
  the orchestrator reads like any project's trees; only the Build phase runs live.
- Deliverable target is the agentic-delivery-pipeline coding-canon profile
  (`code-canon/agentic-delivery-pipeline.md`, pinned by `ADR-0021`/`D21`). The "code" unit is a
  prompt `.md`; Build writes to `prompts/<phase>/<ROLE>.md` (promoted from scratch after the gate).
- Verify mechanism is the clean-room runner simulation against `_fixtures/` — NOT pytest.
  Fresh runner gets the prompt verbatim + a `_test_bench` root, must emit a schema-valid,
  ID-threaded artifact matching the golden on value; both directions (good PASS + defect FAIL).
- RE-RANK over `.roadmap/08-rerank.json` picks the next unshipped prompt. Status is derived
  from disk (scan `prompts/` + `_fixtures/` + locks; done iff `done_sentinel` present + valid);
  do NOT maintain a tracker/changelog file.
- Orchestrator stays Opus through the parity gate (external judge), Sonnet after.
- `00-exclusive.md` still applies (don't touch Kiro's built-in specs). The generic `step.json`
  executor is reused unchanged — for self-host it just happens to write a prompt `.md`.
