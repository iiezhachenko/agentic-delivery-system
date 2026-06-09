# greenfield-build-reds — DIAGNOSE red-scenario goldens

DIAGNOSE (Phase 4 role 5/8) is a **failure-only adjudicator** — it runs only on a verification RED. The clean chain (`greenfield-clean`) produces no red, so DIAGNOSE's inputs are red scenarios that live HERE as overlays on the clean frozen baseline.

## How to seed a scenario into a bench
1. Copy the clean frozen baseline: `.aprd/ .adr/ .hld/ .build/ src/` from `_fixtures/greenfield-clean/`.
2. Overlay the scenario's blocked record onto `.build/skeleton/` (rename to `build-record.json` or `integration-record.json`).
3. For `escape-contract`, also overlay `contracts.planted-async-CT1.json` → `.hld/skeleton/contracts.json` (the genuine defect: CT1 flipped to `kind:async_event`, contradicting INV6 single-server-synchronous; `kind_distribution` kept consistent).
4. Run DIAGNOSE. It writes `.build/skeleton/diagnosis.json`.

## Scenario → expected verdict (the regression oracle)
| scenario | producer record | the red | expected verdict | classification | route |
|---|---|---|---|---|---|
| `misread-self-heal` | IMPLEMENT build-record (blocked, C1) | provisional escape `contract→P3`, but CT1 ("create-or-update, return non-None") is SATISFIABLE — a misread | **self-heal** | my-code | back to IMPLEMENT |
| `progress-self-heal` | IMPLEMENT build-record (blocked, C2) | provisional escape on raw count=3, but `attempts[]` show signature changing + passes 0→1→2 | **self-heal** | my-code | back to IMPLEMENT |
| `flaky-quarantine` | INTEGRATE integration-record (blocked, F1) | provisional escape `missing-foundation→P1`, but the red is test-order/state-leak flaky | **flaky-quarantine** | null | quarantine + fix harness (NOT P1 — a harness gap is not a missing foundation) |
| `escape-contract` | INTEGRATE integration-record (blocked, F1) + planted async CT1 | provisional escape `my-code→IMPLEMENT`, but CT1 `kind:async_event` genuinely contradicts INV6 | **escape** | contract (MIS-ROUTE CORRECTED) | Phase 3, routable diagnosis naming `contracts.json#CT1` |

`escape-contract/diagnosis.golden.json` = the validated golden output for the load-bearing escape path (routable diagnosis + mis-route correction). The other three goldens' load-bearing assertion is the verdict+classification in the table above (re-run + check).

Validated 2026-06-07: isolated test 4/4 (fresh verifier PASS), windowed e2e PASS (no-op on golden green records; producer's exact blocked schema with `attempts[]` absent → `basis:producer-asserted`).

## Slice-build mode scenario (S4) — `.build/slices/S4/`

DIAGNOSE slice-build (Part B) adjudicates a SLICE red against the slice oracle + slice contracts + the INHERITED frozen skeleton, adding the **skeleton-fidelity** dimension (H14): a slice red whose fix demands editing the frozen skeleton is NOT slice-local → escape at the shared baseline, never reshape it. Seeding:
1. Copy the clean frozen baseline (`.aprd/ .adr/ .hld/ .build/ src/ .roadmap/`) from `_fixtures/greenfield-clean/`.
2. Overlay `.build/slices/S4/integration-record.blocked.json` → `.build/slices/S4/integration-record.json` (the slice red: INTEGRATE blocked on F4, provisional `my-code-wiring → self-heal/INTEGRATE`).
3. Overlay `.build/slices/S4/contracts.planted-async-CT9.json` → `.hld/slices/S4/contracts.json` (the genuine defect: slice contract CT9 flipped to `kind:async_event`, contradicting INV6 + ADR-0004 MPA/SSR; only CT9 changed).
4. Run DIAGNOSE → writes `.build/slices/S4/diagnosis.json`.

| scenario | producer record | the red | expected verdict | classification | route | skeleton-fidelity |
|---|---|---|---|---|---|---|
| `S4 slice escape-contract` | INTEGRATE slice integration-record (blocked, F4) + planted async CT9 | provisional `my-code-wiring→self-heal`, but slice CT9 `kind:async_event` genuinely contradicts INV6 + ADR-0004 | **escape** | contract (MIS-CLASS CORRECTED) | Phase 3, routable diagnosis naming `.hld/slices/S4/contracts.json#CT9` | **not breached** (defect is the slice seam, frozen skeleton untouched — slice-local re-derive, no ripple) |

`.build/slices/S4/diagnosis.json` = the validated golden (sentinel for P-DIAGNOSE-SLICE) — the load-bearing slice escape path: slice-local contract escape + skeleton-fidelity discrimination (breach=false). It proves the slice-build mode reads slice paths, routes a slice-contract defect to Phase 3 naming the SLICE artifact, and confirms the inherited frozen skeleton needs no change.
