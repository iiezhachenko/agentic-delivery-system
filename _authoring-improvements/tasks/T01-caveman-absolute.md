# T01 — Caveman ABSOLUTE on every artifact; DELETE the register exception

> Do-not-commit. Caveman register. SELF-CONTAINED — all context inside.

## WHY (problem)

Agents bloat prompts + artifacts by ADDING text. One enabler is a canon contradiction that lets agents excuse both verbose prose AND repetition.

- **CLAUDE.md** (correct): caveman register governs "all artifact prose (spec/ADR/prompt/doc bodies)".
- **Every prompt's Register block** (wrong): *"Exception: artifact content (specs, JSON/YAML, ADR bodies) stays clean and complete. Caveman governs narration, not the deliverable."*

The exception is the bug. It (a) contradicts the absolute mandate, (b) gets misread as "say everything, repeat freely, full prose." Kill it.

## DECISION (absolute, no exception)

**Caveman is an absolute mandate on EVERY artifact in the system, incl human-facing.** Rationale:
- condensed text reads faster (human AND agent);
- a "human-facing" artifact is still ingested by agents downstream — it IS prompt context;
- need a different prose style for a human consumer → a SEPARATE agent OUTSIDE the pipeline rewrites that one artifact. Restyling = external post-process, NEVER a reason to relax caveman inside the system.

Register + economy are two SEPARATE properties; **both absolute, both consumer-independent:**

| Property | Controls | Consumer-dependent? |
|---|---|---|
| **Register** (caveman) | terse style — drop articles/filler | **No** — all prose, all artifacts, incl human-facing. External restyle only. |
| **Economy** (one home · objective-per-statement · single-interpretation) | substance discipline | **No** — all prose regardless of register or consumer |

Both bind independently: caveman-terse text can still be bloated (repeats a fact) → economy fails it; economical text can still be full-prose → register fails it. Both must hold.

## SCOPE

Make caveman absolute in canon: DELETE the register exception from the canonical block + everywhere it propagated. State both register + economy as absolute, consumer-independent. State the external-rewrite escape. This task removes the exception; it does NOT add AB7–AB9 (→ T03) nor spec P13 (→ T02).

## GIVEN (current state, exact)

- `CLAUDE.md` Register section (top of file) — already says caveman governs all artifact prose. Keep + sharpen to "absolute, no exception, incl human-facing".
- `.hld/skeleton/coding-canon.md` "Caveman block (PR4)" L7–15 + PR4 L21 — the verbatim block pasted into every prompt. Currently NO exception line itself, but its propagated copies + `_orchestrator.md` carry one.
- 39 prompts under `prompts/<phase>/*.md` — many carry the "artifact content stays clean and complete" exception line in their Register block.
- `prompts/_orchestrator.md` L99: *"Artifact content (the authored prompt) stays clean prose — PR4."* ← an exception phrasing; rewrite to "stays caveman — PR4".

## DO

