---
id: ADR-0024
title: Schema registry + structured-output enforcement — new frozen artifact class
status: Accepted
date: 2026-06-11
class: self-host
scope: global
mode: foundation
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D24 — Output schema leaves the prompt into a frozen `schemas/` registry; conformance is code-enforced.**
  Context (doc 01): every prompt carries `## Output schema` inline — biggest single block in most of the 39 prompts, paid every run. PR2 duplicates it across the chain boundary (output N == input N+1), tolerated today only because "structural data stays literal." Schema = structural data the stochastic layer must CONFORM to, never AUTHOR; conformance + ownership are deterministic. **Extends D22** (deterministic-tool class) — the validator is a D22 instance; this ADR adds only the new frozen DATA class + the externalization decision.
  **Decision:**
  1. **Registry.** Every output schema → `schemas/<id>.schema.json` (JSON-Schema draft 2020-12). Field docs (today inline `//`, AB5) → `description` per property (one machine-readable home). `_meta.json` indexes `{id: {path, version, produced_by[], consumed_by[]}}`. Constraint unfittable in `description` (reciprocity, walk-to-count) → JSON-Schema construct (`dependentRequired`, `if/then`) or `x-*` annotation read by the validator — never prose re-list.
  2. **Prompt references by id.** `outputs: [{path, schema: "<id>"}]`; the schema body never enters prose. `inputs:` (until R11 removes it) names the same id ⇒ PR2 proven by id-equality, not eyeballing.
  3. **Enforcement.** Validator (`tools/det/validate.mjs`, a D22 tool) checks each artifact vs its registry schema. Grade per D27: enforce via constrained decode on Claude, validate-after + retry on Kiro. JSON-Schema is the portable contract → harness-neutral (D21) intact.
  4. **New frozen artifact class.** `schemas/` + `schemas.lock` join the immutability set (mirror `aprd.lock`/`adr.lock`/`skeleton.lock`). Registry = source of truth for shape; prompts reference, never re-own (B11). Schema change = new version + downstream change-request.
  **Consequences:** every prompt loses its largest block; PR2 dup dies (string-equality lint, D26/graph-lint); conformance hope→enforced; Tier-1 prompts can vanish (emitter owns artifact, D26). Coding-canon AB5 rewritten, AB3 extended, PR2 restated, prompt-skeleton drops `## Output schema` (HLD canon CR, this intake). **Reopen if** a portable structured-output contract proves unworkable on an adapter — fall back to registry-only (bloat still removed, enforcement weaker).
