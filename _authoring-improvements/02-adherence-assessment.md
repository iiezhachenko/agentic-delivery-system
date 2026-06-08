# Adherence assessment — whole tree vs P1/P2/P3 (AB1–AB6)

> Audited all 39 prompts + orchestrator + step-runner + 7 specs + sampled ADRs + docs. Findings cited file:line. Scored against P1 (anti-bloat/AB1), P2 (objective/AB3·AB5·AB6), P3 (single-interpretation — no AB rule yet). Severity: 🔴 systemic · �amber recurring · 🟢 clean.

## Scorecard by tree

| Tree | Verdict | Dominant violation |
|---|---|---|
| `prompts/03-hld/` (8) | 🔴 | two-pass split copies every shared rule A↔B; "one load-bearing thing" 3–4×; "never invent" 4–6× |
| `prompts/04-build/` (8) | 🔴 | role-identity load-bearing paragraph = verbatim Rule 1; lane in 3 homes; schema-footer prose re-lists schema comments |
| `prompts/00-aprd/` (9) | 🟠 | lane in role+Rule+Stop; `format:` re-specs upstream; schema-comment facts re-prosed in Rules/edge-cases |
| `prompts/01-roadmap/` (7) | 🟠 | ordering tuple / value-carried-verbatim stated 4–5×; RE-RANK re-lists guards in Stop (AB2) |
| `prompts/02-adr/` (7) | 🟠 | lane triple (role+Rule+Stop); caveman footer per-schema; discriminator≈Rules paraphrase |
| `_orchestrator.md` | 🟠 | "no bookkeeping" ×3; "never read tracker" ×3; Model rationale in role identity |
| `_step-runner.md` | 🟢 | cleanest (24 ln); one minor decorative clause L11 |
| `.aprd/specs/*` | 🟠 | each rule in principle-table + stage-prose + prompt-block + failure-table = ~4 homes |
| `.adr/log/*` | 🟠 | Decision blocks narrate working sessions + TODOs; increment ADRs re-explain shared H14 pattern |
| `CLAUDE.md` | 🟢 | tight; minor "why" narration L7 |
| `docs/*` | 🟠 | idempotency/oracle facts triplicated across guide+guide+workflow (some pedagogically intentional) |

## P1 — anti-bloat / one-home-per-fact (the dominant failure)

### Worst single-fact offenders (count = homes the same fact occupies)

| Fact | Prompt | Homes | Citations |
|---|---|---|---|
| "design-layer oracle, NOT aPRD acceptance oracle" | DERIVE-TESTS | **12** | role L54, A-Rule2 L75, B-Rule5 L235, schema `layer` L107/L269 (+ scattered) |
| "MODEL-DATA never mints an E*" | MODEL-DATA | **6** | input L9, escape L31, B-test L162, Rule5 L180, Rule9 L184, schema L240 |
| anti-gold-plating "cache/queue/replica FORBIDDEN" | MAP-NFR | **5** | role L48, disc L65, Rule6 L73, B-test L157, Rule5 L175 |
| "carry the framework, don't re-pick" | INTEGRATE | **4** | product4 L49, Rule4 L57, Rule5 L58, schema L103 |
| "value client-owned, never re-scored" | SEQUENCE/RE-RANK | **4–5** | SEQUENCE Rule4/7/8 + schema; RE-RANK role L30, disc L39, Rule5 L47, schema L87 |
| "never re-reconcile / carry verbatim" | aprd VERIFY | **5** | role L24, Rule1 L37, Rule5 L42, Rule7 L44, Stop L138 |

### The structural drivers (fix these, most duplication dies)

1. **🔴 Two-pass skeleton/increment split (all 8 03-hld prompts).** Part A and Part B each carry a full Rules block; shared rules (lane, P5/P11 grounding, "named-not-designed", failure-variant-mandatory, "invent nothing") are copied into both. This is the single biggest line driver. RECONCILE-CRITIQUE even says "Part A's exonerations all carry over" (L166) then re-lists them (L184). DERIVE-TESTS' 8-item lane list is verbatim in A-Rule9 L82 and B-Rule10 L240.
   → **Fix:** one shared rule block + per-pass DELTA only. Mode-specific rules stay; shared rules factor up. Mirrors how D14 dual-mode is meant to work (one role, two modes — not two prompts glued).

2. **🔴 Role-identity = verbatim Rule 1 (all 8 04-build prompts).** The "load-bearing thing" paragraph in role identity restates Rule 1 / the discriminator word-for-word. VERIFY-OUTPUT L38 = ~9-line sentence duplicating disc L40-47 + Rules 1/3/5. AB6 caps identity at 3 lines.
   → **Fix:** identity states who/one-thing/lane-pointer in ≤3 lines; the mandate lives in Rules. Delete the paragraph.

3. **🔴 Schema-footer prose re-lists schema comments (corpus-wide 04-build + many).** Nearly every file closes its schema with "On a clean run X==Y, []..." that re-states invariants already in the inline field comments (AB5). MATERIALIZE-ORACLE L180, INTEGRATE L160, BUILD-PLAN L126, VERIFY-OUTPUT L186.
   → **Fix:** delete the footer; the comments ARE the doc (AB5).

