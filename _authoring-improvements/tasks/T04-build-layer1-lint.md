# T04 — Build Layer-1 economy LINT (deterministic, no LLM)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

Bloat is currently INVISIBLE because nothing counts it. A 331-line prompt that restates one fact 12× passes the clean-room value-verify exactly like a tight 120-line one would. Need a cheap deterministic check that FAILS structural bloat before spending LLM tokens — cheapest-source-first (project principle P5).

Lint catches the structural ~70% of violations (line budgets, role-identity length, `format:` essays, hedge words, schema-footer prose, escapes-in-Stop, literal duplicates). The semantic ~30% (same fact reworded, no-objective, two-way wording beyond wordlist) is Layer-2 AUDIT's job (T05). Lint short-circuits the obvious; AUDIT spends tokens only on the residue.

## SCOPE

Build a deterministic linter (regex/heuristic, NO LLM) that reads a target prose artifact (`.md` prompt now, any artifact type later) and emits `lint.json`. Includes a both-directions self-test. Oracle = AB1–AB9 (from T03).

Does NOT do semantic checks (T05). Does NOT wire into orchestrator (T06) — but defines the `lint.json` contract T06 consumes.

## GIVEN (the violations lint must catch — audit evidence)

- Top prompt = 331 lines (DERIVE-TESTS); ADR-0010 retrofit avg was ~120; current 39-prompt avg ~163.
- Role-identity mandate-narration: VERIFY-OUTPUT L38 ≈ 9-line sentence (AB6 caps at 3 lines).
- `format:` re-specs upstream schema with `{...}` field-lists: DERIVE-TESTS L14/L19, RECONCILE L7.
- Hedge cluster: "vague-but-watchable", "merely plausible", "genuinely unsure", "too big/small" (P3 / AB8).
- Schema-footer prose "On a clean run X==Y, []..." re-stating inline comments: MATERIALIZE-ORACLE L180, INTEGRATE L160, BUILD-PLAN L126, VERIFY-OUTPUT L186 (AB5).
- escapes re-listed in Stop: RE-RANK Stop L130–133, DERIVE-TESTS Stop L205–207 (AB2).
- literal duplicate: `WRONG: "fields":[{name,type}]` verbatim twice in MODEL-DATA L71/L182 (AB1).
- caveman-footer / PR4 reminder duplicated per-schema in 02-adr files (AB1).

## DO — implement the checks

### Output contract (`lint.json`)
```json
{
  "target": "<artifact path>",
  "verdict": "clean | blocked",          // blocked iff violations non-empty
  "violations": [
    { "check": "role-identity-length", "rule": "AB6", "practice": "P2",
      "line": 39, "evidence": "role block = 7 lines (cap 3)", "fix": "DELETE|REWRITE" }
  ],
  "counts": { "lines_total": 331, "by_rule": { "AB6": 1, "AB1": 4 } }
}
```
Same shape as every gate artifact (disk-truth, schema-valid). `fix` is ALWAYS `DELETE` or `REWRITE` — never `ADD` (AB9 keystone, enforced even in the lint output schema).

### The checks
- **C1 — line budget (P1/AB1, signal).** Non-blank, non-frontmatter prose lines. WARN >150, BLOCK >220. Tunable per phase w/ justification. Rationale: a number that fails; bloat was invisible because nothing counted.
- **C2 — role-identity length (P2/AB6, hard).** Lines between `# Role:` and next `##`. BLOCK >3.
- **C3 — `format:` clause length (P2/AB3, hard).** Each `format: "..."` value in `inputs:`/`outputs:`. BLOCK >25 words OR contains a `{...}` field-list (the re-spec tell).
- **C4 — banned hedge wordlist (P3/AB8, hard).** Regex outside code/JSON for `\b(usually|roughly|loosely|basically|really|just|simply|genuinely unsure|when in doubt|too big|too small)\b`, ` etc\.`, ` and so on`, prose `\.\.\.`. BLOCK on match UNLESS same line has `judgment call:` (the AB8 escape) or a crisp test within N chars.
- **C5 — Field-rules-section detector (P2/AB5, hard).** Prose paragraph AFTER a ```json schema block re-stating field names. Detect: lines after schema close containing ≥2 schema field-keys + words "must"/"on a clean run"/"==". BLOCK.
- **C6 — escapes-restated-in-Stop (P1/AB2, hard).** Tokens in BOTH `escapes:` `when:` clauses AND `## Stop condition` body (guard-condition phrases, not the bare word "guard"). BLOCK if Stop re-enumerates ≥2 specific guard conditions. Allowed: "guard tripped → HALT (escapes)".
- **C7 — duplicate-phrase detector (P1/AB1, signal).** N-gram (n=6..12) shingling across file; flag shingle recurring outside code/JSON, normalize whitespace/case. WARN ≥3, BLOCK ≥4. Catches LITERAL dup; semantic dup → T05.
- **C8 — caveman-footer / PR4-reminder duplication (P1/AB1, hard).** Count "caveman governs"/"PR4"/"clean prose" reminder lines outside the one verbatim Register block. BLOCK >1.
- **C9 — register / caveman compliance (PR4, hard) — absolute mandate, gated.** Deterministic signals outside code/JSON/ids: article density (`\b(the|a|an)\b` per prose line), filler (`\b(just|really|basically|simply|actually|in order to|please|note that)\b`), pleasantry/hedge openers ("Sure", "I'd be happy", "Let's"). WARN over per-artifact-type article+filler ratio; BLOCK on any pleasantry/filler-phrase hit. Literal data exempt. Caveman is ABSOLUTE on every artifact incl human-facing — no register exception (T01); PR4 was advisory, this gates it. Full-prose-but-DRY artifact must FAIL. Different human prose = external rewrite outside the system.

### Generalize per artifact type (file 06 correction)
Linter parameterized by `{artifact-type, thresholds}`. Prompt `.md` thresholds above. For other artifacts (aPRD/ADR/HLD/roadmap/code-stack files), thresholds live in the stack profile, not hard-coded. C2/C3/C5/C6 are prompt-frontmatter-specific; gate them behind artifact-type so a plain ADR body skips them but C1/C4/C7/C8 still apply.

## ACCEPTANCE — both-directions self-test (mirror verify mandate)

Linter MUST prove it discriminates before trusted:
- reference tight prompt → `clean`.
- planted-defect copies, each → `blocked` naming the RIGHT check:
  - role identity padded to 7 lines → C2.
  - a `format:` `{...}` brace-list added → C3.
  - an " etc." inserted in prose → C4.
  - the lane copied into Stop → C6.
  - a verbatim 8-line block duplicated → C7.
  - a full-prose / pleasantry sentence inserted ("As you can see, the agent should…") → C9.
- If a planted defect PASSes, the check is broken — fix before trusting.
- Deterministic: same input → same `lint.json` every run (no LLM, no nondeterminism).

## DEPENDS ON / BLOCKS

- Depends on: T03 (AB1–AB9 = oracle; rules must exist).
- Blocks: T06 (orchestrator runs lint first, short-circuits before the expensive sim).

## OUT OF SCOPE

Semantic duplication / no-objective / general ambiguity (T05). Orchestrator wiring (T06). Re-authoring prompts (T08–T10).
