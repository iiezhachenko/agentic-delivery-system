---
id: ADR-0036
title: Audit class binding — third brownfield class (read-only lens-based assessment)
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: CR-015
---

## Decision

- **D36 — Introduce `audit` as a third brownfield delivery class: read-only lens-based assessment of an existing codebase.**
  Context (CR-015): `bugfix` and `feature-add` cover repair and extension of existing code. Neither covers the case where the Operator wants to assess the codebase against named check criteria without modifying it. `audit` fills this gap: read-only pass, Operator-defined lenses, machine + human report, optional promote-to-initiative path.

  **Decisions:**
  1. **`audit` = read-only class (no scaffold, no code modification).** `active_stages` all off — audit adds nothing to the skeleton/foundation/scaffold. Re-cutting frozen boxes = BF1 violation. `grounding_corpus` = existing code + tests + configs + conventions + git-history. No new components, no new slices, no IDs minted beyond `L*`/`LC*` (lens/criterion).
  2. **Operator-defined lenses.** Lenses = named check sets with pass/fail criteria. Schema: `{id: L*, name, description, criteria[{id: LC*, test, severity: info|warn|block}]}`. LENS-DEFINE collects interactively; engine stores at `.audit/lenses.json`. Operator must supply ≥1 lens; LENS-DEFINE HALTs otherwise. Scope stored at `.audit/scope.json`; default = repo root.
  3. **Dual output always: human `.audit/report.md` + machine `.audit/audit-report.json`.** Report structure: executive summary, per-lens pass/fail table, findings grouped by severity, recommended actions. JSON: `{lenses[], scope, findings[{lens_id, file, line?, criterion_id, severity, finding, remediation}], summary{total, block_count, warn_count, info_count, pass_count}}`.
  4. **Optional promote path to ADP initiative.** AUDIT-REPORT offers interactive promote after report: writes `.aprd/00-raw-request.md` shaped as ADP intake. Block findings → `bugfix`-class requirements; warn → `feature-add`-class requirements. Operator reviews; no auto-execution.
  5. **Three net-new roles (deferred — licensed by this decision).** LENS-DEFINE (interactive: collect lenses + scope), AUDIT-RUN (silent: evaluate criteria), AUDIT-REPORT (silent: write report + optional promote). Authoring in subsequent builds on `feature/audit-spine`.
  6. **Two existing roles need audit overlays (deferred).** CLASSIFIER: must emit `class=audit` on audit requests + apply the `has_adp_artifacts` guard. BASELINE-MAP: read-existing-first grounding applies; baseline inventory runs before any Operator interaction (`grounding_order: read-existing-first`). Overlays authored in subsequent builds.
  7. **`has_adp_artifacts: true` guard.** CLASSIFIER verifies `.aprd/`, `.hld/`, `.adr/` all present before routing to audit class. Foundation absent → HALT: "ADP foundation absent. Run `adopt` dispatch first, then re-run." Prevents audit from running against a project that hasn't been onboarded.

  **Tradeoffs considered:**
  - *Inline audit in existing roles — rejected.* Audit = observational class with its own lens/scope/report lifecycle. Mixing into DIAGNOSE or VERIFY-OUTPUT conflates two distinct control flows (one fixes, one observes). Separate class keeps failure isolation clean (D1).
  - *Free-form criteria (no schema) — rejected.* Unschematized lenses can't be evaluated mechanically (AUDIT-RUN needs `criterion_id` + `severity` + `test`). Schema = `L*`/`LC*` IDs; no richer ID family needed (audit doesn't mint R*/AC*/S* — it observes them).
  - *Auto-promote findings — rejected.* Auto-promotion into the ADP pipeline bypasses operator review. Promote = opt-in interactive step after report. Operator owns the initiative-launch decision.

  **Consequences:** `prompts/_playbooks/audit-spine.md` shipped. Three new role prompts deferred (LENS-DEFINE, AUDIT-RUN, AUDIT-REPORT) + two overlays (CLASSIFIER, BASELINE-MAP). components.json + contracts.json update after roles authored. adr-index.json: ADR-0036 entry added; `adr_counts.rendered` → 36. adr.lock → v16.
  **Reopen if:** lenses need version-controlled schema enforcement (→ `schemas/audit-lens.schema.json`); scope-narrowing to file-level granularity is insufficient (→ AST-level criteria); promote-path auto-execution is ever wanted (→ new gate decision required).
