---
id: ADR-0007
title: Phase-1 file numbering past 03
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

- **D7 — Phase-1 file numbering past 03 (RESOLVED 2026-06-07).** **Number by spine order, not §10's pinned slots:** SKELETON-IDENTIFY=`04-skeleton.json`, SEQUENCE=`05-sequence.json`, FOUNDATION-CUT=`06-foundation-cut.json` (shifted from §10's `04`). Why: §10's tree is illustrative not binding (precedent: CRITIQUE took `08-critique.json`; research branch invented `03-grounding/`); PR2 cares about spine ORDER + a stable declared path, and no authored prompt yet consumes the literal `04-foundation-cut.json`. **Consequence:** FOUNDATION-CUT reads `04-skeleton.json`+`05-sequence.json`, writes `06-foundation-cut.json`.
