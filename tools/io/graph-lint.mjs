#!/usr/bin/env node
// IO-graph lint (R14/D24/D25/PR2). Pure deterministic CODE, no LLM at runtime.
// Checks full data-flow over schema-registry (_meta.json) + read-graph (io-manifest.json):
//   roles-resolve · pr2-closure · schema-file-exists · group-refs-resolve · contracts-match · orphan(warn).
// PR2 = "output schema of step N == input schema of step N+1", checked by REGISTRY-ID equality
//   on the self-contained registry — W3 lands BEFORE prompts carry outputs:[{schema}], so the
//   check operates on _meta produced_by/consumed_by + io-manifest group/role resolution, NOT frontmatter.
// contracts.json chain is GENERATED from the registry phase list, never hand-written; must deep-equal frozen.
// Core fns pure (take loaded data, return results) so selftest exercises synthetic data off-disk;
//   only checkSchemaFiles + CLI touch disk. Mirrors validate.mjs/resolve.mjs idiom (zero deps, ESM, exit codes).
// Usage: node graph-lint.mjs [--root <dir>] [--write <path>] [--json]  → 0 ok / 1 lint-violation / 2 usage.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_ROOT = path.resolve(here, "..", "..");

// --- constants: frozen-contracts embedded strings (copied VERBATIM from .hld/skeleton/contracts.json) ---
const CONTRACTS_ARTIFACT = "contracts.json";
const CONTRACTS_CLASS = "self-host";
const CONTRACTS_NOTE = "Producer/consumer chain (PR2): each prompt writes the exact place+format the next reads; output schema of step N == input schema of step N+1. IDs thread R→AC→S→ADR→C→CT→F→commit. Precondition contracts (STREAM-MANAGER, D28+D29/CR-008): STEP 0 entry enforces branch isolation + branch-match before any frontier work begins. Postcondition contracts (LEDGER-PRUNE, D31/CR-010): STEP 0.1 prunes merged-wave records from the informational reranker ledger after reconcile.";
const CONTRACTS_RULE = "PR2";
const CONTRACTS_TERMINAL = "terminal (accepted staging demo)";
// preconditions: STREAM-MANAGER gate (CR-008/ADR-0029) — not derivable from registry phase list; embedded verbatim from frozen, like NOTE/TERMINAL above.
const CONTRACTS_PRECONDITIONS = [
  {
    id: "step-0-precondition",
    enforcer: "STREAM-MANAGER (orchestrator STEP 0.0 + STEP 0.1)",
    adr: "ADR-0029",
    cr: "CR-008",
    contract: "HEAD in registered-pending-branch-set (R-MW-5) OR (HEAD=master AND <=1 pending → auto-checkout) AND reconcile_from_main == clean | HALT",
    branch_match_cases: {
      A: "HEAD in pending set → pass",
      B: "master + 1 pending → auto-checkout branch: value, continue",
      C: "master + 0 pending → pass (solo-master)",
      D: "master + >1 pending → HALT (ambiguous)",
      E: "HEAD not in set AND not master → HALT (unregistered branch)",
    },
    consumers: ["STEP 0 frontier-scan", "all subsequent STEP 0–6"],
    violation_response: "HALT — list pending streams (Case D/E R-MW-5) OR list in-flight branches (R-MW-3) OR report merge conflict (R-MW-2); do not proceed",
  },
];
// postconditions: LEDGER-PRUNE (CR-010/ADR-0031) — not derivable from registry phase list; embedded verbatim from frozen, like NOTE/TERMINAL/PRECONDITIONS above.
const CONTRACTS_POSTCONDITIONS = [
  {
    id: "step-0.1-ledger-prune",
    enforcer: "LEDGER-PRUNE (orchestrator STEP 0.1, tools/det/prune-ledger.mjs)",
    adr: "ADR-0031",
    cr: "CR-010",
    trigger: "STEP 0.1, after git merge origin/main --ff-only == clean",
    contract: "completed[] rows whose done_sentinel present on master pruned (R-LH-1, merged=complete+accepted+merged) AND remaining_sequence + open deferred_findings preserved (R-LH-2) AND idempotent re-run = no-op (R-LH-3)",
    consumers: ["STEP 0 frontier-scan (derives frontier from disk sentinels, NOT this ledger — D20)"],
    invariant: "ledger is informational ordering, never the source of truth; prune never alters the disk-derived frontier",
  },
];

