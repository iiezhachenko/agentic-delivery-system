#!/usr/bin/env node
// BASELINE-MAP emitter (Tier-1, det) — reproduces DETERMINISTIC fields of .aprd/baseline-map.json
// for a greenfield-built brownfield root. Replaces stochastic BASELINE-MAP prompt (ADR-0026/D26).
// Source spec: prompts/00-aprd/BASELINE-MAP.md (output schema + BF2..BF6 rules).
// Maps the FROZEN BASELINE only (accepted, demo-signed scope) — NOT in-flight CR frontier
//   (new slices w/o accepted demo, v2 aprd, new assumptions). Baseline = the greenfield map
//   downstream reads instead of re-scanning src/ (P5 cheapest-source-first).
// Pure exported fns + thin CLI (if import.meta.url===...). Zero deps, ESM, deterministic.
// Mirrors validate.mjs / verdict.mjs idiom. Comments caveman; ids/JSON keys literal.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { highWater } from "../idgen.mjs";

// --- io helpers -------------------------------------------------------------
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const readText = (p) => fs.readFileSync(p, "utf8");
const exists = (p) => fs.existsSync(p);

// scan all R*/AC*/S*/ADR-*/C*/E*/CT*/A*/F* tokens in a text blob (frozen aprd is markdown).
// Word-boundary anchored; ADR uses dash form. Returns flat id list.
function scanIds(text) {
  const out = [];
  const re = /\b(?:AC|CT|ADR-|[RSCEAF])[0-9]+\b/g;
  let m;
  while ((m = re.exec(text)) !== null) out.push(m[0]);
  return out;
}

// --- idHighWater: max index per namespace across the FROZEN BASELINE -----------------
// Sources (BF3): R/AC/A from .aprd/aprd.frozen.md (the v1 baseline, NOT lock's v2 artifact);
//   ADR from .adr/adr.lock adrs[]; C/E/CT from .hld/skeleton/*.json; S from baseline slices
//   (rerank completed[] ∪ accepted-demo slice ids — excludes in-flight new frontier S*).
//   F from baseline flows (skeleton + accepted-demo slice flows). highWater() does the max().
export function idHighWater(root) {
  const ids = [];
  // R/AC/A from baseline frozen aprd (literal path, not lock artifact — maps pre-CR baseline)
  const aprdFrozen = path.join(root, ".aprd", "aprd.frozen.md");
  if (exists(aprdFrozen)) ids.push(...scanIds(readText(aprdFrozen)));
  // ADR from adr.lock index
  const adrLock = readJSON(path.join(root, ".adr", "adr.lock"));
  for (const a of adrLock.adrs || []) ids.push(a.id);
  // C/E/CT from skeleton components + contracts + data-model
  const comps = readJSON(path.join(root, ".hld", "skeleton", "components.json"));
  for (const c of comps.components || []) {
    ids.push(c.id);
    ids.push(...(c.owns_entities || []));
  }
  const cts = readJSON(path.join(root, ".hld", "skeleton", "contracts.json"));
  for (const t of cts.contracts || []) ids.push(t.id);
  const dmPath = path.join(root, ".hld", "skeleton", "data-model.json");
  if (exists(dmPath)) {
    const dm = readJSON(dmPath);
    for (const e of dm.entities || []) if (e && e.id) ids.push(e.id);
  }
  // S from baseline slices; F from baseline flows
  const base = baselineSlices(root);
  ids.push(...base.sliceIds);
  ids.push(...base.flowIds);
  // collapse ADR- prefix to ADR for output key
  const hw = highWater(ids);
  const out = {};
  for (const [ns, n] of Object.entries(hw)) out[ns.replace(/-$/, "")] = n;
  return out;
}

