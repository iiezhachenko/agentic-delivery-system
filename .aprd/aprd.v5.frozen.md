# aPRD — Agentic Delivery Pipeline (self-host) (FROZEN v5)

> Version bump extending frozen baseline v4 (P8). Baseline `aprd.v4.frozen.md` unchanged + remains source for its own scope; this version adds only the scope delta of CR-002 (deterministic-machine). Stable structure threads spec → roadmap → build. Design corpus = `_deterministic-machine/` docs 00–04 (frozen, lifted not re-derived). Caveman register.

## CLASS
feature-add (change-request against the self-host deliverable; CR-002)

## BASELINE
- **extends**: `aprd.v4.frozen.md` v4 (lock content_sha256 `438061eca012ecbf44767dcffbfe564d8f0e581fbcd598f78a3483887d117c85`)   <!-- immutable parent; its PROJECT/MISSION/SOURCE SPECS/BUILD ORDER + CR-001 bugfix scope carried by REFERENCE, not re-emitted -->

## SCOPE DELTA (what v5 adds over v4)
v4 scope = greenfield (specs 00–04) + brownfield class bindings (feature-add, bugfix). v5 extends:

> **Scope note (2026-06-11, CR-002):** deliverable scope now ALSO includes the **deterministic spine** — code owns everything deterministic across the 39-prompt library; the LLM is scoped to the Tier-3 judgment islands only. Built as: a **schema-registry** (`schemas/` + `schemas.lock`) externalizing every output schema; an **io-manifest** (`io/` + `io.lock`) + resolver owning the input read-graph; **`tools/det/` modules** computing verdict/route/sequence/idgen/coverage + pre-filling shells; **Tier-1 emitters** owning whole mechanical artifacts; the **39 prompts re-authored** to drop their schema block + `inputs:`; the **orchestrator** STEP-4.1 swapped to resolve+prefill+compute. Sequenced as the W0–W8 wave (doc 04). All prior greenfield/feature-add/bugfix behavior untouched — the spine wraps, never rewrites, the judgment.

Prior frontier (greenfield 00–04 + bugfix spine) stays shipped — no requirement altered, no touch-set on a shipped golden's behavior (only the prompt's schema/inputs blocks leave; value invariant).

## NEW REQUIREMENTS (above high-water R8, BF3)
- **R9 — schema registry.** Every output schema externalized to `schemas/<id>.schema.json` (JSON-Schema 2020-12); field docs = `description`; prompt names the schema by registry id in `outputs:`, never inlines the body. `_meta.json` indexes `{id: {path, produced_by[], consumed_by[]}}`.
- **R10 — structured-output enforcement.** Code validates each artifact vs its registry schema (`tools/det/validate.mjs`). Enforce via constrained decode on Claude; validate-after + retry on Kiro. Conformance moves hope→enforced.
- **R11 — io-manifest + resolver.** Input read-graph code-owned (`io/io-manifest.json`: groups + role `when`-bindings). Prompts declare no `inputs:`; orchestrator calls `resolve(role,state)` → seeds `_test_bench` + path-injects. Drift impossible.
- **R12 — deterministic compute modules.** `tools/det/{verdict,route,sequence,idgen,coverage,prefill}.mjs` compute the verdict-from-count, route-from-axes, topo-sort, monotonic-id, set/bijection, and mechanical prefill — no LLM.
- **R13 — Tier-1 emitters.** Whole-mechanical steps (`tools/det/emit/*.mjs`) emit the artifact end-to-end; their prompt retires; the role keeps its sentinel + a one-line `components.json` note (D1 holds).
- **R14 — graph-lint + generated contracts.** `tools/io/graph-lint.mjs` checks PR2 by registry-id equality (`producer.outputs[].schema == consumer.inputs[].schema`) + generates `contracts.json` from manifest+registry — the chain becomes generated, not hand-written.

