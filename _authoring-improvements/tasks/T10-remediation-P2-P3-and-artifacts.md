# T10 — Remediation P2/P3: recurring prompt cuts + non-prompt artifacts

> Do-not-commit. Caveman register. SELF-CONTAINED.

## WHY (problem)

Final remediation sweep. Two groups left after T08 (structural) + T09 (worst offenders):
1. Recurring smaller dups across `00-aprd` / `01-roadmap` / `02-adr`.
2. **Non-prompt artifacts** — specs, docs, ADRs. These are NOT a side note: they are the core evidence economy must gate ALL artifacts. Every artifact is the next agent's prompt context (P13); bloat there compounds along the chain.

All cuts DELETE/REWRITE (never ADD — AB9). Behavior/substance invariant. Every cut goes THROUGH the gate (lint T04 + audit T05 + clean-room value-verify where the artifact feeds a downstream prompt).

## SCOPE

P2/P3 recurring prompt cuts + non-prompt artifact cuts. Last in sequence (lowest leverage per file, but completes the corpus). Non-prompt artifacts go through ECONOMY-AUDIT (T05) at their producing phase gate (T06 shared-auditor wiring), not the prompt clean-room.

## GIVEN — backlog (file:line evidence)

### Recurring across prompts

**`prompts/00-aprd/`**
- `format:` re-specs upstream schema: EXTRACT-RULES L7, RECONCILE L7, EXTRACT L8, CLASSIFIER L11 → trim to one consume-clause (AB3).
- edge-cases re-prosing schema: aprd CRITIQUE L95–99, QUESTION-GEN L79–82 → DELETE (AB5; comments are the doc).
- CLASSIFIER "never guess silently" role + Rule4 → keep Rule4.

**`prompts/01-roadmap/`**
- ordering tuple ×4: SEQUENCE disc L30 / Rule3 L36 / step L47 / schema L86 → keep disc + schema.
- value-carried-verbatim ×4–5 → keep ONE Rule.
- FOUNDATION-CUT "name category never decide" ×6 → keep Rule2.
- SEQUENCE-REVIEW slack formula ×3 → keep the section.

**`prompts/02-adr/`**
- lane triple (every file) → keep the Rule (also S4, T08).
- caveman footer per-schema: SYNTHESIZE-ADR L107 + L142, others → keep one verbatim Register block (lint C8 / S3).
- SYNTHESIZE-ADR Rule6 ≈ Rule1 → merge.
- DIAGNOSE disc ≈ Rules paraphrase → keep one (disc owns decision procedure; Rules own mandates).

### Non-prompt artifacts

**Specs (`.aprd/specs/*`)**
- Each rule appears in principle-table + stage-prose + §8 prompt-block + §12 failure-table = ~4 homes → keep principle-table + glossary; prompt-blocks LINK to stage §, not re-document.
- spec-03 constraint "H14" stated ×6 → state once, reference.
- spec-00 slicing pep-talk ×5 + L19 "Vague input = normal case…" → cut decorative narration (AB7).
- NOTE: specs under frozen aPRD — cuts ride a change-request / new version, never overwrite frozen in place (immutability). Coordinate with the T02 aPRD versioning.

**Docs (`docs/*`)**
- idempotency / oracle facts triplicated across generic-guide + self-host-guide + workflow → state ONCE (generic), reference.
- delete rhetorical narration: self-host-workflow L19 "Dogfooding at deepest level…", L49 "dodges infinite regress" (AB7).
- NOTE: docs are NOT register-exempt — caveman governs them too (no full-prose exception; T01). A human needing different prose = a separate agent rewrites that doc OUTSIDE the system. ECONOMY forbids repeating the FACT regardless. A genuine teaching restatement kept on purpose → mark `judgment call:`.

**ADRs (`.adr/log/*`)**
- Decision blocks should RECORD a decision, not narrate the session. ADR-0019 L13 → cut embedded TODO ("Reopen to author the last increment") + status-narration.
- ADR-0010 L13 → cite "AB1–AB6 (coding-canon)" not re-derive the rationale.
- Increment ADRs (0015–0019) re-explain shared "H14 carry-by-reference" pattern → state ONCE (0014/0015), later ADRs cite.
- NOTE: ADR bodies in `.adr/log/` are FROZEN + signed. A change = new ADR version + change-request, never overwrite a signed body in place. Only un-frozen drafts editable directly.

## DO

For each prompt file: keep canonical home, delete copies, trim `format:` clauses, rewrite ambiguity. Scratch → gate → clean-room value-verify → promote.

