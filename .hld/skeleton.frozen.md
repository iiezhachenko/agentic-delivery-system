# HLD Skeleton — Agentic Delivery Pipeline (self-host) (FROZEN v1)

> Frozen, signed skeleton. Immutable. The self-host Build phase reads this + the .hld/skeleton/*.json artifacts it manifests. Gate: RECONCILE/CRITIQUE verdict **clean**. Rendered mechanically by freeze.mjs — do not hand-edit (invariant #5).

## CLASS
self-host

## SCAFFOLD
The DRY prompt skeleton (D10) — see skeleton/prompt-skeleton.md. Every authored prompt = frontmatter + caveman block (PR4) + Role/Discriminator/Rules/Task-steps/Output-schema/Stop. One home per fact (AB1–AB6).

## CODING CANON
AB1–AB6 + PR1–PR4 + the caveman block — see skeleton/coding-canon.md.

## COMPONENTS (build-DAG nodes = the role library)
- **00-aprd** (aPRD (Understand)): 9 roles — CLASSIFIER, CRITIQUE, EXTRACT, EXTRACT-RULES, GAP-DETECT, QUESTION-GEN, RECONCILE, SYNTHESIZE, VERIFY.
- **01-roadmap** (Roadmap (Plan)): 7 roles — FOUNDATION-CUT, RE-RANK, SEQUENCE, SEQUENCE-REVIEW, SKELETON-IDENTIFY, SLICE-EXTRACT, VERTICALITY-CHECK.
- **02-adr** (ADR (Decide)): 7 roles — CRITIQUE, DECISION-EXTRACT, EVALUATE-DECIDE, OPTION-GEN, RECONCILE, SYNTHESIZE-ADR, TRIAGE.
- **03-hld** (HLD (Design)): 8 roles — DEFINE-CONTRACTS, DERIVE-COMPONENTS, DERIVE-TESTS, MAP-NFR, MODEL-DATA, MODEL-FLOWS, RECONCILE-CRITIQUE, RESOLVE-LOCAL.
- **04-build** (Build (Deliver)): 8 roles — BUILD-PLAN, CRITIQUE, DEMO-GEN, DIAGNOSE, IMPLEMENT, INTEGRATE, MATERIALIZE-ORACLE, VERIFY-OUTPUT.

Total: 39 roles across 5 phases. The built skeleton (prompts/) is the shipped subset; the remaining_sequence (.roadmap/08-rerank.json) is the unshipped frontier.

## BUILD ORDER (topological)
00-aprd → 01-roadmap → 02-adr → 03-hld → 04-build (each phase consumes the prior phase's artifact format; no cycles).

## CONTRACTS
Producer/consumer (PR2): output schema of step N == input schema of step N+1 — see skeleton/contracts.json.
