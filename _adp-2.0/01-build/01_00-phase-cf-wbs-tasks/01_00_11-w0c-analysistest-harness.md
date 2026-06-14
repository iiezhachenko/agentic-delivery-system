# CF-W0c-C4+C5 — analysistest harness shell + pos/neg fixture

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (pkg paths, testdata dirs) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0c stands up the analysistest harness — the test rig tier-2 AUTHORED canon rules (go/analysis analyzers) run through LATER (BULK). This task ships a THROWAWAY analyzer + its pos/neg testdata proving the harness fires correctly BOTH directions, BEFORE any real rule exists. Merges WBS sub-tasks **C4** (harness pkg) + **C5** (pos/neg fixture) — the harness can't go green without its testdata; one deliverable. **NO real rule authored.**

## Background — analysistest

`golang.org/x/tools/go/analysis/analysistest` runs a go/analysis analyzer against `testdata/` packages, asserting diagnostics fire where `// want` comments mark them. The CF harness proves the rig works using a throwaway analyzer (e.g. one that flags a marker comment) — proving the mechanism, not enforcing any canon. Tier-2 rules plug into this same rig later.

## Deliverable

`internal/canon/analysistest/` package: an analysistest runner + a throwaway analyzer + pos/neg testdata, green under `go test`. Proves the harness fires (pos → diagnostic) and stays silent (neg → no diagnostic).

## Sentinels

- `internal/canon/analysistest/` (the harness pkg + throwaway analyzer + `_test.go` calling `analysistest.Run`).
- `internal/canon/analysistest/testdata/{pos,neg}/` (the fixture: pos triggers a diagnostic, neg stays silent).

## Depends on

- Task 10 (`canon-rules/schema.json`) — harness lives in the same canon home; conceptually the rig the schema's future rules use. (Harness does not parse the schema at CF; link is structural.)
- Task 01 (WP-0) — module + `golang.org/x/tools` dep (add to go.mod).

## Steps

1. Add `golang.org/x/tools` dependency (for `go/analysis` + `analysistest`).
2. Author a THROWAWAY analyzer under `internal/canon/analysistest/` — minimal: flags a marker (e.g. emits a diagnostic on a specific marker comment or trivial AST pattern). NOT a real canon rule.
3. `testdata/pos/`: a Go file containing the marker, with a `// want "<diagnostic regexp>"` comment where the analyzer should fire.
4. `testdata/neg/`: a Go file WITHOUT the marker — analyzer stays silent (no `// want`).
5. `_test.go`: call `analysistest.Run(t, analysistest.TestData(), <throwaway-analyzer>, "pos", "neg")` (or equivalent) asserting pos fires + neg silent.

## Acceptance (OPERATOR runs per IRON LAW D39)

Agent does NOT run the proof. Agent hands operator exact command + expected output; operator runs from clean checkout:
```
cd _adp-2.0/_deliverables/adp-2.0-code
go test ./internal/canon/...        # expect: PASS (pos → diagnostic fires, neg → silent)
```
Harness green proves the rig works BOTH directions — pos fires, neg silent — with the rule-store EMPTY.

## Boundary — OUT of scope

- Real tier-2 rules / go/analysis analyzers for canon = BULK W5d–f. This analyzer is THROWAWAY.
- The schema itself = task 10.
- "Green with no rules" must NOT be mistaken for "rules exist" — the throwaway pos/neg fixture is exactly what PROVES the harness fires; rule-store stays explicitly EMPTY (R-CF5).

## Risk

- **R-CF5** harness "green with no rules" mistaken for "rules exist". Mitigation = the throwaway pos/neg fixture proves the harness FIRES; document that rule-store is empty by design.
