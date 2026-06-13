# Audit Report — Agentic Delivery Pipeline

## Executive Summary

- **Project:** agentic-delivery-pipeline
- **Scope:** `prompts/**/*.md` excluding `_playbooks/`, `_orchestrator*.md`, `_step-runner.md`, `_economy-audit.md`
- **Files assessed:** 43 role prompt files
- **Lenses:** 1 (SRP — Single Responsibility Principle)
- **Criteria:** 4 (LC1–LC4)
- **Total assessments:** 172 (43 files × 4 criteria)
- **Findings:** 6 block, 7 warn, 0 info
- **Pass:** 159

## Per-Lens Results

| lens_id | name | block | warn | info | pass |
|---|---|---|---|---|---|
| L1 | SRP (Single Responsibility Principle) | 6 | 7 | 0 | 159 |

## Findings

### Block

**Finding 1**
- File: `prompts/00-aprd/AUDIT-REPORT.md`
- Criterion: LC1 — 2+ unrelated output paths
- Finding: Declares two unrelated output paths: `.audit/report.md` (operator-facing audit report) and `.aprd/00-raw-request.md` (Phase-0 ADP intake artifact). Different downstream consumers, different schemas, different phases. Separable functions: produce audit report vs generate ADP intake artifact.
- Remediation: Split into two roles. One writes `.audit/report.md` (audit presentation). One writes `.aprd/00-raw-request.md` (intake promotion). Or fold the intake write into a separate AUDIT-PROMOTE role.

**Finding 2**
- File: `prompts/00-aprd/DIAGNOSE.md`
- Criterion: LC1 — 2+ unrelated output paths
- Finding: Three output paths across modes: `.build/skeleton/diagnosis.json`, `.build/slices/<id>/diagnosis.json` (build-red adjudication), and `.aprd/diagnosis.json` (Phase-0 bugfix intake). Third output is in `.aprd/` namespace serving Phase-0 intake — fundamentally different function from build-red self-heal-vs-escape adjudication.
- Remediation: Split BUGFIX-LOCALIZE (Part C) into a separate role in phase 00-aprd. Keep DIAGNOSE in 04-build for build-red adjudication only (Parts A + B).

**Finding 3**
- File: `prompts/00-aprd/DIAGNOSE.md`
- Criterion: LC2 — phase boundary crossing
- Finding: Prompt declared in phase 04-build. Part C (BUGFIX-LOCALIZE) performs Phase-0 intake work: reads change-requests, reads frozen aprd.frozen.md, reproduces/localizes/root-causes a defect, writes `.aprd/diagnosis.json`. Phase-0 intake operations inside a Phase-4-labeled prompt.
- Remediation: Move BUGFIX-LOCALIZE to a separate prompt in 00-aprd phase. DIAGNOSE (04-build) handles only build-red adjudication.

**Finding 4**
- File: `prompts/01-roadmap/SEQUENCE.md`
- Criterion: LC1 — 2+ unrelated output paths
- Finding: Two unrelated output paths: `.roadmap/05-sequence.json` (proposed sequencing artifact consumed by SKELETON-IDENTIFY/FOUNDATION-CUT/SEQUENCE-REVIEW) and `.roadmap/08-rerank.json` (living roadmap consumed by slice build loop and RE-RANK). Greenfield path writes 05-sequence.json only; feature-add path writes 08-rerank.json only. Two separable output concerns serving different downstream stages.
- Remediation: Restrict SEQUENCE to outputting only 05-sequence.json. Split feature-add output into RE-RANK or a new SEQUENCE-FEATURE-ADD role producing 08-rerank.json.

