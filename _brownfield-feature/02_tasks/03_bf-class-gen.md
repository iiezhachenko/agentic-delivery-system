# Task 03 — BF-CLASS-GEN (CONFIG)

> Self-contained. Everything needed embedded below — do NOT hunt other files.

## TL;DR

Un-HALT `feature-add` in CLASSIFIER and generalize the hardcoded `class: greenfield  # only greenfield authored` line across all 39 role frontmatters to **playbook-injected dispatch**. Today every role hardcodes greenfield and CLASSIFIER escapes any non-greenfield class to "playbook not authored yet — HALT." With the feature-add playbook now present (Task 01), the route exists. Per **AB9**: DELETE/REWRITE the hardcoded line, NEVER ADD a parallel one. Mechanical; substance invariant. Satisfies **BF7** (re-entry routes, no HALT).

## Why this exists

Brownfield:feature re-enters at Phase 0 via a client change request classified `feature-add`. The classifier currently recognizes the class but HALTs because no playbook was authored. Task 01 shipped `prompts/_playbooks/feature-add.md`. This task flips the gate so `feature-add` routes to that playbook instead of halting. BF7: re-entry = change request that routes (no HALT).

## DAG position

- **Deps:** Task 01 (BF-PLAYBOOK) — the route target must exist before un-HALTing.
- **Downstream:** BF-EXTRACT (04) and all feature-add overlays run only once the class no longer HALTs.
- **Sentinel (done when):** CLASSIFIER routes `feature-add` to the playbook — golden `_fixtures/brownfield-feature/.aprd/01-classification.json` has `class=feature-add`, `needs_confirmation` not forced by class alone, and the non-greenfield-HALT escape ABSENT for feature-add.

## EMBEDDED CANON

This edits frontmatter prose + escape clauses — caveman + economy bind. **AB9 is the load-bearing rule here:** wrong/stale behavior is fixed by DELETE/REWRITE of the offending line, never by appending a clarifying instruction. Do not add a second `class:` line or a "but feature-add is now ok" caveat — rewrite the line in place.