4. **🟠 lane triple — role + "Stay in lane" Rule + Stop condition.** EVERY schema-bearing prompt. The negative lane ("no X, no Y, no client touch") appears in all three. One home (the Rule) suffices.
   → **Fix:** delete from role identity (point to Rule) and from Stop (Stop names terminal outcomes, not the lane).

5. **🟠 discriminator ≈ Rules paraphrase.** DIAGNOSE: the 5 ordered gates (disc L36) and Rules 1-6 (L47-54) are the same content twice. aprd CRITIQUE, 04-build CRITIQUE: "lane vs sibling-role" section restated in Rule + role.
   → **Fix:** discriminator owns the decision procedure; Rules own the mandates; don't paraphrase one into the other.

6. **🟠 AB2 breach — escapes re-listed in Stop.** RE-RANK Stop L130-133 re-enumerates guard categories already in `escapes:` frontmatter. DERIVE-TESTS Stop L205-207. Several 03-hld.
   → **Fix:** Stop says "guard tripped → HALT (escapes)", names no specific guard.

## P2 — every statement has an objective

- **🔴 mandate-narration in role identity (AB6).** RESOLVE-LOCAL L55-56 opens with 2 sentences of Phase-2 history before stating lane. RECONCILE-CRITIQUE L60-61 "read as an adversary who wants the design wrong, hunting an orphan requirement..." — decorative, the 7 categories own it. Orchestrator L18 puts Model-choice rationale ("the earlier Opus pass is retired") in the role block.
- **🔴 `format:` re-specs upstream schema (AB3).** EXTRACT-RULES L7, RECONCILE L7, DERIVE-TESTS L14/L19, RESOLVE-LOCAL L9, DEFINE-CONTRACTS L13, MAP-NFR L9 — each re-documents the producer's full field set + smuggles processing rules into the `format:` clause. AB3: one clause, what THIS prompt consumes.
- **🟠 schema-comment facts re-prosed (AB5).** aprd CRITIQUE edge-cases L95-99 re-explain verdict/issues semantics already commented L80/L81/L90. QUESTION-GEN edge-cases L79-82 = verbatim template comment L70. GAP-DETECT Rule4 `recommended_default` = schema comment L76.
- **🟠 decorative spec/doc narration.** spec-00 L19 "Vague input = normal case. Clients don't know what they want until they see it." spec-03 H14 stated 6×. self-host-workflow L19 "Dogfooding at deepest level..." / L49 "dodges infinite regress" — rhetorical, no extraction objective.
- **🟠 ADR Decision blocks narrate sessions + TODOs.** ADR-0019 L13 = ~400-word paragraph with embedded status + meta-instruction "Reopen to author the last increment" (a TODO, not a decision). ADR-0010 L13 re-derives AB1-AB6 rationale that coding-canon already owns.

## P3 — single interpretation (NO current AB rule covers this)

Cluster on fuzzy boundaries stated with soft qualifiers + no crisp test:

| Prompt | Line | Ambiguous wording | Why two readings |
|---|---|---|---|
| SLICE-EXTRACT | Rule4 L38 | "too big / too small" | no mechanical bound on split/merge |
| VERTICALITY-CHECK | Rule4 L43 | "vague-but-watchable", "imperfect prose" | pass/reject line left to vibe |
| RECONCILE (aprd) | L31 | "meaning same thing" | no test for when two settings are "same" |
| GAP-DETECT | Rule6 L48 | "loosely related", "directly drives" | what to cite in refs reads ≥2 ways |
| EXTRACT | L32 | "merely plausible" vs "necessary consequence" | implied-bar stated 3× with drift |
| RESOLVE-LOCAL | L80/L83 | "genuinely unsure", "when in doubt defer" | resolve/defer boundary by feel |
| aprd VERIFY | L52 | "(= 14 for standard input)" | is 14 mandatory or illustrative? |
| MAP-NFR | L58 vs L104 | "latency/performance" vs enum "latency" | label drift across homes |
| 04-build CRITIQUE | L50/L52/L54 | "regardless of"/"even on mocked path"/"EVEN on untested path" | one condition phrased 3 ways → read as 3 conditions |

Some fuzz is inherent (INVEST sizing). But the rule should force: state the test ONCE, precisely; if genuinely judgment, say "judgment call:" explicitly so the reader stops hunting for a crisp test that isn't there.

## What's already good (don't regress)

- `_step-runner.md` — 24 ln, one purpose, no schema, no duplication. The model.
- DECISION-EXTRACT, ADR-0001 — tightest of their kind.
- CLAUDE.md — "holds only what is always true"; the constraint is respected.
- Guards mostly honor AB2 (Task-step-1 says "check guards (escapes)" without re-listing) — the discipline EXISTS, just leaks in Stop conditions.
- Inline-schema-comments-as-field-doc (AB5) is the right pattern where it's not duplicated by a prose footer.

## Quantified drift since ADR-0010

ADR-0010 retrofit hit 3135 lines across 26 prompts (~120 avg). Current 39 prompts = 6356 lines (~163 avg). 03-hld alone: 4 prompts >270 ln, top is 331. The two-pass prompts authored AFTER the retrofit (MAP-NFR onward, per ADR-0010 "author DRY from the start") are the LARGEST — the from-the-start DRY mandate was not met because nothing measured it. Direct evidence the advisory rule has no teeth.
