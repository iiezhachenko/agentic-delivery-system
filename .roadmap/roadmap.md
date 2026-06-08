# Self-Host Build Roadmap — remaining prompt-builds

> The unshipped frontier of the agentic-delivery-pipeline deliverable. Each entry below is one prompt-build the self-host loop authors, verifies clean-room against `_fixtures/`, and promotes to `prompts/`. Order = `08-rerank.json` `remaining_sequence`; position is derived from disk (the `done_sentinel` scan), never read from a tracker. Rendered by freeze.mjs.

## Shipped (built skeleton)
- **P-DERIVE-TESTS-INC** — DERIVE-TESTS increment mode (last-shipped 2026-06-08; the M0 proof-twin).

## Remaining (build in order)
1. **P-RECONCILE-CRITIQUE-INC** — RECONCILE/CRITIQUE increment mode. Unit: `prompts/03-hld/RECONCILE-CRITIQUE.md (increment)`. Sentinel: `_fixtures/greenfield-clean/.hld/slices/S4/reconcile.json`. Phase-3 role 8/8, last Phase-3 increment (D9/D14); unblocks the Phase-4 SLICE-BUILD modes. First net-new self-build (migration-spec §7 M5b).
2. **P-BUILD-PLAN-SLICE** — BUILD-PLAN slice-build mode. Unit: `prompts/04-build/BUILD-PLAN.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/build-plan.json`. Phase-4 slice-build (D11); blocked on the Phase-3 increment chain finishing.
3. **P-MATERIALIZE-ORACLE-SLICE** — MATERIALIZE-ORACLE slice-build mode. Unit: `prompts/04-build/MATERIALIZE-ORACLE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/oracle.json`. Phase-4 slice-build (D11).
4. **P-IMPLEMENT-SLICE** — IMPLEMENT slice-build mode. Unit: `prompts/04-build/IMPLEMENT.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/build-record.json`. Phase-4 slice-build (D11).
5. **P-INTEGRATE-SLICE** — INTEGRATE slice-build mode. Unit: `prompts/04-build/INTEGRATE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/integration-record.json`. Phase-4 slice-build (D11).
6. **P-DIAGNOSE-SLICE** — DIAGNOSE slice-build mode. Unit: `prompts/04-build/DIAGNOSE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/diagnosis.json`. Phase-4 slice-build (D11).
7. **P-VERIFY-OUTPUT-SLICE** — VERIFY-OUTPUT slice-build mode. Unit: `prompts/04-build/VERIFY-OUTPUT.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/verify-output.json`. Phase-4 slice-build (D11).
8. **P-CRITIQUE-SLICE** — CRITIQUE slice-build mode. Unit: `prompts/04-build/CRITIQUE.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/critique.json`. Phase-4 slice-build (D11).
9. **P-DEMO-GEN-SLICE** — DEMO-GEN slice-build mode. Unit: `prompts/04-build/DEMO-GEN.md (slice-build)`. Sentinel: `_fixtures/greenfield-build-reds/.build/slices/S4/demo/demo.json`. Phase-4 slice-build (D11), interactive demo+accept gate.

The frontier is the first entry whose `done_sentinel` is absent or schema-invalid — today **P-RECONCILE-CRITIQUE-INC** (its sentinel `reconcile.json` does not yet exist).
