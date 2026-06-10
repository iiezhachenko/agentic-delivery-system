# Task 11 — BF-IMPLEMENT (OVERLAY)

> **STATUS: DONE** (2026-06-10). feature-add convention delta added to `prompts/04-build/IMPLEMENT.md` slice-build part; frozen-WHAT lock-resolved (07a canon); golden feature-add slice `build-record.json` (S5/C4) on bench shows convention-conformant new code. See §COMPLETION.

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Add a `feature-add` DELTA to the SLICE-BUILD mode of `prompts/04-build/IMPLEMENT.md`. Greenfield IMPLEMENT (builder) implements ONE component against its FROZEN oracle, contract layer to green, mocking unbuilt seams. Feature-add grounds from EXISTING code FIRST (cheapest-source-first) so new code matches the `CONVENTION_BASELINE` (BF5), not canon defaults. MODE=slice (no scaffold — harness exists). Dual-mode overlay on the existing slice-build part: ONE shared Rules + a feature-add delta carrying ONLY what differs (AB1). Satisfies **BF5**.

## Why this exists

New feature code must look like the existing codebase, not like greenfield canon defaults (BF5). The builder must read existing `src/` + the captured `CONVENTION_BASELINE` before writing, so the new component conforms to established naming/layout/idioms. Risk R5: tacit conventions can escape a shallow read — the baseline-map's explicit `conventions` block is the ground truth.

### Invariants served
- **BF5 — convention-conformant.** New code matches existing conventions (from `baseline-map.json` `conventions` + the aPRD `CONVENTION_BASELINE`), not canon defaults.
- **BF7 / P8 — lock = single source of current frozen WHAT.** The aPRD carrying `CONVENTION_BASELINE` is RESOLVED via `aprd.lock.artifact` (read lock → open named file), NOT a hardcoded `aprd.v<N>.frozen.md`. Same canon as Task 07a; `v2` below is the bench EXAMPLE, never the binding.

## DAG position

- **Deps:** Task 10 (BF-MATERIALIZE-ORACLE — frozen slice oracle with regression layer). **Hard gate:** greenfield `IMPLEMENT` SLICE-BUILD part shipped.
- **Downstream:** BF-INTEGRATE (12).
- **Sentinel:** golden slice `build-record.json` — new code convention-conformant (matches the baseline `conventions`), contract layer green.

## EMBEDDED CANON

**Caveman block — already present in IMPLEMENT; leave verbatim.**

**Anti-bloat:** AB1 (delta = only differences), AB2, AB7–AB9. **Dual-mode overlay pattern:** role runs `mode: skeleton-build|slice-build` off ONE shared `## Rules` + per-mode deltas. Add the feature-add convention delta to the slice-build part; class dispatched by playbook (`build_depth: per-slice-no-scaffold`; `aprd_extension` includes `CONVENTION_BASELINE`).

## Current state — `prompts/04-build/IMPLEMENT.md` (greenfield, slice-build mode)

**Role:** builder, Phase 4 role 3/8. Implement ONE component against its FROZEN oracle: only LLD (internals behind a fixed seam), honor the ADR frame + INV, mock unbuilt seams, make its CONTRACT tests green. You make a pre-authored immutable oracle green — ZERO acceptance authority; needing to edit a test = ESCAPE with diagnosis (B1/B4/B5).

**Shared Rules (spine):** (1) make oracle green, author nothing about "done"; (2) NEVER edit a frozen test/oracle/contract/ADR/WHAT — that's ESCAPE; (3) LLD lives here only (framework pick is your LLD behind the contract); (4) code grounded from frame + canon, LLM composes not source (cheapest-source-first); (5) self-heal vs escape — escape on STALL not count, one reflection pass first; verification method executed-or-static-trace; (6) mock unbuilt seams via frozen conftest; (7) commit closes the ID thread, build ONLY your namespace; (8) scaffold first run only; (9) full accounting; (10) stay in lane.

**SLICE-BUILD mode (Part B):** auto-select target slice from `08-rerank.json`; build set = slice's fleshed component(s); NEVER rebuild a `prior_built_components` component; build in isolation against the frozen SLICE oracle (prior-built deps mocked at the contract layer); inherit the frozen skeleton-oracle greens, green ALL the slice's NEW contract tests (H14). Output `.build/slices/<id>/build-record.json`.

**Code conventions (every src file):** header comment `# Component <C*> (<name>) — implements <CT*…> ... LLD owned here (B8); seam is fixed (B3).`; honor the frozen contract's failure_modes.

