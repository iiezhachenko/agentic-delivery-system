# Self-Host Build Roadmap — remaining prompt-builds

> Unshipped frontier of agentic-delivery-pipeline deliverable. Each entry = one prompt-build self-host loop authors, verifies clean-room against `_fixtures/`, promotes to `prompts/`. Order = `08-rerank.json` `remaining_sequence`; position derived from disk (`done_sentinel` scan), never read from tracker.

## Shipped (built skeleton)
- **P-DERIVE-TESTS-INC** — DERIVE-TESTS increment mode. Sentinel: `_fixtures/greenfield-clean/.hld/slices/S4/test-specs.json`. Proof-twin, re-tested green against golden.
- **P-RECONCILE-CRITIQUE-INC** — RECONCILE/CRITIQUE increment mode. Sentinel: `_fixtures/greenfield-clean/.hld/slices/S4/reconcile.json` (present). Phase-3 role 8/8, last Phase-3 increment (D9/D14); first net-new self-build. Unblocks Phase-4 SLICE-BUILD modes.

## Remaining (build in order)
1. **P-BUILD-PLAN-SLICE** — BUILD-PLAN slice-build mode. Unit: `prompts/04-build/BUILD-PLAN.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/build-plan.json`. Phase-4 slice-build (D11); unblocked now Phase-3 increment chain done.
2. **P-MATERIALIZE-ORACLE-SLICE** — MATERIALIZE-ORACLE slice-build mode. Unit: `prompts/04-build/MATERIALIZE-ORACLE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/oracle.json`. Phase-4 slice-build (D11).
3. **P-IMPLEMENT-SLICE** — IMPLEMENT slice-build mode. Unit: `prompts/04-build/IMPLEMENT.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/build-record.json`. Phase-4 slice-build (D11).
4. **P-INTEGRATE-SLICE** — INTEGRATE slice-build mode. Unit: `prompts/04-build/INTEGRATE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/integration-record.json`. Phase-4 slice-build (D11).
5. **P-DIAGNOSE-SLICE** — DIAGNOSE slice-build mode. Unit: `prompts/04-build/DIAGNOSE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/diagnosis.json`. Phase-4 slice-build (D11).
6. **P-VERIFY-OUTPUT-SLICE** — VERIFY-OUTPUT slice-build mode. Unit: `prompts/04-build/VERIFY-OUTPUT.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/verify-output.json`. Phase-4 slice-build (D11).
7. **P-CRITIQUE-SLICE** — CRITIQUE slice-build mode. Unit: `prompts/04-build/CRITIQUE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/critique.json`. Phase-4 slice-build (D11).
8. **P-DEMO-GEN-SLICE** — DEMO-GEN slice-build mode. Unit: `prompts/04-build/DEMO-GEN.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/demo/demo.json`. Phase-4 slice-build (D11), interactive demo+accept gate.

Frontier = first entry whose `done_sentinel` absent or schema-invalid — today **P-BUILD-PLAN-SLICE** (`reconcile.json` present → P-RECONCILE-CRITIQUE-INC shipped; `build-plan.json` not yet exists).
