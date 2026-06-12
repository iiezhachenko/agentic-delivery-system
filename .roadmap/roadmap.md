# Self-Host Build Roadmap — remaining prompt-builds

> Unshipped frontier of agentic-delivery-pipeline deliverable. Each entry = one prompt-build self-host loop authors, verifies clean-room against `_fixtures/`, promotes to `prompts/`. Order = `08-rerank.json` `remaining_sequence`; position derived from disk (`done_sentinel` scan), never read from tracker.
>
> **roadmap_version 3 (2026-06-10, CR-001):** aPRD v3→v4 brought the **bugfix class binding** into scope. Greenfield 10 builds reconciled to shipped (all sentinels present on disk). Bugfix spine = the new frontier.

## Shipped (greenfield delivery pipeline — specs 00–04, all sentinels present)
P-DERIVE-TESTS-INC · P-RECONCILE-CRITIQUE-INC · P-BUILD-PLAN-SLICE · P-MATERIALIZE-ORACLE-SLICE · P-IMPLEMENT-SLICE · P-INTEGRATE-SLICE · P-DIAGNOSE-SLICE · P-VERIFY-OUTPUT-SLICE · P-CRITIQUE-SLICE · P-DEMO-GEN-SLICE. (10/10 — Phase-3 increments + Phase-4 slice-build modes.)

## Shipped head-start (bugfix spine — committed, NOT yet roadmap-tracked goldens)
- bugfix playbook (`prompts/_playbooks/bugfix.md`).
- class-dispatch wiring (`8e0f8ea`) — bugfix dropped from HALT lists + CLASSIFIER routing; verified both directions clean-room.
- intake overlays (`60e8b99`) — BASELINE-MAP/GAP-DETECT/SYNTHESIZE bugfix deltas; no new lint violations.
> Prompt edits exist; their `_fixtures/brownfield-bugfix/` goldens are owed → produced by the builds below (re-run harmless, D20).

## Remaining (bugfix spine — build in order)
1. **P-BUGFIX-FIXTURE-BASELINE** — `_fixtures/brownfield-bugfix/` baseline (greenfield-clean demo-accepted + defect report: null billable-rate crashes project-list, S4). Sentinel: `_fixtures/brownfield-bugfix/README.md`.
2. **P-BUGFIX-DIAGNOSE** — DIAGNOSE bugfix defect-localize mode. Sentinel: `_fixtures/brownfield-bugfix/.aprd/diagnosis.json`. Writes ROOT_CAUSE for SYNTHESIZE.
3. **P-BUGFIX-SYNTHESIZE-CR** — bugfix CR aPRD (CLASS_EXTENSION). Sentinel: `_fixtures/brownfield-bugfix/.aprd/aprd.v2.frozen.md`. (overlay authored 2a; golden owed.)
4. **P-BUGFIX-DERIVE-TESTS** — reproduction test spec (red→green). Sentinel: `_fixtures/brownfield-bugfix/.hld/slices/S4/test-specs.json`.
5. **P-BUGFIX-MATERIALIZE-ORACLE** — repro + regression layers. Sentinel: `_fixtures/brownfield-bugfix/.build/slices/S4/oracle/oracle.json`.
6. **P-BUGFIX-IMPLEMENT** — minimal fix at root cause (scoped to BLAST_RADIUS). Sentinel: `_fixtures/brownfield-bugfix/.build/slices/S4/build-record.json`.
7. **P-BUGFIX-VERIFY-OUTPUT** — repro flips red→green + regression stays green. Sentinel: `_fixtures/brownfield-bugfix/.build/slices/S4/verify-output.json`.
8. **P-BUGFIX-DEFECTS-E2E** — planted defects + both-directions e2e + README note. Sentinel: `_fixtures/brownfield-bugfix/defects/regression/expected-verdict.json`.

Frontier = first entry whose `done_sentinel` absent or schema-invalid — bugfix wave (8 entries above) still pending; **CR-007 multi-stream wave** added as positions 19–22 in `08-rerank.json` (branch `feature/multi-stream-workstreams`, frontier = W16-ADR-0028).
