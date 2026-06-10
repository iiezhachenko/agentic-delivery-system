# Task 07 — P2+P3 VERIFY-ONLY (REUSE checkpoint)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Author NOTHING. Prove Phase-2 (ADR, 7 roles) + Phase-3 (HLD, 8 roles) carry VERBATIM for feature-add by running them clean-room on a feature-CR fixture. Phase-2 scoped to NEW decisions the feature forces (TRIAGE may find none → skip Phase 2). Phase-3 = **increment mode** (`skeleton.lock` present → INCREMENT PASS extends the frozen skeleton for new slices, never redraws a frozen box). New ADRs/components continue numbering. Satisfies **BF1** (frozen boxes untouched) + **BF6** (new components plug at seams). If a role needs an edit to run clean, that's a leaked abstraction → flag, don't author here.

## Why this exists

Architecture §2 reuse ledger: Phases 2 + 3 are entirely FREE for feature-add — 15 roles run as-is. Phase-2 ADR roles scope to whatever new decision the feature forces (existing ADRs = frozen constraints, like canon; an existing ADR changes only via a superseding ADR). Phase-3 already has the machinery: **increment mode** is exactly "extend a frozen baseline with one more slice." This checkpoint VERIFIES that claim against a real feature CR — if it holds, nothing is authored; if it breaks, the break is a spine defect to fix once, not a feature-add overlay.

### Invariants verified
- **BF1 — baseline immutable.** Phase-3 increment never redraws a frozen skeleton box; `skeleton.frozen.md` stays unchanged. New ADRs continue numbering; existing ADRs changed only by superseding.
- **BF6 — seam-bounded.** New components plug into existing components at declared seams.

## DAG position

- **Deps:** Task 06 (BF-SYNTHESIZE — provides `aprd.v2.frozen.md` + class-extension block). Parallel to Tasks 08–09 (no ordering dep between Phase-1 overlays and this checkpoint).
- **Downstream:** Task 14 (BF-FIXTURE-ORACLE) consumes this checkpoint's clean run.
- **Sentinel:** feature-CR fixture runs P2 + P3 clean — golden `_fixtures/brownfield-feature/.hld/slices/S<new>/` HLD increment present + frozen `skeleton.frozen.md` byte-unchanged + frozen `skeleton.lock` unchanged.

## Phase-2 roles (ADR — 7, all REUSE)

`TRIAGE`, `DECISION-EXTRACT`, `OPTION-GEN`, `EVALUATE-DECIDE`, `SYNTHESIZE-ADR`, `RECONCILE`, `CRITIQUE` (in `prompts/02-adr/`). They consume the frozen aPRD (now `aprd.v2.frozen.md`) and emit new decision points + ADRs. Existing `.adr/log/<NNNN>.md` bodies + `adr.lock` are frozen constraints. New ADRs continue numbering above the baseline ADR high-water-mark. **TRIAGE may determine the feature forces NO new decision → Phase 2 is skipped for small features.**

## Phase-3 roles (HLD — 8, all REUSE in increment mode)

`MODEL-DATA`, `DERIVE-COMPONENTS`, `DEFINE-CONTRACTS`, `MODEL-FLOWS`, `MAP-NFR`, `DERIVE-TESTS`, `RESOLVE-LOCAL`, `RECONCILE-CRITIQUE` (in `prompts/03-hld/`). Phase-3 roles carry `pass: skeleton|increment`. When `.hld/skeleton.lock` is present + frozen → **INCREMENT PASS**: extend the frozen skeleton for the new slice(s). New components/contracts/data-model/flows land under `.hld/slices/S<new>/` (mirrors the greenfield-clean fixture's `.hld/slices/S4/` layout). A collision with a frozen box (the increment would need to redraw an existing frozen component) → change request routed back (already wired in the increment-mode escapes), NEVER an in-place edit.

## What this checkpoint does (verify, don't author)

1. Seed a feature-CR fixture baseline (the greenfield-built project trees + the new `aprd.v2.frozen.md` from Task 06).
2. Run Phase-2 roles clean-room (step-runner, one role per fresh session) on the new version:
   - Confirm TRIAGE correctly scopes to NEW decisions (or finds none → documented skip).
   - Confirm any new ADR continues numbering above the baseline ADR high-water-mark; existing ADR bodies + `adr.lock` byte-unchanged (superseding only).
3. Run Phase-3 roles clean-room in INCREMENT PASS:
   - Confirm `skeleton.lock` present → roles dispatch to increment, not skeleton, pass.
   - Confirm new HLD artifacts land under `.hld/slices/S<new>/`; `skeleton.frozen.md` + `skeleton.lock` byte-unchanged.
   - Confirm new components declare their integration seams to existing components (BF6); no frozen box redrawn.
4. Record the clean run as the golden. **Author no new prompt.** If any role CANNOT run clean without an edit, STOP and report the role + the exact failure — that is a leaked abstraction (fix the spine once, P3), not a feature-add overlay to write here.

## EMBEDDED CANON (for the verify discipline)

**Both-directions oracle:** a verify is only trustworthy if a known-good run PASSes AND a planted-defect run FAILs. **Disk is the deliverable** — verify the artifact on disk, not the runner's chat reply. **Clean-room:** runner gets only the prompt verbatim + the test-bench path; no pipeline context leaks in.

## Verify (both-directions)

- **Known-good:** feature CR → P2 (new ADRs continue numbering OR clean skip) + P3 increment (new `.hld/slices/S<new>/` artifacts, frozen skeleton untouched). PASS.
- **Planted defect — frozen redraw:** an increment that mutates `skeleton.frozen.md` or an existing frozen component → MUST FAIL (BF1).
- **Planted defect — ADR collision:** a new ADR reusing a baseline ADR number, or editing an existing ADR body in place → MUST FAIL (immutability; supersede only).
- **Planted defect — skeleton-pass misdispatch:** Phase-3 role running skeleton pass despite `skeleton.lock` present → MUST FAIL (should be increment).

## Lane / what NOT to do

- Author NO prompt. This is a verification checkpoint.
- Don't "fix" a role by adding a feature-add delta here — if a role breaks, it's a spine defect to escalate.
- Don't redraw or edit any frozen artifact.

## DONE WHEN

- P2 + P3 run clean-room on the feature-CR fixture; golden `.hld/slices/S<new>/` increment recorded.
- Frozen `skeleton.frozen.md`, `skeleton.lock`, existing `.adr/log/*` + `adr.lock` all byte-unchanged.
- Both-directions checks hold (known-good PASS; frozen-redraw / ADR-collision / skeleton-misdispatch FAIL).
- No new prompt authored (or, if a role broke, the leak is escalated with the exact role + failure).
