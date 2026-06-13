// adp-server/tier-router.js — per-role + per-hole tier router (CR-025/ADR-0038)
// Routes each hole-fill: 'local-8b' (gated, free) | 'claude' (judgment) | 'tier-1' (no model)
// Source: _self-host/01-8b-offload.md §1/§3/§4 + 00-analysis.md §4.
// Pure fns. Zero npm deps. ESM. Deterministic.

// --- Tier-1: emitter-owned, no model call (D26/D27) ----------------------------
export const TIER1_ROLES = new Set([
  "BASELINE-MAP", "BUILD-PLAN", "DERIVE-TESTS", "VERIFY-OUTPUT",
]);

// --- Class A: deterministically gated → local-8b default (01-8b-offload §3) ---
export const CLASS_A_ROLES = new Set([
  "IMPLEMENT", "IMPLEMENT-BUGFIX",
  "MATERIALIZE-ORACLE", "MATERIALIZE-BUGFIX",
  "INTEGRATE",
  "DEMO-GEN",
  "EXTRACT", "EXTRACT-RULES", "DECISION-EXTRACT", "SLICE-EXTRACT",
  "QUESTION-GEN",
  "AUDIT-REPORT", "AUDIT-PROMOTE",
  "RECONCILE", "VERIFY",
  "TRIAGE", "RE-RANK", "SEQUENCE",
]);

// --- Class B: judgment-gated → claude default (01-8b-offload §3) ---------------
export const CLASS_B_ROLES = new Set([
  "GAP-DETECT",
  "CRITIQUE", "RECONCILE-CRITIQUE",
  "OPTION-GEN", "EVALUATE-DECIDE",
  "DERIVE-COMPONENTS", "DEFINE-CONTRACTS", "MODEL-DATA", "MODEL-FLOWS", "MAP-NFR",
  "SYNTHESIZE", "SYNTHESIZE-INCREMENT", "SYNTHESIZE-ADR",
  "FOUNDATION-CUT", "SKELETON-IDENTIFY", "VERTICALITY-CHECK", "RESOLVE-LOCAL",
  "DIAGNOSE", "BUGFIX-LOCALIZE",
  "CLASSIFY", "SLICE-EXTRACT-ADR",
]);

// --- Per-hole type override (01-8b-offload §4) ---------------------------------
// narration/carry/restate holes → local-8b (gated by schema+det-lint)
// decision/judgment holes → claude (no deterministic oracle)
export const HOLE_TYPE_TIER = {
  narration:    "local-8b",
  restatement:  "local-8b",
  carry:        "local-8b",
  verbatim:     "local-8b",
  lld_notes:    "local-8b",
  summary:      "local-8b",
  rationale:    "local-8b",
  why:          "local-8b",
  decision:     "claude",
  judgment:     "claude",
  finding:      "claude",
  score:        "claude",
  design:       "claude",
  option:       "claude",
  ac_text:      "claude",
  diagnosis:    "claude",
};

// --- routeTier: deterministic tier assignment for one hole ---------------------
// role: string, holeType: string → 'local-8b' | 'claude' | 'tier-1'
// Precedence: tier-1 > per-hole override within class > class default > unknown→claude
export function routeTier(role, holeType) {
  // tier-1: emitter-owned, no model
  if (TIER1_ROLES.has(role)) return "tier-1";

  const holeTier = HOLE_TYPE_TIER[holeType];

  if (CLASS_A_ROLES.has(role)) {
    // hole-type override: decision/judgment hole in Class-A role → claude
    return holeTier !== undefined ? holeTier : "local-8b";
  }

  if (CLASS_B_ROLES.has(role)) {
    // hole-type override: narration/carry hole in Class-B role → local-8b
    return holeTier !== undefined ? holeTier : "claude";
  }

  // unknown role → safe default: claude (never silently offload unknown)
  return "claude";
}

// --- CLI: node tier-router.js <role> [holeType] --------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [role, holeType = "narration"] = process.argv.slice(2);
  if (!role) {
    process.stderr.write("usage: node tier-router.js <role> [holeType]\n");
    process.exit(2);
  }
  const tier = routeTier(role, holeType);
  process.stdout.write(JSON.stringify({ role, holeType, tier }) + "\n");
  process.exit(0);
}