// --- baselineSlices: accepted/demo-signed scope (NOT in-flight CR frontier) ----------
// A slice is BASELINE iff: in rerank completed[] OR has an accepted demo on disk
//   (.build/slices/S*/demo/demo.json). New CR frontier slices (no accepted demo, not
//   completed) are EXCLUDED — they post-date the baseline freeze. Skeleton always baseline.
// Returns { sliceIds, flowIds, oracleDirs } — all derived from on-disk baseline scope.
export function baselineSlices(root) {
  const sliceIds = new Set();
  const flowIds = [];
  const oracleDirs = [];
  // rerank completed[] = accepted baseline slices
  const rerankPath = path.join(root, ".roadmap", "08-rerank.json");
  let completed = [];
  if (exists(rerankPath)) {
    const rr = readJSON(rerankPath);
    completed = (rr.completed || []).map((s) => s.id);
    for (const id of completed) sliceIds.add(id);
  }
  // skeleton oracle + flow always baseline
  const skelOracle = path.join(root, ".build", "skeleton", "oracle", "oracle.lock");
  if (exists(skelOracle)) oracleDirs.push(".build/skeleton/oracle/");
  const skelFlows = path.join(root, ".hld", "skeleton", "flows.json");
  if (exists(skelFlows)) for (const f of readJSON(skelFlows).flows || []) flowIds.push(f.id);
  // per-slice: baseline iff accepted demo present (demo/demo.json) — sorted by S index
  const slicesDir = path.join(root, ".build", "slices");
  const dirNames = exists(slicesDir)
    ? fs.readdirSync(slicesDir).filter((d) => /^S\d+$/.test(d)).sort((a, b) => sIdx(a) - sIdx(b))
    : [];
  for (const sid of dirNames) {
    const demo = path.join(slicesDir, sid, "demo", "demo.json");
    const accepted = exists(demo) || completed.includes(sid);
    if (!accepted) continue;
    sliceIds.add(sid);
    const oracleLock = path.join(slicesDir, sid, "oracle", "oracle.lock");
    if (exists(oracleLock)) oracleDirs.push(`.build/slices/${sid}/oracle/`);
    const sliceFlows = path.join(root, ".hld", "slices", sid, "flows.json");
    if (exists(sliceFlows)) for (const f of readJSON(sliceFlows).flows || []) flowIds.push(f.id);
  }
  return { sliceIds: [...sliceIds], flowIds, oracleDirs };
}

const sIdx = (id) => Number(String(id).replace(/\D/g, ""));

// --- integrationSeams: each seam-realizing component -> {at, kind, contract_ref} -----
// BF6. at = component id; kind = realized seam role; contract_ref = the contract fronting
//   that boundary, derived from baseline-flow STEPS (steps[].via labeled by seam phase),
//   preferring the latest accepted slice flow (S4 > skeleton) on collision. Iteration =
//   component order × realizes_seam order (stable, matches golden ordering).
export function integrationSeams(root) {
  const comps = readJSON(path.join(root, ".hld", "skeleton", "components.json")).components || [];
  const ingressComp = comps.find((c) => (c.realizes_seam || []).includes("ingress"));
  const ingressId = ingressComp ? ingressComp.id : null;
  const steps = baselineFlowSteps(root); // ordered: latest accepted slice first
  const seams = [];
  for (const c of comps) {
    for (const kind of c.realizes_seam || []) {
      const ref = pickSeamContract(kind, c.id, ingressId, steps);
      seams.push({ at: c.id, kind, contract_ref: ref });
    }
  }
  return seams;
}

// baseline-flow steps, flattened, ordered latest-accepted-slice-first then skeleton.
// Each step: {from, to, via}. via=null steps (external boundary) dropped — no contract.
function baselineFlowSteps(root) {
  const base = baselineSlices(root);
  const out = [];
  // accepted slices descending by S index (latest wins on collision)
  const sliceIds = base.sliceIds.filter((s) => /^S\d+$/.test(s)).sort((a, b) => sIdx(b) - sIdx(a));
  for (const sid of sliceIds) {
    const fp = path.join(root, ".hld", "slices", sid, "flows.json");
    if (exists(fp)) for (const fl of readJSON(fp).flows || []) pushSteps(out, fl);
  }
  // skeleton last (lowest priority)
  const skel = path.join(root, ".hld", "skeleton", "flows.json");
  if (exists(skel)) for (const fl of readJSON(skel).flows || []) pushSteps(out, fl);
  return out;
}

