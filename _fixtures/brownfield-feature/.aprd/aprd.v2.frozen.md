# aPRD — Tag client projects and filter the project list by tag (feature-add, FROZEN v2)

> Version bump extending a frozen baseline (P8). Baseline `aprd.frozen.md` (v1) is unchanged and remains the source for its own R*/AC*/E*/C*/A*; this version adds only the tag feature. Stable IDs thread spec → design → code → test (P9).

## CLASS
feature-add

## BASELINE
- **extends**: `aprd.frozen.md` v1 (lock content_sha256 `f3a1c0d9b8e7461525d4c3b2a1908f7e6d5c4b3a2918f0e7d6c5b4a39281706f`). Baseline R1–R10, AC1–AC10, E1–E7, C1–C3, A1–A13 carried by REFERENCE — not re-listed here.

## ENTITIES
- **E8 — Tag**: A label attached to a client project. Under the resolved decision (A14) a tag is a free-text string value stored on the project record, not a separate table or managed vocabulary.

## REQUIREMENTS
- **R11**: A freelancer must be able to tag a client project with a label.
- **R12**: A freelancer must be able to filter the project list by tag.
- **R13**: A tag applied to a client project must be persisted and associated with that project.

## CONSTRAINTS
<!-- this CR's 02 stated_constraints is empty; no C* synthesized from a gap answer (shared Rule 5) -->

## ASSUMPTIONS
> Each assumption fills one gap from this CR's 04 and is traceable to it (gap_ref → G*). New A* continue above baseline high-water (A13).
- **A14** (gap_ref: G1): A tag is a free-text string field added to the existing project record; persistence contract CT2 is extended with the new field. No separate Tag table, relation, or controlled vocabulary is introduced.
- **A15** (gap_ref: G2): Each project carries exactly one label (singular, as the CR words it). Multiple tags per project are not supported.
- **A16** (gap_ref: G3): Filtering selects the project list by a single tag at a time. Combining multiple tags with AND/OR semantics is not supported.

## OUT_OF_SCOPE
- First-class Tag entity — a separate Tag table, a many-to-one/many relation to the project, and a freelancer-managed controlled vocabulary (declined alternative for G1).
- Multiple tags per project (declined alternative for G2).
- Multi-tag filtering with AND/OR combination semantics (declined alternative for G3).

## ACCEPTANCE
- **AC11** (req_ref: R11): Given a freelancer is signed in and a client project exists, when the freelancer sets a label on that project and saves, the project's stored label field holds the submitted text and the label renders on the project in the project list.
- **AC12** (req_ref: R12): Given projects with differing labels exist, when the freelancer filters the project list by a given tag value, the list shows exactly the projects whose stored label equals that value and omits all others.
- **AC13** (req_ref: R13): After a freelancer sets a label on a project and navigates away, on return the project's label field still holds the same value and remains linked to the same project.

## CLASS_EXTENSION (feature-add)
### INTEGRATION_SEAMS
- **at C1** (contract_ref: CT2, kind: persistence): tag persisted by EXTENDING contract CT2 — a new label field on the existing project record. No new contract; the C1 data_store internals stay untouched. Feature meets baseline only at this seam (from G1 `seam_ref`).

### REGRESSION_GUARD
- **suites must stay green**: `.build/skeleton/oracle/`, `.build/slices/S4/oracle/` (baseline-map `existing_oracle`; scoped to touched surface + the C1 seam, NOT the whole inherited suite — Risk R4).
- **baseline AC* must stay green**: AC6 (create and manage client projects — R6, parent of R11/R12/R13). The label field is additive: existing project create / list / edit / delete + persistence behaviour unchanged.

### CONVENTION_BASELINE
- **lang**: Python >=3.11 (ADR-0002)
- **layout**: src/freelancer_app/<component_snake>/*.py; one package per component (C1 data_store, C2 identity_auth, C3 project_management, C4 time_logging, C5 invoice_export, C6 web_ingress)
- **lint**: pyproject.toml [tool.pytest.ini_options] pythonpath=['src']; setuptools build; no ruff/black config present
- **naming**: module dir = snake_case(component.name); module files snake_case (e.g. session_gate.py, oauth_callback.py, project_store.py); pkg = freelancer-app
