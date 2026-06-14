# SUB-W1a-A3 — P-TOOL discipline scaffolds (ifaces · atomic-write · no global state)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (pkg paths, helper names) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1a-A3**, the third + final W1a task. Tasks 01 (module) + 02 (pkg tree) gave the dir skeleton. A3 lands the P-TOOL DISCIPLINE scaffolds — the cross-cutting shapes every later wave reuses so the core stays IO-free, fixture-testable, and arch-clean. A3 is the discriminator gate for W1a: **core⊥adapter arch-lint green + depguard zero-IO-in-core** must hold on the real tree.

## P-TOOL invariants A3 realizes

| Invariant | What it means | How A3 lands it |
|---|---|---|
| pure IO-free core ⊥ thin adapter | `internal/*` never imports `net`/`os`/`io`/`log`/protocol SDK; IO lives at `cmd/adp-server` edge | injected reader/writer ifaces; depguard catches leaks |
| consumer-side interfaces | each consumer pkg DECLARES the narrow iface it needs; NO upstream "interface package" | per-consumer small ifaces (Go idiom; satisfies acyclic) |
| no global mutable state | each `adp_*` call context-closed; no package-level mutable vars | constructor-injected deps, not globals |
| atomic writes | temp-file + rename; non-atomic writes FORBIDDEN | ONE atomic-write helper, all writers use it |
| context-closed invocation | each call self-contained, no cross-invocation RAM state | call shape takes all inputs as params |

## Deliverable

Discipline scaffolds: (1) an atomic-write helper (single home, temp+rename); (2) consumer-side interface stub pattern demonstrated (e.g. a narrow `fileReader`/`fileWriter` iface declared at the consumer); (3) a context-closed call-shape convention; (4) ZERO package-level mutable state. All under `internal/*`, IO-free, arch-lint + depguard green.

## Sentinels

- Atomic-write helper file (single home — recommend `internal/io/` or fold into the writer-owning pkg; one home, no scattered temp+rename logic).
- `internal/` skeleton ifaces (consumer-side narrow ifaces declared where consumed).

## Depends on

- Task 02 (A2) — pkg tree present so the scaffolds have homes.

## Steps

1. **Atomic-write helper** — single home (e.g. `internal/io/atomic.go` or the writer pkg). Shape: `WriteAtomic(path string, data []byte) error` = write to `path+".tmp"` (or temp in same dir), `fsync`, `os.Rename` over target. Rename is atomic on POSIX → no partial-write window. ALL future writers (derive/scratch, promote, lock-gen) call THIS; no other code does temp+rename. NOTE: `os` import lives here — this helper is the IO seam; it must sit where depguard ALLOWS IO. If core must stay IO-free, the helper takes an injected writer iface OR lives in an adapter-adjacent pkg. **Decision:** confine the actual `os` syscall behind a small injected `Writer` iface so pure logic stays testable; the concrete `os`-backed impl is wired at the adapter edge (task 09). Document the seam.
2. **Consumer-side interface pattern** — demonstrate: a core pkg that needs to read disk declares its OWN narrow iface (e.g. `type reader interface { Read(path string) ([]byte, error) }`) at the consumer, NOT an upstream shared "interfaces" pkg. The concrete impl is injected by the adapter. This keeps deps acyclic + core fixture-testable with a fake. Show the pattern in ≥1 pkg as the template later waves copy.
3. **No global mutable state** — assert no package-level `var` holding mutable state across calls. Deps flow through constructors (`New…(deps) *T`). Each `adp_*` handler takes its inputs as params (context-closed). Add a doc comment stating the rule per core pkg or in a top-level CONTRIBUTING/canon note.
4. **Context-closed call shape** — convention: handler signatures take all needed inputs explicitly (no hidden ambient state); document so frontier (task 08) + adapter (task 09) follow it.
5. Defense-in-depth: assert `internal/` visibility + acyclic via the compiler AND go-arch-lint structural (both retained from CF). Run both.

## Acceptance

- **core⊥adapter arch-lint GREEN** on the real tree (CF `.go-arch-lint.yml`).
- **depguard GREEN** — zero `net`/`net/http`/`os`/`io/ioutil`/`log`/protocol import inside any `internal/*` core pkg (IO confined behind injected ifaces / the adapter edge).
- `go build ./...` + `go vet ./...` green.
- Atomic-write helper exists in ONE home; consumer-side iface pattern demonstrated; no package-level mutable state.

## Boundary — OUT of scope

- Business logic in any core pkg = SPK.
- The frontier's concrete disk scanner = task 08 (reuses the injected-reader pattern A3 establishes).
- Concrete `os`-backed reader/writer impl wiring = task 09 (adapter edge).
- Schema embed/lock = tasks 05–07.

## Risk

- **R-SUB4** IO leaks into core → kills fixture-testability + trips depguard. Mitigation = A3 confines IO to injected reader/writer ifaces (consumer-side); concrete impls wired at adapter edge; CF depguard catches any leak. This is the W1a discriminator — must be green before W1b starts.
