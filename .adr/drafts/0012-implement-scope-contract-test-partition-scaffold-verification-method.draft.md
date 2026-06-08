---
id: ADR-0012
title: IMPLEMENT scope + contract-test partition + scaffold + verification method
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

- **D12 — IMPLEMENT scope + contract-test partition + scaffold + verification method (RESOLVED 2026-06-07).** Calls made authoring IMPLEMENT (Phase-4 builder). **(1) Scope = ONE component per invocation, auto-selected** (next un-built in build-plan `build_order`, resumable via build-record.json); the manual-sim operator pastes it once per skeleton component (3× for C1/C2/C6). Rationale: faithful to §8/§5.5/B3 + the runtime's per-agent parallel fan-out; the manual sim collapses the orchestrator into repeated pastes. **(2) THE load-bearing partition call — contract tests split PER TEST FUNCTION by system-under-test, NOT per file/provider:** a component's obligations = the frozen tests that DRIVE its module (call+assert) with ITS deps mocked (B3). So one `CT*`'s tests split across units — the provider owns the shape test, the caller owns the failure tests it drives (CT1: shape→C1, failures→C2 [drive oauth_callback, C1 mocked]; CT8 tests→C6 [drive session_gate, C2 mocked]). The oracle.json provider/file grouping is NOT the partition (using it caused module+trace bleed — C1 wrote C2's code + greened R5 tests; killed in isolated test). Build ONLY your namespace `freelancer_app.<snake(name)>`; never write a sibling's module. **(3) Scaffold folded into the first invocation** (package root + `pyproject.toml` pytest pythonpath; minimal — NOT CI/staging/walking-skeleton-on-stubs, those are INTEGRATE/demo). No separate SCAFFOLD prompt (§8 has none; inventory stays 8). **(4) Verification method `executed | static-trace`:** builder runs pytest where a runtime exists; where absent (the manual-sim bench has NO Python), it delivers code + a static trace of each assertion's outcome (`method:static-trace`), authoritative run owed to VERIFY-OUTPUT — a runtime gap is the harness's concern, NOT a missing-foundation escape (fix killed runner variance: one runner escaped to Phase 1 on the missing interpreter). **(5) LLD + framework pick live HERE (B8):** ADR-0002 pins Python; Django|Flask|FastAPI is IMPLEMENT-stage LLD behind the contract; contract-layer modules are framework-agnostic plain Python (WSGI/framework materializes at INTEGRATE). Reopen to author the SLICE-BUILD mode (D11).
