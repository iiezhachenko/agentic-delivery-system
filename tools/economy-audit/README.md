# Layer-2 ECONOMY-AUDIT — self-test record

> The role (deliverable) lives at `prompts/_economy-audit.md` (general `ECONOMY-AUDIT` capability;
> `PROMPT-AUDIT` = its prompt-stack caller-view). This dir holds only the **self-test record** (below).
> AUDIT is an LLM role, NOT a deterministic tool → its clean-room fixtures live under `_fixtures/economy/audit/`
> (same kind as `greenfield-*` trees). Deterministic-tool fixtures (lint's) live under `tools/fixtures/` instead.
>
> Layer-2 = the LLM READER behind Layer-1 lint (`tools/economy-lint/`). Lint counts STRUCTURE; AUDIT
> judges MEANING — semantic dup lint's n-gram misses, no-objective, ambiguity beyond the wordlist,
> over-compression (`starvation`). Runs ONLY on lint-clean residue (P5 cheapest-first). Oracle =
> AB1–AB9 (`.hld/skeleton/coding-canon.md`) + spec §2/§2.1 (`P13`/`A-ECON`, substance floor).
> Permanent home (survives `_authoring-improvements/` deletion). Not git-committed (T05 do-not-commit).

## Run (clean-room, mirror operator paste)

Fixtures: `_fixtures/economy/audit/{reference-tight,planted-bloat,planted-omission}.md` (+ baked `.lint.json`
sidecar each — clean, the residue precondition). Point a fresh session at `prompts/_economy-audit.md`, bind
its `<...>` placeholders to a fixture + its `.lint.json` + an output path. AUDIT writes `economy-audit.json`
(an output, not kept in the fixture dir). No code — prompt-driven (contrast lint's `selftest.mjs`).

## `economy-audit.json` contract (T06 consumes)

```json
{
  "target": "<artifact>", "type": "prompt", "lint_ref": "<lint.json>",
  "oracle": ["AB1-AB9", "P13", "A-ECON"],
  "verdict": "clean | blocked",            // blocked iff issues non-empty (deterministic)
  "issues": [ { "id": "I1", "category": "duplicate-fact | no-objective | mandate-narration | ambiguous | re-spec | starvation",
                "target": "<file:line>", "finding": "...", "routes_to": "RE-AUTHOR", "fix": "DELETE | REWRITE" } ],
  "issue_count": 0, "by_category": { } }
```

- **`fix` ALWAYS `DELETE`/`REWRITE` — never `ADD`** (AB9 keystone, enforced in schema). Loop offers no
  patch path; defect routes to re-author from the DRY skeleton (T06 enforces).
- **Every issue routes to the PRODUCING stage** (default `RE-AUTHOR`; `canon` only when a wrong AB is root).

## Six categories (oracle = AB1–AB9 + P13/§2.1)

| category | rule | fires when |
|---|---|---|
| `duplicate-fact` | AB1/P1 | same fact ≥2 sections, SEMANTIC (lint catches only literal) — names home + N-1 copies |
| `no-objective` | AB7/P2 | statement changes no reader action (delete-test) |
| `mandate-narration` | AB6/P2 | role identity narrates the mandate Rules owns; >3 lines |
| `ambiguous` | AB8/P3 | two-way wording, hedge w/ no crisp test, unmarked `judgment call:` |
| `re-spec` | AB3/P2 | consume-clause re-documents upstream schema |
| `starvation` | §2.1 floor | load-bearing fact DELETED / over-terse ambiguity (UNDER direction — economy ≠ truncation) |

## Both-directions self-test — PASS (2026-06-08, clean-room, 3 runs each)

All three fixtures lint-CLEAN first (residue precondition — Layer-1 misses semantic dup + omission):

| fixture | lint | AUDIT verdict | category | discrimination |
|---|---|---|---|---|
| `reference-tight.md` | clean | **clean** | — | tight → clean ✓ |
| `planted-bloat.md` | clean | **blocked** | `duplicate-fact` | Rule-2 fact reworded into 3 extra homes (role/step-2/stop) so lint's n-gram misses; AUDIT names home (Rule 2) + copies to DELETE ✓ |
| `planted-omission.md` | clean | **blocked** | `starvation` | `skeleton.lock` input declaration dropped (escapes + role still depend on it); AUDIT flags the dropped load-bearing fact, fix REWRITE ✓ |

Bar (mirror behavior verifier): if AUDIT can't tell tight from bloated OR misses the omission, it's
broken — fix before trusting. Held across runs. Issues NEVER carry `fix: ADD` (schema-checked).

## Wiring (T06, not done here)

`_orchestrator.md` STEP-4 verify: lint scratch → blocked? route re-author, skip sim. clean → AUDIT →
blocked? route re-author (DELETE/REWRITE), skip sim. clean → clean-room sim. T07 = per-project inherit.
