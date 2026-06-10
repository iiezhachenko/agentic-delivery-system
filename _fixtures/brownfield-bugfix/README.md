# brownfield-bugfix — both-directions oracle for the bugfix spine

Single oracle the bugfix-spine builds verify against. = a greenfield-built, demo-accepted project (frozen baseline) carrying a **latent defect** + a defect report (CR-bug-001) + the GOLDEN repaired trees, plus planted defects. Golden (repaired) PASSes; each planted defect FAILs. Verifier can't separate golden from defect → verifier broken, fix before trusting any bugfix build.

## What's here

```mermaid
flowchart TD
    subgraph BASE["IMMUTABLE BASELINE (greenfield-clean demo-accepted, v1 frozen) + LATENT BUG"]
        A1[".aprd/aprd.frozen.md v1 + lock (frozen)"]
        A2[".adr/ + .hld/ + .build/ (frozen, demo accepted)"]
        A3["src/ — _render formats billable_rate as {:.2f}; null rate → TypeError → list 500s"]
    end
    CR["CR-bug-001 — project-list 500s on null rate"] --> GOLD
    BASE --> GOLD
    subgraph GOLD["GOLDEN repaired trees (expected bugfix output)"]
        G1[".aprd/diagnosis.json — DIAGNOSE root-cause (P-BUGFIX-DIAGNOSE)"]
        G2[".aprd/aprd.v2.frozen.md — CLASS_EXTENSION REPRO/ROOT_CAUSE/BLAST_RADIUS/REGRESSION_GUARD (P-BUGFIX-SYNTHESIZE-CR)"]
        G3[".hld + .build/slices/S4 — repro test + repro/regression oracle (P-BUGFIX-DERIVE-TESTS/MATERIALIZE-ORACLE)"]
        G4["src/ — _render repaired: null rate renders gracefully (P-BUGFIX-IMPLEMENT)"]
        G5[".build/slices/S4/verify-output.json — repro red→green + regression green (P-BUGFIX-VERIFY-OUTPUT)"]
    end
    GOLD -->|"known-good"| PASS([PASS])
    subgraph DEF["defects/ — planted (P-BUGFIX-DEFECTS-E2E)"]
        D1["no-repro-flip (fix doesn't fix)"]
        D2["regression-break (fix breaks baseline AC)"]
        D3["off-blast-radius (edit outside BLAST_RADIUS)"]
    end
    BASE --> DEF
    DEF -->|"each overlaid"| FAIL([MUST FAIL])
```

## The defect (CR-bug-001)
`_ProjectManagementAdapter._render` (`src/freelancer_app/wsgi.py`) formats `billable_rate` as `{p['billable_rate']:.2f}`. A project with `billable_rate = null` → `TypeError` → GET `/projects` 500s. Demo never exercised a null rate, so it shipped green. Repair = render null rate gracefully (correct behavior; no new feature). Blast radius = `_render` only. Regression guard = baseline project CRUD + list render for rated projects (AC on slice S4).

## Both-directions oracle — scenario → expected verdict (filled by builds P-BUGFIX-* 12–18)

| direction | seed | run | expected verdict | separates from golden by |
|---|---|---|---|---|
| **golden** (repaired) | `src/.../wsgi.py` _render renders null rate gracefully | VERIFY-OUTPUT | **verified** (repro green + regression green) | repro flips red→green; regression green |
| `no-repro-flip` | fix that doesn't address null rate | VERIFY-OUTPUT | **blocked** (reproduction still RED) | repro red→red |
| `regression-break` | fix that breaks rated-project render | VERIFY-OUTPUT | **blocked** (regression RED, baseline AC) | regression green→red |
| `off-blast-radius` | edit outside `_render` / declared BLAST_RADIUS | CRITIQUE | **blocked** (off-surface edit) | critique clean→blocked |

## Build status (this fixture is filled incrementally by the roadmap loop)
- **P-BUGFIX-FIXTURE-BASELINE** (this build) — baseline + latent bug + CR-bug-001 + this README. ✓
- P-BUGFIX-DIAGNOSE … P-BUGFIX-VERIFY-OUTPUT (12–17) — add the golden repair artifacts + repaired `src/`.
- P-BUGFIX-DEFECTS-E2E (18) — add `defects/` + e2e-validated note.

Verify discipline (EMBEDDED CANON): both-directions mandatory · disk is the deliverable · clean-room (no pipeline context leaks) · caveman + economy bind all fixture prose. (No python in env → repro/regression verified by static-trace + golden comparison, as the greenfield fixtures are — DIAGNOSE Rule 5: runtime/harness gap ≠ missing-foundation.)