## CLASS_EXTENSION (feature-add)
### INTEGRATION_SEAMS
- **at the contract + spine layer** (P3): the spine plugs in as new frozen DATA (`schemas/`, `io/`) + new deterministic CODE (`tools/det/`, `tools/io/`) the orchestrator + adapters shell out to (D22 class). Prompts plug the spine via frontmatter (`outputs[].schema` id) + by losing their `inputs:`/schema blocks. Existing role logic untouched — the spine wraps it.
- **at the orchestrator**: STEP-4.1 swaps "parse prompt frontmatter for inputs" → `resolve(role,state)`; gains prefill+compute+validate around the LLM fill. Engine config, not new control machinery (doc 04 close).

### REGRESSION_GUARD
- **must stay green**: every shipped both-directions oracle — `_fixtures/greenfield-clean/**`, `_fixtures/greenfield-build-reds/**`, `_fixtures/brownfield-feature/**`, `_fixtures/brownfield-bugfix/**`. A re-authored prompt's clean-room VALUE verdict must equal its pre-CR golden (schema/inputs leave; behavior invariant). Orchestrator swap (W7) re-runs the full self-host loop e2e against `_fixtures/` as its gate.
- **economy-lint**: re-authored prompts introduce no NEW lint violations vs HEAD; prompts SHRINK (schema block + inputs lines gone) — economy strengthened, not bloated (AB1–AB9).
- **both-directions for every new module**: resolver, validator, emitters, verdict/route/seq/id/coverage each ship known-good-PASS + planted-defect-FAIL selftest, wired into the `pack.mjs` gate — same bar as a prompt.

### CONVENTION_BASELINE
- **frozen-class pattern**: `schemas/`+`schemas.lock`, `io/`+`io.lock` mirror `adr.lock`/`skeleton.lock`/`aprd.lock` — signed + immutable; change = new version + change-request.
- **det-tool pattern (D22)**: zero-dep Node ESM, deterministic (no network/clock/randomness), disk-in/disk-out, registered in `code-canon/<stack>.md`, FLAGS-never-authors, both-directions self-proving. Idiom = `tools/economy-lint/lint.mjs`.
- **prompt pattern**: schema leaves the prompt (R9/AB5); `inputs:` leaves the prompt (R11/AB3); `outputs:` carries the schema id; caveman + economy bind all prose (PR4).

## NEW IN-SCOPE BUILDS (the W0–W8 wave — Phase-1 RE-RANK sequences these)
Order respects dependency: contracts before consumers, code before prompt-edits, verify each by the existing self-slice loop (re-run harmless, D20).
1. **W0-CANON-CR** — amend AB3/AB5/PR2 + prompt-skeleton; register `schemas.lock`/`io.lock` classes; re-sign affected locks (this intake).
2. **W1-SCHEMA-REGISTRY** — `schemas/` + `schemas.lock` + `tools/det/validate.mjs` + selftest.
3. **W2-IO-MANIFEST** — `io/` + `io.lock` + `tools/io/resolve.mjs` + selftest.
4. **W3-GRAPH-LINT** — `tools/io/graph-lint.mjs` + generated `contracts.json`.
5. **W4-DET-MODULES** — `tools/det/{verdict,route,sequence,idgen,coverage,prefill}.mjs` + selftests.
6. **W5-TIER1-EMITTERS** — `tools/det/emit/*.mjs`; Tier-1 prompts retired.
7. **W6-REAUTHOR** — 39 prompts drop schema+inputs, per phase (04-build first).
8. **W7-ORCH-SWAP** — orchestrator STEP-4.1 = resolve+prefill+compute; e2e loop drains clean.
9. **W8-PACK-GATE** — `pack.mjs` wires all selftests; `dist/adp-v<ver>.tgz` ships.

## BUILD ORDER
v4 build order unchanged (greenfield 0→4 + bugfix spine, shipped). Deterministic spine builds in W0→W8 order (above), each authored/built clean-room + verified against its `done_sentinel` + the regression oracle + gated. Phase 2/3 (ADR/HLD) thin — extends D22, amends canon, no new architecture (P3).
