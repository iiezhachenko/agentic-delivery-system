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

---

## STATUS — DONE (not committed)

Makes the EXISTING economy canon + gate cross-project + inherited-by-default. No P13/INV redefine (T02), no lint/auditor build (T04/T05), no wiring mechanics (T06), no bloat re-author (T08–T10). Standing-INV addition is the wiring DO 2 sanctions ("or its spec §"), same category as T06's `_orchestrator` edit — not remediation.

### Deps confirmed
- **T02 DONE** — `P13` (spec-00 §2 table) + §2.1 economy invariant (`A-ECON` NFR + cross-slice `INV-ECON` + universal/stack-local split). Universal layer (the economy RULE) already in spec.
- **T03 DONE** — coding-canon AB1–AB6 framed as prompt-stack placement idioms; AB7–AB9 CITE `P13`/`A-ECON`, do not re-own.
- **T04 DONE** — `tools/economy-lint/` parameterized `{artifact-type, thresholds}`; prompt thresholds in `lint.mjs PROFILES`, non-prompt belong in stack profile.
- **T06 DONE** — ONE shared `ECONOMY-AUDIT` + lint wired into every phase gate; routing keystone (`fix DELETE|REWRITE`, no patch path).

### Changes (5 edits, 3 files)

**`.aprd/specs/01-automated-roadmap-pipeline-spec.md`:**
1. **§5.7** — `cross_slice_invariants` now TWO sources: aPRD-read (unchanged) + **engine-standing** `INV-ECON` (spec-00 §2.1, grounded `P13`/`A-ECON`) cut by DEFAULT into EVERY project, cross-cutting like security, stack-independent (P3) — VERIFY-OUTPUT NFR check measures economy in ANY stack, not opt-in.
2. **§6.1 schema** — `cross_slice_invariants` comment names the two sources + standing default.
3. **Version 0.1→0.2 + Change log** — change = new version (P8); downstream: `FOUNDATION-CUT` emits `INV-ECON[0]`.

**`prompts/01-roadmap/FOUNDATION-CUT.md`** (REALIZES the default — surgical wiring, not bloat re-author):
4. Discriminator 4 + Rule 4 + Task step 4 + output schema — `cross_slice_invariants[0]` ALWAYS engine-standing `INV-ECON` (default, grounded `P13`/`A-ECON`, carried-not-minted), then aPRD-read invariants (read, never invent). New project inherits economy without manual wiring; stack-independent (emitted by spine prompt, NOT read from profile → swap can't drop it).

**`code-canon/agentic-delivery-pipeline.md`:**
5. **Stack profile contract** section — every sibling profile (this, `terraform.md`, `typescript.md`) MUST: (a) CITE `P13`/`A-ECON` (never re-state — meta-AB1), (b) fill stack-local "one home" def, (c) supply per-artifact-type lint thresholds. Omitting any = incomplete. Active profile DEMONSTRATES: "one home" = a prompt SECTION (AB1); non-prompt thresholds table (adr/aprd/hld/roadmap token 6500/13000, C1·C4·C7·C8·C9; prompt thresholds cited in `lint.mjs`, not restated; C1 = TOKEN budget not lines — `07-bloat-metric-tokens.md`); new stack REUSES shared auditor/lint parameterized `{artifact-type, stack thresholds}`, never re-authors. Stack-swap = no spine edit (invariant #1).

### Acceptance — MET (hypothetical terraform project)
- [x] **1. P13 inherited via spec** → SYNTHESIZE reads spec-00 §2 principles; `A-ECON` NFR §2.1 carries into aPRD synthesis (T02; engine-universal, stack-blind).
- [x] **2. Economy INV cut by default, no manual wiring** → `FOUNDATION-CUT` emits `INV-ECON[0]` regardless of stack/aPRD (spec-01 §5.7 engine-standing source; realized on disk).
- [x] **3. Stack profile cites P13 + fills terraform "one home" (.tf resource) + thresholds** → stack profile contract (a)/(b)/(c) documented + named (`.tf` resource = terraform's "one home"); active profile demonstrates.
- [x] **4. Shared ECONOMY-AUDIT at every phase gate** → T06 five-callers wiring; profile note: new stack parameterizes shared auditor, never re-authors.
- [x] **Stack-swap test** → `INV-ECON` emitted by spine prompt + economy RULE in spec; profile holds only stack-local realization → swap inherits economy FREE, no spine edit (invariant #1). If swap needed spine change = leak → fix spine (P3).
- [x] **Economy RULE ONE home (meta-AB1)** → spec-00 §2.1 owns the rule; spec-01 §5.7, `FOUNDATION-CUT`, profile all CITE `P13`/`A-ECON`, none re-state it.

### Verify
- `grep -rln "INV-ECON" .aprd/specs/ prompts/ code-canon/` = spec-00, spec-01, `FOUNDATION-CUT`, `_economy-audit`, profile (threaded, rule not duplicated).
- `node tools/economy-lint/selftest.mjs` = PASS (lint untouched). Lint on the 3 touched files: pre-existing BLOCKs only (FOUNDATION-CUT frontmatter `format:` clauses + role-identity "when in doubt"; profile `caveman-footer-dup` rows) — all at lines NOT in T07 edits; my additions introduced ZERO new violations. Pre-existing bloat = T08–T10 remediation, out of T07 scope.
- DO-NOT-COMMIT honored.
