# CF-M-Floor — aggregate exit gate (operator-run, D39)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (commands, paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF = land tier-1 BORROWED canon at commit 0. CF done ⟺ ALL THREE lane discriminators hold SIMULTANEOUSLY. This task = the aggregate exit gate **M-Floor** — the phase-exit every CF task rolls up to. Milestone proves: foundation canon-governed before any engine code lands. Sentinel-on-disk alone does NOT satisfy CF — the discriminators (both-directions) must hold.

## IRON LAW — operator runs the proof (D39)

**Agent NEVER runs the demo/acceptance proof.** Agent assembles + hands the operator EXPLICIT copy-pasteable steps + exact expected output, then STOPS. Operator executes from a CLEAN CHECKOUT, observes, signs off. Build-time agent self-run during authoring is NOT the demo. CF is config/gate-level (no MCP surface yet) → the proof = operator running the CI gate + the commands below from clean checkout. (Gold-standard fresh-session native-MCP demo does not apply at CF — no engine surface exists.)

## Depends on

- Task 04 (planted lint fixture — W0a leg).
- Task 09 (planted import fixture — W0b leg).
- Task 11 (analysistest harness — W0c leg).

## The three discriminators (ALL must hold)

| Leg | Discriminator | Expected |
|---|---|---|
| lint (W0a) | run gate on clean fixture, then planted | clean → GREEN · planted → **RED** |
| arch (W0b) | run arch + depguard on clean fixture, then planted import-direction defect | clean → GREEN · planted → **RED** |
| harness (W0c) | `go test ./internal/canon/...` | analysistest **GREEN** (pos fires, neg silent) |

## Operator repro (CF supplies these EXACT commands at gate time)

```
cd _adp-2.0/_deliverables/adp-2.0-code

# leg 1 — lint both-directions (W0a)
golangci-lint run ./_canon-floor/lint/clean/...                  # expect: 0 issues (GREEN)
golangci-lint run --no-config ./_canon-floor/lint/planted/...    # expect: ≥1 issue (errcheck+ineffassign), exit 1 (RED)
#   NOTE: planted lint REQUIRES --no-config. .golangci.yml globally excludes _canon-floor/**/planted/** (R-CF6)
#   so the real gate never false-reds; WITH config the planted run is 0-issues GREEN (no proof). --no-config =
#   v2 default linters, exclusion off → planted reds. (task 04.)

# leg 2 — arch both-directions (W0b)
go-arch-lint check                                               # clean tree → PASS (exit 0, GREEN)
golangci-lint run --default=none --enable=depguard ./...         # clean depguard (import-CONTENT) → 0 issues (GREEN)
( cd _canon-floor/arch/planted && go-arch-lint check )           # planted core→adapter edge → violation, exit 1 (RED)
#   NOTE: planted arch fixture = OWN nested go.mod, run from INSIDE its dir vs its own .go-arch-lint.yml. The
#   root config excludes _canon-floor/arch/planted (R-CF6) so the main gate stays green. (task 09.)

# leg 3 — analysistest harness (W0c)
go test ./internal/canon/...                                     # expect: PASS (pos fires, neg silent)
```

## Acceptance

CF done ⟺ all three legs hold simultaneously, operator-verified from clean checkout:
- lint: clean green + planted red.
- arch: clean green + planted red.
- harness: green.

## On any leg fail

HALT. Fix the config (NOT engine code). NO engine code (SUB phase) starts until M-Floor green. The foundation never lands ungoverned (mitigates risk #14).

## Boundary — OUT of scope

- Any engine business logic, MCP surface, real tree (= SUB) — blocked behind this gate.
- Acceptance (Godog) oracle = SPK; M-Floor proves only the canon-COMPLIANCE oracle (linters + arch + analysistest harness).

## Downstream note

CF emits no `R→AC→…→commit` thread artifacts (no engine feature) — it lands the GATES those threads later run through. First threaded code = SPK phase. After M-Floor green: SUB W1a (real P-TOOL tree) begins, written UNDER these configs.
