# CF-W0c-C1+C2+C3 — `canon-rules/schema.json` (rule schema + trigger vocab + source registry)

> Atomic task. SELF-CONTAINED — all context inline. Register: caveman; structural data (schema keys, ids, paths) literal.

## Context — Phase CF (canon floor)

ADP 2.0 = full Go rewrite. **Delivery root = `_adp-2.0/_deliverables/adp-2.0-code/`** (engine SOURCE repo). ALL paths relative to this root.

Phase CF lane W0c = stand up the rule-schema + trigger vocab + source registry + analysistest harness shell — the HOME where tier-2 AUTHORED canon (GC-* rules) lands LATER (BULK W5d–f). **NO rules authored now** — proven EMPTY. This task authors the schema + its vocab/registry. Merges WBS sub-tasks **C1** (schema) + **C2** (trigger vocab — `$defs`/enum inside schema) + **C3** (source registry — provenance shape). The analysistest harness = task 11.

## Background — the rule schema shape (C6, from design canon)

Each future tier-2 rule entry has this shape:
```
{
  id,                       // GC-* (see id namespace below)
  body,                     // rule description
  triggers {                // ≥1 of 5 keys (closed vocab — C2)
    imports,                //   import-path match
    symbols,                //   identifier match
    AST,                    //   AST node pattern
    task-class,             //   ADP task class
    glob                    //   path glob
  },
  severity,
  provenance { url, go-version },   // CP1 ground-beats-consensus (C3)
  TTL,                      // optional
  fixture-ref               // optional — every rule ships a fixture (CP3)
}
```

## Deliverable

`canon-rules/schema.json` — a JSON Schema for tier-2 rule entries, including the closed trigger vocab (C2) and provenance/source-registry shape (C3). Plus validation sample(s).

## Sentinels

- `canon-rules/schema.json` (the schema; trigger vocab as enum/`$defs` inside it — C2).
- source registry shape (C3): `canon-rules/sources.json` OR `$defs` inside `schema.json`. **Recommended: `$defs.provenance` inside schema.json** (one home; less surface). If a separate `sources.json` registry is wanted, keep it a thin shape file. Document choice.

## Depends on

- Task 01 (WP-0) — module + Go-version pin (the Go version feeds `provenance.go-version` grounding).

## Steps

1. Author `schema.json` (JSON Schema). REQUIRED fields per rule: `id`, `body`, `triggers`, `severity`, `provenance`. OPTIONAL: `TTL`, `fixture-ref`.
2. **Trigger vocab (C2)** — `triggers` = object, ≥1 of the CLOSED set of 5 keys: `imports`, `symbols`, `AST`, `task-class`, `glob`. Unknown trigger key → schema REJECT (`additionalProperties: false`). Document each:
   - `imports` = import-path match
   - `symbols` = identifier match
   - `AST` = AST node pattern
   - `task-class` = ADP task class
   - `glob` = path glob
3. **Source registry / provenance (C3)** — `provenance` carries primary-source `url` + `go-version` (CP1: ground beats consensus). Define its shape in `$defs`.
4. **id namespace (DECISION — reserve, do NOT author bodies):** `id` pattern validates the `GC-*` namespace (GC-ERR / GC-CONC / GC-CTX / GC-RES / GC-SEC / GC-IFACE / …). Schema validates the PATTERN only; NO rule bodies authored here (rule-store stays EMPTY — tier-2 = BULK).
5. Write validation samples (used as acceptance evidence): one HAND-WRITTEN well-formed sample rule entry that VALIDATES; one malformed (missing required field) that REJECTS; one with an unknown trigger key that REJECTS.

## Acceptance

- Schema validates the well-formed sample rule entry.
- Schema rejects: a malformed entry (missing required) + an entry with an unknown trigger key.
- Trigger vocab is a closed set (5 keys); rule-store contains ZERO real rules.

## Boundary — OUT of scope

- AUTHORED tier-2 rule bodies (GC-ERR/CONC/CTX/RES/SEC/…) = BULK W5d–f. CF leaves rule-store EMPTY.
- analysistest harness pkg = task 11.
- **embed.FS + `schemas.lock` plumbing = SUB W1c — do NOT build here.** `schema.json` is a generated-frozen-class artifact: at CF it is authored + its hash RECORDED. SUB W1c later wires the generator + deep-equal selftest. Forward-link: record the hash now so W1c can verify the frozen copy never drifts from its generator (R-CF7).

## Risk

- **R-CF7** schema.json drifts from a future generator (generated-frozen discipline). Mitigation = record hash at CF; SUB W1c wires generator + deep-equal selftest.
