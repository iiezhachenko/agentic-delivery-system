# CF-W0a-A5 — planted-lint fixture pair (both-directions)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, linter names) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF = tier-1 BORROWED canon. A canon gate is only proven if it fires BOTH directions: clean code PASSes, defective code FAILs. This task ships the fixture pair proving the W0a lint gate (tasks 02+03) actually rejects violations — not just stays green. WBS sub-task **A5**.

## Deliverable

Fixture pair: a clean Go copy (lint PASS) + a planted-defect copy (lint FAIL), proving the lint gate fires both directions.

## Sentinels

- `_canon-floor/lint/clean/` — clean Go, golangci exit 0.
- `_canon-floor/lint/planted/` — ≥1 deliberate violation, golangci exit 1.

## Depends on

- Task 03 (CI lint+compiler gate) — the gate this fixture exercises.
- (Reads `.golangci.yml` from task 02 to know which linters fire.)

## Steps

1. `_canon-floor/lint/clean/`: minimal valid Go pkg, lint-clean under the 8 linters (`staticcheck` `govet` `gosec` `errcheck` `ineffassign` `unused` `gocritic` `revive`).
2. `_canon-floor/lint/planted/`: copy of clean + ONE planted violation per representative linter class. Keep minimal + DETERMINISTIC. Each defect documented (comment) naming which linter it trips. Examples:
   - `errcheck`: call returning `error`, error ignored (`f()` where `f() error`).
   - `ineffassign`: assign a var, overwrite before read.
   - (1–2 classes enough to prove the gate; document which.)
3. Ensure `_canon-floor/**/planted/**` is EXCLUDED from the MAIN lint scope (`.golangci.yml`, task 02) so the planted defects don't red the real gate during normal runs (R-CF6). This fixture is run EXPLICITLY pointing at the planted dir.

## Acceptance (both-directions — OPERATOR runs per IRON LAW D39)

Agent does NOT run the proof. Agent hands operator these exact steps + expected output; operator runs from clean checkout:
```
cd _adp-2.0/_deliverables/adp-2.0-code
golangci-lint run ./_canon-floor/lint/clean/...     # expect: 0 issues, exit 0 (GREEN)
golangci-lint run ./_canon-floor/lint/planted/...   # expect: ≥1 issue, exit 1 (RED)
```
Both directions must hold: clean → green, planted → red.

## Boundary — OUT of scope

- Arch fixtures = task 09.
- Gate wiring = task 03.
- These fixtures are THROWAWAY — may be pruned once SUB W1a real tree exercises the gate. Flag for SUB: decide whether `_canon-floor/` fixtures retire or fold into regression suite.

## Risk

- **R-CF6** real gate lints planted defects → false red. Mitigation = `_canon-floor/**/planted/**` excluded from main scope; planted copy linted only by this explicit command.
