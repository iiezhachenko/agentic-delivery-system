# aPRD — Tag client projects and filter the project list by tag (feature-add, FROZEN v2) — PLANTED DEFECT (id-collision / BF3)
#
# DEFECT: new requirements/acceptance REUSE baseline indices (R10, AC10) instead of continuing strictly
# above the baseline high-water (R10/AC10). New IDs must be R11+/AC11+. Overlay → .aprd/aprd.v2.frozen.md.
# The verifier MUST reject: a new R* reusing a baseline R* index collides the spec→code→test thread (BF3).

## CLASS
feature-add

## BASELINE
- **extends**: `aprd.frozen.md` v1 (lock content_sha256 `f3a1c0d9b8e7461525d4c3b2a1908f7e6d5c4b3a2918f0e7d6c5b4a39281706f`). Baseline R1–R10, AC1–AC10, E1–E7, A1–A13 carried by REFERENCE.

## ENTITIES
- **E8 — Tag**: A label attached to a client project (free-text, A14).

## REQUIREMENTS
- **R10**: A freelancer must be able to tag a client project with a label.   <!-- DEFECT: R10 already = baseline 'billable hourly rate configurable'. Reuses baseline index. Should be R11. -->
- **R11**: A freelancer must be able to filter the project list by tag.
- **R13**: A tag applied to a client project must be persisted and associated with that project.

## ACCEPTANCE
- **AC10** (req_ref: R10): When the freelancer sets a label on a project and saves, the project's stored label field holds the submitted text and renders in the list.   <!-- DEFECT: AC10 already = baseline 'rate × hours' acceptance. Collision. Should be AC11. -->
- **AC12** (req_ref: R11): The list filtered by a tag shows exactly the projects whose label equals that value.
- **AC13** (req_ref: R13): On return, the project's label field still holds the same value, linked to the same project.

## CLASS_EXTENSION (feature-add)
### INTEGRATION_SEAMS
- **at C1** (contract_ref: CT2, kind: persistence): tag persisted by extending CT2 (label field on the project record).
### REGRESSION_GUARD
- **baseline AC* must stay green**: AC6.
### CONVENTION_BASELINE
- **lang**: Python >=3.11 (ADR-0002)
