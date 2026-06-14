# CF-W0b — arch fixture tree (clean core⊥adapter stub)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, pkg names) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0b = adopt the FROZEN P-TOOL arch profile (depguard + go-arch-lint configs) at commit 0. The arch linters need PACKAGES to check direction against. go-arch-lint/depguard can't validate "clean → exit 0" with zero Go. This task ships the fixture-scale clean target tree the W0b configs (tasks 06, 07) check against, and the planted-defect fixture (task 09) mutates. Implicit prereq surfaced from WBS §6 (chicken-egg) + §4 boundary flag.

## Background — P-TOOL architecture (the frozen invariants to model)

P-TOOL = pure IO-free deterministic CORE ⊥ thin protocol ADAPTER. Layers:
- **core** = `internal/...` — pure deterministic logic, IO-free, fixture-testable in isolation (this = the canon oracle). NO IO/protocol imports.
- **adapter** = `cmd/adp-server` — thin MCP/stdio protocol adapter; wires core via constructors.
- **cli** = `cmd/adp` — thin init/pack/deploy CLI.

Allowed dep directions: `adapter → core` only. NEVER `core → adapter`. NEVER IO/protocol imports inside core. Acyclic. No global mutable state. Atomic writes. Context-closed invocation.

## Deliverable

A clean, fixture-scale package pair proving the core⊥adapter boundary — the lint TARGET for go-arch-lint + depguard. NOT the real W1a tree.

## Sentinel

`_canon-floor/arch/clean/` — clean stub tree, arch-lint + depguard exit 0.

## Depends on

- Task 01 (WP-0 module bootstrap).

## Steps

1. Under `_canon-floor/arch/clean/`, build a TINY 2-layer stub:
   - `internal/core/` (or `.../internal/det…`-shaped) — a pure pkg: one func, deterministic, NO IO imports (no `net/http`, no `os` IO, no MCP/protocol pkgs).
   - `cmd/adapter/` (stands in for `cmd/adp-server`) — thin pkg importing core (direction `adapter → core`), doing the IO/protocol side.
2. Keep it minimal — just enough to demonstrate a legal `adapter → core` edge + an IO-free core. This is the SHAPE the real W1a tree must satisfy day-one.
3. Must compile: `go build ./_canon-floor/arch/clean/...` green.
4. Name layers consistently so tasks 06/07 configs can target them (e.g. `core` = `.../internal/core`, `adapter` = `.../cmd/adapter`). Document the chosen names — tasks 06+07 reference them.

## Acceptance

- `_canon-floor/arch/clean/` compiles (`go build` green).
- Tree exhibits legal `adapter → core` dep + IO-free core (no forbidden imports). Verified green by tasks 06+07 once their configs land.

## Boundary — OUT of scope

- Real P-TOOL pkg tree (`internal/det…` ⊥ `cmd/adp-server`) = SUB W1a. This is fixture-scale stubs ONLY — do NOT pull W1a forward (R-CF3).
- The arch configs themselves = tasks 06 (go-arch-lint) + 07 (depguard).
- The planted-defect variant = task 09.
- THROWAWAY: may be pruned once W1a real tree exercises the gate.

## Risk

- **R-CF3** temptation to pull W1a forward (arch lint needs packages). Mitigation = fixture-scale stubs only; §6 boundary binds it.