## THE WORK — add the feature-add delta to the slice-build part of `IMPLEMENT.md`

1. **Frontmatter:** add feature-add inputs — `.aprd/baseline-map.json` (`conventions` = lang/layout/lint/naming; the convention ground truth), the lock-resolved CURRENT frozen version `.aprd/<aprd.lock.artifact>` (read `.aprd/aprd.lock`, open `.aprd/` + its `artifact` value; feature-add → `aprd.v<N>.frozen.md`, here `aprd.v2.frozen.md` — example, NOT hardcoded path; BF7/P8 + 07a canon) for its `CONVENTION_BASELINE` block, and the existing `src/**` (read-only — the convention exemplar). Guard (rewrite freeze-gate, don't add — AB9): lock missing / `status != frozen`, OR named artifact missing/unparseable → HALT. Class dispatched by playbook.
2. **Shared `## Rules`:** keep verbatim. Rule 4 ("code grounded from frame + canon, cheapest-source-first") already names cheapest-source-first — generalize the SHARED source order so for feature-add the cheapest source is EXISTING code + `CONVENTION_BASELINE` BEFORE canon (state the corpus in the delta, AB1).
3. **Add a `### feature-add delta (slice-build)` block under Part B:**
   - **Ground from existing code FIRST (BF5, cheapest-source-first).** Before writing, read the existing `src/` modules the new component sits beside + the `baseline-map.json` `conventions` + the aPRD `CONVENTION_BASELINE`. New code matches THOSE (naming, layout, idioms, error handling, framework usage) — NOT greenfield canon defaults. A canon default that contradicts a captured convention → the convention wins (it's the baseline truth).
   - **Conform, don't reformat.** Match existing conventions for the new code; never reformat or restyle existing baseline files to match canon (that's a baseline mutation, BF1) — touch only the new component's namespace.
   - **MODE=slice, no scaffold.** Harness + `src/` package already exist (playbook `build_depth: per-slice-no-scaffold`). Do NOT lay scaffold or a new `pyproject.toml`.
   - **Convention drift is a CRITIQUE-flaggable defect (BF5).** New code diverging from the captured convention without cause = drift → re-author, never ship.
4. **Output schema:** slice `build-record.json` adds `class:"feature-add"`, `convention_baseline_ref`, and per build_unit a `conforms_to_conventions: true` flag (with the conventions checked). Keep the rest of the slice build-record shape.
5. **Task steps:** add a feature-add branch to Part B's steps: after auto-selecting the slice + component, READ existing neighbor code + `conventions` + `CONVENTION_BASELINE` FIRST → LLD + write code conforming to them → green the slice's NEW contract tests → record `conforms_to_conventions`. Keep slice-build steps intact.

## Lane / what NOT to do

- Don't reformat/restyle/edit existing baseline `src/` files (BF1 — new namespace only).
- Don't apply a canon default that contradicts a captured convention (BF5 — convention wins).
- Don't edit a frozen test/oracle (ESCAPE per shared Rule 2).
- Don't lay scaffold (harness exists).

## Verify (both-directions)

- **Known-good:** feature-add slice → new component code conforms to baseline `conventions`, contract layer green, `conforms_to_conventions: true`. PASS.
- **Planted defect — convention drift:** new code using canon-default naming/layout that contradicts the captured convention → CRITIQUE flags → MUST FAIL (BF5).
- **Planted defect — baseline reformat:** an existing baseline file restyled → MUST FAIL (BF1).
- **Planted defect — stale-version walk:** a copy that ignores `aprd.lock.artifact` and hardcodes a fixed `aprd.v<N>.frozen.md` → reads the wrong version's `CONVENTION_BASELINE` → MUST FAIL (BF7/P8; the 07a defect).

## DONE WHEN

- `IMPLEMENT.md` slice-build part carries a feature-add convention delta (shared/slice-build Rules substance untouched).
- Frozen-WHAT RESOLVED via `aprd.lock.artifact` (no hardcoded version path); freeze-gate guard verifies the named artifact exists (BF7/P8 + 07a canon).
- Golden feature-add slice `build-record.json` shows convention-conformant new code, contract layer green.
- Both-directions check holds (incl. stale-version-walk FAIL).

## COMPLETION (2026-06-10)

### What changed — `prompts/04-build/IMPLEMENT.md` (slice-build / Part B; shared + slice-build Rules SUBSTANCE untouched, AB1)
1. **Frontmatter inputs** — added `# — slice-build feature-add` block: `.aprd/<aprd.lock.artifact>` (frozen-WHAT RESOLVED via lock → CURRENT version carrying `CLASS_EXTENSION`/`CONVENTION_BASELINE`; NEVER hardcode `aprd.v<N>`; BF7/P8 + 07a canon), `.aprd/baseline-map.json` (`conventions` = ground truth, `integration_seams`), `src/freelancer_app/**` (READ-ONLY convention exemplar — read neighbor code first, never reformat; BF1/BF5).
2. **Freeze-gate guard REWRITTEN, not added (AB9)** — shared escape now also HALTs when (feature-add) `aprd.lock` names an artifact missing/unparseable (version-mismatch impossible by construction — only the lock-named file opened). Added 2 feature-add slice-build guards: missing baseline-map / no `CLASS_EXTENSION`/`CONVENTION_BASELINE` → HALT (BF5); greening a test by reformatting/editing an existing baseline `src/` file → ESCAPE → Phase 2/3 (BF1).
3. **Shared Rule 4 generalized (cheapest-source-first, class-aware)** — CLASS sets the cheapest grounding source walked BEFORE canon: greenfield → ADR frame + canon; **feature-add → EXISTING code + `CONVENTION_BASELINE` first** (corpus stated in the delta, AB1). Canon default contradicting a captured baseline truth → baseline wins. Greenfield substance preserved (ADR-0002..0005, INV6 named verbatim).
4. **`### feature-add delta (slice-build)`** block (5 rules): lock-resolve frozen-WHAT (BF7/P8); ground from existing code FIRST (BF5, Risk R5 — explicit `conventions` block is ground truth); conform-don't-reformat (BF1); MODE=slice, no scaffold; convention drift = CRITIQUE-flaggable defect → re-author (`conforms_to_conventions:true`).
5. **Task-steps feature-add branch** — step 0a: resolve lock → read `CONVENTION_BASELINE` + `conventions` + READ neighbor `src/` first; step 5: write code CONFORMING to captured conventions (convention wins on conflict), new namespace only; step 7: emit `class:"feature-add"` + `convention_baseline_ref` + per build_unit `conforms_to_conventions`. Greenfield steps intact.
6. **Feature-add schema delta** — `class:"feature-add"`, resolved `aprd_ref`/`aprd_version`, `convention_baseline_ref`, per build_unit `conforms_to_conventions:true` + `conventions_checked[]` + `baseline_files_edited:false`.
7. **Stop condition** — feature-add line: convention-conformant new code, baseline untouched, `class:"feature-add"` + `convention_baseline_ref`.

### Golden sentinel
`_fixtures/brownfield-feature/.build/slices/S5/build-record.json`: target slice S5 (Tag a time entry with a label), `class:"feature-add"`, `aprd_ref:.aprd/aprd.v2.frozen.md` (lock-RESOLVED, not hardcoded), `convention_baseline_ref`, build_unit C4 Time Logging (`freelancer_app.time_logging`), additive label feature (CT2 label extension A14, traces R11/R13), C1 mocked, `conforms_to_conventions:true` + `conventions_checked:[lang,layout,lint,naming]` + `baseline_files_edited:false`, contract layer green (static-trace; no runtime in bench). Valid JSON.

### Verify — both-directions (prompt now enforces all 4)
- **Known-good** — feature-add S5 → new C4 label code conforms to baseline `conventions` (snake_case `time_entry_label.py` additive file, error-propagation idiom), contract layer green, `conforms_to_conventions:true`. PASS (golden).
- **Planted: convention drift** — new code using canon-default naming/layout contradicting captured convention → CRITIQUE flags (delta Rule 5 + `conforms_to_conventions` field). MUST FAIL (BF5).
- **Planted: baseline reformat** — an existing baseline `src/` file restyled → baseline-mutation guard (delta Rule 3 + `baseline_files_edited` field). MUST FAIL (BF1).
- **Planted: stale-version walk** — copy ignoring `aprd.lock.artifact`, hardcoding `aprd.v<N>.frozen.md` → reads wrong version's `CONVENTION_BASELINE` → rewritten freeze-gate guard (delta Rule 1). MUST FAIL/HALT (BF7/P8; the 07a defect).

> Note: bench `_fixtures/brownfield-feature` is manifest-only (`.aprd`/`.roadmap` + `.build/slices/S5/oracle/` + this golden `build-record.json`); full clean-room bench assembly (skeleton/S4 suites + S5 test `.py` files + build-plan the run executes against) = Task 14 BF-FIXTURE-ORACLE.
