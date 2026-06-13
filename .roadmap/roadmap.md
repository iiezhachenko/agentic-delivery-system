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
| W31i-T01..T17 | Role thinning Phase 0 (aPRD) — 17 atomic increments, one per `prompts/00-aprd/*` | CR-026 | W31d |
| W31j-T01..T08 | Role thinning Phase 1 (Roadmap) — 8 atomic increments, one per `prompts/01-roadmap/*` | CR-026 | W31i-T17 |
| W31k-T01..T07 | Role thinning Phase 2 (ADR) — 7 atomic increments, one per `prompts/02-adr/*` | CR-026 | W31j-T08 |
| W31l-T01..T10 | Role thinning Phase 3 (HLD) — 10 atomic increments, one per `prompts/03-hld/*` | CR-026 | W31k-T07 |
| W31m-T01..T10 | Role thinning Phase 4 (Build) — 10 atomic increments, one per `prompts/04-build/*` | CR-026 | W31l-T10 |

All CR-026 thinning is now fully atomic: **52 increments** (17+8+7+10+10), positions 59–110 in `08-rerank.json`. Each is its own frontier — own `done_sentinel` + `done_discriminator` (incl ECONOMY-AUDIT clean) + 3-attempt budget + lint/economy/parity verify; promotes independently. Frontier = first entry whose `done_sentinel` absent / schema-invalid / `done_discriminator` fails on disk.

## Operator gate ruling — W31i economy clean (2026-06-13)

Prior run thinned all 17 Phase-0 prompts to scratch. Layer-2 ECONOMY-AUDIT blocked CLASSIFIER.md (8 issues: I1-I8). Operator decision at gate:

**Full clean, decomposed into atomic tasks.**
- Economy audit = absolute. Fix ALL issues — thinning-introduced regression (I4: threshold starvation) AND pre-existing prose debt (I1-I3, I5-I8) — and same issue-classes across all 17 Phase-0 prompts.
- Do NOT carve pre-existing debt as out-of-scope.
- Decomposed: one prompt per atomic task, own 3-attempt budget + lint + economy + parity verify. Promote per atomic unit.

### Atomic task breakdown — W31i (Phase-0, 17 prompts) — PROMOTED to ledger `08-rerank.json` (roadmap_version 59)

Each row below is now a first-class ledger increment (W31i-T01..T17, positions 59–75), executed as its own frontier with own done_sentinel + done_discriminator + 3-attempt budget + lint/economy/parity verify. Promote per increment; W31i complete iff all 17 sentinels valid.

| Task | Prompt | Key issues |
|---|---|---|
| W31i-T01 | CLASSIFIER.md | I1-I8 (role identity, threshold starvation, ambiguous compound/confidence wording, motivational phrases) |
| W31i-T02 | ADOPT.md | TBD (scan after T01 passes) |
| W31i-T03 | AUDIT-PROMOTE.md | TBD |
| W31i-T04 | AUDIT-REPORT.md | TBD |
| W31i-T05 | AUDIT-RUN.md | TBD |
| W31i-T06 | BASELINE-MAP.md | TBD |
| W31i-T07 | BUGFIX-LOCALIZE.md | TBD |
| W31i-T08 | CRITIQUE.md | TBD |
| W31i-T09 | EXTRACT-RULES.md | TBD |
| W31i-T10 | EXTRACT.md | TBD |
| W31i-T11 | GAP-DETECT.md | TBD |
| W31i-T12 | LENS-DEFINE.md | TBD |
| W31i-T13 | QUESTION-GEN.md | TBD |
| W31i-T14 | RECONCILE.md | TBD |
| W31i-T15 | SYNTHESIZE-INCREMENT.md | TBD |
| W31i-T16 | SYNTHESIZE.md | TBD |
| W31i-T17 | VERIFY.md | TBD |

W31i done (sentinel valid) only when ALL 17 tasks pass lint + economy + parity. W31i `thinned: CR-026` marker in CLASSIFIER.md is the done discriminator (per `_playbooks/refactor.md`).

## Fix record — D39 gate deviation (2026-06-13, W31i-T10)

**Violation:** STEP 5 gate for W31i-T10 (EXTRACT.md) mixed build-time steps (`head`, `node -e`, direct `node tools/det/gap-derive.mjs`, direct `adp-server/tools/index.js` import) into the operator gate. D39 forbids these as acceptance proof.

**Root cause:** `prompts/_orchestrator.md` STEP 5 said "present the verify result" without constraining gate format for D39. `_playbooks/mcp-modernize.md` §done-discriminator-4 correctly says "Operator runs demo (D39)" but STEP 5 carried no enforcement text preventing build-time step inclusion.

**Fix applied:** added D39 gate format constraint to STEP 5 in `prompts/_orchestrator.md` — labels build-time evidence as internal only, mandates operator gate = `mcp__adp__*` native calls from fresh session only, both directions as native MCP calls, no shell commands in gate block.

**Affected file:** `/workspace/prompts/_orchestrator.md` STEP 5.

## Fix record — D39 native-MCP failure (2026-06-13, W31i-T11 GAP-DETECT demo)

**Failure:** D39 acceptance demo from fresh session — both `mcp__adp__adp_derive` calls returned `{output_path: null}`. Operator expected `gaps[0].id=="G1"`, `disposition=="ask"`, `gap_counts.architecture==1`. Got null. Demo rejected.

**Root causes (two):**

**RC-1 (gate instruction defect):** demo gate instructions issued to operator did NOT include `output_path` in `adp_derive` arguments. Without it, server derives but returns `{output_path: null}` and writes nothing. Operator faithfully executed what was given; defect was in the gate block, not the operator.

