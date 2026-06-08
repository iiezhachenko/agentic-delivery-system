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

## DEPENDS ON / BLOCKS

- Depends on: T08 (structural fixes first; S1/S5 absorb some of these).
- Blocks: T10 (recurring + non-prompt artifacts last).

## OUT OF SCOPE

Structural patterns (T08). 00-aprd/01-roadmap/02-adr recurring + specs/docs/ADRs (T10).
