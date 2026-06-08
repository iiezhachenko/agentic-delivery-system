# CR-001 — Economy as stack-independent pipeline canon (P13 + economy INV)

> Change-request against frozen requirement source. Honors P8 immutability: frozen artifacts NOT overwritten in place; change = new version + re-lock + downstream re-trigger.

## What changed

Source spec `.aprd/specs/00-automated-aprd-pipeline-spec.md`:
1. **P13** added to §2 principles table — "Every produced artifact is downstream context — author to context-economy."
2. **§2.1 Economy invariant** added — cross-cutting NFR `A-ECON` / cross-slice invariant `INV-ECON`, testable acceptance (both-directions, substance floor), universal-vs-stack-local split.

## Version + lock

- **Spec 00:** v0.3 → **v0.4** (requirement-source new version). Date 2026-06-08.
- **`aprd.frozen.md` / `aprd.lock`:** NOT overwritten. Self-host frozen aPRD references specs by PATH, not by principle content → no in-place content delta. When build re-freezes against v0.4 specs, re-lock **v3 → v4** per freeze ritual (content hash + signer + timestamp). Frozen body never edited in place.

## Downstream re-trigger (affected stages)

P13 + `A-ECON` are new canon downstream stages read. Re-trigger:

| Stage / artifact | Re-trigger | Owner task |
|---|---|---|
| `.hld/skeleton/coding-canon.md` | CITE P13 + `A-ECON`; drop self-owned economy framing (one home → spec) | T03 |
| FOUNDATION-CUT (`.roadmap`/Phase 1) | inject `INV-ECON` default into `cross_slice_invariants` | T07 |
| MAP-NFR (Phase 3) | economy = NFR category, disposition `satisfied-by-gate` | T06/T07 |
| VERIFY-OUTPUT (Phase 4) | NFR check measures emitted artifact against `A-ECON` | T06 |
| Every artifact-emitting stage | gate reads output for economy | T06 |

## Immutability posture

- Frozen aPRD body unchanged → no overwrite.
- Spec 00 versioned (draft → new version), not frozen-in-place.
- Re-lock + re-trigger deferred to wiring tasks (T03/T06/T07) — this CR records the path; does not build the gate.
