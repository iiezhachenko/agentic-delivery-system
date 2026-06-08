---
id: ADR-0014
title: Phase-3 INCREMENT authoring pattern
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

- **D14 — Phase-3 INCREMENT authoring pattern (RESOLVED 2026-06-08, reopens D9).** Calls made authoring the FIRST increment mode (DERIVE-COMPONENTS). **(1) Dual-mode single prompt, not a sibling file** — the role file dispatches on disk state (`.hld/skeleton.lock` absent → SKELETON Part A; present+frozen → INCREMENT Part B), faithful to D9 "one role two modes" + the runtime agent + the operator pasting ONE prompt. Skeleton body preserved verbatim; the old skeleton-mode "frozen-skeleton-exists → HALT (increment not authored)" guard flipped to route to Part B. **Reuse this pattern for DEFINE-CONTRACTS→RECONCILE/CRITIQUE increment.** **(2) Target-slice auto-select (resumable, PR1):** read `08-rerank.json` `remaining_sequence` in order, target = first slice with no `.hld/slices/<id>/components.json` on disk (cf IMPLEMENT build-record resume); all present → STOP clean. **(3) Introduced component from the living roadmap** `introduction_map[slice]` (not re-derived — R9/R10 are multi-homed so pure trace-intersection over-selects); touched = introduced + its transitive frozen deps + the ingress entry, **EXCLUDING any box introduced by a DIFFERENT slice** (the load-bearing call — a future-slice consumer of the introduced box is NOT this slice's; killed in isolated test). **(4) `new_components`/`new_edges`=[] is CORRECT in greenfield** (skeleton drew the FULL R-set, every slice req already homed; cf MAP-NFR empty mechanisms) — non-empty = brownfield/thin-skeleton signal. **(5) Output `.hld/slices/<slice_id>/components.json`** (§10 tree). Skeleton fidelity (H14): reused boxes carried verbatim, collision → escalate Phase 2/3, never redraw.
