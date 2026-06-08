# T07 — Per-project inheritance: economy ships with the engine

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

The ADS is a GENERIC engine (principle P3 — one spine, swappable playbooks). It builds OTHER systems (terraform, typescript, …), not just self-host. When it builds a terraform system it STILL emits a PRD, ADRs, an HLD, a roadmap — same prose artifacts, same downstream-context role, SAME bloat disease. If economy lives only in the self-host config, every client project starts un-gated. The bar must travel WITH the engine, automatically, not be re-wired per project.

## SCOPE

Make economy inherited by default for every project the ADS builds. Three mechanisms, leaning on T02 (P13 + INV stack-independent) and T06 (shared auditor wiring). Plus: split universal-vs-stack-local cleanly so a stack swap inherits economy for free.

Does NOT re-define P13/INV (T02 owns). Does NOT build the gate (T04–T06). This task makes the EXISTING canon + gate cross-project by default.

## GIVEN (current state, exact)

- `code-canon/agentic-delivery-pipeline.md` — the active stack profile (6 fields). Sibling profiles a future project drops next to it: `code-canon/terraform.md`, `code-canon/typescript.md` — fill the same fields against their own stack. Spine reads profile; never special-cases (invariant #1).
- Today AB1–AB6 live in `.hld/skeleton/coding-canon.md` framed as "prompt-domain idioms (D21 field 2)" — binds economy to ONE stack. WRONG home for a universal rule.
- foundation-cut (`prompts/01-roadmap/FOUNDATION-CUT.md`) cuts cross-cutting invariants into a project's foundation slice (like security/auth) — the hook a cross-project INV plugs into.
- T02 produced spec P13 + a cross-slice economy INV (`A*` NFR). T06 wired ONE shared ECONOMY-AUDIT invoked by every phase gate.

## DO

1. **Confirm the universal/stack-local split** (relocation; depends T02):
   - **Universal layer (pipeline canon / spec):** the economy RULE itself = P13 + the economy INV. Stack-independent. Already in the spec (T02).
   - **Stack-local layer (code-canon profile):** ONLY what "one home" MEANS for that stack's code unit — a prompt section (prompt stack) vs a `.tf` resource (terraform) vs a TS module (typescript). The economy RULE does NOT live here; the profile CITES P13 + fills stack-local realization.

   ```mermaid
   flowchart TD
     subgraph U [STACK-INDEPENDENT — pipeline canon]
       ECON[Economy invariant P13 + INV<br/>governs ALL pipeline prose]
     end
     subgraph S [STACK-SPECIFIC — code-canon profile]
       P1p[prompt: 'one home' = prompt section]
       P2p[terraform: 'one home' = .tf file]
       P3p[typescript: module idioms]
     end
     ECON --> S
   ```

2. **foundation-cut default INV.** The economy INV is cut into EVERY project's foundation slice by default — cross-cutting, like security/auth. So VERIFY-OUTPUT's NFR-wiring check measures every stage's output against it in any project, not just self-host. Add to FOUNDATION-CUT's standing cross-cutting INV set (or its spec §) so it's automatic, not opt-in.

3. **Stack profile contract.** Document (in the profile template / the active profile's notes) that EVERY stack profile must: (a) cite P13 + the economy INV (don't re-own), (b) fill the stack-local "one home" definition, (c) supply per-artifact-type lint thresholds (T04 reads these). A profile that omits these = incomplete.

4. **Shared auditor reused, not re-built.** The ONE ECONOMY-AUDIT (T05) + lint (T04) run at every phase gate of any project (T06 wiring). A new stack does NOT author its own auditor — it parameterizes the shared one with `{artifact-type, stack thresholds}`.

## ACCEPTANCE — per-project inheritance verified

For a hypothetical non-self-host project (e.g. terraform), confirm it gets economy FOR FREE:
1. P13 inherited as a standing NFR via spec → its aPRD synthesis carries it.
2. Economy INV cut into its foundation-cut by default (no manual wiring).
3. Its stack profile (terraform.md) cites P13 + fills terraform-local "one home" (a `.tf` resource) + thresholds.
4. The shared ECONOMY-AUDIT runs at every phase gate, same as self-host.
- Stack-swap test: swapping the stack profile must NOT require a spine edit to keep economy (invariant #1). If it does, the abstraction leaked — fix the spine once, not the profile.
- Economy RULE has ONE home (spec); no profile re-states it (meta-AB1).

## DEPENDS ON / BLOCKS

- Depends on: T02 (P13 + INV), T06 (shared-auditor wiring to generalize).
- Blocks: T08 (remediation proceeds against the now-cross-project canon).

## OUT OF SCOPE

Defining P13/INV (T02). Building lint/auditor (T04/T05). Wiring mechanics (T06). Re-authoring prompts (T08–T10).
