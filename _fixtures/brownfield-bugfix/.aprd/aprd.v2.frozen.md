# aPRD — Freelancer Time-Tracking: Fix null billable_rate project-list 500 (bugfix, FROZEN v2)

> Version bump extending a frozen baseline (P8). Baseline `aprd.frozen.md` is unchanged and remains the source for its own R*/AC*/E*/C*/A*; this version adds only the fix. Stable IDs thread spec → design → code → test (P9).

## CLASS
bugfix

## BASELINE
- **extends**: `aprd.frozen.md` v1 (lock content_sha256 `f3a1c0d9b8e7461525d4c3b2a1908f7e6d5c4b3a2918f0e7d6c5b4a39281706f`). Baseline R*/AC*/E*/C*/A* carried by REFERENCE — not re-listed here.

## ENTITIES
<!-- No new entities — bugfix repairs existing render path, no new data model additions -->

## REQUIREMENTS
- **R11**: Project list must render every owned project, including a project whose billable_rate is null.   <!-- repro requirement; asserts correct behavior defect violates; baseline_ref R6 -->

## CONSTRAINTS
<!-- None — bugfix adds no new C*; no constraint synthesized from gap answer -->

## ASSUMPTIONS
> One per gap in 04, traceable gap_ref → G*. New A* above baseline high-water (A13).

- **A14** (gap_ref: G1): Null billable_rate renders as blank placeholder em-dash ('—') in rate column; the row renders, no numeric format applied to null value.

## OUT_OF_SCOPE
- Render null billable_rate as zero ('0.00') in rate column (declined alternative for G1).
- Omit rate field entirely for null-rate project row (declined alternative for G1).

## ACCEPTANCE
- **AC11** (req_ref: R11): Given freelancer owns a project with billable_rate null, when GET /projects, then response is HTTP 200 and the project list contains that project's row with rate column rendered as '—' (not an error, not blank-via-crash, not '0.00').

## CLASS_EXTENSION (bugfix)
### REPRO_STEPS
1. Sign in; own >=1 project with billable_rate = null (rate omitted / pre-rates data).
2. GET /projects.
3. Observed: HTTP 500. Expected: 200, list renders every project.

### ROOT_CAUSE
- **cause**: _ProjectManagementAdapter._render (src/freelancer_app/wsgi.py) formats each project's billable_rate with the numeric format spec ':.2f' and direct-indexes p['billable_rate']. When billable_rate is null (None), ':.2f' raises TypeError, so rendering the whole project list aborts and GET /projects returns HTTP 500. The render code applies a numeric format to a value the data model allows to be null, with no null guard — the contract CT9 (server-rendered project list) and AC6 are satisfiable and correct; the defect is the rendering implementation.
- **diagnosis_ref**: `.aprd/diagnosis.json` (`defect-localized / my-code`)

### BLAST_RADIUS
- **touched surface**: C3 (module `src/freelancer_app/wsgi.py`), symbol `_ProjectManagementAdapter._render` — single method; only edit site repair needs.

### REGRESSION_GUARD
- **suites must stay green**: `.build/slices/S4/oracle/`
- **baseline AC* must stay green**: AC6