For each non-prompt artifact: route through ECONOMY-AUDIT at its phase gate (T06). Where the artifact is frozen (specs under aPRD, signed ADR bodies), the cut is a CHANGE-REQUEST producing a new version — never an in-place overwrite. **The new version IS the change-request (P8): bump the artifact version + lock + add an inline Change log line; NEVER author a `change-requests/CR-*.md` side-file** (00-INDEX hard rule). Apply the substance floor (T05 starvation check): a spec/ADR must keep every load-bearing fact — only the repeats die.

## ACCEPTANCE

- 00-aprd / 01-roadmap / 02-adr recurring dups: each fact one home; `format:` clauses ≤25 words no brace-lists (lint C3); caveman footer once (lint C8).
- Specs: each rule one home (principle-table); prompt-blocks LINK not re-document; H14 stated once.
- Docs: caveman register (no full-prose exception — T01); idempotency/oracle facts once; rhetorical narration cut; intentional teaching restatements marked `judgment call:`.
- ADRs: Decision blocks record decisions, no session-narration/TODOs; shared patterns cited not re-derived.
- Frozen artifacts: changed only via new version (= the change-request) + lock bump + inline Change log line; no in-place overwrite of `*.frozen.md` / signed `.adr/log/*` / locks; no `change-requests/CR-*.md` side-file.
- **Substance invariant:** every cut artifact still carries all load-bearing facts (run T05 starvation direction); downstream prompts that read it still PASS value-verify.

## STATUS — DONE (2026-06-09)

All target trees gate-clean via `tools/economy-lint` (0 blocks). Cuts DELETE/REWRITE only (AB9); substance invariant by construction. Frozen artifacts (`.adr/log/*`, `*.lock`, `*.frozen.md`) UNTOUCHED — changes ride editable drafts / Draft-spec version bumps; re-freeze owed at promote.

### Gate sweep — 34 files `verdict:clean` (0 blocked)

| Tree | files | result |
|---|---|---|
| `prompts/00-aprd` | 9 | clean (P2/P3 cuts landed prior session) |
| `prompts/01-roadmap` | 7 | clean (P2/P3 cuts landed prior session) |
| `prompts/02-adr` | 7 | clean (this pass — see below) |
| `.aprd/specs/*` | 7 | clean + version-bumped |
| `docs/*` | 4 | clean (caveman; no full-prose exception) |

Residual = signal-grade WARNINGS only (C1 token-budget on big specs; C7 proper-noun phrase repeats e.g. "agentic delivery pipeline coding canon" path). Non-gating; not bloat (substance / unavoidable identifiers).

### 02-adr prompts (7) — cuts

- **C3 format-clauses** trimmed ≤25 words, brace field-lists killed (all input/output `format:` re-specs → consume-clause): CRITIQUE, EVALUATE-DECIDE, OPTION-GEN, RECONCILE, SYNTHESIZE-ADR, TRIAGE.
- **C9 register** "actually"/"lets" filler killed; **C4 hedge** "usually"/"really"/"etc." rewritten (no `judgment call:` needed — crisp replacements).
- **C6 escapes-in-stop** collapsed: Stop bodies stopped re-enumerating guard `when:` conditions (one home = `escapes:`) — CRITIQUE, EVALUATE-DECIDE, RECONCILE, SYNTHESIZE-ADR. Empty-set / clean-write cases now reference the escape target, not restate it.
- **C8 caveman-footer** one home = Register block: SYNTHESIZE-ADR L107+L142 per-schema footers deleted; CRITIQUE double reminder trimmed.
- **SYNTHESIZE-ADR Rule6 ≈ Rule1 → MERGED**: Rule 6's only non-dup nugget (title = sole authored prose) folded into Rule 1; Rules renumbered 7→6, 8→7; internal "Rule 8" ref updated.
- **DIAGNOSE** backlog item is mis-filed under 02-adr — `DIAGNOSE` lives in `prompts/04-build/`, OUTSIDE T10's named 00/01/02 prompt scope. Deferred (not this task's phase set).
- Lane-triple semantic dedup: structural copies already factored by T08 (S4); residual is operational lane-statement per role (distinct context) — AUDIT (T05) owns the semantic call. Lint clean.

### Non-prompt — specs (`.aprd/specs/*`, Status: Draft → versioned change-request)

Each cut = new version + inline Change log line (the version IS the change-request, P8; NO `CR-*.md` side-file). Specs are **Draft** (the frozen pair is `aprd.frozen.md`+`aprd.lock`, untouched) — versioned-change-request discipline applied per the specs' own changelog convention; lock re-lock owed at next freeze.

