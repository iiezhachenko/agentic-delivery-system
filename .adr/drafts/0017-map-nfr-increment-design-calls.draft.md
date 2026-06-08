---
id: ADR-0017
title: MAP-NFR increment design calls
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

- **D17 — MAP-NFR increment design calls (RESOLVED 2026-06-08, under D14 pattern).** Made authoring the 5th Phase-3 increment (MAP-NFR). **(1) Slice NFR scope = frame NFRs governing its boxes (the NFR-level mirror of MODEL-DATA owned/referenced + RESOLVE-LOCAL inherit-by-reference):** `inherited-governing` = a frozen NFR whose `realized_by ∩ touched_components ≠ ∅` (e.g. A2 security@C2 via CT3, C1 delivery@C6 via CT9) OR a topology-wide frame property (`realized_by:[]`, satisfied-by-frame — A13 scale, C2 timeline govern every slice), carried BY REFERENCE from frozen `nfr-mechanisms.json`, NEVER re-disposed (H14). **The exclusion (load-bearing, the D14/D16 trap at NFR level):** the aPRD-silent `not-applicable` frame NFRs (latency/availability/waived A9/data-residency) are frame-global non-requirements — NOT inherited per-slice; an NFR realized only by a non-touched box is excluded too. **(2) `new_mechanisms`=[] in greenfield (CORRECT, cf `new_components`/`new_contracts`/`new_entities`/skeleton-mechanisms=[]):** INV6/A13 forbid the classic scale mechs (cache/queue/replica/scale/partition) + the frame satisfies the rest → a slice adds no hardening; non-empty = brownfield/genuine-hardening signal. **MAP-NFR NEVER invents an NFR** — set is aPRD C*/A* + categories; an ungrounded slice NFR → `aprd_defects[]` → Phase 0. **(3) Per-slice hardening queue = frozen `nfr_inventory` entries with disposition `deferred` + `defer_to==target slice`** (the NFR-level analog of RESOLVE-LOCAL `re_deferred` filter); greenfield → `slice_nfr_queue:[]` (skeleton deferred none — every cross-cutting NFR dispositioned once). A frame-forbidden demand → `frame_conflicts[]` → Phase 2; a silently-unmet NFR → `unmet[]` (H5). **(4) Output `.hld/slices/<slice_id>/nfr-mechanisms.json`** (§10 tree; resumability sentinel = its presence; auto-select gate = components.json+contracts.json present, nfr-mechanisms.json absent — minimal consumed set, MODEL-DATA/RESOLVE-LOCAL outputs NOT consumed). `frame_fidelity.re_disposed_nfrs`/`re_realized_nfrs` MUST be empty (H14 at NFR level). **Reuse this inherit-governing-by-reference + frame-fidelity pattern for MODEL-FLOWS→RECONCILE/CRITIQUE increment.** Reopen to author the remaining Phase-3 increment modes.
