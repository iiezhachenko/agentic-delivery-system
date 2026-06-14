# SUB-W1c-C3+C4 — `schemas.lock` generated-frozen + wire `canon-rules/schema.json` embed+lock

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (paths, lock keys, sha) literal.

## Context — Phase SUB (substrate)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). Module path `github.com/iiezhachenko/adp-2.0`. ALL paths relative to this root.

This task = **W1c-C3+C4** (merged — both are lock-mechanism wiring over the same generated-frozen discipline; one deliverable). Task 05 embedded 48 schemas; task 06 built the typed registry. C3 locks the schema set (generated-frozen, deep-equal selftest). C4 closes a CF forward-link: CF authored + hash-recorded `canon-rules/schema.json` but left embed+lock to SUB — C4 wires it. **THE CHOKEPOINT exit** — once locked, W1d (frontier) ∥ W1e (adapter) fork off W1c.

## Generated-frozen discipline (the iron rule — CR-008 class)

Some frozen artifacts are EMITTED by a generator, not hand-written, and carry a deep-equal verify that breaks silently if the frozen file drifts from its generator. **Amend the GENERATOR, never the frozen copy alone.** Canonical drift case CR-008: someone hand-edited a frozen file, left the generator behind → the gate drifted. Fix-forward: edit the generator (or its embedded constants), regen with `--write`, confirm the selftest's deep-equal (generated == frozen) passes. This binds BOTH `schemas.lock` and `canon-rules/schema.json` here.

## Source — the existing JS `schemas.lock` (port the MECHANISM)

The JS repo has `schemas/schemas.lock` (v4). Shape:
```json
{ "artifact": "schemas/", "version": "v4",
  "content_sha256": "<hash of all *.schema.json + _meta.json, sorted recursive, concatenated, single sha256>",
  "content_sha256_algo": "<exact enumeration + ordering recipe>",
  "schema_count": 48, "status": "frozen", "signer": "...", "signed_at": "...", "supersedes": "v3:<sha>" }
```
Port this lock SHAPE + the deterministic hashing recipe into Go (the generator). The `schema_count` = 48.

## Deliverable

1. **C3** — `schemas.lock` generator (Go) + deep-equal selftest: generator emits the lock manifest (`{schemaId → sha}` + aggregate `content_sha256` + count); selftest asserts generated == on-disk frozen lock; drift (hand-edit a schema or stale lock) → verify RED.
2. **C4** — `canon-rules/schema.json` wired into `embed.FS` + a lock entry; if it's generator-emitted, a deep-equal selftest; CF-recorded hash matches.

## Sentinels

- `schemas.lock` on disk (frozen manifest) + its generator in `internal/schema` (e.g. `lockgen.go` + `--write` path).
- Lock entry for `canon-rules/schema.json`; `canon-rules/schema.json` embedded via `embed.FS`.
- Selftest (`_test.go`) asserting generated == frozen for BOTH.

## Depends on

- Task 06 (C2) — typed registry over the embedded 48 schemas (the lock hashes that exact set).

## Steps

1. **`schemas.lock` generator** (C3) — Go that walks the embedded schema set, hashes per the EXACT recipe (recursive readdir, entries sorted alphabetically per dir, `_meta.json` first then `00-aprd/ 01-roadmap/ 02-adr/ 03-hld/ 04-build/` each sorted internally, file bytes concatenated no separators, single `sha256`). Emit the manifest: aggregate `content_sha256`, `schema_count: 48`, `status: "frozen"`, version, and (optionally) per-schema `{schemaId → sha}`. Embed the non-derivable constants (signer, version label, the algo description string) IN the generator.
2. **`--write` + selftest** — a `--write` mode regenerates `schemas.lock`; a selftest (`go test`) runs the generator in compare-mode and asserts deep-equal generated == on-disk frozen `schemas.lock`. This is the generated-frozen gate.
3. **Drift proof (both directions)** — selftest GREEN when lock matches; if a schema is hand-edited (or the lock goes stale) the recomputed `content_sha256` diverges → selftest RED. Verify both.
4. **C4 — wire `canon-rules/schema.json`** — CF authored this file + recorded its hash (CF §5 / R-CF7) but did NOT embed/lock it (that was SUB scope). Add `canon-rules/schema.json` to an `embed.FS` (single owner — `internal/canon` or `internal/schema`, document which). Add a lock entry (its own sha). If the file is generator-emitted, wire a deep-equal selftest; assert the CF-recorded hash matches the embedded content.
5. **Document the generated-frozen contract** — note on disk: future schema/`schema.json` edits go through the GENERATOR + `--write` + selftest, NEVER hand-edit the frozen copy (CR-008 avoidance).

## Acceptance (selftest legs the operator can run)

```
cd _adp-2.0/_deliverables/adp-2.0-code
go test ./internal/schema/...        # expect: PASS — schemas.lock deep-equal generated==frozen
# (canon-rules selftest in its pkg)  # expect: PASS — canon-rules/schema.json hash matches CF record
```
- `schemas.lock` verify GREEN; hand-edit a schema → verify RED (drift caught).
- `canon-rules/schema.json` embedded + lock entry present; CF-recorded hash matches; selftest green.
- `canon-rules/rules/` stays EMPTY (rule bodies = BULK W5d–f).
- `go build ./...` + arch-lint + depguard green.

## Boundary — OUT of scope

- AUTHORED canon rules (GC-*) — rule-store STAYS empty. C4 wires only the schema.json that VALIDATES future rules.
- Form/validate/derive consumers of schemas = SPK.
- Schema CONTENT — port-only, no changes.

## Risk

- **R-SUB3** generated-frozen drift (hand-edit `schemas.lock`/`schema.json`, stale generator — CR-008 class). Mitigation = generator + `--write` + deep-equal selftest; edits go through the generator, NEVER the frozen copy; document the contract.
- **R-SUB2** chokepoint exit — locking the set completes W1c; only after this do W1d ∥ W1e fork.
