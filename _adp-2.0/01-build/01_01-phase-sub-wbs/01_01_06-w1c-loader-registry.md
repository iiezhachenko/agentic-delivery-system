# SUB-W1c-C2 — typed Go schema loader/registry

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (pkg paths, schema ids, types) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1c-C2**, second of three W1c tasks. Task 05 (C1) landed the 48 JSON schemas + `_meta.json` embedded via `embed.FS` in `internal/schema`. C2 builds the typed Go loader/registry over that embed: lookup any schema by `schemaId`, typed errors on unknown id. Replaces the current JS ad-hoc schema access with a typed registry. **THE CHOKEPOINT** — 7 SPK consumers (form/context/validate/derive + `bdd-feature`) call this registry; build it clean.

## D3 — typed VIEW only (not a rewrite)

JSON schemas = source of truth. Go decodes them to a typed VIEW at load. The registry returns the schema (raw bytes / decoded view), it does NOT replace the JSON. No schema is re-modeled as a hand-authored Go struct.

## `_meta.json` — the registry index

`_meta.json` keys each schema by `schemaId` (basename without `.schema.json`), e.g.:
```json
"01-classification": { "path": "00-aprd/01-classification.schema.json", "version": 1,
                       "produced_by": ["CLASSIFIER"], "consumed_by": ["EXTRACT","GAP-DETECT","SYNTHESIZE"] }
```
The registry loads `_meta.json` from the embed.FS, then resolves each `path` against the same embed.FS to fetch the schema body.

## Deliverable

`internal/schema` typed loader/registry: parses embedded `_meta.json`, exposes lookup by `schemaId` → schema (body + metadata), returns a typed error for unknown id. No global mutable state (constructor-built registry, per A3 discipline).

## Sentinels

- `internal/schema/` — registry type + loader + lookup API + unit tests.

## Depends on

- Task 05 (C1) — 48 schemas + `_meta.json` embedded via `embed.FS` in `internal/schema`.
- Task 03 (A3) — no-global-state + constructor-injection discipline (registry built via `New…`, not a package global).

## Steps

1. Define a `Schema` view type (decoded `_meta.json` entry: `SchemaId`, `Path`, `Version`, `ProducedBy []string`, `ConsumedBy []string`) + the raw schema bytes/JSON.
2. `NewRegistry(fs embed.FS) (*Registry, error)` — at construction: read `_meta.json` from the embed.FS, decode the index, validate each entry's `path` resolves in the embed.FS (fail fast if any missing). Build an in-memory `map[schemaId]Schema`. Built once, immutable thereafter (no global mutable state — return the `*Registry`).
3. Lookup API: `(*Registry) Get(schemaId string) (Schema, error)` → returns the schema; unknown id → a typed error (e.g. `ErrUnknownSchema`). Optionally `Raw(schemaId) ([]byte, error)` for the JSON body.
4. Keep IO-free: the registry reads ONLY the injected `embed.FS` (compiled in) — no runtime disk read; pure + fixture-testable (CF canon oracle).
5. Unit tests: every `schemaId` in `_meta.json` resolves via `Get`; an unknown id returns the typed error; count matches (48).

## Acceptance

- Registry returns each of the 48 schemas by `schemaId`; unknown id → typed error.
- `_meta.json` fully indexed; every `path` resolves in the embed.FS.
- No package-level mutable state (registry constructor-built).
- IO-free (reads only the embedded FS); fixture-testable.
- `go build ./...` + `go test ./internal/schema/...` + arch-lint + depguard green.

## Boundary — OUT of scope

- `schemas.lock` gen + verify = task 07 (C3). The registry does NOT verify the lock; it loads + serves schemas.
- `canon-rules/schema.json` wiring = task 07 (C4).
- Form projection (W2b), shape validation (W2f), derivers (W2g) that READ the registry = SPK consumers.
- Schema CONTENT changes — none; port-only.

## Risk

- **R-SUB2** chokepoint under-built → 7 SPK consumers blocked/churned. Mitigation = a clean typed registry with lookup-by-id + typed errors, fully tested, before W1d/W1e fork.
- **R-SUB4** IO leak → registry must read only the embed.FS (compiled in), no runtime disk; keeps core IO-free + depguard green.
