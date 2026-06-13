---
id: ADR-0038
title: MCP driver loop — invert ADP control into server; model fills judgment holes only
status: Draft
date: 2026-06-13
class: self-host
scope: global
mode: architecture
source: operator-directed
supersedes: null
superseded_by: null
cr: "CR-023"
---

## Decision

- **D38 — Invert ADP control into "ADP Powers" MCP server; model = hole-filler only (CR-023).**
  Context: `_orchestrator.md` STEP 0–6 = LLM-executed prose, loaded every session. One IMPLEMENT step ingests: orchestrator + io-manifest + 48 schemas + ~17 whole input files = ~60–80k tokens. Model carries control-loop logic, frontier derivation, branch enforcement, gate sequencing — all deterministic, none requiring judgment. Token floor immovable while LLM drives.

  **Decision:** Bake STEP 0–6 into an "ADP Powers" MCP server (`adp-server/`). Server drives the loop in code; model called only to fill judgment holes. Existing spine modules (`tools/det/*`, `tools/io/resolve.mjs`, `tools/det/emit/*`) become MCP tool bodies UNCHANGED — P3 engine-invariant holds. Net-new = driver loop (`adp-server/driver.js`) + MCP tool surface wrapping existing modules.

  **Tool surface (`adp-server/tools/index.js`):**

  | Tool | Wraps | Returns |
  |---|---|---|
  | `adp_status` | STEP 0 sentinel scan + frontier derive | frontier tally + next role |
  | `adp_next` | STEP 0–2 + resolve + prefill | step packet: `{role, state, judgment_prose, inputs[], shell, holes[], output_path, schemaId}` |
  | `adp_emit` | `tools/det/emit/*` | whole Tier-1 artifact, validated — no model call |
  | `adp_submit` | prefill splice + validate + lint + value-check | gate verdict + route |
  | `adp_promote` | STEP 6 atomic move + cleanup | new frontier |
  | `adp_branch` | STEP 0.0/0.1/0.1b (branch enforce, reconcile, ledger-prune) | branch action / HALT |
  | `adp_guard` | `escapes:` predicate eval over disk | tripped? + which guard |
  | `adp_verdict` / `_route` / `_sequence` / `_idgen` / `_coverage` | `tools/det/*` as-is | decision only |

  **Leaks closed (from `_self-host/00-analysis.md` §2.1):**
  - L1 (control loop STEP 0–6 prose) → driver code
  - L2 (frontier derivation: sentinel scan, schema-validate, class-discriminator) → `adp_status` / `adp_next`
  - L3 (branch enforce cases A–E, auto-reconcile, ledger-prune) → `adp_branch`
  - L9 (gate-verdict sequencing Layer1→Layer2→Layer3, short-circuit) → `adp_submit`

  **Per-step model context:** Before = ~60–80k (orchestrator + manifest + schemas + whole input files). After = ~6–8k (driver zero, judgment prose ~1k, projected slices ~3–5k, prefilled shell ~1k). Drop ~10×; fits 32k cap on either model tier.

  **Tradeoffs considered:**
  - *MCP inversion — CHOSEN.* Spine modules unchanged (P3). Context drops ~10× per step. Both loops (`/evolve` + `/deliver`) benefit — driver is command-agnostic (D35). Idempotency preserved: driver reads disk, resume-safe (D20). Determinism guaranteed: same disk → same frontier → same packet.
  - *Status quo — REJECTED.* Token floor fixed at ~60–80k while LLM drives; no technique removes it. 32k cap target unreachable. Accumulates with each new role added.

  **Consequences:** New `adp-server/` directory (`driver.js` + `tools/index.js`). Existing spine selftests (`graph-lint.selftest.mjs`, `resolve.selftest.mjs`, `tools/det/*.selftest.mjs`) unchanged — server wraps, not reimplements. `_orchestrator.md` thins after server proven (STEP 0–6 prose replaced by `adp_next` / `adp_submit` tool calls). CR-024 (context projector, closes L7) + CR-025 (tier router, closes Claude-token spend) plug into this server. `adp_next` becomes the single assembly point — CR-024 extends it with projection without touching other tools. adr-index.json: ADR-0038 entry added; `adr_counts.rendered` → 38. adr.lock → v18.

  **Reopen if:** MCP host incompatibility forces spine module fork (= abstraction leak — fix spine instead, per P3); or driver proves non-idempotent on resume (disk-derived design makes this unlikely); or tool surface granularity wrong (merge/split tools without changing spine modules).
