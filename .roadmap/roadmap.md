# Build Roadmap — MCP ADP Powers Workstream

> Branch: `feature/mcp-adp-powers`. Source: `_self-host/00-analysis.md` + `_self-host/01-8b-offload.md`. CRs: 023-026. Frontier derived from disk (`done_sentinel` scan), never from tracker.

## Prior shipped work (all sentinels present on disk — W1–W30l)
Greenfield delivery pipeline (specs 00–04, 10 builds), bugfix spine W29a–W29j, SRP-refactor W30a–W30l. All 14 entries in archived `08-rerank.json` (roadmap_version 49) show sentinels present. Archived at `.roadmap/archive/2026-06-13-multi-stream/`.

## This workstream — MCP driver loop + context projector + two-tier fleet (W31a–W31m)

Objective: invert ADP control into "ADP Powers" MCP server. Three capability changes:
1. Bake STEP 0–6 prose → code (CR-023). Token win: ~15k removed per step.
2. Context projector: hint→field-selector, projects inputs server-side (CR-024). Token win: ~40–60k → ~3–5k per IMPLEMENT step.
3. Two-tier model fleet: local 8B for gated holes, Claude for judgment (CR-025). ~55% Claude-token cut.
4. Role `.md` thinning: strip server-owned prose, keep judgment only (CR-026). Role ~3k → ~1k.

### Remaining (build in order)

| Wave | Unit | CR | Depends |
|---|---|---|---|
| W31a | ADR-0038 draft | CR-023 | — |
| W31b | ADR-0038 sign | CR-023 | W31a |
| W31c | MCP tool surface scaffold | CR-023 | W31b |
| W31d | MCP driver loop code | CR-023 | W31c |
| W31e | Projector module `tools/io/project.mjs` | CR-024 | W31d |
| W31f | Projector selftest | CR-024 | W31e |
| W31g | Tier router `adp-server/tier-router.js` | CR-025 | W31f |
| W31h | Tier router selftest | CR-025 | W31g |
| W31i | Role thinning Phase 0 (aPRD) | CR-026 | W31d |
| W31j | Role thinning Phase 1 (Roadmap) | CR-026 | W31i |
| W31k | Role thinning Phase 2 (ADR) | CR-026 | W31j |
| W31l | Role thinning Phase 3 (HLD) | CR-026 | W31k |
| W31m | Role thinning Phase 4 (Build) | CR-026 | W31l |

Frontier = first entry in `08-rerank.json` whose `done_sentinel` absent or schema-invalid on disk.
