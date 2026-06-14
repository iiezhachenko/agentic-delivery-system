# SUB-W1c-C1 — ~50 JSON schemas land in `schemas/` + `embed.FS`

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, schema ids, embed directive) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1c-C1**, first of three W1c tasks. **W1c = THE CHOKEPOINT** — 7 downstream consumers depend on the schema registry (build-order §9): `bdd-feature` (SPK), form projector (SPK), context assembler (SPK), validator (SPK), derivers (SPK). Build it solid + locked FIRST; it gates the widest fan-out. C1 lands the schema CONTENT + the `embed.FS` so the binary is self-contained. C2 (task 06) = typed loader/registry; C3+C4 (task 07) = lock.

## D3 — schemas STAY JSON (the hard rule)

Decision D3: JSON schemas are the SOURCE OF TRUTH. Go gets a typed VIEW only (decode-to-struct at load). NO JSON→Go-struct REWRITE of the source. Port the JSON verbatim; Go decodes it, never replaces it. Schema home stays `schemas/`.

## Source — the current JS schemas (port these VERBATIM)

The current ADP (JS) repo holds the schema set at repo-root `schemas/`. **48 `*.schema.json` files + `_meta.json`** (the `~50`). Layout (5 phase dirs):

```
schemas/
  _meta.json                                  registry index {schemaId → {path,version,produced_by,consumed_by}}
  00-aprd/      11 files   (01-classification, 02-extraction, 04-gaps, 07-assumptions,
                            08-critique, audit-report, baseline-map, diagnosis,
                            rules-extracted, rules-reconciled, rules-verified)
  01-roadmap/    7 files   (02-slices, 03-verticality, 04-skeleton, 05-sequence,
                            06-foundation-cut, 07-sequence-reviewed, 08-rerank)
  02-adr/       11 files   (01-decision-points, 02-triage, 04-conflicts, 05-critique,
                            adr-index, decision, decisions-index, deferred-decisions,
                            option-index, option-set)
  03-hld/        9 files   (build-dag, components, contracts, critique, data-model,
                            flows, nfr-mechanisms, reconcile, test-specs)
  04-build/     11 files   (build-diagnosis, build-plan, build-record, critique, demo,
                            economy-audit, integration-record, mutation-certification,
                            oracle, verification, verify-output)
```
`_meta.json` keys each schema by `schemaId` (the basename without `.schema.json`), with `path`, `version`, `produced_by[]`, `consumed_by[]`. There is also an existing `schemas.lock` (v4, `schema_count: 48`) in the JS repo — its lock MECHANISM is ported in task 07, not here.

## Deliverable

All 48 `*.schema.json` + `_meta.json` ported VERBATIM into delivery-root `schemas/`, embedded via `go:embed` into the binary from a single owner pkg (`internal/schema`), resolving at build time.

## Sentinels

- `schemas/**/*.schema.json` (48) + `schemas/_meta.json` present under delivery root.
- `go:embed` directive in `internal/schema` resolving all of them into an `embed.FS`.

## Depends on

- Task 04 (W1b) — `.adp/` containment + centralized path constants; schema loader roots read via the `paths` home. (Schemas embed into the BINARY, but any disk-relative resolution uses the `.adp/`-aware paths.)
- Task 02 (A2) — `internal/schema` pkg home exists.

## Steps

1. **Inventory + confirm count.** Copy the JS-repo `schemas/` tree (48 `*.schema.json` + `_meta.json`) into delivery-root `schemas/`. Confirm 48 schema files (the `~50`). Preserve the 5 phase-dir structure + filenames EXACTLY (consumers + `_meta.json` paths depend on them).
2. **Port VERBATIM (D3).** Do NOT rewrite any schema into Go structs. Copy the JSON bytes unchanged. (Typed Go VIEW = task 06's decode target, not a source rewrite.)
3. **`embed.FS` at a single owner** — in `internal/schema`, add `//go:embed schemas/...` (or relative embed of the `schemas/` dir) into one `embed.FS` var. ONE embed home; NO scattered `go:embed` across pkgs. NOTE: `go:embed` needs the embedded files reachable from the embedding pkg's dir — decide placement (embed a `schemas/` dir adjacent to `internal/schema`, OR use an embed-root pattern). Document the chosen embed root.
4. Verify `go:embed` resolves ALL 48 + `_meta.json` at build (a build error fires if any path is missing — that's the check).

## Acceptance

- `go build ./...` green — `go:embed` resolves all 48 schemas + `_meta.json`; binary self-contained (no runtime disk read needed for schema bodies).
- Schema count = 48 (`~50`), 5 phase dirs, filenames verbatim.
- Single `embed.FS` owner pkg (`internal/schema`); no scattered embeds.
- Schemas are JSON (NOT rewritten to Go structs) — D3 honored.

## Boundary — OUT of scope

- Typed loader/registry (decode + lookup by `schemaId`) = task 06 (C2).
- `schemas.lock` gen + verify = task 07 (C3).
- `canon-rules/schema.json` embed+lock = task 07 (C4).
- Form projection / validation / derivers that READ schemas = SPK consumers.
- `bdd-feature` schema is NEW-design (SPK W2a), NOT ported here.

## Risk

- **R-SUB2** schema chokepoint under-built → 7 SPK consumers blocked. Mitigation = land the FULL set verbatim + embedded FIRST, before W1d/W1e fork; D3 keeps JSON canonical (no lossy struct rewrite).