function pushSteps(out, fl) {
  for (const s of fl.steps || []) {
    if (!s || s.via == null) continue;
    out.push({ from: s.from, to: s.to, via: s.via });
  }
}

// pickSeamContract: seam kind -> contract on the fronting baseline-flow step.
// ingress: step where component is caller (from==comp). domain/persistence/prim_ext:
//   step where component is callee (to==comp); domain caller != ingress, prim_ext caller == ingress.
// First match wins (steps already ordered latest-slice-first → latest contract preferred).
function pickSeamContract(kind, compId, ingressId, steps) {
  let pred;
  if (kind === "ingress") pred = (s) => s.from === compId;
  else if (kind === "primary_external_integration") pred = (s) => s.to === compId && s.from === ingressId;
  else if (kind === "domain") pred = (s) => s.to === compId && s.from !== ingressId;
  else pred = (s) => s.to === compId; // persistence + any other callee seam
  const hit = steps.find(pred);
  return hit ? hit.via : null;
}

// --- existingOracle: BF4 regression baseline — accepted oracle suites + must_stay_green --
export function existingOracle(root) {
  return { suites: baselineSlices(root).oracleDirs, must_stay_green: true };
}

// --- frozenLocks: each baseline lock path -> its status field (no hashing, BF "Frozen-lock digest") --
export function frozenLocks(root) {
  const out = {};
  const candidates = [
    ".aprd/aprd.lock",
    ".adr/adr.lock",
    ".hld/skeleton.lock",
  ];
  // baseline oracle locks
  for (const dir of baselineSlices(root).oracleDirs) candidates.push(`${dir}oracle.lock`);
  for (const rel of candidates) {
    const p = path.join(root, rel);
    if (exists(p)) {
      const lock = readJSON(p);
      if (typeof lock.status === "string") out[rel] = lock.status;
    }
  }
  return out;
}

// --- conventions: NARRATION/templated prose (BF5). lang from ADR-0002 + requires-python;
//   layout/lint/naming templated from src/ + pyproject. NOT byte-exact vs golden (verify bar
//   tolerates conventions prose differences). Cited from real files; un-citable omitted.
export function conventions(root) {
  const pyproj = path.join(root, "pyproject.toml");
  let pyVer = "", pkg = "";
  if (exists(pyproj)) {
    const t = readText(pyproj);
    const v = /requires-python\s*=\s*"([^"]+)"/.exec(t);
    if (v) pyVer = " " + v[1];
    const n = /^\s*name\s*=\s*"([^"]+)"/m.exec(t);
    if (n) pkg = n[1];
  }
  // top src package dir = layout root
  let srcPkg = "";
  const srcDir = path.join(root, "src");
  if (exists(srcDir)) {
    const dirs = fs.readdirSync(srcDir).filter((d) => fs.statSync(path.join(srcDir, d)).isDirectory()).sort();
    if (dirs.length) srcPkg = dirs[0];
  }
  return {
    lang: `Python${pyVer} (ADR-0002)`,
    layout: `src/${srcPkg || "<pkg>"}/<component_snake>/*.py; one package per component`,
    lint: "pyproject.toml [tool.pytest.ini_options] pythonpath=['src']; setuptools build",
    naming: "module dir = snake_case(component.name); module files snake_case" + (pkg ? `; pkg = ${pkg}` : ""),
  };
}

// --- emit: assemble whole baseline-map (BASELINE-MAP output schema) -------------------
export function emit(root) {
  return {
    built_by: "greenfield-spine",
    id_high_water: idHighWater(root),
    conventions: conventions(root),
    integration_seams: integrationSeams(root),
    existing_oracle: existingOracle(root),
    frozen_locks: frozenLocks(root),
  };
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2];
  if (!root) { console.error("usage: node baseline-map.mjs <project-root>"); process.exit(2); }
  let map;
  try { map = emit(path.resolve(root)); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(map, null, 2));
  process.exit(0);
}
