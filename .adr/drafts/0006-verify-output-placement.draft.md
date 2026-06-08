---
id: ADR-0006
title: VERIFY-OUTPUT placement
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

- **D6 — VERIFY-OUTPUT placement (RESOLVED 2026-06-07).** VERIFY-OUTPUT is the **Phase 4 build/verify gate**, NOT Phase 0. Why: it executes test CODE against BUILT software (§8/§4.1); Phase 0 emits the frozen aPRD (WHAT) — AC are statements, no executable artifacts pre-build. Tests get authored (MATERIALIZE-ORACLE) + run (VERIFY-OUTPUT) in Phase 4. Phase 0 terminates at **freeze** (§5.7) = mechanical render (frozen.md + lock), non-LLM → not an authored prompt. **Consequence:** Phase 0 prompt set = CLASSIFIER→EXTRACT→GAP-DETECT→QUESTION-GEN→[gate]→SYNTHESIZE→CRITIQUE + research branch EXTRACT-RULES→RECONCILE→VERIFY. Author VERIFY-OUTPUT in Phase 4 once oracle/build schemas lock.
