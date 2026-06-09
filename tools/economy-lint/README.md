# Layer-1 economy LINT

> Deterministic, NO LLM. Catches structural ~70% of economy violations cheaply (P5) before the
> clean-room sim spends tokens. Semantic ~30% (same fact reworded, no-objective, two-way wording
> beyond wordlist) = Layer-2 AUDIT (T05). Oracle = AB1–AB9 (`.hld/skeleton/coding-canon.md`).
>
> **Permanent home** (survives `_authoring-improvements/` deletion). FIRST instance of the
> deterministic-helper-tool class sanctioned by **ADR-0022 / D22** (spine may shell out to
> deterministic, NO-LLM helpers) — ratified into `.adr/log/0022-deterministic-helper-tools.md`
> (Accepted), `adr.lock` v4. Authored under T04; orchestrator/code-canon wiring + registration by T06.
> Not git-committed yet (T04 do-not-commit); the `.adr/` freeze sits in the working tree.

## Run

```
node lint.mjs <target.md> [--type prompt|adr|aprd|hld|roadmap] [--out lint.json]
node selftest.mjs        # both-directions discrimination + determinism
```

`selftest.mjs` golden = `tools/fixtures/economy-lint/reference.md` (deterministic-tool fixtures live under `tools/fixtures/<tool>/`).

Exit 0 = clean, 1 = blocked, 2 = usage. Type inferred from path (`/prompts/`→prompt, `/.adr/`→adr…); `--type` overrides.

## `lint.json` contract (T06 consumes)

```json
{
  "target": "<artifact path>",
  "type": "prompt",
  "verdict": "clean | blocked",
  "violations": [ { "check": "role-identity-length", "rule": "AB6", "practice": "P2",
                    "line": 39, "evidence": "role block = 7 lines (cap 3)", "fix": "DELETE|REWRITE" } ],
  "warnings":   [ { "check": "token-budget", "rule": "AB1", "practice": "P1",
                    "line": 1, "evidence": "est_tokens = 5762 (warn >5000; chars=23048)", "fix": "REWRITE" } ],
  "counts": { "lines_total": 331, "est_tokens": 5762, "by_rule": { "AB6": 1, "AB1": 4 }, "warnings": 1 }
}
```

- **verdict = blocked iff `violations` non-empty.** `violations` = BLOCK-grade (gate). `warnings` = signal-grade (C1/C7/C9 below block) — surfaced, not gating.
- **`fix` is ALWAYS `DELETE` or `REWRITE` — never `ADD`** (AB9 keystone, enforced in the schema itself). Loop offers no patch path; bloat routes to re-author from the DRY skeleton.
- Same shape as every gate artifact (disk-truth, schema-valid). Deterministic: same input → byte-identical output.

## Checks (oracle = AB1–AB9)

| # | check | rule | gate | heuristic |
|---|---|---|---|---|
| C1 | `token-budget` | AB1/P1 | warn>5000, block>7500 tok | est_tokens = content_chars/4 (lines gameable by packing — file-07) |
| C2 | `role-identity-length` | AB6/P2 | block>3 | non-blank lines `# Role:`→next `##` |
| C3 | `format-clause-length` | AB3/P2 | block | `format:"…"` >25 words OR `{…}` field-list (re-spec tell) |
| C4 | `banned-hedge` | AB8/P3 | block | hedge wordlist + ` etc.`/`and so on`/`…`; escape = `judgment call:` |
| C5 | `field-rules-section` | AB5/P2 | block | prose after ```json``` re-stating ≥2 field keys + must/`==`/"on a clean run" |
| C6 | `escapes-in-stop` | AB2/P1 | block | ≥2 escape `when:` guard conditions re-enumerated in `## Stop` body |
| C7 | `duplicate-phrase` | AB1/P1 | warn≥3,block≥4 + verbatim-block | shingles n=6..12 + ≥3 contiguous duplicated lines |
| C8 | `caveman-footer-dup` | AB1/P1 | block>1 | PR4/caveman reminder outside the one Register block |
| C9 | `register-compliance` | PR4 | block on pleasantry/filler; warn on article density | caveman absolute, no exception |

## Generalize per artifact type (file-06)

Linter parameterized by `{artifact-type, thresholds}` (`PROFILES` in `lint.mjs`). Prompt `.md` thresholds
inline. Other artifact thresholds belong in the **stack profile**, not hard-coded. C2/C3/C5/C6 are
prompt-frontmatter-specific → gated behind type so a plain ADR body skips them while C1/C4/C7/C8/C9 still apply.

## What lint CANNOT do (→ Layer-2 AUDIT, T05)

Semantic duplication (same fact reworded — the ×12), no-objective prose, two-way wording beyond the
wordlist, legit-vs-bloat judgment on a long-but-dense prompt (C1 is a signal, not a verdict). A single
line duplicated exactly 2× sits below C7's spec thresholds (≥3) — multi-line verbatim blocks at 2×
ARE caught (contiguous-run rule). Lint short-circuits the obvious; AUDIT spends tokens on the residue.

## Wiring (T06, not done here)

`_orchestrator.md` STEP 4 step-0 (before runner spawn): lint scratch → `lint.json`. blocked → route to
re-author (DELETE/REWRITE, never ADD), skip the expensive sim. clean → proceed to AUDIT then clean-room.
