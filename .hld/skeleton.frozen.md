# HLD Skeleton — Agentic Delivery Pipeline (self-host) (FROZEN v4)

> Frozen, signed skeleton. Immutable. Self-host Build phase reads this + .hld/skeleton/*.json artifacts it manifests. Gate: RECONCILE/CRITIQUE verdict **clean**. Committed source at repo root. v4 = v3 + AB7–AB9 + dual-mode Rules rule (see Change log).

## CLASS
self-host

## SCAFFOLD
DRY prompt skeleton (D10) — see skeleton/prompt-skeleton.md. Every authored prompt = frontmatter + caveman block (PR4) + Role/Discriminator/Rules/Task-steps/Output-schema/Stop. One home per fact (AB1–AB9). Dual-mode prompts (`pass: skeleton|increment`): ONE shared `## Rules` block above the mode split + per-mode DELTA block — never copy a shared rule into both (v4).

## CODING CANON
AB1–AB9 + PR1–PR4 + caveman block — see skeleton/coding-canon.md. AB1–AB6 = prompt-stack placement idioms; AB7–AB9 = prompt-stack realization of spec P13 (cite, don't re-own).

## COMPONENTS (build-DAG nodes = role library)
- **00-aprd** (aPRD (Understand)): 9 roles — CLASSIFIER, CRITIQUE, EXTRACT, EXTRACT-RULES, GAP-DETECT, QUESTION-GEN, RECONCILE, SYNTHESIZE, VERIFY.
- **01-roadmap** (Roadmap (Plan)): 7 roles — FOUNDATION-CUT, RE-RANK, SEQUENCE, SEQUENCE-REVIEW, SKELETON-IDENTIFY, SLICE-EXTRACT, VERTICALITY-CHECK.
- **02-adr** (ADR (Decide)): 7 roles — CRITIQUE, DECISION-EXTRACT, EVALUATE-DECIDE, OPTION-GEN, RECONCILE, SYNTHESIZE-ADR, TRIAGE.
- **03-hld** (HLD (Design)): 8 roles — DEFINE-CONTRACTS, DERIVE-COMPONENTS, DERIVE-TESTS, MAP-NFR, MODEL-DATA, MODEL-FLOWS, RECONCILE-CRITIQUE, RESOLVE-LOCAL.
- **04-build** (Build (Deliver)): 8 roles — BUILD-PLAN, CRITIQUE, DEMO-GEN, DIAGNOSE, IMPLEMENT, INTEGRATE, MATERIALIZE-ORACLE, VERIFY-OUTPUT.

Total: 39 roles across 5 phases. Built skeleton (prompts/) = shipped subset; remaining_sequence (.roadmap/08-rerank.json) = unshipped frontier.

## BUILD ORDER (topological)
00-aprd → 01-roadmap → 02-adr → 03-hld → 04-build (each phase consumes prior phase's artifact format; no cycles).

## CONTRACTS
Producer/consumer (PR2): output schema of step N == input schema of step N+1 — see skeleton/contracts.json.

## Change log
- **v3 → v4** (T03 authored canon, T08 froze). Delta: (a) coding-canon AB section `AB1–AB6` → `AB1–AB9` — AB7 (statement earns its place), AB8 (single interpretation or named judgment), AB9 (fix down, delete/rewrite, never patch-by-add); each cites spec P13/A-ECON, does not re-own. (b) caveman block delta line (AB7/AB8/AB9 one-liner). (c) prompt-skeleton dual-mode rule: shared `## Rules` once + per-mode delta (kills the Part A↔B rule copy at the source). Frozen `.hld/skeleton/*` source = the v4 canon (committed). **Downstream re-trigger (done under T08):** all 8 03-hld + 8 04-build prompts re-authored against v4 through the gate (lint clean on C2/C5/C6/C8; clean-room value-verified — DERIVE-TESTS exact-match golden, DEFINE-CONTRACTS invariant vs shipped control). T09/T10 carry the remaining per-file P1/P2/P3 cuts (AB3/AB8 residue out of T08 scope).