1. **Rewrite the canonical caveman block** (`.hld/skeleton/coding-canon.md`) so it states the absolute mandate. Replace the "Applies to ALL prose…" closing line (do NOT append — AB9, fix by rewrite). Paste-ready (NOTE: coding-canon is under the frozen skeleton → this edit rides T03's skeleton-v4 change-request; do not freeze separately):

   ```
   Applies to ALL prose in ALL artifacts — narration, prompt/spec/ADR/HLD/doc bodies, code comments — NO exception, incl human-facing artifacts. (Condensed reads faster; every artifact is also agent-ingested context.) Need a different prose style for a human consumer → a separate agent OUTSIDE the pipeline rewrites that one artifact; never relax caveman inside the system. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax. Economy (one home per fact, every statement earns its place, single interpretation) is a SEPARATE absolute invariant — both bind every artifact.
   ```

2. **Sharpen CLAUDE.md** — rewrite the Register clause to "absolute, no exception, incl human-facing; external rewrite for different human prose". Do NOT append a caveat (AB9). CLAUDE.md + canonical block must say the SAME thing in ONE voice.

3. **Kill the exception in `_orchestrator.md` L99** — rewrite "stays clean prose" → "stays caveman" (the authored prompt is caveman like everything else).

4. **Per-prompt exception lines** — wherever a prompt's Register block carries the "stays clean and complete" exception, it must be DELETED. These are propagated copies of the PR4 block; fixing the canonical block (step 1) is the source fix. The 39 propagated copies get the corrected block when re-authored (T08–T10). Do NOT hand-edit 39 prompts here; this task fixes the source + names the propagation for the remediation tasks.

## ACCEPTANCE

- Canon (CLAUDE.md + canonical caveman block) states caveman as ABSOLUTE on every artifact incl human-facing, in ONE consistent voice, ONE home.
- The "artifact stays clean/complete" register exception exists NOWHERE in canon (deleted, not reframed).
- External-rewrite escape stated once: different human prose = separate agent outside the system.
- Register + economy both named absolute + consumer-independent; their independence stated (terse-but-bloated still fails; economical-but-full-prose still fails).
- No new standing section added (fix-by-rewrite, not patch-by-add).
- Sanity: under new canon, a "full-sentence human-facing ADR" = register DEFECT (must be caveman); an ADR stating one fact 6× = economy DEFECT. Both fail.

## DEPENDS ON / BLOCKS

- Depends on: nothing (precondition).
- Blocks: T02 (P13 wording leans on caveman-absolute), T03 (AB rules + caveman delta land in same block), T04 (lint C9 GATES the register mandate — makes "absolute" enforced, not advisory), T08–T10 (delete the propagated exception when re-authoring).

## OUT OF SCOPE

AB7–AB9 text (T03). Spec principle P13 (T02). Re-authoring prompts / deleting propagated copies (T08–T10).

## STATUS — DONE (not committed)

Source edits (3), no 39-prompt hand-edit:

1. **Canonical caveman block** — `.hld/skeleton/coding-canon.md` L14. Old "Applies to ALL prose…/never breaks data/code" closing line REPLACED (not appended — AB9) with absolute mandate: NO exception, incl human-facing + external-rewrite escape + economy named separate absolute. (Rides T03 skeleton-v4 change-request; not frozen separately.)
2. **CLAUDE.md Register** — "Applies to" bullet rewritten → "Applies ABSOLUTE — NO exception … incl human-facing"; external-restyle escape stated; new bullet states Register+Economy = two separate consumer-independent absolutes + their independence (terse-but-bloated fails economy; economical-but-full-prose fails register). Same voice as canonical block, one home.
3. **`_orchestrator.md` L99** — "stays clean prose — PR4" → "stays caveman — PR4, no exception".

Verify: `grep` for `stays clean|clean and complete|clean prose` in canon (CLAUDE.md + coding-canon + orchestrator) = 0 hits. Exception gone from canon, deleted not reframed.

Propagation NAMED for remediation (T08–T10, NOT edited here): `prompts/04-build/DEMO-GEN.md` ("client-facing prose stays clean") + prompt carrying "governs narration, not the deliverable". Get corrected PR4 block on re-author.

ACCEPTANCE check:
- Caveman ABSOLUTE on every artifact incl human-facing, one voice, one home → ✅ (canonical block + CLAUDE.md aligned).
- Exception NOWHERE in canon → ✅ (0 grep hits, deleted).
- External-rewrite escape stated once → ✅ (canonical block; CLAUDE.md mirrors same rule).
- Register + economy both absolute + consumer-independent, independence stated → ✅ (CLAUDE.md new bullet + canonical block economy clause).
- No new standing section (fix-by-rewrite) → ✅ (rewrote existing lines; CLAUDE.md bullet added inside existing Register section, no new section).
- Sanity: full-sentence human-facing ADR = register DEFECT; ADR stating one fact 6× = economy DEFECT → both fail under new canon → ✅.
