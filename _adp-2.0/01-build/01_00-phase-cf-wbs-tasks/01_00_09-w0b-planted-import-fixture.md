# CF-W0b-B4 — planted import-direction fixture (both-directions)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0b = adopt FROZEN P-TOOL arch. A boundary gate is proven only if it fires BOTH directions: legal arch PASSes, illegal arch FAILs. This task ships the planted-defect copy proving the arch gate (tasks 06+07+08) actually rejects a forbidden import edge. WBS sub-task **B4**.

## Background — P-TOOL forbidden edges (what to plant)

- `core → adapter` (core importing the protocol adapter) = ILLEGAL direction → go-arch-lint must flag.
- IO/protocol import INSIDE core (e.g. `net/http`, MCP pkg in `internal/core`) = ILLEGAL → depguard must flag.
Either defect type proves the gate; plant ≥1.

## Deliverable

Planted-defect fixture copy: a core package that violates the arch boundary (illegal direction or IO-in-core), making the arch gate go red.

## Sentinel

`_canon-floor/arch/planted/` — defect tree; arch-lint/depguard exit 1.

## Depends on

- Task 08 (arch CI wiring) — the gate this fixture exercises.
- Task 05 (clean fixture tree) — the base to mutate.

## Steps

1. Copy the clean fixture tree (task 05) into `_canon-floor/arch/planted/`.
2. Plant ONE forbidden edge, documented (comment naming the violated invariant). Pick one (or both):
   - core package imports the adapter (`core → adapter`) → go-arch-lint fires; OR
   - core package imports a forbidden IO/protocol pkg (`net/http`, etc.) → depguard fires.
3. Keep minimal + deterministic. Ensure `_canon-floor/**/planted/**` excluded from MAIN lint scope (R-CF6) so it doesn't red the real gate during normal runs.

## Acceptance (both-directions — OPERATOR runs per IRON LAW D39)

Agent does NOT run the proof. Agent hands operator exact steps + expected output; operator runs from clean checkout:
```
cd _adp-2.0/_deliverables/adp-2.0-code
go-arch-lint check                                   # clean tree → PASS (exit 0, GREEN)
#   (point arch-lint/depguard at _canon-floor/arch/planted/ per its config)
#                                                    → violation, exit 1 (RED)
```
Both directions must hold: clean → green, planted → red.

## Boundary — OUT of scope

- Lint fixtures = task 04.
- Gate wiring = task 08.
- THROWAWAY — may be pruned once SUB W1a real tree exercises the gate.

## Risk

- **R-CF6** real gate lints planted defects → false red. Mitigation = `_canon-floor/**/planted/**` excluded from main scope.