**Register block** stays as-is in each role (don't touch it).

## Current state (what you're changing)

**1. CLASSIFIER (`prompts/00-aprd/CLASSIFIER.md`) — the gate.** Current relevant frontmatter:
```yaml
class: greenfield            # class-agnostic by design; only greenfield has downstream prompts authored yet
escapes:
  - { when: "needs_confirmation == true (confidence < threshold OR compound OR any subrequest non-greenfield)", target: "self / HALT — wait for client class confirmation before any downstream stage runs" }
  - { when: "a subrequest classifies as anything other than greenfield", target: "non-greenfield playbook — not authored yet; flag it, HALT, report" }
```
Current Rule 4 forces `needs_confirmation` when "any subrequest is non-greenfield." Current escape 2 hard-HALTs every non-greenfield class.

CLASSIFIER already emits all 8 classes (greenfield, feature-add, bugfix, refactor, migration, perf, integration, investigation) with `{class, confidence, reason}`. Only the routing of the result is stale.

**2. All 39 roles** carry a frontmatter `class:` line. Two observed phrasings:
- `class: greenfield            # class-agnostic by design; only greenfield authored yet` (and variants: "only greenfield has downstream prompts authored yet", "first pass; ... only greenfield authored").
- These comments assert the class is hardcoded because no other playbook existed. That assertion is now false for feature-add.

Roles also carry non-greenfield escape clauses like:
`{ when: "<class field> != greenfield", target: "non-greenfield playbook — not authored yet; HALT and report the class" }`

## THE WORK

### A. Un-HALT feature-add in CLASSIFIER

1. **Escape 2 — rewrite (AB9), don't add.** Change the blanket non-greenfield HALT so a class WITH an authored playbook routes to it, and only classes still lacking a playbook HALT. New escape semantics:
   - `{ when: "a subrequest classifies as a class with no authored playbook (bugfix|refactor|migration|perf|integration|investigation)", target: "<that> playbook — not authored yet; flag it, HALT, report" }`
   - feature-add is NO LONGER in the HALT set — it routes to `prompts/_playbooks/feature-add.md`.
2. **Rule 4 — rewrite.** `needs_confirmation` should fire on confidence/compound and on a class lacking a playbook — NOT on feature-add merely being non-greenfield. A confident, atomic `feature-add` request proceeds without forced confirmation. Keep confirmation for genuine class/scope ambiguity (P5/P7 — don't burn client time on a non-question).
3. **Output schema `escape` block** (in `01-classification.json`): rename the field meaning from "non_greenfield_subrequests" gate to "unplaybooked_subrequests" (classes still lacking a playbook). feature-add with a playbook is not listed here. Keep the `escape: null when every subrequest has an authored playbook` semantics.
4. CLASSIFIER frontmatter `class:` comment: rewrite to reflect playbook-injected dispatch (see B).

### B. Frontmatter `class:` sweep — all 39 roles

Generalize the hardcoded line to playbook-injected dispatch. Replace the stale comment in EVERY role's frontmatter:
- FROM: `class: greenfield            # ... only greenfield authored yet` (and all variants).
- TO: `class: <dispatched by playbook>   # was greenfield-only; feature-add playbook now authored (prompts/_playbooks/feature-add.md). Other classes still HALT at CLASSIFIER.`
- Keep it ONE line (AB9 — no appended caveat block). The exact wording must read once (AB8); match it consistently across roles.

For each role's non-greenfield escape clause: rewrite so it HALTs only on classes still lacking a playbook, and routes feature-add to the playbook overlay. Roles that will carry a feature-add OVERLAY (EXTRACT, GAP-DETECT, SYNTHESIZE, SLICE-EXTRACT, SEQUENCE, MATERIALIZE-ORACLE, IMPLEMENT, INTEGRATE, VERIFY-OUTPUT — Tasks 04–13) get their actual delta later; here only the gate/comment is generalized. REUSE roles (the other ~30) get the comment + escape generalization only — their behavior for feature-add is "run verbatim under the playbook."

**Substance invariant:** no role's Rules/Task steps/Output schema change in this task — only the `class:` line + the class-gate escape clause. If a sweep edit would change any role's actual logic, stop — that's a Task 04–13 overlay, not this CONFIG sweep.

## Lane / what NOT to do

- Do NOT author any overlay delta block here (Tasks 04–13).
- Do NOT add a second `class:` line or an appended caveat — rewrite in place (AB9).
- Do NOT un-HALT bugfix/refactor/migration/perf/integration/investigation — they still lack playbooks.
- Touch no Rules/schema substance beyond the class gate.

## Verify (both-directions)

- **Known-good:** feature-add CR fixture → CLASSIFIER emits `class=feature-add`, escape does NOT list feature-add, no class-forced HALT. golden `01-classification.json` PASS.
- **Planted defect 1 — bugfix request:** must STILL HALT (bugfix unplaybooked). FAIL if it proceeds.
- **Planted defect 2 — double class line:** a role with an added second `class:` line (instead of rewrite) → economy/lint FAIL (AB9 breach).

## DONE WHEN

- CLASSIFIER routes `feature-add` to the playbook, HALTs only unplaybooked classes; `01-classification.json` golden validates.
- All 39 roles' `class:` line + class-gate escapes generalized to playbook dispatch, one line each, no appended caveats.
- No role's substantive Rules/schema changed.

## STATUS — DONE (2026-06-10)

### A. CLASSIFIER un-HALT (`prompts/00-aprd/CLASSIFIER.md`)
- **Escape 2 rewritten (AB9, not added)** → two entries: `feature-add` → `prompts/_playbooks/feature-add.md` (route, no class-HALT, BF7); `class with no authored playbook (bugfix|refactor|migration|perf|integration|investigation)` → that playbook, HALT. feature-add OUT of HALT set.
- **Rule 4 rewritten** — `needs_confirmation` fires on confidence/compound/unplaybooked-class, NOT on feature-add being non-greenfield. Confident atomic feature-add proceeds.
- **Output-schema escape block** — field `non_greenfield_subrequests` → `unplaybooked_subrequests`; null when every subrequest playbooked (greenfield|feature-add); feature-add NOT listed.
- **Aligned same-gate reflections** (single interpretation, AB8): `interaction.when`, escape 1 confirmation trigger, Lane line, Task-step 6 routing tail, Stop condition — all narrowed `!= greenfield`/`non-greenfield` → unplaybooked. Classes block + Rules 1–3/5 + Discriminator UNCHANGED.

### B. Frontmatter `class:` sweep — 39 roles
- Every greenfield-hardcoded `class:` line REWRITTEN in place (never appended — AB9) to one uniform line: `class: <dispatched by playbook>   # was greenfield-only; feature-add playbook now authored (prompts/_playbooks/feature-add.md). Other classes still HALT at CLASSIFIER.` Reads once, matched verbatim across roles (AB8). BASELINE-MAP stays `class: feature-add` (40th role, feature-add-only). Two `class: greenfield` in code-block ADR examples (SYNTHESIZE-ADR:71, RESOLVE-LOCAL:154) left literal — structural data, not the gate.
- Every role's non-greenfield escape clause narrowed: `<src> class != greenfield` → `<src> class lacks authored playbook (bugfix|refactor|migration|perf|integration|investigation)`; target `non-greenfield playbook` → `that playbook`. feature-add no longer trips HALT → routes verbatim under the playbook (REUSE roles) or via its overlay (overlay roles, Tasks 04–13).
- Body guard-restatements (Task steps / Stop conditions in SKELETON-IDENTIFY, SLICE-EXTRACT, VERTICALITY-CHECK, OPTION-GEN, TRIAGE) `non-greenfield class` → `unplaybooked class` — same gate, single interpretation.
- **Substance invariant held:** no role's Rules / Task-step logic / Output schema changed beyond the class gate. Overlay deltas (EXTRACT/GAP-DETECT/SYNTHESIZE/SLICE-EXTRACT/SEQUENCE/MATERIALIZE-ORACLE/IMPLEMENT/INTEGRATE/VERIFY-OUTPUT) deferred to Tasks 04–13.

### Verify (both-directions)
- Golden `_fixtures/brownfield-feature/.aprd/00-raw-request.md` (feature CR: tag + filter time entries on existing app) + `.aprd/01-classification.json` authored. JSON valid.
- **Known-good PASS:** `class=feature-add`, atomic, `confidence 0.93`, `needs_confirmation:false`, `escape:null` (feature-add playbooked → not listed). No class-forced HALT → routes to playbook.
- **Planted defect 1 (bugfix CR):** class=bugfix → escape 3 fires → `unplaybooked_subrequests:[SR*]`, `needs_confirmation:true`, HALT. Still HALTs (bugfix unplaybooked). FAIL-by-construction ✓.
- **Planted defect 2 (double `class:` line):** every edit a REWRITE in place — zero added second lines; an added duplicate = AB9/economy breach → lint FAIL ✓.
- Stray `!= greenfield` / `non-greenfield` across `prompts/`: **none**. Satisfies BF7 (re-entry routes, no HALT).
