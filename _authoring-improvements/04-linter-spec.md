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
  "counts": { "lines_total": 331, "est_tokens": 8796, "by_rule": { "AB6": 1, "AB1": 4 } }
}
```

Same shape as every gate artifact (D3 disk-truth, schema-valid). `fix` is always DELETE or REWRITE — never ADD (AB9 keystone).

## The checks

### C1 — TOKEN budget per prompt (P1/AB1, signal) — see file-07
- **Heuristic:** `est_tokens = content_chars / 4` (content = non-blank, non-frontmatter lines). Deterministic, zero-dep, conservative under-count.
- **Threshold:** WARN >5000, BLOCK >7500 tokens. (Mapped from old 150/220-line thresholds at corpus median 134 char/line.) Tunable per phase if justified.
- **Why TOKENS not lines:** lines are gameable — system packs facts into long lines, line count drops, gate passes, real cost unchanged. char/line varies 78→190 across corpus (83% spread) → line budget has no fixed meaning + ranks files backwards (RECONCILE-CRITIQUE passed line-gate yet was heaviest at ~10.8K tok). Tokens = the actual context-window cost; un-gameable by packing. Full rationale + evidence: `07-bloat-metric-tokens.md`. Still signal-grade (WARN→BLOCK, override-on-justification) — a legit prompt can be long.

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

### C9 — register / caveman compliance (PR4, hard) — the absolute mandate, gated
- **Heuristic (deterministic signals, outside code/JSON/ids):** article density (`\b(the|a|an)\b` per prose line); filler hits (`\b(just|really|basically|simply|actually|in order to|please|note that)\b`); pleasantry/hedge openers ("Sure", "I'd be happy", "Let's", "As you can see"). Compute per-artifact ratio.
- **Threshold:** WARN over a per-artifact-type article+filler ratio; BLOCK on any pleasantry opener or filler-phrase hit. Literal data (JSON/YAML keys+values, schemas, ids, code) exempt — register stays literal there.
- **Why:** caveman is ABSOLUTE on every artifact incl human-facing — no register exception (T01). PR4 was advisory; this makes it gated, same as economy. A full-prose-but-DRY artifact must still FAIL. Different human prose = external rewrite outside the system, never a pass here.

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
