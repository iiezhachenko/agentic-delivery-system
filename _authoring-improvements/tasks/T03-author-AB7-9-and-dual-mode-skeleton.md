# T03 — Author AB7/AB8/AB9 + caveman delta + dual-mode skeleton rule (skeleton v3→v4)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

Anti-bloat rules AB1–AB6 are advisory + INCOMPLETE. Gaps:

| Practice | Covered by existing AB? | Gap |
|---|---|---|
| **P1** delete-not-add | Partly — AB1 says WHERE a fact lives | No rule names the ACTION "fix by deletion/rewrite, never addition" |
| **P2** objective-per-statement | Partly — AB3/AB5/AB6 cover specific cases (format, field-rules, role identity) | No GENERAL rule "every statement earns its place" — decorative narration outside those cases uncaught |
| **P3** single-interpretation | **No** | NOTHING bans multi-reading wording. Wholly-missing rule. |

Also: biggest single line driver corpus-wide = the **two-pass skeleton/increment split** in all 8 `03-hld/` prompts. Part A + Part B each carry a full Rules block; shared rules (lane, grounding, "named-not-designed", "invent nothing") COPIED into both. Skeleton doesn't prevent this → must fix at the SOURCE.

## SCOPE

Add AB7, AB8, AB9 to coding canon + one caveman-block delta line + a dual-mode Rules rule to the prompt skeleton. Freeze as new skeleton version v4 via change-request (current frozen = v3).

Per T02: economy RULE is stack-independent (lives as spec P13 + INV). So coding-canon's AB7–AB9 are the PROMPT-STACK REALIZATION of P13 and should CITE P13, not re-own the universal rule. AB1–AB6 already are the prompt-stack idioms; AB7–AB9 extend them, same frame.

Does NOT build linter (T04) or auditor (T05) — those reference these rules as their oracle.

## GIVEN (current state, exact)

- `.hld/skeleton/coding-canon.md`:
  - Caveman block L7–15 (PR4 verbatim paste).
  - AB1–AB6 L23–29 under "## Anti-bloat authoring rules AB1–AB6".
- `.hld/skeleton/prompt-skeleton.md` — the DRY scaffold; frontmatter has `pass: skeleton|increment` (Phase-3 dual-mode, D9/D14). `## Rules` section comment L23.
- `.hld/skeleton.frozen.md` = "FROZEN v3"; `.hld/skeleton.lock` = `{version:"v3", content_sha256:..., status:"frozen"}`. Immutable. Change = new signed version, never overwrite.
- coding-canon + prompt-skeleton are both listed artifacts in `skeleton.lock`.

## DO

1. **Add AB7 (P2 / objective-per-statement)** to coding-canon AB section, paste-ready:

   ```markdown
   - **AB7 — Statement earns its place.** Every line exists to change a downstream reader's action — what the agent reads, computes, writes, or routes. No decorative narration, no motivational prose, no restating a mandate "for emphasis", no explaining WHY a rule exists where stating the rule suffices. Test per statement: "delete it — does any agent behavior change?" No → delete it. (Generalizes AB3/AB5/AB6 from their specific homes to all prose. Prompt-stack realization of spec P13.)
   ```

2. **Add AB8 (P3 / single-interpretation)** — the wholly-new rule:

   ```markdown
   - **AB8 — Single interpretation, or named judgment.** Use the most precise wording that reads ONE way. A statement readable two ways is a defect — rewrite it. State each test ONCE, precisely. If the call is genuinely judgment (no mechanical test — e.g. INVEST sizing), say "judgment call:" explicitly so the reader stops hunting a crisp bound that isn't there. Banned without a crisp adjacent test: "usually", "loosely", "roughly", "too big/small", "genuinely unsure", "when in doubt", open "etc." lists. A fixture-coupled number stated as a general rule ("= 14 for standard input") must be marked illustrative or cut.
   ```

3. **Add AB9 (P1 / fix-by-deletion)** — the action rule:

   ```markdown
   - **AB9 — Fix down, not up.** Wrong/unclear behavior → DELETE or REWRITE the offending text. NEVER patch by adding another instruction. Adding to clarify IS the bloat mechanism (a second statement to fix a first leaves both). If a rule is misread, the rule is wrong — rewrite it in place; do not append a caveat. A prose defect routes to RE-AUTHOR against the DRY skeleton, never to a patch. (Authoring analog of orchestrator STEP 4.5: defect is in the prompt — re-author, never hand-patch.)
   ```

4. **Caveman-block delta** — one line inside the verbatim block (so every prompt carries the reflex at point-of-authoring):

   ```markdown
   Fix by cutting, never by adding (AB9). If a statement reads two ways, rewrite it (AB8). Every line earns its place (AB7).
   ```

5. **Dual-mode skeleton rule** — kill two-pass duplication at the SOURCE. Add to `prompt-skeleton.md`:

   ```markdown
   ## Rules (dual-mode prompts)   # ONE shared Rules block + a per-mode DELTA block.
   # Shared rules (lane, grounding, named-not-designed, invent-nothing) live ONCE above the mode split.
   # Each mode section carries ONLY its delta (rules that differ A vs B). Never copy a shared rule into both.
   ```

