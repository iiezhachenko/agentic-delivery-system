// MCP tool surface: thin wrappers over spine modules (D38 / ADR-0038).
// ESM; zero npm deps; P3 — spine unchanged, only wrappers new.
import fs from "node:fs";
import path from "node:path";
import { execSync } from "node:child_process";
import { computeVerdict } from "../../tools/det/verdict.mjs";
import { triageRoute, diagnoseRoute } from "../../tools/det/route.mjs";
import { sequence } from "../../tools/det/sequence.mjs";
import { assignAdrIds, highWater, nextId } from "../../tools/det/idgen.mjs";
import { bijection, bucketCoverage, singleOwner, membership, intersect } from "../../tools/det/coverage.mjs";
import { prefill } from "../../tools/det/prefill.mjs";
import { validateFile } from "../../tools/det/validate.mjs";
import { resolve as ioResolve, loadManifest } from "../../tools/io/resolve.mjs";
import { emit as emitBaselineMap } from "../../tools/det/emit/baseline-map.mjs";
import { emitBuildPlan } from "../../tools/det/emit/build-plan.mjs";
import { emit as emitDeriveTests } from "../../tools/det/emit/derive-tests.mjs";
import { aggregateVerification } from "../../tools/det/emit/verify-output.mjs";

// --- adp_status: frontier tally + done/remaining partition --------------------
export async function adp_status(params, { root = "." } = {}) {
  const rerank = JSON.parse(fs.readFileSync(path.join(root, ".roadmap/08-rerank.json"), "utf8"));
  const done = [], remaining = [];
  for (const entry of rerank.completed || []) done.push(entry);
  for (const entry of rerank.remaining_sequence || []) {
    const hasSentinel = entry.done_sentinel && fs.existsSync(path.join(root, entry.done_sentinel));
    (hasSentinel ? done : remaining).push(entry);
  }
  const frontier = remaining.length > 0 ? remaining[0] : null;
  return { done, remaining, frontier };
}

// --- adp_next: step packet assembly (resolve + prefill) ---------------------------
export async function adp_next(params, { root = "." } = {}) {
  const { role, state, schemaId, computed } = params;
  const manifestPath = path.join(root, "io", "io-manifest.json");
  const manifest = loadManifest(manifestPath);
  const { resolved } = ioResolve(manifest, { role, ...state }, { root });
  const { shell, holes } = prefill(schemaId, computed || {});
  return {
    role,
    state,
    judgment_prose: "",
    inputs: resolved.map(r => ({ path: r.path, hint: r.hint || "" })),
    shell,
    holes,
    output_path: (computed || {}).output_path || null,
    schemaId,
  };
}

// --- adp_emit: Tier-1 artifact emission (no model) --------------------------------
export async function adp_emit(params, { root = "." } = {}) {
  const { role } = params;
  if (role === "BASELINE-MAP") {
    return emitBaselineMap(params.fixtureRoot || root);
  }
  if (role === "BUILD-PLAN") {
    return emitBuildPlan(params.fixtureRoot || root, { mode: params.mode, sliceId: params.sliceId });
  }
  if (role === "DERIVE-TESTS") {
    return emitDeriveTests(params.fixtureRoot || root);
  }
  if (role === "VERIFY-OUTPUT") {
    return aggregateVerification(params.oracleManifest, params.resultsMap, {});
  }
  throw new Error("unknown Tier-1 role: " + role);
}

// --- adp_submit: gate verdict (validate + verdict) --------------------------------
export async function adp_submit(params, { root = "." } = {}) {
  const { artifactPath, schemaId } = params;
  const fullPath = path.join(root, artifactPath);
  const { valid, errors } = validateFile(fullPath, schemaId);
  return { verdict: valid ? "pass" : "fail", errors: errors || [] };
}

// --- adp_promote: atomic move scratch->dest ---------------------------------------
export async function adp_promote(params, { root = "." } = {}) {
  const { scratchPath, destPath } = params;
  const dest = path.join(root, destPath);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.renameSync(path.join(root, scratchPath), dest);
  return { promoted: destPath };
}

