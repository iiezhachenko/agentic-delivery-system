# Task 10 — BF-MATERIALIZE-ORACLE (OVERLAY)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA to the SLICE-BUILD mode of `prompts/04-build/MATERIALIZE-ORACLE.md`. Greenfield MATERIALIZE-ORACLE (test-author) turns frozen design specs (`CT*`/`F*`) + `AC*` into executable pytest, splits acceptance visible/held-out, mutation-certifies high-blast, freezes red-first. Feature-add adds a MANDATORY **regression layer** (`oracle_layers += regression`, BF4) scoped to the **touched surface + seams** (NOT the full inherited suite — Risk R4). MODE=slice, no scaffold (harness exists). Dual-mode overlay on the existing slice-build part: ONE shared Rules + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF4**.

## Why this exists

Feature-add must guarantee nothing previously green goes red (BF4). The oracle is where "done" is materialized — so the regression guard belongs here as a fourth layer alongside contract/flow/acceptance. Scoping matters: re-running the whole inherited suite per slice is slow on large baselines (Risk R4), so the regression layer targets the surface the feature touches + the seams it plugs into.

### Invariants served
- **BF4 — regression-gated.** Regression layer materialized; existing suites that cover the touched surface + seams must stay green.
- **BF7 / P8 — lock = single source of current frozen WHAT.** The aPRD carrying `CLASS_EXTENSION`/`REGRESSION_GUARD` is RESOLVED via `aprd.lock.artifact` (read lock → open named file), NOT a hardcoded `aprd.v<N>.frozen.md`. Same canon as Task 07a; `v2` below is the bench EXAMPLE, never the binding (a literal version path walks stale WHAT one bump later).

## DAG position

- **Deps:** Task 09 (BF-SEQUENCE — `08-rerank.json` auto-selects the target slice). **Hard gate:** greenfield `MATERIALIZE-ORACLE` SLICE-BUILD part must be shipped (this overlays it).
- **Downstream:** BF-IMPLEMENT (11).
- **Sentinel:** golden slice `oracle.json` carries a `regression` layer (scoped to touched surface + seams).

## EMBEDDED CANON

**Caveman block — already present in MATERIALIZE-ORACLE; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences from the shared/slice-build rules; never copy a shared rule), AB2 (guards only in escapes), AB5 (schema inline comments are field docs), AB7–AB9. **Dual-mode overlay pattern:** the role already runs `mode: skeleton-build|slice-build` off ONE shared `## Rules` + per-mode deltas. Add the feature-add regression delta to the slice-build part; the class is dispatched by the playbook (`feature-add.md` sets `oracle_layers: [contract, flow, acceptance, regression]` + `build_depth: per-slice-no-scaffold`).

## Current state — `prompts/04-build/MATERIALIZE-ORACLE.md` (greenfield, slice-build mode)

**Role:** test-author, Phase 4 role 2/8. SEPARATE from the builder (B4) — materialize "done" into an immutable oracle, implement nothing. The builder may green it, never edit it. Each test file: `# FROZEN ORACLE — do not edit (B4)`. `oracle.lock` signed by test-author (≠ builder), `builder_may_not_edit:true`, `starts_red:true`.

**Shared Rules (spine):** materialize-never-implement; oracle frozen+builder-can't-edit; reference frozen specs verbatim; held-out split (each `AC*` → visible + held_out, B7); mutation-certify high-blast (auth/money/data-integrity); red-first; stack from frozen frame; frozen-locks gate everything; full accounting/walk-to-count; assert SUT-observable not mock-config; stay in lane.

