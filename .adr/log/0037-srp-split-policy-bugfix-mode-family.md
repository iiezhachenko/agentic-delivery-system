---
id: ADR-0037
title: SRP split policy — all 13 findings execute as splits; Class A + Class B extracted
status: Accepted
date: 2026-06-12
class: self-host
scope: global
mode: foundation
source: operator-approved
supersedes: null
superseded_by: null
cr: "CR-016, CR-017, CR-018, CR-019, CR-020, CR-021"
---

## Decision

- **D37 — Execute SRP splits for all 13 findings — Class A dual-output splits + Class B bugfix-mode-family both extracted.**
  Context (CR-016/CR-021): SRP audit (lens L1, criteria LC1–LC4) of 43 role prompts found 6 block + 7 warn = 13 findings. Findings cluster into two classes:

  **Class A — Dual-output splits** (F1/F6 AUDIT-REPORT, F2/F3/F7 DIAGNOSE, F4/F8 SEQUENCE, F5/F9 DERIVE-TESTS): each role writes 2 structurally unrelated outputs (different schemas, different phases, different consumers), or crosses a phase boundary. Clean SRP violations — extract/split unambiguous.

  **Class B — Bugfix-mode-family** (F10 SYNTHESIZE, F11 IMPLEMENT, F12 MATERIALIZE-ORACLE, F13 VERIFY-OUTPUT): each role has a bugfix branch that behaves differently from greenfield/feature-add. Warn severity (not block). Design question: extract vs accept.

  **Decisions:**
  1. **Class A dual-output splits: execute.** CR-017 (AUDIT-REPORT → AUDIT-PROMOTE), CR-018 (DIAGNOSE → BUGFIX-LOCALIZE), CR-019 (SEQUENCE → SEQUENCE-FEATURE-ADD), CR-020 (DERIVE-TESTS → DERIVE-BUILD-DAG) accepted. Build loop executes splits in subsequent workstream.
  2. **Class B bugfix-mode-family: execute extraction.** Operator gate rejected accept-as-designed ruling. Rationale: strict one-role-one-prompt + failure isolation (CLAUDE.md: "role separation load-bearing") > DRY-skeleton role-count minimization argument. Each role's failure surface must isolate. Mode-switching across delivery classes = multiple responsibilities; extract mandatory. F10/F11/F12/F13 → resolved-by-split via CR-021. Extraction creates: SYNTHESIZE-INCREMENT.md, IMPLEMENT-BUGFIX.md, MATERIALIZE-ORACLE-BUGFIX.md, VERIFY-OUTPUT-BUGFIX.md.
  3. **F10 SYNTHESIZE split.** Greenfield path (draft, no lock) stays in SYNTHESIZE.md. Feature-add/bugfix path (frozen version + aprd.lock re-sign) extracted to SYNTHESIZE-INCREMENT.md. Split approved — lock-write responsibility separates cleanly.
  4. **F9 DERIVE-TESTS bugfix pass split.** Bugfix pass (Part C) extracted to DERIVE-TESTS-BUGFIX.md (repro test + regression layer mint). DERIVE-TESTS retains skeleton/increment test-specs only. CR-020 extracts build-dag derivation; CR-021 extracts bugfix pass. Post-split DERIVE-TESTS = skeleton+increment test-spec generation only.
  5. **Severity confirmed.** F10/F11/F12/F13 + F9 Part C = WARN (LC4), resolved-by-split (CR-021). LC4 warn severity correct — genuine SRP issues flagged, extraction warranted. Warn = human-review signal; operator review confirmed extraction over accept-as-designed.

  **Tradeoffs considered:**
  - *Extract bugfix family — CHOSEN.* Operator rationale: one-role-one-prompt absolute (CLAUDE.md foundation). Failure isolation per role = load-bearing design invariant. Role proliferation cost accepted — each new role = isolated failure surface. DRY-skeleton argues for fewer files, but SRP mandate + failure isolation > DRY minimization when responsibilities differ structurally. Creates 4 new roles (SYNTHESIZE-INCREMENT, IMPLEMENT-BUGFIX, MATERIALIZE-ORACLE-BUGFIX, VERIFY-OUTPUT-BUGFIX) + DERIVE-TESTS-BUGFIX (from F9). Total 5 new Class B roles.
  - *Accept Class B as designed — REJECTED.* Operator explicitly rejected: CLAUDE.md SRP mandate not optional. Warn severity does not mean "ignore." Bugfix = first-class delivery class argument (roles polymorphic over classes) did not override one-role-one-prompt + failure-isolation foundation. Mode-switching = multiple responsibilities.
  - *Extract SYNTHESIZE-INCREMENT only — partial/superseded.* Original consideration: greenfield vs increment split for SYNTHESIZE alone. Operator applied same rationale to entire bugfix-mode family — SYNTHESIZE-INCREMENT confirmed, plus 4 others.
  - *Create DIAGNOSE-BUGFIX (not BUGFIX-LOCALIZE) at phase-04 — rejected.* Part C performs Phase-0 intake work regardless of file location. Moving within phase-04 doesn't fix phase-boundary violation (F3). Extract must land in 00-aprd.

  **Consequences:** CR-017–CR-021 all active — execute splits in build loop. All 13 findings resolved-by-split. No findings resolved-by-design. Active SRP work: 5 CRs covering 13 findings. Post-split role count: 43 baseline + 9 new roles (AUDIT-PROMOTE, BUGFIX-LOCALIZE, SEQUENCE-FEATURE-ADD, DERIVE-BUILD-DAG, DERIVE-TESTS-BUGFIX, SYNTHESIZE-INCREMENT, IMPLEMENT-BUGFIX, MATERIALIZE-ORACLE-BUGFIX, VERIFY-OUTPUT-BUGFIX) = 52 roles. adr-index.json: ADR-0037 entry added; `adr_counts.rendered` → 37. adr.lock → v17.
  **Reopen if:** new SRP violations surface requiring further extraction; or split boundaries prove incorrect (wrong responsibility division → merge/re-split); or extracted roles show coupling pathology requiring different split axis (→ re-examine boundaries).
