# Lint spec — Layer 1, deterministic prose checks

> Mechanical checks, no LLM. Run on a scratch `.md` before the clean-room sim (orchestrator STEP 4). Catches the structural ~70% of P1/P2/P3 violations cheaply (P5). Output `lint.json`. Each check = {what, heuristic, threshold, practice, AB rule, why}.

## Output contract

```json
{
  "target": "<scratch .md path>",
  "verdict": "clean | blocked",          // blocked iff violations non-empty
  "violations": [
    { "check": "role-identity-length", "rule": "AB6", "practice": "P2",
      "line": 39, "evidence": "role block = 7 lines (cap 3)", "fix": "DELETE|REWRITE" }
  ],
  "counts": { "lines_total": 331, "by_rule": { "AB6": 1, "AB1": 4 } }
}
```

Same shape as every gate artifact (D3 disk-truth, schema-valid). `fix` is always DELETE or REWRITE — never ADD (AB9 keystone).

## The checks

### C1 — line budget per prompt (P1/AB1, signal)
- **Heuristic:** total non-blank, non-frontmatter prose lines.
- **Threshold:** WARN >150, BLOCK >220. (ADR-0010 retrofit avg ~120; current top 331.) Tunable per phase if justified.
- **Why:** a number that fails. Bloat is currently invisible because nothing counts. This is the cheapest possible signal — a budget the authoring agent feels every run. Not a hard quality measure (a legit prompt can be long), so WARN-then-BLOCK with override-on-justification, not a silent cap.

### C2 — role-identity length (P2/AB6, hard)
- **Heuristic:** lines between `# Role:` and the next `##` heading.
- **Threshold:** BLOCK >3 lines.
- **Why:** AB6 explicit cap. Catches the mandate-narration paragraph (VERIFY-OUTPUT L38 9-line, RESOLVE-LOCAL Phase-2 recap). Pure line count → fully mechanical.

### C3 — `format:` clause length (P2/AB3, hard)
- **Heuristic:** char/word count of each `format: "..."` value in `inputs:`/`outputs:`.
- **Threshold:** BLOCK >25 words OR contains a `{...}` field-list (the re-spec tell).
- **Why:** AB3 = one clause. A `{id, between, kind, shape, failure_modes, traces}` field-list in a format clause IS the upstream-schema re-spec (DERIVE-TESTS L14, RECONCILE L7). The brace-list is a deterministic signal.

### C4 — banned hedge wordlist (P3/AB8, hard)
- **Heuristic:** regex match outside code/JSON blocks for: `\b(usually|roughly|loosely|basically|really|just|simply|genuinely unsure|when in doubt|too big|too small)\b`, ` etc\.`, ` and so on`, `\.\.\.` in prose (open lists).
- **Threshold:** BLOCK on match UNLESS the same line contains `judgment call:` (the AB8 escape) or a crisp test within N chars.
- **Why:** P3's mechanical front line. The "vague-but-watchable" / "merely plausible" / "genuinely unsure" cluster (02-adherence §P3) is mostly catchable by wordlist. The `judgment call:` exception lets honest fuzz through, named.

### C5 — Field-rules-section detector (P2/AB5, hard)
- **Heuristic:** a prose paragraph AFTER a ```json schema block that re-states field names already commented inline. Detect: lines after schema close that contain ≥2 schema field-keys + words "must"/"on a clean run"/"==".
- **Threshold:** BLOCK.
- **Why:** AB5. The schema-footer prose ("On a clean run X==Y, []...") is corpus-wide (MATERIALIZE-ORACLE L180, INTEGRATE L160). Field-keys-after-schema is a reliable structural tell.

### C6 — escapes-restated-in-Stop (P1/AB2, hard)
- **Heuristic:** tokens appearing in BOTH the `escapes:` frontmatter `when:` clauses AND the `## Stop condition` body (guard-condition phrases, not just the word "guard").
- **Threshold:** BLOCK if Stop re-enumerates ≥2 specific guard conditions (vs the allowed "guard tripped → HALT (escapes)").
- **Why:** AB2 — guards have one home. RE-RANK Stop L130-133, DERIVE-TESTS Stop L205-207.

### C7 — duplicate-phrase detector (P1/AB1, signal)
- **Heuristic:** n-gram (n=6..12) shingling across the file; flag any shingle recurring ≥3× outside code/JSON. Normalize whitespace/case.
- **Threshold:** WARN ≥3 occurrences, BLOCK ≥4.
- **Why:** catches LITERAL duplication cheaply (the verbatim lane list A↔B, the `WRONG: "fields":[{name,type}]` example twice in MODEL-DATA L71/L182). Semantic duplication (same fact, different words — DERIVE-TESTS ×12) needs Layer-2 AUDIT; this catches the copy-paste half for free.

### C8 — caveman-footer / PR4-reminder duplication (P1/AB1, hard)
- **Heuristic:** count occurrences of "caveman governs"/"PR4"/"clean prose" reminder lines outside the one verbatim Register block.
- **Threshold:** BLOCK >1 (the Register block already mandates it; per-schema reminders are duplication — 02-adr files repeat it per schema).
- **Why:** AB1. Recurring corpus-wide footer.

## What lint CANNOT do (→ Layer 2 AUDIT)

- Semantic duplication: same fact, reworded (the ×12). C7 only catches verbatim copies.
- "Does this statement have an objective?" — needs meaning (P2 general).
- "Is this readable two ways?" beyond the wordlist — needs a reader (P3 general).
- Legit-vs-bloat judgment on a long-but-dense prompt (C1 is a signal, not a verdict).

Lint short-circuits the obvious; AUDIT spends tokens only on the residue. Cheapest-source-first.

## Both-directions self-test (mirror verify mandate)

Lint must prove it discriminates before trusted:
- reference tight prompt → `clean`.
- planted-defect copies (role identity padded to 7 lines; a `format:` brace-list added; an "etc." inserted; the lane copied to Stop) → each `blocked`, naming the right check.
- If a planted defect passes, the check is broken — fix before trusting.

## Wiring

`_orchestrator.md` STEP 4, step 0 (before runner spawn): run lint on scratch → `lint.json`. Blocked → route to re-author (STEP 3), skip the expensive sim. Clean → proceed to AUDIT then clean-room. Disk artifact, idempotent, no bookkeeping.
