# brownfield-feature — both-directions oracle for the feature-add spine

Single oracle Tasks 02–13 verify against. = a greenfield-built, demo-accepted project (frozen baseline) + a feature change request (CR-001) + the GOLDEN correctly-extended trees, plus 4 planted defects. Known-good golden PASSes; each planted defect FAILs. Verifier can't separate golden from defect → verifier broken, fix before trusting any brownfield build.

## What's here

```mermaid
flowchart TD
    subgraph BASE["IMMUTABLE BASELINE (greenfield-clean, demo-accepted)"]
        A1[".aprd/aprd.frozen.md v1 + lock (frozen)"]
        A2[".adr/ + .hld/skeleton + .hld/slices/S4 (frozen)"]
        A3[".build/skeleton + .build/slices/S4 (oracle.lock frozen, demo accepted)"]
        A4["src/ C1 C2 C3 C6 + pyproject.toml"]
    end
    CR["CR-001 — tag + filter client projects"] --> GOLD
    BASE --> GOLD
    subgraph GOLD["GOLDEN extended trees (expected feature-add output)"]
        G1[".aprd/aprd.v2.frozen.md (R11/R13, CLASS_EXTENSION) — v1 byte-unchanged"]
        G2[".aprd/baseline-map.json + .roadmap (S5/S6, baseline pinned)"]
        G3[".hld/slices/S5/* (CT2 label extension)"]
        G4[".build/slices/S5/* — verify-output verdict=verified, regression green"]
        G5["src/ project_label.py + project_label_dispatch.py + wsgi label route (additive)"]
    end
    GOLD -->|"known-good"| PASS([PASS])
    subgraph DEF["defects/ — 4 planted overlays"]
        D1["regression (BF4)"]
        D2["id-collision (BF3)"]
        D3["frozen-overwrite (BF1)"]
        D4["convention-drift (BF5)"]
    end
    BASE --> DEF
    DEF -->|"each overlaid"| FAIL([MUST FAIL])
```

## The feature (CR-001)

Add a free-text **label** to a client project and filter the project list by tag. Atomic, single-system. Plugs into the EXISTING system at one declared seam: extends persistence contract **CT2** (C3 Project Management → C1 Data Store) with an additive label field on the existing project record (A14). Domain component **C3** (built in baseline slice S4). New slices S5 (set+persist label) and S6 (filter). Regression guard = baseline **AC6** (create + manage projects).

Baseline ID high-water (baseline-map): R10 / AC10 / E7 / C6 / S4 / ADR-0006 / CT11 / A13 / F4. New feature IDs continue strictly above: R11, R13, AC11, AC13, E8, S5, S6, F5.

## Both-directions oracle — scenario → expected verdict

The golden (this tree as-is) PASSes: `.build/slices/S5/verify-output.json` verdict `verified` (5/5 layers, regression green, baseline byte-unchanged, no ID collision). Each defect is an overlay onto the clean baseline + golden; running the named role MUST reject.

| defect | invariant | seed overlay | run | expected verdict | separates from golden by |
|---|---|---|---|---|---|
| `regression` | **BF4** feature breaks an existing AC | `project_store.regressed.py` → `src/.../project_management/project_store.py` | VERIFY-OUTPUT | **rejected** (regression RED, AC6) | `regression.verdict` green→red |
| `id-collision` | **BF3** new R* reuses a baseline R* index | `aprd.v2.collision.frozen.md` → `.aprd/aprd.v2.frozen.md` | SYNTHESIZE / P2+P3 verify | **rejected** (R10/AC10 collide) | `id_threading.collisions` []→[R10,AC10] |
| `frozen-overwrite` | **BF1** run mutates the frozen baseline | `aprd.frozen.mutated.md` → `.aprd/aprd.frozen.md` | VERIFY (immutability) | **rejected** (immutability breach) | `baseline_immutability.frozen_artifacts_modified` []→[aprd.frozen.md] |
| `convention-drift` | **BF5** new code uses canon defaults vs CONVENTION_BASELINE | `tagService.py` → `src/freelancer_app/tags/tagService.py` | CRITIQUE | **blocked** (convention-drift flagged) | `convention_drift_check.drift_detected` false→true |

Each defect dir carries the planted artifact(s) + `expected-verdict.json` (the load-bearing assertion). The headline regression defect also carries the rejecting `verify-output.regression-red.json`; convention-drift carries the blocking `critique.flagged.json`.

## How to seed a scenario into a bench

1. Copy the clean baseline + golden: everything under `_fixtures/brownfield-feature/` EXCEPT `defects/`.
2. Overlay the scenario's planted file(s) onto the path named in its `expected-verdict.json` `seed[]`.
3. Run the named role clean-room (step-runner, Sonnet/High — prompt verbatim + bench path; never reads `_fixtures/` directly).
4. Assert the role's on-disk output matches the defect's `expected_verdict` / `expected_signal`. The golden (no overlay) must produce `verified` / `clean`.

Verify discipline (EMBEDDED CANON): both-directions mandatory · disk is the deliverable (verify the artifact on disk, not a chat reply) · clean-room (no pipeline context leaks) · caveman + economy bind all fixture prose.