// --- adp_branch: branch case eval (STEP 0.0) --------------------------------------
export async function adp_branch(params, { root = "." } = {}) {
  const head = execSync("git rev-parse --abbrev-ref HEAD", { cwd: root, encoding: "utf8" }).trim();
  const registered = [];
  const streamsDir = path.join(root, "_streams");
  if (fs.existsSync(streamsDir)) {
    for (const entry of fs.readdirSync(streamsDir)) {
      const briefPath = path.join(streamsDir, entry, "brief.md");
      if (!fs.existsSync(briefPath)) continue;
      const text = fs.readFileSync(briefPath, "utf8");
      const statusMatch = /status:\s*pending/i.test(text);
      if (!statusMatch) continue;
      const branchMatch = /branch:\s*(\S+)/i.exec(text);
      if (branchMatch) registered.push({ branch: branchMatch[1], slug: entry });
    }
  }
  const registeredBranches = registered.map(r => r.branch);
  // case A: head in registered set
  if (registeredBranches.includes(head)) {
    return { case: "A", action: "proceed", message: "correct branch" };
  }
  // case B: head in main AND registered.length===1
  if ((head === "master" || head === "main") && registered.length === 1) {
    return { case: "B", action: "checkout", branch: registered[0].branch, slug: registered[0].slug, message: "auto-checkout" };
  }
  // case C: head in main AND registered.length===0
  if ((head === "master" || head === "main") && registered.length === 0) {
    return { case: "C", action: "proceed", message: "solo-master" };
  }
  // case D: head in main AND registered.length>1
  if ((head === "master" || head === "main") && registered.length > 1) {
    return { case: "D", action: "halt", streams: registered, message: "on master with multiple pending streams" };
  }
  // case E: else
  return { case: "E", action: "halt", head, message: "branch not registered" };
}

// --- adp_guard: escape predicate eval --------------------------------------------
export async function adp_guard(params, { root = "." } = {}) {
  const guards = params.guards || [];
  for (const g of guards) {
    const when = g.when;
    let tripped = false;
    if (when.startsWith("file_missing:")) {
      const rel = when.slice(13);
      tripped = !fs.existsSync(path.join(root, rel));
    } else if (when.startsWith("file_exists:")) {
      const rel = when.slice(12);
      tripped = fs.existsSync(path.join(root, rel));
    } else if (when.startsWith("json_field:")) {
      const parts = when.slice(11).split(":");
      if (parts.length < 3) continue;
      const [relPath, pointer, value] = parts;
      try {
        const obj = JSON.parse(fs.readFileSync(path.join(root, relPath), "utf8"));
        const actual = pointer.split(".").reduce((o, k) => o && o[k], obj);
        tripped = String(actual) === value;
      } catch {
        tripped = false;
      }
    } else {
      // unknown predicates = conservative: NOT tripped, log warning
      console.warn(`adp_guard: unknown predicate: ${when}`);
    }
    if (tripped) return { tripped: true, guard: g };
  }
  return { tripped: false, guard: null };
}

// --- adp_verdict: spine pass-through ----------------------------------------------
export async function adp_verdict(params, { root = "." } = {}) {
  return computeVerdict(params.gate, params.issueCount);
}

// --- adp_route: spine pass-through ------------------------------------------------
export async function adp_route(params, { root = "." } = {}) {
  const { type, ...rest } = params;
  if (type === "triage") return triageRoute(rest);
  if (type === "diagnose") return diagnoseRoute(rest);
  throw new Error("unknown route type: " + type);
}

// --- adp_sequence: spine pass-through ---------------------------------------------
export async function adp_sequence(params, { root = "." } = {}) {
  return sequence(params.slices, { skeletonId: params.skeletonId });
}

// --- adp_idgen: spine pass-through ------------------------------------------------
export async function adp_idgen(params, { root = "." } = {}) {
  const { type, ...rest } = params;
  if (type === "adr") return assignAdrIds(rest.decisions, { start: rest.start });
  if (type === "highwater") return highWater(rest.ids, rest.namespace);
  if (type === "next") return nextId(rest.namespace, rest.currentMax);
  throw new Error("unknown idgen type: " + type);
}

// --- adp_coverage: spine pass-through ---------------------------------------------
export async function adp_coverage(params, { root = "." } = {}) {
  const { op, ...rest } = params;
  if (op === "bijection") return bijection(rest.leftIds, rest.rightRefs);
  if (op === "bucketCoverage") return bucketCoverage(rest.items, rest.tracedSet, rest.deferredSet);
  if (op === "singleOwner") return singleOwner(rest.entityIds, rest.ownsLists);
  if (op === "membership") return membership(rest.dep, rest.buildSet);
  if (op === "intersect") return intersect(rest.a, rest.b);
  throw new Error("unknown coverage op: " + op);
}
