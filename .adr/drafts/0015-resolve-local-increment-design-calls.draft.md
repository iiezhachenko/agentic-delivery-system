---
id: ADR-0015
title: RESOLVE-LOCAL increment design calls
status: Proposed
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D15 — RESOLVE-LOCAL increment design calls (RESOLVED 2026-06-08, under D14 pattern).** Made authoring the 3rd Phase-3 increment (RESOLVE-LOCAL). **(1) Per-slice local queue = the skeleton-pass ledger's `re_deferred[]` entries with `defer_to == target_slice`** (role-deferred entries like DP11→DERIVE-TESTS skipped — not a slice). Greenfield → typically EMPTY (skeleton drew the full graph + drained TRIAGE's whole `deferred_queue[]` once; no NEW local fork per slice — the decision-level analog of `new_components`/`new_contracts`=[]); empty is CORRECT. The S3 increment will be the non-empty case (drains DP3 PDF-library). **(2) Inherited local ADRs (THE load-bearing new surface, H14 at decision level):** the skeleton ledger `local_adrs[]` whose `component ∈ the slice's touched_components` are carried BY REFERENCE (id/dp_id/component/title) into `inherited_local_adrs[]`, NEVER re-opened — the decision-level mirror of DEFINE-CONTRACTS carrying a frozen contract verbatim. This is the meaningful per-slice output when the slice's own queue is empty (names which prior locals govern its boxes). **(3) Foundational-stays-out:** TRIAGE `slice_deferred[]` forks for this slice (foundational-but-not-yet, e.g. DP5 module-cut→S4) are recorded in `foundational_routed[]` (route Phase 2 ADR slice increment) for accounting but NEVER resolved here — RESOLVE-LOCAL resolves LOCAL forks only (same foundational-stays-out discipline as the escalation rule). **(4) Output `.hld/slices/<slice_id>/deferred-decisions.json`** (per-slice ledger; resumability sentinel = its presence); resolved-fork DRAFTS still land in the shared `.adr/drafts/` with ids continuing the monotonic sequence after `current_adr_max` (= max across `adr.lock.adrs[]` ∪ skeleton ledger `local_adrs[]`). **Reuse this inherit-by-reference + foundational-route-out pattern for MODEL-DATA→RECONCILE/CRITIQUE increment where applicable.** Reopen to author the remaining Phase-3 increment modes.