6. **Rename / reframe** the AB section header to "AB1–AB9". Update `.hld/skeleton/coding-canon.md` title-region reference and `skeleton.frozen.md` "## CODING CANON" line ("AB1–AB6" → "AB1–AB9"). coding-canon notes AB7–AB9 = prompt-stack realization of spec P13 (CITE, don't re-own — depends T02).

7. **Change-request mechanics (immutability):**
   - Do NOT overwrite frozen v3. Author v4: new `skeleton.frozen.md` (FROZEN v4) + new `skeleton.lock` (version v4, new content_sha256, signed_at, gate verdict).
   - Re-trigger downstream: every prompt re-authored against v4 (that re-author work = T08–T10; this task only lands the canon + new freeze).
   - Freeze v4 only AFTER the gate (T04/T05/T06) exists + both-directions self-test holds — i.e. v4 canon authored here, freeze ritual completes in the T08 sequence. Note this ordering; do not freeze prematurely.

## ACCEPTANCE

- AB7, AB8, AB9 present, each ONE home, each paste-ready + gateable.
- Caveman delta line present in the verbatim block (single line, no narration).
- Dual-mode Rules rule present in prompt-skeleton — shared-once + per-mode-delta.
- coding-canon CITES P13 (T02), does not duplicate the universal rule.
- No frozen-v3 overwrite; v4 authored as new signed version.
- Self-check the rules are themselves economy-clean: no AB rule restates another; AB9 ≠ AB1 (AB1=placement, AB9=action) stated as such.

## DEPENDS ON / BLOCKS

- Depends on: T01 (caveman block edit), T02 (P13 to cite).
- Blocks: T04 (linter oracle = AB1–AB9), T05 (auditor oracle = AB1–AB9), T08–T10 (re-author against v4 + dual-mode rule).

## OUT OF SCOPE

Linter (T04). Auditor role (T05). Pipeline wiring (T06). Actual prompt re-authoring (T08–T10).

## STATUS — DONE (not committed)

v4 canon authored in live `skeleton/*.md`. Freeze ritual (new frozen.md + re-lock) DEFERRED to T08 per step-7 ordering — see CR below.

### Landed
- `coding-canon.md` caveman block (PR4, verbatim) — delta line added inside fence: `Fix by cutting, never by adding (AB9). If a statement reads two ways, rewrite it (AB8). Every line earns its place (AB7).` Propagates to every prompt at paste-time.
- `coding-canon.md` AB section — header `AB1–AB6` → `AB1–AB9`; AB7/AB8/AB9 added paste-ready; lead note frames AB1–6 = placement idioms, AB7–9 = prompt-stack realization of spec **P13** (CITE `A-ECON`, do not re-own; universal rule lives spec §2.1).
- `coding-canon.md` D10 line ref `AB1–AB6` → `AB1–AB9`.
- `prompt-skeleton.md` intro ref `AB1–AB6` → `AB1–AB9`; dual-mode Rules rule added as scoped section (`pass: skeleton|increment`, D9/D14): ONE shared `## Rules` above mode split + per-mode DELTA only, never copy shared rule into both (AB1). Killed the two-pass duplication AT THE SOURCE.

### CR — skeleton v3→v4 (immutability honored, mirrors T02 path)
- Frozen v3 NOT overwritten: `skeleton.frozen.md` (FROZEN v3) + `skeleton.lock` (v3) untouched. Same precedent as T02 (advanced live source, left frozen/lock, deferred re-lock to next freeze).
- Step-6 vs step-7 reconcile (judgment call): step 6 names a frozen.md "## CODING CANON" line-edit; step 7 + CLAUDE.md forbid overwriting frozen v3 and forbid premature freeze. Resolved toward immutability — frozen v3 left intact (BOTH its `AB1–AB6` refs: SCAFFOLD L9 + CODING CANON L12). The `AB1–AB6` → `AB1–AB9` reference lands in the NEW `skeleton.frozen.md` (FROZEN v4) + new `skeleton.lock` (v4, fresh content_sha256, signed_at, gate verdict) authored at the **T08** freeze ritual — only AFTER gate (T04/T05/T06) exists + both-directions self-test holds.
- Downstream re-trigger (named, not done here): T04 linter oracle = AB1–AB9; T05 auditor oracle = AB1–AB9; T08–T10 re-author every prompt against v4 + dual-mode rule.

### ACCEPTANCE check
- AB7/AB8/AB9 present, each ONE home, paste-ready + gateable (each carries a mechanical test) → ✅.
- Caveman delta single line in verbatim block, no narration → ✅.
- Dual-mode Rules rule in prompt-skeleton — shared-once + per-mode-delta → ✅.
- coding-canon CITES P13, does not duplicate universal rule → ✅ (lead note + AB7/AB9 parentheticals point to spec §2.1/P13).
- No frozen-v3 overwrite; v4 authored as live canon, signed v4 freeze deferred to T08 → ✅.
- Economy self-check: no AB restates another; AB9 ≠ AB1 stated in-rule (AB1 = placement, AB9 = fix action) → ✅. AB7 generalizes AB3/AB5/AB6 (named), does not re-state them.

### Verify
`grep -n "AB7\|AB8\|AB9" .hld/skeleton/coding-canon.md` = block + delta + lead note. `grep "AB1–AB6" .hld/skeleton/coding-canon.md .hld/skeleton/prompt-skeleton.md` = only the lead-note contrast line (intentional). Frozen v3 unchanged (`AB1–AB6` still present in `skeleton.frozen.md` — correct, immutable). DO-NOT-COMMIT honored.
