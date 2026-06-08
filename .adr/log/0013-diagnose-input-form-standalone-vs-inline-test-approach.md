---
id: ADR-0013
title: DIAGNOSE input form + standalone-vs-inline + test approach
status: Accepted
date: 2026-06-08
class: self-host
scope: global
mode: foundation
source: reasoned
supersedes: null
superseded_by: null
---

## Decision

- **D13 — DIAGNOSE input form + standalone-vs-inline + test approach (RESOLVED 2026-06-07).** Calls made authoring DIAGNOSE (Phase-4 role 5/8). **(1) Standalone = the INDEPENDENT adjudicator (B4-style separation).** IMPLEMENT/INTEGRATE embed an inline self-heal loop + emit a PROVISIONAL `escape{}`; DIAGNOSE is the canonical role the orchestrator routes a blocked record through to confirm-or-overturn — the role that hit the red must not be sole authority on escaping. So DIAGNOSE **re-derives from the frozen inputs; the producer's provisional classification is a HINT, never trusted** (mirrors RECONCILE-CRITIQUE "self-report is not evidence"). **(2) Input = the verifying role's BLOCKED record** (`build-record.json` / `integration-record.json`, status:blocked + `escape{failure_signature,classification,diagnosis,route,attempts?}`) + the frozen oracle/contracts/ADR/aPRD/locks + the built code. NO new producer artifact minted (D7 precedent) — DIAGNOSE reads the producers' EXACT emitted schema. **`attempts[]` (the K-trajectory) is OPTIONAL**: IMPLEMENT/INTEGRATE don't currently emit it, so DIAGNOSE handles absence via `stall_analysis.basis:"producer-asserted"` (still gates on flaky/misread/routable). No retrofit of IMPLEMENT/INTEGRATE. **(3) Output `.build/skeleton/diagnosis.json`** — verdict {self-heal | escape | flaky-quarantine} + confirmed classification + flaky/stall/reflection blocks + (escape) routable_diagnosis / (self-heal) corrected_understanding / (flaky) quarantine. FLAG+route only — never edits code or a frozen artifact. **(4) Failure-only role → test approach.** DIAGNOSE runs only on a RED; the clean chain produces none. Isolated test (PRIMARY) spans the decision space with crafted blocked-record reds + a planted-defect frozen variant (`_fixtures/greenfield-build-reds/`); the windowed e2e validates the real producer interface — the no-op against the golden GREEN records + the producer's exact blocked schema (attempts-absent). Reds are NOT in `greenfield-clean` (would contradict it); they live as overlays in `greenfield-build-reds/`. Reopen to author the SLICE-BUILD mode (D11).
