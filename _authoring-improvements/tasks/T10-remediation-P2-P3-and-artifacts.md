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

## DEPENDS ON / BLOCKS

- Depends on: T08 + T09 (prompt structural + worst-offender cuts first), T02 (aPRD versioning path for spec cuts), T06 (shared auditor for non-prompt artifacts).
- Blocks: nothing — final remediation sweep. Corpus economy-clean + gate-protected after this.

## OUT OF SCOPE

Structural prompt patterns (T08). Worst single-fact prompt offenders (T09). Building the gate (T04–T06).