// --- deepEqual: order-insensitive structural equality (mirror validate.mjs) -----
function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null || b === null) return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => deepEqual(a[k], b[k]));
}

// --- phase list: distinct leading path-segment of every schema path, sorted ascending ---
function derivePhases(meta) {
  const phases = new Set();
  for (const id of Object.keys(meta)) phases.add(meta[id].path.split("/")[0]);
  return [...phases].sort();
}

// --- generateContracts: phase chain (PR2). step N outputs == step N+1 inputs; last terminal. ---
export function generateContracts(meta) {
  const phases = derivePhases(meta);
  const chain = [];
  for (let i = 0; i < phases.length - 1; i++) {
    chain.push({ from: phases[i], to: phases[i + 1], contract: `${phases[i]}.outputs == ${phases[i + 1]}.inputs` });
  }
  const last = phases[phases.length - 1];
  chain.push({ from: last, to: null, contract: CONTRACTS_TERMINAL });
  return {
    artifact: CONTRACTS_ARTIFACT,
    class: CONTRACTS_CLASS,
    note: CONTRACTS_NOTE,
    rule: CONTRACTS_RULE,
    preconditions: CONTRACTS_PRECONDITIONS,
    postconditions: CONTRACTS_POSTCONDITIONS,
    chain,
  };
}

// --- bare role: strip @phase suffix (io-manifest uses CRITIQUE@00-aprd etc.) ----
function bareRole(key) { return key.split("@")[0]; }

// --- lintGraph: pure — already-loaded data in, {violations,warnings} out. No disk. ---
export function lintGraph({ meta, manifest, knownRoles, frozenContracts }) {
  const violations = [];
  const warnings = [];
  const V = (check, msg) => violations.push({ check, msg });
  const W = (check, msg) => warnings.push({ check, msg });

  // roles-resolve: every role in produced_by/consumed_by + every manifest role key (bare) known.
  for (const id of Object.keys(meta)) {
    for (const r of meta[id].produced_by || []) if (!knownRoles.has(r)) V("roles-resolve", `schema ${id} produced_by unknown role: ${r}`);
    for (const r of meta[id].consumed_by || []) if (!knownRoles.has(r)) V("roles-resolve", `schema ${id} consumed_by unknown role: ${r}`);
  }
  for (const key of Object.keys(manifest.roles || {})) {
    const r = bareRole(key);
    if (!knownRoles.has(r)) V("roles-resolve", `manifest role key unknown: ${key} (bare ${r})`);
  }

  // pr2-closure: consumed schema with no producer = dangling input = PR2 break.
  for (const id of Object.keys(meta)) {
    const e = meta[id];
    if ((e.consumed_by || []).length > 0 && (e.produced_by || []).length === 0) {
      V("pr2-closure", `schema ${id} consumed but produced by nobody (dangling input — PR2 break)`);
    }
  }

  // group-refs-resolve: every string read entry (group-id) across always + when[].read exists in groups.
  const groups = manifest.groups || {};
  for (const [key, role] of Object.entries(manifest.roles || {})) {
    const refs = [...(role.always || [])];
    for (const w of role.when || []) refs.push(...(w.read || []));
    for (const ref of refs) {
      if (typeof ref === "string" && !(ref in groups)) {
        V("group-refs-resolve", `role ${key} references unknown group: ${ref}`);
      }
    }
  }

  // contracts-match: generated chain MUST equal frozen.
  if (!deepEqual(generateContracts(meta), frozenContracts)) {
    V("contracts-match", "generated contracts chain != frozen .hld/skeleton/contracts.json");
  }

  // orphan: produced but consumed by nobody (WARNING — terminal artifacts legit).
  for (const id of Object.keys(meta)) {
    if ((meta[id].consumed_by || []).length === 0) {
      W("orphan", `schema ${id} produced but consumed by nobody (terminal?)`);
    }
  }

  return { violations, warnings };
}

