# Self-host: build system on itself
- Workspace root = repo root (`.`). Read phases 0–3 from committed root trees
  `.aprd .adr .hld .roadmap`. Do NOT re-run aPRD/Roadmap/ADR/HLD — committed source
  orchestrator reads like any project's trees; only Build phase runs live.
- Deliverable target = agentic-delivery-pipeline coding-canon profile
  (`code-canon/agentic-delivery-pipeline.md`, pinned by `ADR-0021`/`D21`). "Code" unit =
  prompt `.md`; Build writes to `prompts/<phase>/<ROLE>.md` (promoted from scratch after gate).
- Verify mechanism = clean-room runner simulation against `_fixtures/` — NOT pytest.
  Fresh runner gets prompt verbatim + `_test_bench` root, must emit schema-valid,
  ID-threaded artifact matching golden on value; both directions (good PASS + defect FAIL).
- RE-RANK over `.roadmap/08-rerank.json` picks next unshipped prompt. Status derived
  from disk (scan `prompts/` + `_fixtures/` + locks; done iff `done_sentinel` present + valid);
  do NOT maintain tracker/changelog file.
- Orchestrator runs Sonnet — loop trusted; earlier Opus external-judge pass retired.
- `00-exclusive.md` still applies (don't touch Kiro's built-in specs). Generic `step.json`
  executor reused unchanged — for self-host it just happens to write a prompt `.md`.
