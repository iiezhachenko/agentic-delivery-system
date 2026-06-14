# CF-W0b-B2 — depguard config (IO/protocol-in-core forbid)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, import paths, keys) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0b = adopt FROZEN P-TOOL arch at commit 0. P-TOOL core MUST stay IO-free (kills fixture-testing if IO tangles in; protocol details must never leak inward). This task stands up depguard to forbid IO/protocol imports inside core packages. depguard = a golangci-lint linter. WBS sub-task **B2**.

## Background — P-TOOL invariant enforced here

- **core** = `internal/...` — pure IO-free deterministic logic. Forbidden imports inside core: `net/http`, OS-IO surfaces (file/network IO), MCP/protocol packages. These belong in the ADAPTER (`cmd/adp-server`) only.
- go-arch-lint (task 06) handles structural layer/direction; depguard here handles the import-CONTENT forbid (which specific packages may not appear in core). Complementary.

## Placement DECISION (resolve + document — R-CF4)

depguard runs as a golangci linter → config can live EITHER:
- (a) standalone `depguard.yml` referenced from `.golangci.yml`, OR
- (b) an inline `linters-settings.depguard` block in `.golangci.yml`.

Roadmap names `depguard.yml` as a separate sentinel. **Recommended: (a) standalone `depguard.yml`** — honors the named sentinel + keeps the core⊥adapter concern visually separate from the lint stack (task 02). Whichever chosen, HONOR the named sentinel + document the choice. (Note: depguard config is configured under golangci's `linters-settings`; a truly standalone file must be wired so golangci reads it — confirm the pinned golangci version supports the chosen wiring.)

## Deliverable

depguard config forbidding IO/protocol imports inside core packages; allowlist per layer (adapter may import IO).

## Sentinel

`depguard.yml` (or `depguard` block in `.golangci.yml` — per decision above).

## Depends on

- Task 01 (WP-0).
- Task 02 (`.golangci.yml`) — depguard is a golangci linter; coordinate wiring.
- Task 05 (arch fixture tree) — clean target proving `exit 0`.

## Steps

1. Define depguard rule for core packages (`internal/...` + fixture `_canon-floor/arch/clean/.../internal/core`): DENY `net/http`, OS-IO packages, MCP/protocol packages.
2. ALLOW those imports in the adapter (`cmd/adp-server`, fixture `cmd/adapter`) — that layer owns IO/protocol.
3. Ensure depguard is enabled in the golangci run (it is one of golangci's linters; if not in the task-02 enable list explicitly, enable it here for the arch concern).
4. Validate clean fixture (task 05) passes.

## Acceptance

- Clean fixture tree (task 05) → depguard exit 0.
- (Planted IO-in-core defect → red proven in task 09.)
- Placement decision documented.

## Boundary — OUT of scope

- Structural layer/direction enforcement = go-arch-lint, task 06.
- CI wiring = task 08.
- Planted defect = task 09.

## Risk

- **R-CF4** depguard sentinel ambiguity (standalone file vs golangci block). Mitigation = choose + document (above); honor named sentinel either way.
