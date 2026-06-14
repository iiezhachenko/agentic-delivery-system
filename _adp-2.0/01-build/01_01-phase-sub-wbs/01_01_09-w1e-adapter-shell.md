# SUB-W1e-E1+E2+E3 — MCP stdio adapter shell + 13 tool stubs + thin wiring

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (tool names, pkg paths, transport) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1e-E1+E2+E3** (merged — boot + register + wire = one cohesive adapter shell). Forks off W1a+W1c (∥ W1d). The adapter is a **PASSIVE MCP stdio server** — it answers tool calls, never initiates (no sampling, no subagent spawn; the driver lives host-side, NOT in this module). E1 boots the transport; E2 registers the tool stubs; E3 wires the backbone via thin constructors. This task ships the SHELL + STUBS; real handler logic for the composing tools (`adp_task`/`adp_answer`) = SPK. Pure det-tool PORTS = task 10 (E4).

## Why passive (capability constraints, inv §4-I)

Claude Code does NOT support MCP sampling or server-side subagent spawn — only elicitation. So the server cannot call the model or spawn agents itself; a host-side thin driver pumps the loop. The Go engine = a passive MCP server: NO model creds, NO sampling. Keep the adapter THIN — it wires constructors + marshals MCP↔core; ZERO business prose. Logic lives in `internal/*`.

## The tool registry (resolve the count — R-SUB7)

Roadmap §3 says "13 tool stubs"; the inv A registry lists ~15 names. **RESOLVE the canonical stub set + count + document.** Full registry (inv §4-A):
```
adp_task  adp_answer  adp_status  adp_next  adp_derive  adp_submit  adp_verdict
adp_promote  adp_branch  adp_coverage  adp_idgen  adp_route  adp_route_tier
adp_sequence  adp_classify_derive  adp_emit  adp_guard
```
`adp_task`/`adp_answer` = STUBS only (logic = SPK W2e/h). Decide the canonical exposed set (reconcile 13 vs ~15) + document the chosen list. All non-ported tools return a typed "unimplemented"/shell response at this task; the pure det-tool ports (`status·coverage·idgen·route·route_tier·sequence`) get REAL handlers in task 10.

## Deliverable

`cmd/adp-server/main.go` — boots an MCP stdio server, completes the `initialize` handshake, registers the canonical tool set (each schema-described, stub responses), wires the backbone via injected constructors (protocol stays at the edge, core IO-free). Plus a `.mcp.json` registration entry so a fresh Claude Code session exposes `mcp__adp__*` natively.

## Sentinels

- `cmd/adp-server/main.go` (boots + handshakes).
- Tool registry in the adapter (the canonical set registered).
- `.mcp.json` registration entry (server command + name).

## Depends on

- Task 03 (A3) — discipline scaffolds; the adapter wires concrete `os`-backed reader/writer impls into the core's injected ifaces (this is the IO edge).
- Task 07 (C3) — schema registry + lock; tool stubs are schema-described from the registry.

## Steps

1. **Pick the MCP Go transport** (E1) — choose an MCP Go SDK / library; stdio framing per the MCP spec. PASSIVE server (no model creds, no sampling — driver is host-side). NOTE: this adds a protocol dependency — it lives ONLY in `cmd/adp-server` (adapter), NEVER imported into `internal/*` (depguard forbids; add the SDK to the depguard core-deny list per the `depguard.yml` decision-record note).
2. Boot + `initialize` handshake — server starts, completes the MCP `initialize` handshake over stdio.
3. **Reconcile the tool count** (E2, R-SUB7) — decide the canonical exposed set (13 vs ~15 from the registry above); document the list + count on disk. `adp_task`/`adp_answer` = STUBS.
4. **Register tool stubs** (E2) — register each tool, schema-described (input/output schema from the W1c registry where applicable). Each stub returns a typed "unimplemented"/shell response (not an error crash). Host must be able to LIST all of them.
5. **Thin wiring** (E3) — `main.go` builds the backbone via constructors (`NewRegistry`, frontier deriver, etc.), injecting the concrete `os`-backed reader/writer impls into the core's consumer-side ifaces (A3). Protocol marshalling (MCP request → core call → MCP response) stays in the adapter; core stays IO-free + protocol-free. ZERO business prose in the adapter.
6. **`.mcp.json` entry** — author the registration so a fresh Claude Code session loads `adp-server` + exposes `mcp__adp__*` natively (the M-Boot demo wiring, task 11). Include the exact server command + server name.

## Acceptance

- Server starts; MCP `initialize` handshake completes over stdio.
- Host lists the canonical `mcp__adp__*` tool set; each stub returns a typed "unimplemented"/shell (no crash).
- depguard: ZERO protocol/MCP-SDK import in `internal/*`; the SDK lives only in `cmd/adp-server`.
- Tool count reconciled (13 vs ~15) + documented; `adp_task`/`adp_answer` are stubs.
- `.mcp.json` entry present + correct (server command + name).
- `go build ./...` + arch-lint + depguard green (adapter→core only edge).

## Boundary — OUT of scope

- `adp_task`/`adp_answer` composing logic + the form/context/validate/derive they call = SPK W2*.
- Opportunistic pure det-tool PORTS (`status·coverage·idgen·route·sequence`) = task 10 (E4). This task = shell + stubs + wiring.
- Elicitation / operator gates = inv H (BULK W5c). No Godog (SPK W2k). No host-side driver (SPK W2i — lives outside the module).

## Risk

- **R-SUB7** tool-count ambiguity (13 stubs vs ~15 registry names) → registry drift. Mitigation = step 3 reconciles the canonical stub set + count; document.
- **R-SUB4** protocol import leaking into core → depguard red. Mitigation = SDK confined to `cmd/adp-server`; add to depguard core-deny list.