**SLICE-BUILD mode (Part B):** materialize ONE slice's NEW tests against the FROZEN skeleton oracle + prior-built slices. Inherit the frozen skeleton oracle by reference (NEVER re-materialize/re-run/edit, H14). Materialize: NEW real-seam contract tests (slice build-plan `provides_contracts ∪ consumes_seams[real]` MINUS seams already in the frozen oracle), the slice flow test, the slice's traced `AC*` not already materialized. Greenfield `class_ext: []` (regression/benchmark/parity don't fire). Auto-select target slice from `08-rerank.json` `remaining_sequence` (first with build-plan + test-specs but no `oracle.lock`).

> Note: the oracle schema already carries a `class_ext` field that is `[]` for greenfield. Feature-add FIRES it with the regression layer.

## THE WORK — add the feature-add delta to the slice-build part of `MATERIALIZE-ORACLE.md`

1. **Frontmatter:** add feature-add inputs — frozen-WHAT RESOLVED via lock: `.aprd/<aprd.lock.artifact>` (read `.aprd/aprd.lock`, open `.aprd/` + its `artifact` value = CURRENT frozen version carrying the `CLASS_EXTENSION` block: `REGRESSION_GUARD` names which existing ACs/suites the feature touches; feature-add → `aprd.v<N>.frozen.md`, here `aprd.v2.frozen.md` — example, NOT hardcoded path; BF7/P8 + 07a canon), `.aprd/baseline-map.json` (`existing_oracle` inventory + `integration_seams`). Guard (rewrite existing freeze-gate, don't add — AB9): lock missing / `status != frozen`, OR named artifact missing/unparseable → HALT. Class dispatched by playbook.
2. **Shared `## Rules`:** keep verbatim. The `class_ext` field already exists in the schema — the delta fills it for feature-add (one home, AB1).
3. **Add a `### feature-add delta (slice-build)` block under Part B:**
   - **Materialize a regression layer (BF4).** `class_ext += regression`. The regression layer = executable tests proving the existing ACs/suites named in `REGRESSION_GUARD` still pass after the feature lands. Materialize from the EXISTING oracle inventory (`baseline-map.json` `existing_oracle.suites`) by REFERENCE — the regression layer asserts the prior-green tests stay green; never re-author or weaken them (H14 analog).
   - **Scope to touched surface + seams (Risk R4).** Regression layer covers ONLY: the existing ACs/contracts the feature's `INTEGRATION_SEAMS` touch + the surface the new `R*/AC*` alter. Do NOT materialize the whole inherited suite per slice. Cite the scope basis.
   - **Inherit, never mutate (BF1/BF4).** Existing oracle suites are frozen — reference them in the regression layer manifest; never edit a baseline test. A regression test needing a baseline-test edit = a defect → escape (frozen-overwrite breach), never patch.
   - **MODE=slice, no scaffold.** Harness exists (playbook `build_depth: per-slice-no-scaffold`). Don't lay scaffold.
4. **Output schema:** the slice `oracle.json` `class_ext` carries the regression layer: `[{ "layer": "regression", "scope": "touched-surface + seams", "asserts": ["existing AC*/suite refs that must stay green"], "source_suites": [".build/skeleton/oracle/", ...], "rematerialized": false }]`. Add `class:"feature-add"`, `regression_guard_ref` (the aPRD class-extension block). `oracle_counts` adds `regression_tests`.
5. **Task steps:** add a feature-add branch to Part B's steps: after materializing the slice's NEW contract/flow/acceptance tests, read `REGRESSION_GUARD` + `existing_oracle` → materialize the scoped regression layer (by reference) → fill `class_ext` → freeze. Keep slice-build steps intact.

## Lane / what NOT to do

- Don't re-author/edit/weaken any existing baseline test (BF1/BF4 — reference only).
- Don't materialize the whole inherited suite (Risk R4 — scope to touched surface + seams).
- Don't implement anything (test-author lane, B4).
- Don't lay scaffold (harness exists).

## Verify (both-directions)

- **Known-good:** feature-add target slice → slice `oracle.json` carries a scoped `regression` layer referencing the touched existing suites. PASS.
- **Planted defect — missing regression layer:** slice oracle with `class_ext: []` for feature-add → MUST FAIL (BF4).
- **Planted defect — baseline test edited:** regression layer mutates an existing frozen test → MUST FAIL (BF1).
- **Planted defect — full-suite regression:** regression layer pulls the entire inherited suite unscoped → flag (Risk R4 — scope violation).
- **Planted defect — stale-version walk:** a copy that ignores `aprd.lock.artifact` and hardcodes a fixed `aprd.v<N>.frozen.md` → reads the wrong version's `CLASS_EXTENSION` → MUST FAIL (BF7/P8; the 07a defect).

## DONE WHEN

- `MATERIALIZE-ORACLE.md` slice-build part carries a feature-add regression delta (shared/slice-build Rules substance untouched).
- Frozen-WHAT RESOLVED via `aprd.lock.artifact` (no hardcoded version path); freeze-gate guard verifies the named artifact exists (BF7/P8 + 07a canon).
- Golden feature-add slice `oracle.json` carries a scoped `regression` layer; no baseline test mutated.
- Both-directions check holds (incl. stale-version-walk FAIL).
