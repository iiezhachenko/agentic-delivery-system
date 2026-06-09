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
  "counts": { "lines_total": 331, "est_tokens": 8796, "by_rule": { "AB6": 1, "AB1": 4 } }
}
```
Same shape as every gate artifact (disk-truth, schema-valid). `fix` is ALWAYS `DELETE` or `REWRITE` — never `ADD` (AB9 keystone, enforced even in the lint output schema).

### The checks
- **C1 — TOKEN budget (P1/AB1, signal).** `est_tokens = content_chars/4` (non-blank, non-frontmatter lines). WARN >5000, BLOCK >7500. Tunable per phase w/ justification. TOKENS not lines: lines gameable by packing facts into long lines (char/line varies 78→190, 83% spread; line-gate ranks files backwards). Tokens = real context cost, un-gameable. Rationale + evidence: `07-bloat-metric-tokens.md`.
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

---

## DONE (2026-06-08)

Built deterministic linter (Node, no LLM). Lives `tools/economy-lint/` (PERMANENT home — `_authoring-improvements/` is throwaway, so the runtime gate component can't sit there). Not git-committed (T04 do-not-commit); placement settled so value transfers when T06 wires it.

### Deliverables (`tools/economy-lint/`)
- `lint.mjs` — linter + CLI + exported `lint(target,type)`. Emits `lint.json`. C1–C9 all implemented.
- `selftest.mjs` — both-directions discrimination + determinism harness. Reads its golden from `tools/fixtures/economy-lint/reference.md`.
- `tools/fixtures/economy-lint/reference.md` — clean golden prompt (real corpus prompts already carry bloat, so authored fresh). Deterministic-tool fixtures live under `tools/fixtures/<tool>/` (operator directive — location signals "fixtures for a deterministic tool", distinct from `_fixtures/` clean-room/prompt oracles).
- `README.md` — `lint.json` contract (T06 consumes) + check table + per-artifact generalization.
### Enabling decision — ADR-0022 / D22 (RATIFIED, operator-approved 2026-06-08)
Linter = FIRST deterministic-code component in an otherwise 100%-prompt-driven pipeline → needed an enabling ADR. Operator approved + directed tool-agnostic. Authored as a CLASS, not a one-off; then made permanent via the system's mechanical-freeze flow (SYNTHESIZE-ADR design call: draft → review → mechanical freeze promotes to log + writes lock):
- ADR-0022/D22: deterministic helper tools = sanctioned component class; spine may shell out (contract: deterministic · disk-in/out JSON verdict · NO LLM · profile-registered · FLAGS-not-authors · self-proving). LINT = first instance; future tools (schema validators, ID-thread checkers, DAG-cycle detectors) inherit.
- **Frozen:** `.adr/drafts/0022-deterministic-helper-tools.draft.md` (Proposed) → `.adr/log/0022-deterministic-helper-tools.md` (Accepted); `adr-index.json` rendered 21→22; `adr.lock` v3→v4 with REAL `content_sha256` (= sha256 of `.adr/log/*.md` concat in sorted-name order — reproduced v3 to confirm the algo, then recomputed over 22). Review gate = operator approval (spec §5.8 human reviewer), recorded honestly in `adr.lock.amendment` (not a faked agent CRITIQUE). ids contiguous 0001..0022.
- **No CR side-file.** System defines NO change-request file artifact — new version IS the CR (P8; same correction T02 applied to the deleted CR-001).
- Additive + orthogonal: ADR-0001..0021 unchanged; `skeleton.lock` references `adr.lock` by path (no version/hash pin) → no downstream lock invalidated. Prompt re-author against new canon + orchestrator/code-canon wiring remain T06+ scope.

### Acceptance — MET (`node selftest.mjs` → PASS, 20 checks ok, 0 failed)
- reference tight prompt → `clean`.
- planted-defect copies → `blocked`, each naming the RIGHT check: C2 role-pad→`role-identity-length`, C3 brace-list→`format-clause-length`, C4 `etc.`→`banned-hedge`, C6 lane-in-Stop→`escapes-in-stop`, C7 8-line block→`duplicate-phrase`, C9 pleasantry→`register-compliance` (+ bonus C1/C5/C8).
- Deterministic: two runs byte-identical.

### Contract (`lint.json`)
- `verdict=blocked` iff `violations` (BLOCK-grade) non-empty. `warnings`=signal-grade (C1/C7/C9 below block), non-gating.
- `fix` ALWAYS `DELETE|REWRITE`, never `ADD` (AB9 keystone, in schema). T06 routes blocked→re-author, skip sim.
- Parameterized by `{artifact-type, thresholds}` (`PROFILES`); C2/C3/C5/C6 gated behind prompt type, C1/C4/C7/C8/C9 universal. Non-prompt thresholds belong in stack profile, not hard-coded (file-06).

### Corpus validation (real bloat caught, matches GIVEN audit)
- DERIVE-TESTS: blocked, 332 lines, AB3×8 / AB5×3 / AB2×1 / AB1×3 (line-budget + footer).
- BUILD-PLAN L126: `field-rules-section` (AB5) — exactly the cited schema-footer.
- MODEL-DATA, VERIFY-OUTPUT, RECONCILE-CRITIQUE: all blocked on AB3/AB2/AB5/PR4.

### Known limit (deferred to T05 AUDIT, consistent w/ spec thresholds)
- C7 verbatim single-line dup at exactly 2× sits below spec ≥3 threshold (e.g. MODEL-DATA `WRONG` ×2). Multi-line verbatim blocks at 2× ARE caught (contiguous-run rule). Semantic dup (×12 reworded) = AUDIT.
- C4 hedge "crisp-test-within-N-chars" relaxation not implemented — `judgment call:` escape is the deterministic allow; relaxation deferred (semantic, AUDIT).

NOT committed (do-not-commit rule honored).

### AMENDMENT (2026-06-09) — C1 line→TOKEN budget (file-07)
C1 was gameable: line count drops when facts packed into long lines (char/line 78→190 across corpus, 83% spread; line-gate ranked RECONCILE-CRITIQUE as passing yet heaviest ~8.8K tok). Flipped C1 to `est_tokens = content_chars/4` (deterministic, zero-dep). Thresholds WARN>5000 / BLOCK>7500 (mapped from 150/220 lines at median 134 char/line). `counts.est_tokens` now reported; `lines_total` kept informational. selftest gains a GAMING defect (14 mega-lines, low line count, high tokens) → blocks only on token-budget, proving the fix. `node selftest.mjs` → PASS, 22 checks. Rationale: `07-bloat-metric-tokens.md`. Still NOT committed.
