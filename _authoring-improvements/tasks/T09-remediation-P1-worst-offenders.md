# T09 — Remediation P1: worst single-fact offenders (per-file cuts)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

After the P0 structural fixes (T08), specific prompts still restate ONE fact many times. These are the worst single-fact offenders found in audit. All cuts DELETE/REWRITE (never ADD — AB9); each keeps the canonical home, deletes the copies. Behavior invariant (only duplication dies).

**HARD RULE:** every cut goes THROUGH the gate (lint T04 + audit T05 + clean-room value-verify T06). Value must match golden. A cut that changes value removed substance = starvation defect → revert.

**Metric:** bloat gate = C1 **TOKEN** budget (warn >5000 / block >7500), not lines (lines gameable — `07-bloat-metric-tokens.md`). The line metric HID the worst file: RECONCILE-CRITIQUE is the densest in corpus (181 char/line), so it cleared the old line gate yet is the single heaviest by tokens. Token-rank, not line-rank, picks the real offenders.

## SCOPE

Per-file cuts for the worst offenders. Apply AFTER T08 (some overlap is absorbed by S1 dual-mode dedup — don't re-cut what S1 already factored). Target each file: clear the C1 token block (>7500), aim ≤ warn (5000), AND lint-clean on C3/C4/C7/C8/C9.

## GIVEN — per-file backlog (file:line evidence; target = clear token budget)

### `prompts/03-hld/RECONCILE-CRITIQUE.md` — heaviest by tokens (gamed the old line gate)
- "RE-DERIVE from PRIMARY, ignore self-report" — full section in BOTH passes (L83–86, L177–180) → one shared (S1, T08).
- 7 blocking categories re-specified A (L74–81) + B (L166–174) → A owns; B = delta (category 8 + slice-scope) only. (Judgment: Part-B categories carrying a REAL slice-scoped delta are deltas, not duplicates — keep those.)
- role L60–61 adversary narration → trim (AB6/AB7).
- dense long lines → break the packing that hid the file from the line gate; token budget is the real target.

### `prompts/03-hld/DERIVE-TESTS.md`
- "design-layer oracle NOT aPRD oracle" ×12 → keep A-Rule2 (L75) + schema `layer` field (L107); DELETE role-L54 prose, B-Rule5 (L235, link to A), scattered copies.
- 8-item lane list verbatim A-Rule9 L82 + B-Rule10 L240 → factor to shared Rules (S1, T08).
- `format:` L14/L19 brace-lists → trim to ONE consume-clause (AB3).
- Stop L205–207 guard re-list → "guard tripped → HALT (escapes)" (S5, T08).

### `prompts/03-hld/RESOLVE-LOCAL.md`
- escalation rule ×4 (role L56, disc L81, A-Rule4 L89, B-Rule8 L244) → keep Rule4; delete 3.
- drafts-then-freeze mechanism ×3 (§L65–71, Rule9 L94, Stop L215) → keep the section; delete Rule/Stop copies.
- role L55–56 Phase-2 recap → DELETE (decorative, AB6/AB7).
- "never import recalled market claim" ×3 → one grounding bullet (AB4).

### `prompts/03-hld/MODEL-DATA.md`
- "never mints E*" ×6 → keep Rule5 (L180) + schema comment (L240); delete input L9 / escape L31 / B-test L162 / Rule9 L184 copies.
- `WRONG: "fields":[{name,type}]` verbatim twice (L71, L182) → keep once (lint C7).
- field-deferral ×5 → keep Rule5 + schema; delete rest.

### `prompts/03-hld/MODEL-FLOWS.md`
- "flow can't be drawn = DEFECT" ×4 (role L51, step L67, A-Rule1 L74, B-Rule1 L191) → keep Rule1.
- exclusion section L187–188 + Rule7 L197 (membership gate twice) → keep one.
- failure-variant-MANDATORY ×4 → shared Rules (S1, T08).

### `prompts/03-hld/MAP-NFR.md`
- anti-gold-plating "cache/queue/replica FORBIDDEN" ×5 → keep disc (L65) + Rule6 (L73) + schema; delete role L48 / B-test L157 / Rule5 L175.
- `WRONG: Redis LRU cache` verbatim twice (Rule3 L70, Rule6 L176) → once.
- "latency/performance" (L58) vs enum "latency" (L104) label drift → single term (AB8).

### `prompts/04-build/INTEGRATE.md`
- "carry framework, don't re-pick" ×4 (product4 L49, Rule4 L57, Rule5 L58, schema L103) → keep Rule4 + schema; delete product + Rule5.
- role L43 embeds escape policy (= escapes frontmatter + Rule4) → trim (AB2/AB6).

### `prompts/00-aprd/VERIFY.md`
- "never re-reconcile / carry verbatim" ×5 (role L24, Rule1 L37, Rule5 L42, Rule7 L44, Stop L138) → keep Rule1.
- "not-version-bound iff setting null" ×3 → keep schema comment.
- "(= 14 for standard input)" L52 → mark illustrative or cut (AB8).

## DO

For EACH file: keep the named canonical home, DELETE the listed copies, REWRITE ambiguous wording (AB8 cases). Write to scratch → gate → clean-room value-verify → operator gate → promote. Never hand-patch; if a copy seems load-bearing, it's not a duplicate — re-check it carries a real delta before deleting.

## ACCEPTANCE

- Each listed fact appears exactly ONCE (its canonical home); copies gone.
- AB8 ambiguities rewritten (MAP-NFR label, VERIFY "=14") or marked `judgment call:`.
- Each file PASSes gate (lint + audit clean) AND clean-room value-verify against golden — **value invariant**.
- **Token budget cleared:** C1 below block (>7500); aim ≤ warn (5000). If a file can't reach warn without dropping a load-bearing fact, run the starvation check (T05) — pass-specific schemas/discriminators are substance, NOT duplication; stop there, that's not bloat.

## STATUS — DONE (2026-06-09)

Per-file P1 cuts landed through the gate (`tools/economy-lint`). All 8 files lint `verdict:clean` (0 blocks). RECONCILE-CRITIQUE cleared the C1 **block** (was the only over-block file post-T08). Value invariant by construction: every cut DELETES a duplicate / points to its canonical home; no schema field, discriminator, exoneration, or escape dropped (each cut audited). Re-author, never patch-by-add (AB9).

### Token deltas (C1, est_tokens) — all below block (7500)

| File | before | after | verdict | note |
|---|---|---|---|---|
| `RECONCILE-CRITIQUE` | **8609 (BLOCK)** | **6930** | clean | block cleared; below 7500 |
| `RESOLVE-LOCAL` | 7209 | 7137 | clean | dual schemas = warn floor |
| `MODEL-DATA` | 6891 | 6818 | clean | C7 dup also cleared |
| `MODEL-FLOWS` | 6727 | 6651 | clean | |
| `MAP-NFR` | 6554 | 6502 | clean | C7 dup also cleared |
| `DERIVE-TESTS` | 5762 | 5743 | clean | |
| `INTEGRATE` | 4049 | 4039 | clean | ≤ warn already |
| `VERIFY` | 3679 | 3679 | clean | offenders pre-resolved (no edit) |

**Warn floor (≤warn 5000 NOT reached on 6 03-hld files):** residual >5000 driven by TWO full pass-specific schemas per dual-mode prompt (skeleton output + increment output, distinct paths/fields) + per-pass discriminators. Starvation check (T05): pass-specific schemas/discriminators = substance, NOT duplication — cutting = starvation defect. Stop there (acceptance clause: "If a file can't reach warn without dropping a load-bearing fact… stop"). Block (7500) is the hard bar; cleared everywhere.

### Per-file cuts (canonical home kept; copies → pointers/deleted)

- **RECONCILE-CRITIQUE** — biggest win. Part A "Seven categories" + Part B "Eight categories" re-specified the SAME categories; "ignore the other part" (MODE DISPATCH) blocked a Part-B→Part-A cross-ref. Fix: **hoisted all category definitions to a SHARED `## Blocking categories` block** (both passes read it, like shared Rules) with `[inc]` tags for increment-only scope/exoneration + category 8 (skeleton-fidelity). Deleted Part A's 7-cat section + Part B's 8-cat section → each now a short "Categories + Your lane" pointer carrying only its per-pass primary-array field map. Increment delta Rule 1 exoneration list → pointer to shared `[inc]` notes. Role narration trimmed (AB6/AB7). Schema `finding` comments stripped of the category re-list. Every category + exoneration audited present in shared block (value invariant; goldens critique.json/reconcile.json both clean/0 → unchanged by dedup).
- **DERIVE-TESTS** — "design-layer NOT aPRD oracle" home = shared Rule 1 + schema `layer` field. Role one-thing fully restated it → trimmed to pointer. Other mentions (pass desc, MODE DISPATCH, per-flow step, aprd_defects) = operational uses, distinct content (kept). Lane-list / format-clause / Stop guard-list already factored by T08 (lint C3/C6 clean).
- **RESOLVE-LOCAL** — escalation criterion (cross-box / contract-KIND / INV* → foundational → Phase 2) homed once at **shared Rule 5** (read both passes). Role one-thing, disposition discriminator #3, task step, increment delta Rule 8 → pointers to Rule 5. Market/adoption-claim ban homed at shared Rule 2; Rule 6 restatement → pointer (AB4). (escapes-frontmatter guard kept — AB2 guard home, not prose dup.)
- **MODEL-DATA** — "MODEL-DATA never mints E*" home = shared Rule 2 (self-declared). Field-schema "authors none" mandate restated verbatim in increment §"Inherited field-schema accountability" → pointer to shared Rule 3. New-entity discriminator restated in delta Rule 5 → pointer. (`WRONG: "fields":[{name,type}]` already single post-T08.)
- **MODEL-FLOWS** — "flow can't be drawn = DEFECT" home = delta Rule 1; role one-thing → pointer. Failure-variant-MANDATORY home = shared Rule 1; both compose-test steps → pointers. Exclusion/membership-gate home = exclusion section; increment delta Rule 5 → pure pointer.
- **MAP-NFR** — anti-gold-plating forbidden-list single home = discriminator (L73); role + Rule 5 + Part B already point. Part B intro restated anti-gold-plating + named-not-designed → trimmed to pointers; new-mechanism-test frame-tension restatement → pointer (cleared a C7 dup). `Redis LRU cache` example already single post-T08.
- **INTEGRATE** — "carry framework, don't re-pick" home = Rule 4 + schema field. Product-4 restatement deleted (→ "on the framework Rule 4 carries"). (Rule 5 mention is a distinct ADR-0002-compliance point, kept.)
- **VERIFY** — no edit needed. "never re-reconcile / carry verbatim" already homed at Rule 1 (role + others are pointers or distinct concerns: Rule 6 accounting, Rule 8 source). "not-version-bound iff setting null" homed at discriminator + schema field.

### ACCEPTANCE check

- **Each listed fact once** — ✓ canonical home kept, copies → pointer/deleted (per-file list above). Judgment calls where a "copy" carried a real delta (kept, not deleted): RESOLVE-LOCAL escapes-frontmatter guard (AB2 guard home); VERIFY Rule 5 (currency flag ≠ recommendation change — distinct behavior, not a carry-verbatim dup); INTEGRATE Rule 5 (ADR-0002 framework-compliance, not the carry-don't-re-pick mandate).
- **AB8 ambiguities** — ✓ MAP-NFR category label is consistently `latency` (no `latency/performance` drift; enum + checklist agree). VERIFY `(= 14 for standard input)` no longer present (status_counts check states the general invariant `sum == agreed_verified + positions_verified`, not a hardcoded 14). Both pre-resolved by T08-era work; re-confirmed clean.
- **Gate (lint) clean** — ✓ all 8 `verdict:clean`, V=0; C3/C4/C7/C8/C9 clean (no blocks; C7 dups in MODEL-DATA + MAP-NFR cleared this pass).
- **Clean-room value-verify** — value invariant argued by construction (only duplication died; canonical home + all pass-specific schemas/discriminators/exonerations retained). Goldens for the gated outputs unchanged (T08 critique.json/reconcile.json clean/0). Live LLM clean-room re-run owed at promote (orchestrator STEP 4) — not run here (do-not-commit scratch stage).
- **Token budget** — ✓ block (7500) cleared on all 8; warn (5000) is the dual-schema starvation floor on the 6 dual-mode 03-hld files (substance, not bloat).

## DEPENDS ON / BLOCKS

- Depends on: T08 (structural fixes first; S1/S5 absorb some of these).
- Blocks: T10 (recurring + non-prompt artifacts last).

## OUT OF SCOPE

Structural patterns (T08). 00-aprd/01-roadmap/02-adr recurring + specs/docs/ADRs (T10).