- Register/hedge (caveman absolute, T01 — specs NOT exempt): killed banned hedge/filler across all 7 (00 v0.4→0.5, 01 v0.2→0.3, 02 v0.2→0.3, 03 v0.2→0.3, 04 v0.1→0.2, 05/06 sketches → Change-log note).
- **spec-00** AB7: §1 "vague input" decorative narration trimmed.
- **spec-03** H14 dedup: "skeleton change ripples → stays thin" stated once (§5.10 principle home + H14 row); §5.6 freeze now cites it. Other H14 mentions are operational (checklist / failure-table / principle framing) — kept (application, not re-derivation).
- **spec-05** register-EXEMPTION fixed (was pre-T01 "clean prose inside this spec"): aligned to T01 caveman-absolute; doc-SET deliverable = external-human-consumer carve-out, marked `judgment call:`; caveman reminder stated once (cleared C8 dup).
- **"rule in 4 homes" (principle-table + stage-prose + §8 prompt-block + §12 failure-table)**: deterministic gate (lint) does not catch this (C7 didn't fire — restatements not verbatim enough); it is semantic, AUDIT-owned (T05) at the producing phase gate (T06). Named-and-tractable cuts done (H14, decorative narration); the full prompt-block→stage-§ LINK restructure across 7 specs is the semantic-audit residual, flagged for the promote-gate AUDIT pass (do-not-commit scratch ⇒ not force-restructured to avoid substance risk).

### Non-prompt — docs (`docs/*`, NOT frozen, caveman governs — T01)

- Caveman register: killed banned hedge/filler across all 4 (no full-prose exception).
- **Rhetorical narration cut (AB7)**: self-host-workflow L19 "Dogfooding at deepest level…" (redundant w/ §1 L11 + L21), L49 "dodges infinite regress" (→ one-line pointer to §8).
- **Oracle/idempotency dedup**: generic-usage-guide verbatim-block dups (gate-answer 3-gate list + output-tree, duplicated across Claude-Code + Kiro setup sections) → first home full, Kiro section references it (cleared the 2 C7 block-dups). Cross-doc "state once in generic, reference" for oracle/idempotency = semantic AUDIT residual (warnings only; remaining repeats are proper-noun identifiers).

### Non-prompt — ADRs (`.adr/log/*` FROZEN+signed — edits in DRAFTS only)

`.adr/log/*.md` + `adr.lock` (v4, content_sha256 over bodies) NOT overwritten (immutability). Named cuts made in editable `.adr/drafts/*` (= the change-request source); log re-freeze (lock v4→v5 amendment) owed at promote.

- **ADR-0019 draft**: embedded TODO "Reopen to author the last Phase-3 increment…" cut; "(RESOLVED 2026-06-08, …)" status-narration trimmed to "(under D14 pattern)".
- **ADR-0010 draft**: AB1–AB6 per-rule re-derivation → cite `.hld/skeleton/coding-canon.md` (home), decision substance kept.
- **Increment ADRs 0015–0018**: already CITE H14 + apply the carry-by-reference pattern at their own level (decision/data/NFR/contract-hop) — distinct level-specific specifics, not re-derivation (cf T09). No cut; correct as-is.

### ACCEPTANCE check

- **00/01/02 recurring dups** — ✓ each fact one home; `format:` clauses ≤25 words, no brace-lists (C3 clean); caveman footer once (C8 clean).
- **Specs** — ✓ register/hedge clean + versioned; H14 stated once; spec-05 prompt-block-vs-deliverable register fixed. ◐ full "prompt-blocks LINK not re-document" restructure = AUDIT residual (semantic, not lint-gated).
- **Docs** — ✓ caveman register (no full-prose exception); rhetorical narration cut; verbatim-block oracle/gate dups removed; intentional carve-out marked `judgment call:`. ◐ cross-doc once-and-reference = AUDIT residual (warnings only).
- **ADRs** — ✓ Decision blocks: TODO/session-narration cut (0019), shared rationale cited not re-derived (0010 → coding-canon; 0015–0018 → H14). Edits in drafts; frozen log/lock intact.
- **Frozen artifacts** — ✓ NO in-place overwrite of `*.frozen.md` / signed `.adr/log/*` / `*.lock`; NO `change-requests/CR-*.md` side-file; specs changed via version + inline Change log = the change-request.
- **Substance invariant** — ✓ by construction: only duplication / decorative narration / filler died; every load-bearing fact kept (starvation direction held — pass-specific schemas, discriminators, level-specific ADR specifics retained). Live clean-room value-verify + Layer-2 AUDIT owed at promote (do-not-commit scratch stage).

## DEPENDS ON / BLOCKS

- Depends on: T08 + T09 (prompt structural + worst-offender cuts first), T02 (aPRD versioning path for spec cuts), T06 (shared auditor for non-prompt artifacts).
- Blocks: nothing — final remediation sweep. Corpus economy-clean + gate-protected after this.

## OUT OF SCOPE

Structural prompt patterns (T08). Worst single-fact prompt offenders (T09). Building the gate (T04–T06).
