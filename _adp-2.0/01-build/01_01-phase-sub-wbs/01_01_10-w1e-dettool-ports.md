# SUB-W1e-E4 — opportunistic pure det-tool ports (status·coverage·idgen·route·sequence)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (tool names, pkg paths) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1e-E4**, the W1e closer. Task 09 shipped the adapter shell + tool stubs + thin wiring. E4 replaces a HIGH-CONFIDENCE PURE subset of those stubs with REAL ported handlers — the `§7 pure deterministic set`. Why: shipping the adapter as ALL empty stubs leaves the wiring UNPROVEN. Porting the pure det tools exercises the full path (transport → registry → core⊥adapter wiring) on REAL handlers, so `mcp__adp__status` returns the REAL disk frontier at M-Boot — not an empty stub. These tools are pure deterministic (no business judgment), so they port cleanly inside SUB without pulling SPK logic forward.

## The pure det set to port (high-confidence)

| Tool | Lands in | Logic |
|---|---|---|
| `adp_status` | `internal/backbone` (reads `internal/frontier`) | disk frontier scan → `{id,unit,class,schemaId}` |
| `adp_coverage` | `internal/validate` | id-thread / ref-resolve self-consistency check |
| `adp_idgen` | `internal/derive` | deterministic id minting |
| `adp_route` / `adp_route_tier` | `internal/backbone` | class/tier routing (deterministic) |
| `adp_sequence` | `internal/derive` | roadmap sequencing |
| `adp_classify_derive` | `internal/derive` | classification deriver — **port ONLY if cheap**; else leave stub |

These mirror current JS `tools/det/*` (`status`, `coverage.mjs`, `idgen.mjs`, `route.mjs`, `sequence.mjs`, `classify-derive.mjs`) — re-implement the deterministic logic in Go. Each is PURE (input → output, no model judgment).

## Deliverable

Ported handlers for the pure det set in `internal/backbone`/`internal/derive`/`internal/validate`, wired into the adapter's tool registry (replacing those stubs). `mcp__adp__status` returns the REAL disk frontier (via the task-08 deriver). Each ported tool has a fixture test (CP3).

## Sentinels

- Ported handlers in `internal/backbone` + `internal/derive` (+ `internal/validate` for coverage).
- Fixture tests for each ported tool.

## Depends on

- Task 09 (E1+E2+E3) — adapter shell + stubs + wiring (the ports replace those stubs).
- Task 08 (W1d, D3) — frontier deriver; `adp_status` calls it for the real disk frontier.

## Steps

1. Port each pure det tool's deterministic logic from the JS `tools/det/*` analog into its `internal/*` home (table above). Keep logic PURE + IO-free (disk reads via the injected reader iface from A3; the adapter wires the concrete impl).
2. **`adp_status`** — wire to the `internal/frontier` deriver (task 08): scan disk → return real `{id,unit,class,schemaId}`. This is the load-bearing one (proves frontier + transport + wiring end-to-end at M-Boot).
3. **`adp_coverage`** — id-thread / ref-resolve self-consistency (deterministic check over on-disk artifacts).
4. **`adp_idgen` / `adp_sequence` / `adp_route` / `adp_route_tier`** — deterministic mint/route/sequence; pure functions.
5. **`adp_classify_derive`** — port ONLY if cheap; otherwise leave it a stub (note the decision). Don't force it.
6. Replace the corresponding adapter stubs with the real handlers; keep the adapter THIN (marshal MCP↔core only; logic stays in `internal/*`).
7. **Fixture test each ported tool** (CP3) — given a fixture disk state / input, assert the deterministic output. De-risks the adapter: proves transport + registry + core⊥adapter on REAL handlers, not just stubs.

## Acceptance

- `mcp__adp__status` returns the REAL disk frontier (from the task-08 deriver), NOT an empty/stub response.
- Each ported tool passes its fixture test.
- Adapter stays thin (zero business prose; logic in `internal/*`).
- depguard: ported handlers IO-free (disk via injected reader); zero protocol import in core.
- `go build ./...` + `go test ./...` + arch-lint + depguard green.

## Boundary — OUT of scope

- `adp_task`/`adp_answer` + form/context/validate/derive BUSINESS logic = SPK. E4 ports ONLY the pure deterministic set.
- The remaining stubs (`adp_task`, `adp_answer`, `adp_next`, `adp_submit`, `adp_verdict`, `adp_promote`, `adp_branch`, `adp_emit`, `adp_guard`) stay stubs in SUB.
- Elicitation/operator gates = BULK W5c. No Godog.

## Risk

- **R-SUB8** adapter shipped as pure stubs → wiring unproven at M-Boot. Mitigation = port the §7 pure det set so `mcp__adp__status` returns a REAL frontier — exercises the full transport+core path, not just empty stubs.
- **R-SUB4** IO leak — ported handlers read disk via the injected reader iface only; depguard catches leaks.