**Finding 5**
- File: `prompts/03-hld/DERIVE-TESTS.md`
- Criterion: LC1 — 2+ unrelated output paths in skeleton pass
- Finding: Skeleton pass declares two distinct unrelated output paths: `.hld/skeleton/test-specs.json` AND `.hld/skeleton/build-dag.json`. Unrelated concerns — test oracle specifications vs build dependency graph. Separate discriminators, separate task-step sections, separate consumers (MATERIALIZE-ORACLE uses test-specs; IMPLEMENT uses build-dag).
- Remediation: Extract build-dag emission into a separate role (e.g. DERIVE-BUILD-DAG). DERIVE-TESTS outputs only test-specs.json.

**Finding 6**
- File: `prompts/00-aprd/AUDIT-REPORT.md`
- Criterion: LC3 — 2+ separable responsibilities without clear single primary
- Finding: Role description states two co-equal outputs: 'writes `.audit/report.md` + `.aprd/00-raw-request.md`' — report writing and intake artifact generation listed without single named primary.
- Remediation: Clarify single primary (audit report) with intake artifact as byproduct; or split roles per Finding 1.

### Warn

**Finding 7**
- File: `prompts/00-aprd/DIAGNOSE.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Three modes where bugfix-localize behaves as completely different role (Phase-0 intake: reproduce+localize+root-cause) vs build-red modes (build verification adjudication). Different primary outputs (`.aprd/diagnosis.json` vs `.build/*/diagnosis.json`) and different trigger signals.
- Remediation: Extract BUGFIX-LOCALIZE into separate role. Remaining two modes share same primary function.

**Finding 8**
- File: `prompts/01-roadmap/SEQUENCE.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Greenfield and feature-add branches produce different primary outputs (05-sequence.json vs 08-rerank.json) and omit different pipeline stages. Two branches behave as different roles.
- Remediation: Split into SEQUENCE (greenfield) and SEQUENCE-FEATURE-ADD roles, each with single primary output.

**Finding 9**
- File: `prompts/03-hld/DERIVE-TESTS.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Bugfix pass (Part C) behaves as substantially different role: re-enters existing slice, mints reproduction test + regression layer instead of contract/flow/acceptance specs. Different primary outputs and different trigger signal from skeleton/increment modes.
- Remediation: Extract bugfix pass into separate prompt. DERIVE-TESTS handles skeleton|increment only.

**Finding 10**
- File: `prompts/00-aprd/SYNTHESIZE.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Greenfield branch produces draft (`.aprd/drafts/aprd.v1.md`) requiring CRITIQUE + sign-off gate. Feature-add/bugfix branches produce frozen version directly plus re-sign `aprd.lock`. Different primary outputs; greenfield never writes `aprd.lock`, feature-add/bugfix always write it.
- Remediation: Consider splitting greenfield SYNTHESIZE (draft awaiting CRITIQUE) from SYNTHESIZE-INCREMENT (frozen version bump + lock re-sign). Alternatively accept as designed.

**Finding 11**
- File: `prompts/04-build/IMPLEMENT.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Bugfix branch replaces component-build with minimal in-place edit of existing code at BLAST_RADIUS symbol — opposite behavior to greenfield/feature-add (write new component vs edit existing symbol). Different dispatch signal.
- Remediation: Consider extracting bugfix repair into separate IMPLEMENT-BUGFIX role. Low priority.

**Finding 12**
- File: `prompts/04-build/MATERIALIZE-ORACLE.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Bugfix branch materializes reproduction+regression layers instead of full contract/flow/acceptance oracle; supersedes existing slice oracle. No build-plan dispatch. Substantially different behavior from greenfield/feature-add modes.
- Remediation: Consider extracting bugfix oracle materialization into separate role. Low priority.

**Finding 13**
- File: `prompts/04-build/VERIFY-OUTPUT.md`
- Criterion: LC4 — mode-switching with different primary outputs
- Finding: Bugfix mode runs different verification bar (reproduction red→green + scoped regression) vs full contract/flow/acceptance/class-ext ladder. Different dispatch signal. Behaves as different verification function for bugfix class.
- Remediation: Consider extracting bugfix verification into separate role. Low priority.