// --- checkSchemaFiles: disk check (separate so lintGraph stays pure). Returns violation list. ---
export function checkSchemaFiles(meta, registryDir) {
  const out = [];
  for (const id of Object.keys(meta)) {
    const p = path.join(registryDir, meta[id].path);
    if (!fs.existsSync(p)) out.push({ check: "schema-file-exists", msg: `schema ${id} path missing on disk: ${meta[id].path}` });
  }
  return out;
}

// --- loaders ----------------------------------------------------------------
export function loadMeta(registryDir) {
  return JSON.parse(fs.readFileSync(path.join(registryDir, "_meta.json"), "utf8"));
}
export function loadManifest(manifestPath) {
  return JSON.parse(fs.readFileSync(manifestPath, "utf8"));
}
export function loadFrozenContracts(contractsPath) {
  return JSON.parse(fs.readFileSync(contractsPath, "utf8"));
}

// --- deriveKnownRoles: scan prompts/**/*.md; basename - .md - leading _ -> UPPER -> role id ---
// PLUS emitter_owned roles from .hld/skeleton/components.json: a Tier-1 role retired to a
// tools/det/emit/*.mjs emitter (D26/D27) keeps its identity but has NO .md — still a real
// producer/consumer in the chain. Root derived from promptsDir parent (callers unchanged).
export function deriveKnownRoles(promptsDir) {
  const roles = new Set();
  const walk = (dir) => {
    let entries;
    try { entries = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const e of entries) {
      const abs = path.join(dir, e.name);
      if (e.isDirectory()) walk(abs);
      else if (e.name.endsWith(".md")) roles.add(e.name.replace(/\.md$/, "").replace(/^_/, "").toUpperCase());
    }
  };
  walk(promptsDir);
  // emitter_owned roles: prompt retired, artifact owned by emitter — still known roles (D27)
  try {
    const comp = JSON.parse(fs.readFileSync(path.join(path.dirname(promptsDir), ".hld", "skeleton", "components.json"), "utf8"));
    for (const e of comp.emitter_owned || []) if (e.role) roles.add(String(e.role).toUpperCase());
  } catch { /* no components.json / no emitter_owned -> prompt scan only */ }
  return roles;
}

// --- CLI --------------------------------------------------------------------
function parseArgs(argv) {
  const out = { root: DEFAULT_ROOT, write: null, json: false };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--root") out.root = argv[++i];
    else if (a === "--write") out.write = argv[++i];
    else if (a === "--json") out.json = true;
    else return null;
  }
  return out;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const opt = parseArgs(process.argv.slice(2));
  if (!opt) {
    console.error("usage: node graph-lint.mjs [--root <dir>] [--write <path>] [--json]");
    process.exit(2);
  }
  let meta, manifest, frozenContracts, knownRoles;
  try {
    const registryDir = path.join(opt.root, "schemas");
    meta = loadMeta(registryDir);
    manifest = loadManifest(path.join(opt.root, "io", "io-manifest.json"));
    frozenContracts = loadFrozenContracts(path.join(opt.root, ".hld", "skeleton", "contracts.json"));
    knownRoles = deriveKnownRoles(path.join(opt.root, "prompts"));
    if (opt.write) {
      fs.writeFileSync(opt.write, JSON.stringify(generateContracts(meta), null, 2));
    }
    const { violations, warnings } = lintGraph({ meta, manifest, knownRoles, frozenContracts });
    violations.push(...checkSchemaFiles(meta, registryDir));
    const matches = deepEqual(generateContracts(meta), frozenContracts);
    const nSchemas = Object.keys(meta).length;
    const nRoles = knownRoles.size;
    if (opt.json) {
      console.log(JSON.stringify({ clean: violations.length === 0, violations, warnings, generated_chain_matches: matches }, null, 2));
      process.exit(violations.length === 0 ? 0 : 1);
    }
    if (violations.length === 0) {
      console.log(`GRAPH-LINT clean — ${nSchemas} schemas, ${nRoles} roles, chain matches frozen`);
      for (const w of warnings) console.log(`  warn [${w.check}] ${w.msg}`);
      process.exit(0);
    }
    for (const v of violations) console.log(`[${v.check}] ${v.msg}`);
    process.exit(1);
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(2);
  }
}

export { deepEqual };
