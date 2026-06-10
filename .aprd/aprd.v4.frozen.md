# aPRD — Agentic Delivery Pipeline (self-host) (FROZEN v4)

> Version bump extending frozen baseline v3 (P8). Baseline `aprd.frozen.md` unchanged + remains source for its own scope; this version adds only the scope delta of CR-001. Stable structure threads spec → roadmap → build. Caveman register.

## CLASS
feature-add (change-request against the self-host deliverable; CR-001)

## BASELINE
- **extends**: `aprd.frozen.md` v3 (lock content_sha256 `678590f98a2665058e9927cb901a106b6141f366233f02aa19be965a12a0e09c`)   <!-- immutable parent; its PROJECT/MISSION/SOURCE SPECS/BUILD ORDER carried by REFERENCE, not re-emitted -->

## SCOPE DELTA (what v4 adds over v3)
v3 scope note: "THIS tracker covers ONLY greenfield delivery pipeline (specs 00–04)." v4 extends:

> **Scope note (2026-06-10, CR-001):** deliverable scope now ALSO includes the **brownfield class bindings** the deliverable spec (`specs/00` §4 + §"new class → author playbook → register") promises — built as per-class playbook + per-role overlay delta blocks + a `_fixtures/brownfield-<class>/` both-directions oracle, reusing the one spine (P3). **In scope this version: the bugfix class binding.** feature-add binding already built (untracked; retro-track via later CR if wanted). Other 5 classes + Spines D/A still out of scope (HALT / deferred per v3).

Greenfield buildout (specs 00–04, the 10 prompt-builds) stays the prior frontier — all shipped. No greenfield requirement altered (no touch-set on greenfield slices).

## CLASS_EXTENSION (feature-add)
### INTEGRATION_SEAMS
- **at the role library** (the one spine, P3): the bugfix binding plugs in as per-role **overlay delta blocks** (the established feature-add overlay pattern) + a class playbook + a fixture oracle. Existing greenfield/feature-add behavior untouched — overlays are additive dispatch (`class == bugfix`).

### REGRESSION_GUARD
- **must stay green**: the greenfield both-directions oracle (`_fixtures/greenfield-clean/**`, `_fixtures/greenfield-build-reds/**`) + the feature-add oracle (`_fixtures/brownfield-feature/**`). Bugfix overlays must not change any greenfield/feature-add golden or lint verdict (per-edit HEAD-vs-edited violation-set parity — observed discipline).
- **economy-lint**: edited prompts introduce no NEW lint violations vs HEAD.

### CONVENTION_BASELINE
- **overlay pattern**: `### <class> delta (…)` Rules block + `**<Class> branch**` task-steps + `### <Class> schema delta` / `## CLASS_EXTENSION (<class>)`, appended after the shared body (AB1 — only what differs). Caveman + economy bind all prose (PR4).
- **fixture pattern**: `_fixtures/brownfield-<class>/` = immutable greenfield-built baseline + CR + golden trees + planted defects + README, e2e-validated both directions clean-room (step-runner, Sonnet/High, benches outside `_fixtures/`).

## NEW IN-SCOPE BUILDS (bugfix spine — Phase-1 RE-RANK sequences these)
Build-phase overlays + fixture oracle (head-start: playbook + wiring + intake overlays already committed; their fixture goldens still owed — built by the loop, re-run harmless per D20):
1. DIAGNOSE — bugfix defect-localize mode (writes `.aprd/diagnosis.json`; ROOT_CAUSE source for SYNTHESIZE).
2. DERIVE-TESTS — reproduction test spec (red→green).
3. MATERIALIZE-ORACLE — reproduction + regression oracle layers.
4. IMPLEMENT — minimal fix at root cause (scoped to BLAST_RADIUS).
5. VERIFY-OUTPUT — repro flips red→green + regression stays green.
6. `_fixtures/brownfield-bugfix/` — both-directions oracle (baseline + CR + golden + planted defects + README).

## BUILD ORDER
v3 build order unchanged (greenfield 0→4, shipped). Bugfix spine builds in intake→build order (above), each authored clean-room + verified against its `_fixtures/brownfield-bugfix/` golden + gated. Phase 2/3 (ADR/HLD) thin — no new architecture (P3).
