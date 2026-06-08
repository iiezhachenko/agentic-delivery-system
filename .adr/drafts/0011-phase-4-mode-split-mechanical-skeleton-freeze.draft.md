---
id: ADR-0011
title: Phase-4 mode split + mechanical skeleton freeze
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

- **D11 — Phase-4 mode split + mechanical skeleton freeze (RESOLVED 2026-06-07).** Mirrors D9. **(1) Mode split:** Phase 4 runs in two modes (B9) — SKELETON-BUILD (once: scaffold + harness + walking skeleton) + SLICE-BUILD (per slice). **Author SKELETON-BUILD pass for every Phase-4 role first, defer SLICE-BUILD** — rationale: slice build extends a built skeleton that must EXIST first; the available fixture is the frozen skeleton; same skeleton-once-before-slices logic (B9/RM3). BUILD-PLAN guards HALT if a skeleton build already exists (= the slice-build trigger, not authored). **(2) Mechanical skeleton freeze (non-LLM, no prompt — ran BY HAND):** promoted the clean-gated skeleton artifacts to a frozen baseline — wrote `_fixtures/greenfield-clean/.hld/skeleton.lock` (status:frozen + gate.reconcile_critique_verdict:clean + artifact manifest + build_dag summary + walking_skeleton_flow) + `.hld/skeleton.frozen.md` (human-readable snapshot), mirroring the Phase-2 `adr.lock`/`adr.frozen` freeze. The `.hld/skeleton/*.json` goldens stay untouched (the lock references them). Phase 4 reads skeleton.lock as the freeze gate + the `.hld/skeleton/` artifacts it manifests. **(3) §5.1 load+verify-frame** folded into the head prompt (lock guards + build-plan header), NO separate `.build/00-inputs.json` (D7/D9 precedent — §10 tree illustrative, don't mint an artifact no authored consumer reads). **(4) Skeleton-build output path** `.build/skeleton/build-plan.json` (§10's `.build/skeleton/` dir; slice builds use `.build/slices/S*/build-plan.json`).
