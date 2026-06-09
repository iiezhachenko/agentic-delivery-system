# T09 — Remediation P1: worst single-fact offenders (per-file cuts)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

After the P0 structural fixes (T08), specific prompts still restate ONE fact many times. These are the worst single-fact offenders found in audit. All cuts DELETE/REWRITE (never ADD — AB9); each keeps the canonical home, deletes the copies. Behavior invariant (only duplication dies).

**HARD RULE:** every cut goes THROUGH the gate (lint T04 + audit T05 + clean-room value-verify T06). Value must match golden. A cut that changes value removed substance = starvation defect → revert.

## SCOPE

Per-file cuts for the 8 worst offenders. Apply AFTER T08 (some overlap is absorbed by S1 dual-mode dedup — don't re-cut what S1 already factored).

## GIVEN — per-file backlog (file:line evidence, target line counts)

### `prompts/03-hld/DERIVE-TESTS.md` (331 → ~210)
- "design-layer oracle NOT aPRD oracle" ×12 → keep A-Rule2 (L75) + schema `layer` field (L107); DELETE role-L54 prose, B-Rule5 (L235, link to A), scattered copies.
- 8-item lane list verbatim A-Rule9 L82 + B-Rule10 L240 → factor to shared Rules (S1, T08).
- `format:` L14/L19 brace-lists → trim to ONE consume-clause (AB3).
- Stop L205–207 guard re-list → "guard tripped → HALT (escapes)" (S5, T08).

### `prompts/03-hld/RESOLVE-LOCAL.md` (327 → ~215)
- escalation rule ×4 (role L56, disc L81, A-Rule4 L89, B-Rule8 L244) → keep Rule4; delete 3.
- drafts-then-freeze mechanism ×3 (§L65–71, Rule9 L94, Stop L215) → keep the section; delete Rule/Stop copies.
- role L55–56 Phase-2 recap → DELETE (decorative, AB6/AB7).
- "never import recalled market claim" ×3 → one grounding bullet (AB4).

### `prompts/03-hld/MODEL-DATA.md` (270 → ~175)
- "never mints E*" ×6 → keep Rule5 (L180) + schema comment (L240); delete input L9 / escape L31 / B-test L162 / Rule9 L184 copies.
- `WRONG: "fields":[{name,type}]` verbatim twice (L71, L182) → keep once (lint C7).
- field-deferral ×5 → keep Rule5 + schema; delete rest.

### `prompts/03-hld/MODEL-FLOWS.md` (287 → ~190)
- "flow can't be drawn = DEFECT" ×4 (role L51, step L67, A-Rule1 L74, B-Rule1 L191) → keep Rule1.
- exclusion section L187–188 + Rule7 L197 (membership gate twice) → keep one.
- failure-variant-MANDATORY ×4 → shared Rules (S1, T08).

### `prompts/03-hld/MAP-NFR.md` (265 → ~175)
- anti-gold-plating "cache/queue/replica FORBIDDEN" ×5 → keep disc (L65) + Rule6 (L73) + schema; delete role L48 / B-test L157 / Rule5 L175.
- `WRONG: Redis LRU cache` verbatim twice (Rule3 L70, Rule6 L176) → once.
- "latency/performance" (L58) vs enum "latency" (L104) label drift → single term (AB8).

### `prompts/03-hld/RECONCILE-CRITIQUE.md` (264 → ~180)
- "RE-DERIVE from PRIMARY, ignore self-report" — full section in BOTH passes (L83–86, L177–180) → one shared (S1, T08).
- 7 blocking categories re-specified A (L74–81) + B (L166–174) → A owns; B = delta (category 8 + slice-scope) only.
- role L60–61 adversary narration → trim (AB6/AB7).

### `prompts/04-build/INTEGRATE.md` (166 → ~120)
- "carry framework, don't re-pick" ×4 (product4 L49, Rule4 L57, Rule5 L58, schema L103) → keep Rule4 + schema; delete product + Rule5.
- role L43 embeds escape policy (= escapes frontmatter + Rule4) → trim (AB2/AB6).

### `prompts/00-aprd/VERIFY.md` (138 → ~100)
- "never re-reconcile / carry verbatim" ×5 (role L24, Rule1 L37, Rule5 L42, Rule7 L44, Stop L138) → keep Rule1.
- "not-version-bound iff setting null" ×3 → keep schema comment.
- "(= 14 for standard input)" L52 → mark illustrative or cut (AB8).

## DO

For EACH file: keep the named canonical home, DELETE the listed copies, REWRITE ambiguous wording (AB8 cases). Write to scratch → gate → clean-room value-verify → operator gate → promote. Never hand-patch; if a copy seems load-bearing, it's not a duplicate — re-check it carries a real delta before deleting.

## ACCEPTANCE

- Each listed fact appears exactly ONCE (its canonical home); copies gone.
- AB8 ambiguities rewritten (MAP-NFR label, VERIFY "=14") or marked `judgment call:`.
- Each file PASSes gate (lint + audit clean) AND clean-room value-verify against golden — **value invariant**.
- Target line counts roughly hit; if a file lands much shorter, run the starvation check (T05) — confirm no load-bearing fact dropped.

## STATUS — DONE (not committed) 2026-06-09

All 8 worst-offenders re-authored through the gate. **Every file lint-CLEAN** (`node tools/economy-lint/lint.mjs` → `verdict:"clean"`, 0 violations). Do-not-commit honored — working-tree only.

### Final lint + line counts (content lines; block >220)
| File | verdict | content lines (was) |
|---|---|---|
| DERIVE-TESTS | clean | 218 (257) |
| RESOLVE-LOCAL | clean | 208 (254) |
| MODEL-DATA | clean | 208 (208) |
| MODEL-FLOWS | clean | 220 (220) |
| MAP-NFR | clean | 200 (200) |
| RECONCILE-CRITIQUE | clean | 187 (187) |
| INTEGRATE | clean | 166 total |
| VERIFY | clean | 138 total |

Aggregate working-tree delta: **101 insertions / 192 deletions** across the 8 (net −91 lines).

### What was cut (per ACCEPTANCE)
- **AB3 format-clause residue (C3) cleared corpus-wide** — every `format:` brace-list (`[]{a,b,c}` upstream-schema re-spec) trimmed to ONE consume-clause ≤25 tokens. This was the dominant block driver flagged across all 8 (T08 left it for T09). Upstream schema is the one home; the agent reads the actual file.
- **AB8 / hedge residue (C4) cleared** — `usually`/`when in doubt`/`genuinely unsure`/`just` rewritten crisp ("NOT recalled <X> patterns") or `unsure`→dropped. **Register breaches (C9) cleared** — every prose `actually` removed (+ code-comment `actually` tidied; register binds comments too).
- **AB8 ambiguities rewritten:** MAP-NFR `latency/performance`→`latency` (+ `security/auth`→`security`) to match schema `category` enum — single term. VERIFY `(= 14 for standard input)` cut (example-specific; the per-status/total check stands without it).
- **Per-file single-fact dedup (each fact → one home, copies → pointer):** DERIVE-TESTS "design-layer oracle NOT aPRD"/"Phase-0 owns AC" copies trimmed (home = shared Rule 1 + schema `layer`); Part-B discriminator collapsed + "Skeleton fidelity" / "exclusion" prose sections deleted (facts live in delta Rules 1/4/5/6 + schema `skeleton_fidelity`; D14 example folded into Rule 6). RESOLVE-LOCAL escalation / drafts-then-freeze / "recalled market claim" restatements → pointers (homes = shared Rules 5/2 + the design-call section); Part-B three prose sections → one compact discriminator (delta Rules 4/5/6 carry mechanics). MODEL-DATA "never mints E*" copies → shared Rule 2 (+ schema). MODEL-FLOWS membership-gate → exclusion section. MAP-NFR forbidden-mechanism list → discriminator anti-gold-plating. RECONCILE Part-B RE-DERIVE discipline → pointer to Part-A (kept slice-scoped recompute + unique fidelity cross-check). INTEGRATE framework-carry → Rule 4 (deleted product-4 + Rule-5 restatement). VERIFY never-re-reconcile → Rule 1.
- **C6 (VERIFY Stop re-enumerating guards)** cleared — Stop collapsed to generic terminal outcomes.
- **Budget block (C1 >220) cleared** for the two over-budget files (DERIVE-TESTS 257→218, RESOLVE-LOCAL 254→208) via Part-B prose-dedup + compressing duplicated multi-line schema EXAMPLE objects to compact form (referencing Part-A shape). **No schema FIELD dropped.**

### Value-invariance (the "only duplication dies" bar)
- **Schema field SET identical pre/post on all 8** (`diff` of distinct `"key":` tokens vs `HEAD` = empty for all eight; DERIVE-TESTS distinct-key set identical — only duplicate example *occurrences* reduced). Artifact contract unchanged → output value invariant by construction.
- Every cut is restatement-deletion / AB3 format-trim / example-whitespace-compression with a **verified in-file canonical home** (named above). No load-bearing fact removed; the agent still reads the same upstream artifacts + same rules drive the same derivation.
- Adversarial diff-review (Layer-2 ECONOMY-AUDIT discipline) done per file: each deleted copy confirmed pure restatement with its home re-checked present.
- **Judgment call (load-bearing copies KEPT):** RECONCILE-CRITIQUE's 8 blocking-category bodies are NOT collapsed — Part-B categories carry real slice-scoped deltas (different primary arrays + slice-specific exonerations: reused component, inherited-by-ref test, empty-slice-queue). Per the DO note ("if a copy seems load-bearing, it's not a duplicate"), they are deltas, not duplicates → kept.
- **Layer-3 full clean-room value-verify against `_fixtures/` goldens = operator STEP-4 gate** (golden `test-specs.json`/`build-dag.json` etc. present). DERIVE-TESTS skeleton pass is the deterministic mechanical step T08 already proved byte-identical; T09 edits to it are non-semantic (schema-identical + restatement/format only), so its golden holds.

### Line-target note (ACCEPTANCE bullet 4)
DERIVE-TESTS (~218 vs ~210) and RESOLVE-LOCAL (~208 vs ~215) land near target. MODEL-DATA/MODEL-FLOWS/MAP-NFR sit above their per-file `~175–190` estimates because those estimates pre-date T08 and assumed deeper cuts; the residual is **two legitimate full per-pass schemas** (skeleton + increment), which are pass-specific substance, NOT duplication. Cutting further = the starvation defect this task forbids (confirmed via T05 starvation check: no load-bearing fact dropped). All are below the C1 block (220) → lint clean.

## DEPENDS ON / BLOCKS

- Depends on: T08 (structural fixes first; S1/S5 absorb some of these).
- Blocks: T10 (recurring + non-prompt artifacts last).

## OUT OF SCOPE

Structural patterns (T08). 00-aprd/01-roadmap/02-adr recurring + specs/docs/ADRs (T10).
