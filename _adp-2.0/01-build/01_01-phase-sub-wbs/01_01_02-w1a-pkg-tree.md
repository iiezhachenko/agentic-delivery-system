# SUB-W1a-A2 — full P-TOOL pkg tree (internal/* core ⊥ cmd/* adapter)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (pkg paths, layer names) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite of ADP. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1a-A2**: materialize the REAL P-TOOL package tree the CF canon configs govern. CF authored arch-lint + depguard against fixture-scale stubs; A2 writes the production directory layout UNDER them. A2 ships pkg SKELETONS + signatures ONLY — the handler/business logic inside each pkg = SPK (later phase). SUB stubs the homes; SPK fills them. Do NOT pull SPK logic forward.

## P-TOOL profile (the binding layout spec)

P-TOOL = **pure deterministic core `internal/*` (IO-free) ⊥ thin protocol adapter `cmd/adp-server` (MCP/stdio)**. Core fixture-testable in isolation = the canon oracle. Invariants every pkg must satisfy (enforced by CF go-arch-lint + depguard):
- package-by-domain (one domain = one pkg) · consumer-side interfaces · acyclic deps · no global mutable state · atomic writes · context-closed invocation (each call self-contained) · protocol details NEVER leak inward.
- Skip `/pkg` (cargo-cult unless needed). Driver lives host-side, NOT in this module.

CF arch-lint layers already declared: `core = internal/...`, `adapter = cmd/adp-server`, `cli = cmd/adp`; allowed edges `adapter→core`, `cli→core`; **core sealed** (imports no in-module component → acyclic, core→adapter forbidden).

## Deliverable

Full `internal/*` core pkg tree (IO-free) ⊥ `cmd/adp-server` + `cmd/adp`, per the §3 layout below. Each pkg compiles as an empty/stub package (doc comment + minimal signatures), `go vet ./...` green.

## §3 layout (materialize EXACTLY)

```
cmd/
  adp/             main.go      thin: init·pack·deploy CLI (run(args,io)→exit-code, testable)
  adp-server/      main.go      thin MCP stdio adapter; wires backbone via constructors
internal/                       PURE det core (IO-free; fixture-testable)
  backbone/                     adp_* tool handlers; orchestrate det core; no business prose
  frontier/                     stateless disk frontier deriver (task_id re-derivable)
  context/                      context assembler — read-graph → inline metadata vs source_pointer
  form/                         answer-form projector — schema judgment-leaf → plain slots
  validate/                     shape validator + repair-guide
  derive/                       DERIVERS — mint ids/counts, splice envelope, write scratch
  schema/                       schema registry/loader (locked, embed.FS)
  promote/                      scratch→home gate · git · branch · ledger-prune
  memory/
    episodic/                   durable append-only event log
    semantic/                   facts store access (.adp/{adr,aprd,hld} + schemas)
    promotion/                  episodic→semantic gate
    priming/                    working-set bound + provenance-gate
    statedep/                   two-pass scoped→global retrieval
  elicit/                       operator gate wiring (checkpoint A/B/C · D39)
  canon/                        Go canon engine (analysistest harness ALREADY here from CF)
  doctrine/                     task templates (versioned + locked); per-role doctrine + slot map
schemas/                        ~50 JSON schemas (embed) — task 05 fills
canon-rules/                    GC-* rule store (ALREADY present from CF; stays empty)
io/io-manifest.json             read-graph (retained; task 04 re-points roots)
tools/pack/                     pack + manifest allowlist + deploy
```

## Sentinels

- Pkg tree on disk (all dirs above present, each with a stub `.go` file declaring the package).
- `cmd/adp/main.go` + `cmd/adp-server/main.go` (thin stubs; real wiring = task 09).

## Depends on

- Task 01 (A1) — real module confirmed + `_canon-floor/` resolved.

## Steps

1. **Resolve R-SUB6 — layout-name discrepancy (decision).** Roadmap §3 W1a text says `internal/det…`; the §3 inv layout (above) has NO `internal/det…` — core pkgs are `internal/{backbone,frontier,context,form,validate,derive,schema,promote,memory/*,elicit,canon,doctrine}`. **RESOLVE: follow the inv §3 named pkgs above.** The CF go-arch-lint `core = internal/...` layer maps onto ALL of them (it globs `internal/**`, name-agnostic). Document the resolution so config + tree agree; no `internal/det…` dir is created.
2. Materialize §3 layout exactly — package-by-domain dirs. Each pkg = a stub `.go` with `package <name>` + a doc comment naming its responsibility. Keep `internal/canon/analysistest/` (CF harness) intact under `internal/canon/`.
3. `cmd/adp/main.go` thin — shape `run(args []string, io ...) int` (testable, exit-code returning); init·pack·deploy are stubs (logic = BOOT later).
4. `cmd/adp-server/main.go` thin — `package main` stub; MCP transport + tool registration = task 09. Just enough to compile.
5. Do NOT create `/pkg`. Do NOT add IO/protocol imports inside `internal/*` (depguard forbids; adapter owns IO).
6. Stub `io/io-manifest.json` home + `tools/pack/` + `schemas/` (empty, task 05 fills) so the tree shape is complete.

## Acceptance

- `go build ./...` green (all stub pkgs compile).
- `go vet ./...` green.
- arch-lint green — `core = internal/...` attaches every new pkg; `adapter→core`/`cli→core` only edges; no cycle.
- depguard green — zero `net`/`os`/`io`/`log`/protocol import inside any `internal/*` pkg.
- NO `internal/det…` dir exists (R-SUB6 resolved to inv §3 names).

## Boundary — OUT of scope

- ALL handler/business logic inside `backbone·form·context·validate·derive·frontier·…` = SPK. A2 ships skeletons + signatures ONLY.
- MCP transport + tool registration in `cmd/adp-server` = task 09 (E1/E2).
- Schema content + embed = task 05; lock = task 07.
- `.adp/` path re-pointing = task 04.
- Atomic-write helper + consumer-side iface scaffolds = task 03 (A3).

## Risk

- **R-SUB6** layout-name mismatch (roadmap `internal/det…` vs inv `internal/{backbone,…}`) → CF arch-lint config disagrees with tree. Mitigation = step 1 resolves to inv §3 names; CF `core` layer globs `internal/**` (name-agnostic), so config + tree agree; document.
- **R-SUB4** (early guard) IO leaks into core → kills fixture-testability + trips depguard. Mitigation = no IO imports in stubs; IO seam confined later (tasks 03/08).
