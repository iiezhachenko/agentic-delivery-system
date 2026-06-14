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
import { deriveClassification } from "../../tools/det/classify-derive.mjs";
import { deriveExtraction } from "../../tools/det/extract-derive.mjs";
import { deriveGaps } from "../../tools/det/gap-derive.mjs";
import { deriveCritique } from "../../tools/det/critique-derive.mjs";
import { deriveExtractRules } from "../../tools/det/extract-rules-derive.mjs";
import { validateFile } from "../../tools/det/validate.mjs";
import { resolve as ioResolve, loadManifest } from "../../tools/io/resolve.mjs";
import { emit as emitBaselineMap } from "../../tools/det/emit/baseline-map.mjs";
import { emitBuildPlan } from "../../tools/det/emit/build-plan.mjs";
import { emit as emitDeriveTests } from "../../tools/det/emit/derive-tests.mjs";
import { aggregateVerification } from "../../tools/det/emit/verify-output.mjs";

// sentinelDone: disk-derived done-check WITH class discriminator (D20 guarantee 5; _playbooks/refactor.md).
// refactor/mcp-modernize edit a pre-existing file in place → bare existence is NOT done;
// require the completion marker in the sentinel's frontmatter. Other classes: existence suffices.
export function sentinelDone(entry, root = ".") {
  const rel = entry.done_sentinel;
  if (!rel) return false;
  const full = path.join(root, rel);
  if (!fs.existsSync(full)) return false;
  if (entry.class === "refactor" || entry.class === "mcp-modernize") {
    const text = fs.readFileSync(full, "utf8");
    if (!/^thinned:\s*\S+/m.test(text)) return false;            // CR-026 completion stamp
    if (entry.class === "mcp-modernize" && !/^mcp_powered:\s*true\s*$/m.test(text)) return false;
  }
  return true;
}

// --- adp_status: frontier tally + done/remaining counts (slim — no full entry dump) ---
export async function adp_status(params, { root = "." } = {}) {
  const rerank = JSON.parse(fs.readFileSync(path.join(root, ".roadmap/08-rerank.json"), "utf8"));
  let done_count = (rerank.completed || []).length;
  let remaining_count = 0;
  let frontier = null;
  for (const entry of rerank.remaining_sequence || []) {
    if (sentinelDone(entry, root)) { done_count++; }
    else { if (!frontier) frontier = entry; remaining_count++; }
  }
  const slim = frontier
    ? { id: frontier.id, name: frontier.name, unit: frontier.unit, class: frontier.class, state: frontier.state || {}, schemaId: frontier.schemaId || null, cr: frontier.cr || null }
    : null;
  return { frontier: slim, done_count, remaining_count };
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

// schemaId -> derive fn: server computes deterministic fields from role judgment primitives (D38)
const DERIVERS = { "01-classification": deriveClassification, "02-extraction": deriveExtraction, "04-gaps": deriveGaps, "08-critique": deriveCritique, "rules-extracted": deriveExtractRules };

// --- adp_derive: server determinism — derive + splice shell + (opt) questions + write (D38) ----
export async function adp_derive(params, { root = "." } = {}) {
  const { schemaId, primitives, shell, opts, confirmation_questions, output_path } = params;
  const fn = DERIVERS[schemaId];
  if (!fn) throw new Error("no deriver registered for schema: " + schemaId);
  const derived = fn(primitives, opts || {});
  const artifact = Object.assign({}, shell || {}, derived);
  if (Array.isArray(confirmation_questions)) {
    artifact.confirmation_questions = confirmation_questions.map((q, i) => Object.assign({}, q, { id: `Q${i + 1}` }));
  }
  if (output_path) {
    // absolute output_path (e.g. /tmp/...) must NOT be joined with root; path.join strips leading slash.
    const full = path.isAbsolute(output_path) ? output_path : path.join(root, output_path);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, JSON.stringify(artifact, null, 2));
  }
  return { output_path: output_path || null, artifact, needs_confirmation: derived.needs_confirmation, escape: derived.escape };
}

// --- adp_submit: pure gate — validate(artifactPath, schemaId) → verdict only -----
export async function adp_submit(params, { root = "." } = {}) {
  const { artifactPath, schemaId } = params;
  const fullArtifact = path.isAbsolute(artifactPath) ? artifactPath : path.join(root, artifactPath);
  const { valid, errors } = validateFile(fullArtifact, schemaId);
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

// --- adp_classify_derive: classification derived fields (CR-026/D38) ------------
export async function adp_classify_derive(params, { root = "." } = {}) {
  const { primitives, opts } = params;
  return deriveClassification(primitives, opts || {});
}

// --- adp_route_tier: per-hole tier routing (CR-025) ----------------------------
export async function adp_route_tier(params, { root = "." } = {}) {
  const { role, holeType } = params;
  const { routeTier } = await import("../tier-router.js");
  return { tier: routeTier(role, holeType || "narration") };
}