**RC-2 (API design defect):** `adp_derive` return value omitted the derived artifact — returned only `{output_path, needs_confirmation, escape}`. Even with correct gate instructions, the operator could not confirm `gaps[0].id`, `disposition`, `gap_counts` from MCP response alone (required inspecting the written file separately). API made content verification opaque.

**Why build-loop missed this:** both-directions check for W31i-T11 exercised `gap-derive.mjs` CLI directly (spawn) and `adp-server/tools/index.js` import, NOT the server path. Neither of those paths exposed RC-2 because direct function calls return the full artifact — only the MCP response shape was broken. The self-test was testing the wrong entrypoint.

**Fixes applied:**

1. `adp-server/tools/index.js` `adp_derive`: return includes `artifact` field — `{output_path, artifact, needs_confirmation, escape}`. Artifact always in response regardless of `output_path`. Callers unaffected (they checked `output_path` and `needs_confirmation`; `artifact` is additive).

2. `adp-server/gap-derive-mcp.selftest.mjs` (new): gap-derive both-directions test through `adp-server/tools/index.js` (same import the server uses). Direction A: architecture gap → `gaps[0].id=G1`, `disposition=ask`, `gap_counts.architecture=1`. Direction B: planted cosmetic blast_radius → `disposition=assume`, `gap_counts.architecture=0`. Asserts `artifact` present in response (RC-2 regression guard). 15 assertions, both directions PASS.

3. `adp-server/classifier-mcp.selftest.mjs`: added `artifact != null` assertions to both good and defect `adp_derive` calls. 30 assertions, PASS.

**Remaining:** W31i-T11 done-discriminator requires operator runs demo (D39). Gate now corrected — see below.

## Fix record — D39 gate deviation RC-3b (2026-06-13, W31i-T11 GAP-DETECT demo round 2)

**Violation:** corrected gate still deviated from CLAUDE.md canon: "Artifacts land on disk. Every prompt instructs agent to WRITE output to spec-defined path. Deliverable = file on disk, not chat reply." Gate passed `output_path: null` for Direction B (defect direction), asserting `output_path == null` with rationale "content verified from response." This exercises a code path production NEVER uses — write/splice path unproven.

**Fix applied:** `adp-server/gap-derive-mcp.selftest.mjs` Direction B now passes `output_path: "adp-server/_regression/out/defect.04-gaps.json"` and asserts: (1) `result.output_path` set, (2) `result.artifact` present, (3) `disposition=="assume"`, (4) `gap_counts.cosmetic==1`, (5) file exists on disk at that path, (6) written file matches response artifact. 17 assertions total, both directions PASS. Write/splice path verified for BOTH directions.

**Confirmed write/splice output:**
- `adp-server/_regression/out/good.04-gaps.json`: `gaps[0].id=G1`, `disposition=ask`, `gap_counts.architecture=1`
- `adp-server/_regression/out/defect.04-gaps.json`: `gaps[0].disposition=assume`, `gap_counts.cosmetic=1`

**Corrected D39 gate issued below (round 3).**

## Fix record — D39 native-MCP failure round 3 + RC-3c absolute-path write bug (2026-06-13, W31i-T11)

**Three hard contradictions diagnosed (operator fresh-session round 3 returned `{output_path}` only, no `artifact`, files missing at `/tmp/`).**

**RC-1 (no artifact in response):** `adp-server/tools/index.js` committed HEAD (c276397) line 108 returns `{output_path, needs_confirmation, escape}` — NO `artifact` field. The RC-2 artifact fix + `deriveGaps` import + `04-gaps` DERIVERS registration existed only in the working tree (uncommitted). Claude Code spawns `node adp-server/server.mjs` from working-tree files at session start. Round 3 ran BEFORE the working-tree edits were saved, or the fix was written post-gate-issue but pre-commit — in either case the operator's fresh session loaded the committed (pre-fix) server. **Fix:** commit the working-tree changes (this commit).

**RC-3c (absolute output_path write failure — new):** `path.join(root, output_path)` where `root="."` and `output_path="/tmp/..."` produces `"tmp/adp-demo-04-gaps-good.json"` (relative, strips leading slash) — standard Node.js `path.join` behavior. Server writes to `<server-cwd>/tmp/...`, not `/tmp/...`. Operator's `cat /tmp/...` found nothing. **Fix:** `adp_derive` now uses `path.isAbsolute(output_path) ? output_path : path.join(root, output_path)`. Same fix applied to `adp_submit` for `artifactPath`.

**RC-3d (schema enum misconception — prior narration error):** Rounds 1-2 narration stated `blast_radius` enum `architecture|scope|cosmetic` with `gap_counts` keyed architecture/scope/cosmetic. Round-3 narration CONTRADICTED this, claiming `architecture|interface|data|behavior`. Correct enum per `schemas/00-aprd/04-gaps.schema.json` line 26: `"enum": ["architecture","scope","cosmetic"]`. `gap_counts` required keys: `architecture`, `scope`, `cosmetic`, `total`. This is the disk schema verbatim — no `interface/data/behavior`. Round-3 narration was wrong; schema was always correct.

**Verified through native import path (simulates registered server):**
- Direction A (good, architecture gap): response has `artifact`, `artifact.gaps[0].id=="G1"`, `disposition=="ask"`, `gap_counts.architecture==1`; `/tmp/adp-demo-04-gaps-good.json` written, readable.
- Direction B (defect, cosmetic blast_radius planted): `artifact.gaps[0].disposition=="assume"`, `gap_counts.cosmetic==1`, `gap_counts.architecture==0`; `/tmp/adp-demo-04-gaps-defect.json` written, readable.

**Gate round 4 issued below.**
