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

---

## VERIFY RESULT — 2026-06-10 — ROLE BROKE → SPINE LEAK ESCALATED (broke-branch DONE)

**Verdict: known-good run FAILS. Phase-2 + Phase-3 do NOT run verbatim for feature-add. NO golden recorded, NO prompt authored.** Reuse-ledger claim "Phases 2+3 entirely free, 15 roles run as-is" is FALSE as written. Leak is in the spine, not a feature-add overlay — fix once (P3), do NOT patch here.

### Test bench
Seeded feature-CR fixture per task step 1: baseline trees from `_fixtures/greenfield-clean/` (`.adr/ .hld/ .roadmap/ .build/`) + post-CR `.aprd/` from `_fixtures/brownfield-feature/` (v1 `aprd.frozen.md` IMMUTABLE + `aprd.v2.frozen.md` feature version + `aprd.lock` re-signed → `artifact: aprd.v2.frozen.md, version: v2` + `baseline-map.json`). `skeleton.lock` present (increment-dispatch signal).

### The leak (root cause — single, shared by 13 roles)
**Frozen-WHAT input hardcoded to literal path `.aprd/aprd.frozen.md`; NEVER resolved through `aprd.lock.artifact`.** Greenfield: `lock.artifact == aprd.frozen.md` → coincidentally works. Feature-add: `lock.artifact == aprd.v2.frozen.md ≠ aprd.frozen.md` → every consumer walks the STALE v1 baseline. Feature (R11–R13 / E8 / A14–A16) invisible; `CLASS` re-reads as `greenfield` from v1 body. Lock used as freeze-signature only (`status==frozen` + "names frozen artifact"); the named artifact is never opened.

Static sweep (all P2/P3 roles): 13/15 take `path: ".aprd/aprd.frozen.md"`; 0/15 resolve `aprd.lock.artifact` to pick version. (`SYNTHESIZE-ADR`, `TRIAGE` don't read the aPRD directly — they inherit the wrong scope downstream of `DECISION-EXTRACT`.)

### Empirical proof (clean-room, step-runner, prompt verbatim + bench path only)
`DECISION-EXTRACT` (Phase-2 head) on the feature-CR bench → wrote `.adr/01-decision-points.json` with:
- `aprd_ref: ".aprd/aprd.frozen.md"` — walked v1, NOT v2.
- `lock_verified: true` — passed despite `lock.artifact` (v2) ≠ file walked (v1). Version-mismatch is a no-op; no guard catches it.
- `class: "greenfield"` — re-derived from v1 body; feature-add re-entry unrecognized.
- 10 decision points **DP1–DP10 = the BASELINE forks already resolved by frozen ADR-0001..0006.** Zero feature DPs. R11–R13 / E8 never seen.

Downstream blast: those re-extracted baseline DPs flow to OPTION-GEN → EVALUATE-DECIDE → SYNTHESIZE-ADR, which would re-mint ADRs for already-frozen decisions → **ADR collision / baseline-redecision = BF1 immutability violation produced by the spine itself.** Phase-3 inherits identically — `MODEL-DATA` etc. read v1 `ENTITIES` (E1–E7), never E8 (Tag) → cannot model the feature's data scope.

Frozen immutability held at file level (runner stayed in lane; only non-frozen `.adr/01-decision-points.json` written; `sha256 -c` on `skeleton.frozen.md`/`skeleton.lock`/`adr.lock`/`.adr/log/*`/`aprd.frozen.md` = all OK). The defect is in the CONTENT the spine derives, not a frozen overwrite.

### Both-directions status
Known-good direction FAILS → oracle cannot be armed. No planted-defect run needed: the spine emits the defect (baseline re-decision) on the known-good input. FAIL is the signal.

### Escalation — fix the spine ONCE (P3), keep P2/P3 as REUSE (no feature-add delta)
**Defect:** frozen-WHAT input bound to literal `.aprd/aprd.frozen.md` instead of "the frozen aPRD the lock names."
**Roles:** all P2/P3 frozen-WHAT consumers — `DECISION-EXTRACT`, `OPTION-GEN`, `EVALUATE-DECIDE`, `RECONCILE`, `CRITIQUE` (02-adr); `MODEL-DATA`, `DERIVE-COMPONENTS`, `DEFINE-CONTRACTS`, `MODEL-FLOWS`, `MAP-NFR`, `DERIVE-TESTS`, `RESOLVE-LOCAL`, `RECONCILE-CRITIQUE` (03-hld). `TRIAGE` + `SYNTHESIZE-ADR` inherit via scope.
**Fix (class-agnostic, single):** resolve frozen-WHAT input via `aprd.lock.artifact` (read lock → open the file it names), not a hardcoded filename. Greenfield unaffected (`lock.artifact == aprd.frozen.md`); feature-add resolves to `aprd.v2.frozen.md`. Per AB9/P1 this is REWRITE of the input binding, never ADD. Keeps the REUSE posture intact — NOT a feature-add overlay.
**Owner:** spine task (Phase 0/2/3 input-binding), upstream of this checkpoint. This checkpoint cannot pass until that lands. Blocks Task 14 (BF-FIXTURE-ORACLE) consuming a clean P2/P3 run.

### Box check (broke-branch)
- [x] Ran P2 head clean-room on feature-CR fixture; **did NOT pass** — leak surfaced.
- [ ] golden `.hld/slices/S<new>/` — NOT recorded (no clean run; recording would launder a defect).
- [x] Frozen `skeleton.frozen.md` / `skeleton.lock` / `.adr/log/*` / `adr.lock` byte-unchanged (verified sha256 -c).
- [x] No new prompt authored.
- [x] Leak escalated with exact role(s) + exact failure + single-fix recommendation (above).
