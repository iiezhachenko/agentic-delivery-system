# aPRD — Agentic Delivery Pipeline (self-host) (FROZEN v2)

> Frozen, signed contract. Immutable — a later change is a new version + change request that re-triggers affected downstream stages (P8). This is the WHAT the self-host Build phase reads: the deliverable is the **executable AI prompt set** for the greenfield delivery pipeline (specs 00–04). Committed source at the repo root.

## PROJECT
Build the agentic delivery system on itself: author the remaining executable AI prompts that turn the five greenfield-delivery design specs into a runnable pipeline. The deliverable's "code" unit is one prompt `.md` (D21).

## CLASS
self-host (stack = agentic-delivery-pipeline · ADR-0021)

## MISSION
Turn the **5 greenfield-delivery design specs** (`.aprd/specs/00`–`04`) into **executable AI prompts**. Operator pastes each into a **fresh harness session** to manually simulate the agentic system before it is built. Output of one prompt = input to the next (artifacts chain, IDs thread).

Building IS NOT running the pipeline. I am authoring the prompt set, one prompt at a time.

> **Scope note (2026-06-07):** `.aprd/specs/` now also holds `05` (documentation pipeline, Spine D) + `06` (architecture-review pipeline, Spine A) — sibling pipelines that reuse this role library. **THIS tracker covers ONLY the greenfield delivery pipeline (specs 00–04).** Spines D + A are out of current scope; they get authored AFTER the greenfield buildout completes (build order: greenfield → Spine D → Spine A), each with its own tracker. Do not author their prompts here.

## SOURCE SPECS (the requirement source the prompts realize)
**In scope here — greenfield delivery pipeline (00–04):**

| Phase | File | Produces | Key prompts |
|---|---|---|---|
| 0 aPRD | `.aprd/specs/00-automated-aprd-pipeline-spec.md` | frozen aPRD set (WHAT) | CLASSIFIER, EXTRACT, GAP-DETECT, QUESTION-GEN, SYNTHESIZE, CRITIQUE, research(EXTRACT-RULES/RECONCILE/VERIFY). [VERIFY-OUTPUT → Phase 4 per D6; freeze = mechanical, no prompt] |
| 1 Roadmap | `.aprd/specs/01-automated-roadmap-pipeline-spec.md` | vertical slice sequence + foundation cut | SLICE-EXTRACT, VERTICALITY-CHECK, SKELETON-IDENTIFY, SEQUENCE, FOUNDATION-CUT, RE-RANK, SEQUENCE-REVIEW |
| 2 ADR | `.aprd/specs/02-automated-adr-pipeline-spec.md` | ADR log (WHY-this-HOW) | DECISION-EXTRACT, TRIAGE, OPTION-GEN, EVALUATE-DECIDE, RECONCILE, SYNTHESIZE-ADR, CRITIQUE |
| 3 HLD | `.aprd/specs/03-automated-hld-pipeline-spec.md` | skeleton HLD + per-slice increments | DERIVE-COMPONENTS, DEFINE-CONTRACTS, RESOLVE-LOCAL, MODEL-DATA, MAP-NFR, MODEL-FLOWS, DERIVE-TESTS, RECONCILE/CRITIQUE |
| 4 Build | `.aprd/specs/04-automated-build-pipeline-spec.md` | verified staging software (TERMINAL) | BUILD-PLAN, MATERIALIZE-ORACLE, IMPLEMENT, INTEGRATE, DIAGNOSE, VERIFY-OUTPUT, CRITIQUE, DEMO-GEN |

**Out of current scope — sibling spines (NOT built by this tracker):**

| Spine | File | Produces | Reuse posture |
|---|---|---|---|
| D Documentation | `.aprd/specs/05-automated-documentation-pipeline-spec.md` | verified documentation set (TERMINAL) | overlays on the research sub-pipeline + slicing + CRITIQUE/VERIFY; mostly OVERLAY, near-zero new code |
| A Arch-review | `.aprd/specs/06-automated-architecture-review-pipeline-spec.md` | accepted review + recommended ADRs (TERMINAL) | HLD roles read-mode + Phase-2 ADR engine verbatim; new work = DIAGNOSE only |

Pipeline shape: **two loops** — foundation loop (once, thin) + slice loop (×N). Phase 1 is the controller. Phase 4 terminal at accepted staging demo.

## BUILD ORDER
Phases 0→1→2→3→4 in sequence. Each phase consumes prior phase's artifact format, so authoring downstream prompts needs upstream output schema locked first. Within a phase: author prompts in spine-stage order.
