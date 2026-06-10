# CR-bug-001 — defect report: project-list 500s on null billable rate

> Bugfix defect report against the demo-accepted freelancer_app (baseline v1, frozen). Re-enters Phase 0 (BF2: reproduce → localize → root-cause before client). Caveman register.

## Defect (as reported)
Project-list page 500s for some freelancers. A project created before billable rates existed has `billable_rate = null`; the list view crashes instead of rendering. Projects WITH a rate display fine.

## REPRO_STEPS (how to trip it)
1. Sign in; have ≥1 project with `billable_rate = null` (e.g. created via edit path with rate omitted, or pre-rates data).
2. GET `/projects`.
3. Observed: HTTP 500 (server error). Expected: 200, list renders every project.

## Localization hint (NOT the root-cause verdict — DIAGNOSE owns that)
List rendering = `_ProjectManagementAdapter._render` in `src/freelancer_app/wsgi.py`. Formats `billable_rate` per project.

## Class
bugfix — existing behavior wrong (crash), repair to spec, NO new behavior, NO new tech. Existing-behavior expected: render the project list. Correct behavior for a null rate is under-specified by baseline (GAP-DETECT bugfix hunt site).

## Constraints
- BF1: baseline frozen trees (`aprd.frozen.md` v1, locks) immutable — repair edits `src/` only, scoped to blast radius.
- BF4: regression — baseline AC for "create + manage projects" (project CRUD + list render for rated projects) must stay green.
