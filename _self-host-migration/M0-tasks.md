# M0 — Baseline & rollback point — tasks

> Migration phase M0 (migration-spec §6). Goal: known-good baseline to roll back to + the owed D10 re-test on the proof-twin, so M5's parity gate cannot lie against a stale baseline.

## Proof-twin choice

**Proof-twin = DERIVE-TESTS increment mode** (`prompts/03-hld/DERIVE-TESTS.md`, Part B).
Why: last-shipped (2026-06-08); dual-mode increment — the *exact* authoring pattern M5b's net-new RECONCILE/CRITIQUE increment will follow; has a fresh golden twin (`_fixtures/greenfield-clean/.hld/slices/S4/test-specs.json`). Re-testing it green proves the harness + the increment pattern reproduce hand quality. (§7 names it as a valid A/B candidate.)

## Tasks

| # | Task | Acceptance | Status |
|---|---|---|---|
| T0 | Confirm clean git state (no uncommitted changes pre-M0) | `git status` clean | ☑ clean at start |
| T1 | Pick proof-twin + record rationale | proof-twin named, twin golden located | ☑ |
| T2 | Clean-room re-test proof-twin vs golden (owed D10 re-test) | runner authors S4 test-specs.json into scratch; matches golden on value (schema-valid, bijection, ID-threaded, all defect blocks `[]`); behavior == golden | ☑ PASS (0 retries) |
| T3 | Establish rollback point | rollback target recorded (HEAD sha); **NO COMMIT** (task rule) — see note | ☑ HEAD `4515f1d` |

## Spec deviation (logged)

- migration-spec §6 M0 step 2 says *"Commit the tree. Tag it `pre-self-host`."* — **NOT executed.** Task rule: DO NOT COMMIT INTO GIT. Rollback target recorded as the current clean HEAD instead; operator runs the tag when ready (`git tag pre-self-host <sha>`).
- migration-spec §6 M0 step 1 says *"Confirm the 30 shipped prompts validate."* — risk-flag in the spec itself softens this to *"run the owed re-test on at least the twin used for the proof."* M0 gate (Acceptance) = the proof-twin re-tested green. Full 30-prompt sweep is not the M0 gate; deferred (expensive, not load-bearing for M5).

## Results

### T2 — clean-room re-test (proof-twin = DERIVE-TESTS increment)

- **Setup.** Cleared `_test_bench`; seeded the pre-increment workspace state = full `greenfield-clean` fixture minus the target output `_test_bench/.hld/slices/S4/test-specs.json` (reproduces disk as it stood right before DERIVE-TESTS increment ran). All declared inputs present.
- **Run.** `step-runner` (Sonnet/High), clean room — given the `DERIVE-TESTS.md` content verbatim + project root `_test_bench`, no pipeline context. Dispatched INCREMENT (frozen skeleton.lock present), auto-selected S4, wrote `.hld/slices/S4/test-specs.json`. No frozen artifact mutated, no build DAG re-emitted.
- **Verify vs golden** (`_fixtures/greenfield-clean/.hld/slices/S4/test-specs.json`). Value-bearing fields — **all MATCH**: mode, slice_id, slice_name, flow_test (id/target/path/via/asserts_ac/failure.exercises/traces), inherited_contract_tests (ids/targets/source_ref), new_contract_tests `[]`, skeleton_fidelity (verdict `inherits-frozen-oracle`), coverage, test_counts. All defect blocks (`structural_defects`/`frame_conflicts`/`aprd_defects`) `[]`.
- **Parity glance.** One prose field (happy-path `assertion`) differs in wording only — semantically identical; `failure_path.expected_terminal_state` byte-identical. Per spec §7 value is primary, behavior over byte-equality → benign narration variance.
- **Verdict: PASS (0 retries).** Proof-twin reproduces hand quality clean-room → D10 stale-baseline risk retired for the proof-twin. M5 parity gate can trust this baseline.

### T3 — rollback point

- **Rollback target: `4515f1d`** (`Add migration specification for transitioning to self-hosted system`). Tracked tree clean at this commit.
- **NO COMMIT / NO TAG made** (task rule). Operator runs when ready: `git tag pre-self-host 4515f1d`.
- `_test_bench/` confirmed gitignored; the only untracked working-tree item is this deliverable (`_self-host-migration/M0-tasks.md`).

## M0 acceptance (spec §6) — MET

- [x] clean git state (tracked tree clean; rollback target pinned)
- [x] proof-twin prompt re-tested green against its golden

> Owed to M5 (not M0): the **both-directions** discrimination check (known-good PASS + planted-defect FAIL) — spec §7 places it at the cutover gate, not the baseline. Full 30-prompt validation sweep also deferred (not the M0 gate).
