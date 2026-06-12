# Playbook — audit-spine (class binding)

> Class binding for audit. One file = whole class. Touches no engine (P3).

# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose: narration AND artifact bodies AND code comments. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax.

# What this is
Config engine reads, NOT a role. No role/inputs/outputs/escapes frontmatter — file IS the schema instance below. Sibling to `_orchestrator.md`, `_step-runner.md`, `_economy-audit.md`. Selected when CLASSIFIER emits `class=audit`.

audit = read-only assessment class. Re-enters SAME project (existing `.aprd/.adr/.hld/ src/`) WITHOUT modifying it. Operator defines lenses (named check sets with pass/fail criteria); system audits code against lenses; produces operator-readable report + machine-readable JSON. Promote path emits `00-raw-request.md` for ADP intake — one command turns findings into initiative. Declares mechanisms; downstream tasks realize them.

# Schema instance (deliverable core — keys/values literal)

```yaml
class: audit
has_adp_artifacts:   true                # guard: ADP foundation (.aprd/.hld/.adr/) must exist before playbook activates; false -> HALT (CLASSIFIER Rule 2 checks upstream)
classifier_hints:    "audit codebase against operator-defined lenses — produces report + optional promote-to-initiative"
grounding_order:     read-existing-first  # read .aprd/.adr/.hld + src/ + conventions BEFORE any client interaction
grounding_corpus:    [existing code, tests, configs, conventions, git-history]  # NO code modification — read-only
active_stages:       { skeleton_identify: off, foundation_cut: off, scaffold: off }  # audit adds nothing to skeleton; read-only pass
lenses:              operator-defined     # Operator supplies named check sets at LENS-DEFINE; each lens = {id, name, description, criteria[], severity}
audit_scope:         operator-defined     # files / modules / glob patterns to audit; default = whole repo; stored at .audit/scope.json
report_format:       { human: markdown-report, machine: audit-report.json }  # both always emitted
promote_path:        "emit .aprd/00-raw-request.md shaped as ADP intake (feature-add class) listing audit findings as requirements; Operator reviews + launches ADP on that file"
prompt_overlays:     { CLASSIFIER, BASELINE-MAP }  # roles carrying an audit delta block
new_roles:           [LENS-DEFINE, AUDIT-RUN, AUDIT-REPORT]  # three net-new roles; LENS-DEFINE interactive; AUDIT-RUN + AUDIT-REPORT silent
build_depth:         audit-only-no-scaffold  # no new components, no new code, no new slices — pure read + report
verify_method:       lens-coverage-check + report-completeness + promote-artifact-well-formed
```

# Field bindings (one home each — no engine restate, no downstream-schema re-doc)

- `has_adp_artifacts: true` — pre-check guard. CLASSIFIER verifies `.aprd/`, `.hld/`, `.adr/` all present before routing here (Rule 2). Reached only when true; foundation absent → HALT: "ADP foundation absent. Run `adopt` dispatch first, then re-run."
- `grounding_order: read-existing-first` — baseline truth (`.aprd/.adr/.hld` + `src/` + conventions) read before any Operator interaction. Grounding happens at BASELINE-MAP; lenses defined after baseline inventory.
- `grounding_corpus` — read-only corpus: no external canon, no new-tech. Audit stays within project boundary. Git-history included (detects recently-added violations vs long-standing patterns).
- `active_stages` all off — audit adds nothing. Re-cutting skeleton/foundation/scaffold = redraw frozen box = BF1 violation. Stay read-only.
- `lenses: operator-defined` — LENS-DEFINE collects lens definitions interactively. Lens schema: `{id: L*, name, description, criteria[{id: LC*, test, severity: info|warn|block}]}`. Engine stores at `.audit/lenses.json`; AUDIT-RUN reads it. Operator must supply ≥1 lens; LENS-DEFINE HALTs if none provided.
- `audit_scope: operator-defined` — Operator provides glob patterns or explicit paths. Default = repo root. Stored at `.audit/scope.json`. Scope bounds AUDIT-RUN: only files matching scope get assessed.
- `report_format` — AUDIT-REPORT writes two artifacts always: (a) `.audit/report.md` (human-readable: executive summary, per-lens pass/fail table, findings grouped by severity, recommended actions); (b) `.audit/audit-report.json` (machine-readable: `{lenses[], scope, findings[{lens_id, file, line?, criterion_id, severity, finding, remediation}], summary{total, block_count, warn_count, info_count, pass_count}}`).
- `promote_path` — AUDIT-REPORT also writes `.aprd/00-raw-request.md` when Operator requests promote (interactive prompt after report). Content = ADP intake document: block findings → `bugfix`-class requirements (broken behavior); warn findings → `feature-add`-class requirements (missing behavior). Operator reviews before launching ADP. No auto-execution.
- `new_roles: [LENS-DEFINE, AUDIT-RUN, AUDIT-REPORT]` — LENS-DEFINE = interactive (collects lenses + scope from Operator, writes `.audit/lenses.json` + `.audit/scope.json`); AUDIT-RUN = silent (reads baseline + lenses + scope, evaluates each criterion per file in scope, writes `.audit/audit-report.json`); AUDIT-REPORT = silent (reads `.audit/audit-report.json`, writes `.audit/report.md` + optionally `.aprd/00-raw-request.md`).
- `build_depth: audit-only-no-scaffold` — no IDs minted beyond `L*`/`LC*` (lens/criterion), no new slices, no code touched. Audit is observational; IMPLEMENT, INTEGRATE, VERIFY-OUTPUT not in scope.
- `verify_method` — lens-coverage-check: every file in scope assessed against every lens criterion (no silent skip); report-completeness: every finding record has `lens_id`, `file`, `criterion_id`, `severity`, `finding`, `remediation`; promote-artifact-well-formed: when promote invoked, `.aprd/00-raw-request.md` well-formed for CLASSIFIER intake (has `class`, `subrequest` text, finding refs).
