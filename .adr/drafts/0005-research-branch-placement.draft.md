---
id: ADR-0005
title: Research branch placement
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

- **D5 — Research branch placement (RESOLVED 2026-06-07).** Canon-grounding sub-pipeline (§7) runs **PRE-GAP**: emits `03-grounding/`, consumed by GAP-DETECT as OPTIONAL input (folds canon-resolved values into `recommended_default`, drops gaps canon closes). Why: spine order is ground→gap = P5 read-before-ask. Roles EXTRACT-RULES→RECONCILE→VERIFY; the allowlist+fetch ahead of them is **mechanical (non-LLM)**, not an authored prompt — EXTRACT-RULES consumes pre-fetched manifests on disk.
