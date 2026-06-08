---
id: ADR-0018
title: MODEL-FLOWS increment design calls
status: Proposed
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: _decisions.md
supersedes: null
superseded_by: null
---

## Decision

- **D18 — MODEL-FLOWS increment design calls (RESOLVED 2026-06-08, under D14 pattern).** Made authoring the 6th Phase-3 increment (MODEL-FLOWS). **(1) The slice IS a flow F* (§5.7 centerpiece) — the ONE Phase-3 increment that DRAWS a new artifact every slice**, unlike DERIVE-COMPONENTS/DEFINE-CONTRACTS/MODEL-DATA/MAP-NFR (carry-by-reference, empty new-* delta). The flow is genuinely new; the CONTRACTS it walks are FROZEN (composed against, never redrawn). **(2) Compose against frozen contracts (H1/H6/H14):** each inter-component hop → a CT* in the slice's `touched_contracts` (carried by reference from the frozen skeleton); `via`/`failure_modes`/`honors_inv` verbatim; a hop with no CT* → `structural_defects[]` → DEFINE-CONTRACTS (never invent); reshaping a frozen contract / re-walking F1 → `frame_conflicts[]` → Phase 2 (`skeleton_fidelity.reshaped_contracts`/`redrawn_flows` MUST be empty). **(3) The exclusion (the D14/D16/D17 trap at flow level):** walk ONLY `touched_components`+`touched_contracts`; a frozen box/CT* a DIFFERENT slice introduces (C4/C5, CT4-CT7/CT10/CT11) is excluded — membership gate. **(4) `traces` has TWO rules (the e2e determinism fix — two rooms diverged R6-only vs all-4):** R* part = the slice's FULL requirement set verbatim (the flow IS the slice, NOT sub-filtered, deterministic); AC* part = ONLY the AC* the happy path demonstrably reaches end-to-end (a PDF/invoice AC needing a different slice's flow is NOT traced — S4 traces R4/R6/R9/R10 + AC6, excludes AC4/AC9/AC10). **(5) Flow id = F<slice-ordinal>** (S4→F4; skeleton F1==S1) — globally unique, derivable per-slice in isolation without sibling visibility. **(6) Output `.hld/slices/<slice_id>/flows.json`** (§10 tree; resumability sentinel = its presence; auto-select gate = components.json+contracts.json present, flows.json absent — minimal consumed set, RESOLVE-LOCAL/MODEL-DATA/MAP-NFR outputs NOT consumed). **Reuse this compose-against-frozen + flow-is-new pattern for DERIVE-TESTS→RECONCILE/CRITIQUE increment.** Reopen to author the remaining Phase-3 increment modes.
