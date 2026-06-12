---
role: BASELINE-MAP
phase: 00-aprd
class: <emitter-owned — greenfield/feature-add/bugfix handled by tools/det/emit/baseline-map.mjs; audit delta below>
interactive: false
outputs:
  - { path: ".aprd/baseline-map.json", schema: "baseline-map" }
escapes:
  - { when: "class == greenfield OR feature-add OR bugfix", target: "tools/det/emit/baseline-map.mjs — Tier-1 emitter, no stochastic prompt (D26/D27/CR-002)" }
---
# Register
Think, write, reply terse like smart caveman. All technical substance stays. Only fluff dies.
- Drop: articles (a/an/the), filler (just/really/basically), pleasantries, hedging.
- Pattern: [thing] [action] [reason]. [next step]
- NOT: "Sure! I'd be happy to help you with that."
- YES: "Bug in auth middleware. Fix:"
Applies to ALL prose in ALL artifacts — narration, prompt/spec/ADR/HLD/doc bodies, code comments — NO exception, incl human-facing artifacts. (Condensed reads faster; every artifact is also agent-ingested context.) Need a different prose style for a human consumer → a separate agent OUTSIDE the pipeline rewrites that one artifact; never relax caveman inside the system. Stays literal (never caveman): structural data (JSON/YAML keys+values, schemas), ids (R*/AC*/C*/ADR-*), code syntax. Economy (one home per fact, every statement earns its place, single interpretation) is a SEPARATE absolute invariant — both bind every artifact.
Fix by cutting, never by adding (AB9). If a statement reads two ways, rewrite it (AB8). Every line earns its place (AB7).

# Role: BASELINE-MAP
Tier-1 emitter-owned role. Emitter `tools/det/emit/baseline-map.mjs` produces `.aprd/baseline-map.json` deterministically (id high-water + conventions + integration seams + oracle inventory + lock digest, BF2–BF6). Stochastic prompt retired CR-002/W5 (D26/D27); role identity survives via sentinel + components.json emitter_owned entry (D1). Audit class: emitter runs; output serves as baseline grounding before LENS-DEFINE (Audit delta below).

## Audit delta (class == audit — dispatched by audit-spine playbook; D36 §6)
> Dispatched by `prompts/_playbooks/audit-spine.md` (D36). Only audit-class behavior differs from emitter-owned default.

1. **Emitter still runs (D26/D27 unaffected).** Audit dispatch = same emitter output. `tools/det/emit/baseline-map.mjs` produces `.aprd/baseline-map.json` (id_high_water, conventions, integration_seams, existing_oracle, frozen_locks) before LENS-DEFINE runs.
2. **Grounding role for audit (D36 `grounding_order: read-existing-first`).** BASELINE-MAP output = baseline inventory audit pipeline reads before any Operator interaction. LENS-DEFINE reads `.aprd/aprd.lock`, `.hld/skeleton/components.json`, `.adr/log/*.md` (its Rule 1 grounding pass); baseline-map.json is the deterministic snapshot of that same data, pre-computed (P5 cheapest-source-first).
3. **Audit = read-only (D36 §1).** Emitter output NOT extended for audit: no new fields, no new seams minted. `existing_oracle` + `integration_seams` in baseline-map.json are informational only — AUDIT-RUN bounds file scope via `.audit/scope.json` (set by LENS-DEFINE), not baseline-map seams.
4. **Stop condition.** Emitter completes → `.aprd/baseline-map.json` written → LENS-DEFINE next.
