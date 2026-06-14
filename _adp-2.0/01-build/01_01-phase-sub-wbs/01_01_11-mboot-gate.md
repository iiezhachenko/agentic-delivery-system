# SUB-M-Boot — aggregate exit gate (operator-run, fresh-session native MCP, D39)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (commands, paths, tool names) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = the aggregate exit gate **M-Boot** — the phase-exit every SUB task rolls up to. SUB done ⟺ ALL legs hold SIMULTANEOUSLY, canon floor green throughout. Sentinel-on-disk alone does NOT satisfy a wave — the discriminators must hold. **M-Boot = a build-time WIRING check, NOT an acceptance demo** (the acceptance oracle = Godog, SPK). Milestone proves: the substrate every later wave imports boots + answers + scans disk under green canon.

## IRON LAW — operator runs the proof (D39)

**Agent NEVER runs the demo/acceptance proof.** Agent assembles + hands the operator EXPLICIT copy-pasteable steps + exact expected output, then STOPS. Operator executes, observes, signs off. Build-time agent self-run during authoring is NOT the demo.

**Gold standard: a FRESH Claude Code session loading the registered `.mcp.json`, calling `mcp__adp__*` natively** — the ONLY thing proving the full host wiring (`.mcp.json` correct + host connects + tools exposed + callable). Same-session reconnect (`/mcp`) = the minimum; a brand-new session = gold standard. Raw-protocol piping (`printf … | node`/direct server spawn) = a BUILD-TIME check ONLY — it bypasses the host wiring and is NOT acceptance.

## Depends on

- Task 08 (W1d) — frontier deriver (the `mcp__adp__status` real frontier).
- Task 10 (W1e-E4) — adapter shell + ported det tools (boot + `status` handler).
- Task 07 (W1c-C3+C4) — schema embed + lock (the lock-verify leg).

## The five legs (ALL must hold simultaneously)

| Leg | Discriminator | Expected |
|---|---|---|
| boot (W1e) | fresh session connects `adp-server` via `.mcp.json` | server handshakes; `mcp__adp__*` tools listed |
| frontier (W1d→W1e) | call `mcp__adp__status` natively | returns REAL disk frontier `{id,unit,class,schemaId}` |
| schema (W1c) | run lock verify | `schemas.lock` + `canon-rules/schema.json` lock verify GREEN; drift → RED |
| containment (W1b) | grep path-readers | every reader resolves `.adp/`-relative; zero flat-root |
| canon floor (CF, all) | golangci + arch-lint + depguard on the whole real tree | GREEN (core⊥adapter; IO-free core) |

## Operator repro (SUB supplies these EXACT commands + `.mcp.json` snippet at gate time)

```
cd _adp-2.0/_deliverables/adp-2.0-code

# leg: canon floor on the REAL tree
golangci-lint run ./...            # expect: 0 issues
go-arch-lint check                 # expect: core⊥adapter pass
go build ./... && go vet ./...     # expect: clean (no cycles, internal/ respected)

# leg: schema lock
go test ./internal/schema/...      # expect: lock verify PASS; deep-equal generated==frozen
#   (+ canon-rules/schema.json lock selftest PASS)

# leg: containment grep
grep -rE '"\.(aprd|adr|hld|roadmap|build|audit)/' internal/ cmd/   # expect: zero flat-root (all .adp/-relative)

# leg: boot + frontier — NATIVE, FRESH Claude Code session (gold standard)
#   1. register .mcp.json → adp-server
#   2. open a FRESH Claude Code session (loads .mcp.json)
#   3. confirm mcp__adp__* tools listed (boot leg)
#   4. call mcp__adp__status  → expect: REAL disk frontier object {id,unit,class,schemaId}, NOT empty/error
```

## Acceptance

SUB done ⟺ all five legs hold simultaneously, operator-verified, canon floor green throughout:
- boot: fresh session connects; `mcp__adp__*` listed.
- frontier: `mcp__adp__status` returns a REAL disk frontier (not empty/stub).
- schema: `schemas.lock` + `canon-rules/schema.json` verify GREEN; drift → RED.
- containment: zero flat-root reader.
- canon floor: golangci + arch-lint + depguard GREEN on the whole real tree.

## On any leg fail

HALT. Fix the substrate (NOT downstream). NOTHING downstream (SPK / MEM / BOOT joins on substrate) starts until M-Boot green. The substrate the whole pipeline imports never lands unproven.

## Boundary — OUT of scope

- Any engine business logic (`adp_task`/`adp_answer` composing, form/context/validate/derive) = SPK — blocked behind this gate.
- Acceptance (Godog) oracle = SPK; M-Boot proves only the build-time WIRING + canon-COMPLIANCE, NOT customer-facing acceptance.

## Downstream note

SUB emits no `R→AC→…→commit` thread artifacts (no engine feature) — it lands the surface those threads later run through. First threaded code = SPK. After M-Boot green: W1a end already unblocked the parallel LANES (MEM W3a, BOOT W4a — OUT of SUB); SPK begins on the proven substrate.
