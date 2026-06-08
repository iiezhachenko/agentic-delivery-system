# T02 — Codify economy as stack-independent pipeline canon (spec P13 + economy INV)

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

Agents bloat every prose artifact (prompt, aPRD, ADR, HLD, roadmap) by ADDING text. KEY insight: **every artifact the pipeline emits is the NEXT agent's prompt context.** SYNTHESIZE's aPRD → SLICE-EXTRACT reads it; EVALUATE-DECIDE's ADR → DERIVE-COMPONENTS reads it; HLD → IMPLEMENT reads it. Bloat in an ADR = bloat in IMPLEMENT's prompt, one step removed, SAME cost. Bloat COMPOUNDS along the chain — read more times by more agents than a single prompt.

Audit-confirmed disease in non-prompt artifacts: spec-03 states constraint "H14" 6×; ADR Decision blocks narrate whole working sessions + embed TODOs; docs triplicate idempotency facts across 3 files.

Today the anti-bloat rules (AB1–AB6) live ONLY in `.hld/skeleton/coding-canon.md`, framed as "prompt-domain idioms", surfaced only under the PROMPT stack's coding-canon field. That binds economy to ONE stack. Wrong home for a UNIVERSAL rule. The ADS builds OTHER systems (terraform, typescript) — economy must travel with the engine, not live in a self-host config.

## SCOPE

Make economy a first-class, stack-independent pipeline property with TWO homes:
1. A **core principle P13** in the spec principles table.
2. A **cross-slice economy invariant (INV / NFR `A*`)** that threads `R → AC → … → gate` like any requirement, so every stage's existing verify gate measures its output against it.

Does NOT build the linter/auditor (T04/T05) nor wire them (T06). This task gives the gate its ORACLE-at-spec-level: the requirement the gate enforces.

## GIVEN (current state, exact)

- Spec principles table: `.aprd/specs/00-automated-aprd-pipeline-spec.md` §2 "Core principles" (L43+). Holds P1–P12. P3 = "One spine, swappable playbooks". P11 = "LLM reconciles + verifies; not source of truth". P12 = "WHAT mapped broad, HOW built thin".
- Specs sit under `.aprd/`. `.aprd/aprd.frozen.md` + `aprd.lock` are FROZEN + signed + immutable (CLAUDE.md). Adding a principle = a change against frozen requirements → change-request, new version, re-trigger downstream. NEVER overwrite frozen in place.
- Economy currently expressed as design idiom D10 + AB1–AB6 (`.hld/skeleton/coding-canon.md`), NOT as a requirement-level NFR.
- VERIFY-OUTPUT (`prompts/04-build/VERIFY-OUTPUT.md`) already does NFR-wiring checks against cross-slice invariants — the hook the economy INV plugs into.

## DO

1. **Author P13** (paste-ready row for the §2 principles table). Stack-independent wording:

   | ID | Principle | Failure it prevents |
   |---|---|---|
   | P13 | Every produced artifact is downstream context — author to context-economy | Bloat compounds along the chain; each stage's output dilutes every downstream agent's attention |

   Body line for the principle: *"A pipeline artifact's primary consumer is the next agent. Economy (one home per fact, every statement earns its place, single interpretation) is universal, consumer-independent, stack-independent. Distinct from caveman register (also absolute on every artifact — T01); both bind all prose. Both-terse-and-DRY required; terse-but-repetitive still fails economy."*

2. **Define the economy INV** as a cross-cutting NFR (`A*`-class), threaded like security/auth:
   - It is a cross-slice invariant the foundation-cut carries (so it's not per-slice re-derived).
   - VERIFY-OUTPUT's NFR-wiring check measures each stage's emitted artifact against it.
   - Acceptance form (testable, per P2-spec "done = testable contract"): *"For artifact X: every load-bearing fact appears exactly once; every statement maps to a downstream reader action; no statement is readable two ways (or is marked `judgment call:`). Both-directions: planted-duplicate FAILs, planted-omission FAILs."*

3. **Mark the stack-independent / stack-specific split** in the principle's note (consumed by T03 + T07):
   - Universal layer (here, spec): the economy RULE itself.
   - Stack-specific layer (code-canon profile): only what "one home" MEANS per stack (a prompt section vs a `.tf` resource vs a TS module).

4. **Change-request mechanics** (immutability): produce the P13 + INV addition as a change-request against frozen aPRD — new aPRD version, re-lock, re-trigger affected downstream stages. Do NOT edit `aprd.frozen.md` / specs in place without versioning. If specs are governed by `aprd.lock`, bump that lock per the project's freeze ritual.

## ACCEPTANCE

- P13 present in §2 principles table, stack-independent wording, one home.
- Economy INV defined as `A*` NFR with a TESTABLE acceptance (both-directions, substance floor named).
- Split (universal vs stack-local) stated once, so T03 (coding-canon REFERENCES P13, doesn't re-own it) and T07 (per-project inheritance) have a clean source.
- Change-request path honored: frozen aPRD not overwritten in place; new version + lock; downstream re-trigger noted.
- No duplication: P13 stated once; INV stated once; coding-canon will CITE, not copy (T03).

## DEPENDS ON / BLOCKS

- Depends on: T01 (caveman-absolute + economy as separate absolute invariants; P13 wording relies on it).
- Blocks: T03 (coding-canon references P13), T06 (gate enforces the INV), T07 (project inheritance of P13 + INV).

## OUT OF SCOPE

AB7–AB9 prompt-stack rules (T03). Linter (T04). Auditor role (T05). Wiring (T06).
