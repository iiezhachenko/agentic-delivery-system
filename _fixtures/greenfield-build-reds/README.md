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
