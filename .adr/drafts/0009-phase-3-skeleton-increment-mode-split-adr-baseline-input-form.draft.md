---
id: ADR-0009
title: Phase-3 skeleton/increment mode split + ADR-baseline input form
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

- **D9 — Phase-3 skeleton/increment mode split + ADR-baseline input form (RESOLVED 2026-06-07).** Two coupled calls made when authoring DERIVE-COMPONENTS (Phase-3 head). **(1) Mode split:** every Phase-3 role is one role with TWO modes — SKELETON (drawn once: full graph/contracts/data-model/NFR/cross-cutting/build-DAG) + INCREMENT (per slice: one flow F*, extends the FROZEN skeleton, adds only new-capability boxes/contracts — MODEL-FLOWS §5.7 is its centerpiece). **Author the SKELETON pass for every role first, defer INCREMENT modes** — rationale: the increment mode extends a *frozen* skeleton that must EXIST first (a `hld.skeleton.lock` fixture), mirrors "skeleton drawn once before increments" (RM3/H13/H14), and lets the skeleton chain be built+tested end-to-end before the per-slice loop is authored. DERIVE-COMPONENTS guards HALT if a frozen skeleton already exists (= the increment trigger, not authored). Reopen to author increment modes once the skeleton chain freezes + a frozen-skeleton fixture exists. **(2) ADR-baseline input form:** Phase 3 reads the **baselined frozen `.adr/log/` (Accepted) + `adr.lock`** (the spec §2 input is the baselined log), NOT the Proposed `.adr/drafts/` + `adr-index.json` (those are Phase-2 pre-freeze internal). The mechanical freeze (non-LLM, no prompt — promote drafts→log, Proposed→Accepted, write adr.lock w/ baselined manifest) was run BY HAND on the golden Phase-2 drafts to seed `_fixtures/greenfield-clean/.adr/log/` + `adr.lock`; the pre-freeze `drafts/` + `adr-index.json` (Proposed) are kept untouched as the Phase-2 goldens (no conflict — Phase-2 steps seed drafts+index, Phase-3 steps seed log+lock; different subsets). **(3) §5.1 Load+verify-frame** is folded into the head prompt (guard + components.json header), NO separate `00-inputs.json` artifact (D7 precedent — §10 tree illustrative, don't mint an artifact no authored consumer reads).
