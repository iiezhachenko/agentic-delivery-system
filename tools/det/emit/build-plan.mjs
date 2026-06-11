#!/usr/bin/env node
// Deterministic BUILD-PLAN emitter (ADR-0026/D26): replaces stochastic prompt with code.
// Reproduces deterministic fields of .build/.../build-plan.json for BOTH modes.
// MODE DISPATCH (mirror prompt): .build/skeleton/build-plan.json absent → skeleton-build (Part A);
//   present → slice-build (Part B). Pure fns + thin CLI. Zero deps, ESM, deterministic.
// Composes coverage.mjs membership() (real iff dep built). Mirrors verdict.mjs idiom.
// Usage: node build-plan.mjs <fixtureRoot> [sliceId]  → prints JSON.
import fs from "node:fs";
import path from "node:path";
import { membership } from "../coverage.mjs";

// --- io helpers -------------------------------------------------------------
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const exists = (p) => fs.existsSync(p);

// --- ctNum: CT* id -> number for ascending sort (Rule 10) -------------------
const ctNum = (id) => Number(String(id).replace(/^CT/, ""));
const byCt = (a, b) => ctNum(a) - ctNum(b);

// --- seamMap: contracts -> {from: [{via,dep}]} + {to: [via]} -----------------
// One CT* per edge {from,to}=between (H1). Index by `from` (consumes) + `to` (provides).
function seamMap(contracts) {
  const outbound = new Map();   // from -> [{via, dep}]
  const inbound = new Map();    // to -> [{via, caller}]
  for (const ct of contracts) {
    const [from, to] = ct.between;
    if (!outbound.has(from)) outbound.set(from, []);
    outbound.get(from).push({ via: ct.id, dep: to });
    if (!inbound.has(to)) inbound.set(to, []);
    inbound.get(to).push({ via: ct.id, caller: from });
  }
  return { outbound, inbound };
}

// --- filterOrder: build-dag.build_order filtered to set, order preserved -----
function filterOrder(buildOrder, set) {
  const s = set instanceof Set ? set : new Set(set);
  return buildOrder.filter((c) => s.has(c));
}

// --- waveOf: component -> carried wave from build-dag.build_waves ------------
function waveIndex(buildWaves) {
  const m = new Map();
  for (const w of buildWaves) for (const c of w.components) m.set(c, w.wave);
  return m;
}

// --- parallelGroups: set grouped by ascending wave (Rule 10) -----------------
function parallelGroups(buildOrder, waves) {
  const byWave = new Map();
  for (const c of buildOrder) {
    const w = waves.get(c);
    if (!byWave.has(w)) byWave.set(w, []);
    byWave.get(w).push(c);
  }
  return [...byWave.keys()].sort((a, b) => a - b).map((wave) => ({ wave, components: byWave.get(wave) }));
}

// --- buildUnit: one unit's deterministic fields ------------------------------
// consumes_seams = outbound edges, status by membership(dep, realSet); sorted CT* asc.
// provides_contracts = inbound CT* (caller filter per mode); sorted CT* asc.
function buildUnit(comp, name, wave, traces, outbound, inbound, realSet, callerOk) {
  const consumes = (outbound.get(comp) || [])
    .map((e) => ({ via: e.via, dep: e.dep, status: membership(e.dep, realSet) }))
    .sort((a, b) => byCt(a.via, b.via));
  const mockedDeps = consumes.filter((s) => s.status === "mocked").map((s) => s.dep);
  const provides = (inbound.get(comp) || [])
    .filter((e) => callerOk(e.caller))
    .map((e) => e.via)
    .sort(byCt);
  return {
    component: comp,
    name,
    wave,
    traces,
    provides_contracts: provides,
    consumes_seams: consumes,
    mocked_deps: mockedDeps,
    status: "planned",
  };
}

// --- coverage roll-up: walk units to count (Rule 5) --------------------------
function rollup(units) {
  let total = 0;
  const real = [], mocked = [];
  for (const u of units) for (const s of u.consumes_seams) {
    total++;
    (s.status === "real" ? real : mocked).push(s.via);
  }
  return { total, realSeams: real.sort(byCt), mockedSeams: mocked.sort(byCt) };
}

// --- mockMap: component -> mocked deps (skip empty) --------------------------
function mockMap(units) {
  const m = {};
  for (const u of units) if (u.mocked_deps.length) m[u.component] = u.mocked_deps;
  return m;
}

// ===========================================================================
// PART A — skeleton-build
// ===========================================================================
function emitSkeleton(root) {
  const dag = readJSON(path.join(root, ".hld/skeleton/build-dag.json"));
  const flows = readJSON(path.join(root, ".hld/skeleton/flows.json"));
  const comps = readJSON(path.join(root, ".hld/skeleton/components.json"));
  const contracts = readJSON(path.join(root, ".hld/skeleton/contracts.json"));

  const skeletonId = dag.skeleton_id;
  const wsFlow = flows.flows.find((f) => f.slice === skeletonId);
  // build_set = walking-skeleton path (delta Rule 1), carried in build-dag order (Rule 2);
  //   path order kept only for coverage.path_components.
  const pathSet = new Set(wsFlow.path);
  const buildSet = filterOrder(dag.build_order, pathSet);
  const buildSetS = pathSet;
  // later_slice_components = dag nodes off-path (dag order)
  const dagNodes = dag.nodes.map((n) => n.id);
  const laterSlice = dagNodes.filter((c) => !buildSetS.has(c));

  const buildOrder = filterOrder(dag.build_order, buildSetS);
  const waves = waveIndex(dag.build_waves);
  const { outbound, inbound } = seamMap(contracts.contracts);
  const compById = new Map(comps.components.map((c) => [c.id, c]));

  // delta Rule 2: real iff dep in build_set. delta Rule 3: provide iff caller in build_set.
  const callerOk = (caller) => buildSetS.has(caller);
  const units = buildOrder.map((c) => {
    const cm = compById.get(c);
    return buildUnit(c, cm.name, waves.get(c), cm.traces, outbound, inbound, buildSetS, callerOk);
  });

  const { total, realSeams, mockedSeams } = rollup(units);
  const activeWaves = new Set(units.map((u) => u.wave)).size;

  return {
    skeleton_lock_ref: ".hld/skeleton.lock",
    build_dag_ref: ".hld/skeleton/build-dag.json",
    flows_ref: ".hld/skeleton/flows.json",
    components_ref: ".hld/skeleton/components.json",
    contracts_ref: ".hld/skeleton/contracts.json",
    adr_lock_ref: ".adr/adr.lock",
    aprd_lock_ref: ".aprd/aprd.lock",
    locks_verified: true,
    class: comps.class,
    mode: "skeleton-build",
    skeleton_id: skeletonId,
    walking_skeleton_flow: wsFlow.id,
    build_set: buildSet,
    later_slice_components: laterSlice,
    build_order: buildOrder,
    parallel_groups: parallelGroups(buildOrder, waves),
    build_units: units,
    mock_map: mockMap(units),
    lock_set: [],  // skeleton-build: one path, no concurrent slice (shared Rule 8)
    coverage: {
      path_components: [...new Set(wsFlow.path)],
      components_planned: buildOrder,
      unplanned_path_components: buildSet.filter((c) => !buildOrder.includes(c)),
      consumed_seams_total: total,
      consumed_seams_classified: total,
      real_seams: realSeams,
      mocked_seams: mockedSeams,
    },
    structural_defects: [],
    build_plan_counts: {
      build_units: buildSet.length,
      real_seams: realSeams.length,
      mocked_seams: mockedSeams.length,
      active_waves: activeWaves,
      locks: 0,
    },
  };
}

// ===========================================================================
// PART B — slice-build
// ===========================================================================
// autoSelectSlice: first remaining_sequence slice with all 3 increment artifacts
//   AND no sibling .build/slices/<id>/build-plan.json (delta Rule 1). Honors explicit sliceId.
function autoSelectSlice(root, rerank, sliceId) {
  if (sliceId) return sliceId;
  for (const s of rerank.remaining_sequence) {
    const id = s.id;
    const incr = ["components", "contracts", "flows"].every((k) =>
      exists(path.join(root, `.hld/slices/${id}/${k}.json`)));
    const planned = exists(path.join(root, `.build/slices/${id}/build-plan.json`));
    if (incr && !planned) return id;
  }
  return null;
}

function emitSlice(root, sliceId) {
  const dag = readJSON(path.join(root, ".hld/skeleton/build-dag.json"));
  const rerank = readJSON(path.join(root, ".roadmap/08-rerank.json"));
  const skelPlan = readJSON(path.join(root, ".build/skeleton/build-plan.json"));

  const id = autoSelectSlice(root, rerank, sliceId);
  if (!id) return null;  // no ready slice → STOP clean

  const comps = readJSON(path.join(root, `.hld/slices/${id}/components.json`));
  const contracts = readJSON(path.join(root, `.hld/slices/${id}/contracts.json`));
  const flows = readJSON(path.join(root, `.hld/slices/${id}/flows.json`));

  const touched = comps.touched_components;
  // build_set = fleshed_this_slice (delta Rule 1)
  const buildSet = touched.filter((c) => c.fleshed_this_slice).map((c) => c.id);
  const buildSetS = new Set(buildSet);
  // prior_built = reused (fleshed_this_slice:false, built_in set)
  const priorBuilt = touched.filter((c) => !c.fleshed_this_slice && c.built_in).map((c) => c.id);
  // prior-built set already on disk = skeleton build_set ∪ later_slice_components carried built
  //   ∪ this slice's reused. All "already built" → real (delta Rule 2).
  const skelBuilt = new Set([...(skelPlan.build_set || []), ...priorBuilt]);
  // realSet = build_set ∪ prior-built; dep outside (later slice) → mocked.
  const realSet = new Set([...buildSet, ...priorBuilt, ...skelBuilt]);
  // later_slice_components = dag nodes neither built now nor prior-built (dag order)
  const dagNodes = dag.nodes.map((n) => n.id);
  const laterSlice = dagNodes.filter((c) => !buildSetS.has(c) && !realSet.has(c));

  const buildOrder = filterOrder(dag.build_order, buildSetS);
  const waves = waveIndex(dag.build_waves);
  const { outbound, inbound } = seamMap(contracts.touched_contracts);
  const tcById = new Map(touched.map((c) => [c.id, c]));

  // delta Rule 3: provide every CT* where unit is `to`, caller in-slice OR prior-built.
  const callerOk = () => true;
  const units = buildOrder.map((c) => {
    const tc = tcById.get(c);
    return buildUnit(c, tc.name, waves.get(c), tc.realizes_slice_requirements || [],
      outbound, inbound, realSet, callerOk);
  });

  const { total, realSeams, mockedSeams } = rollup(units);
  const activeWaves = new Set(units.map((u) => u.wave)).size;
  const provided = [...new Set(units.flatMap((u) => u.provides_contracts))].sort(byCt);

  const slicePath = flows.flows[0].path;
  const priorOnPath = slicePath.filter((c) => priorBuilt.includes(c));

  return {
    skeleton_lock_ref: ".hld/skeleton.lock",
    build_dag_ref: ".hld/skeleton/build-dag.json",
    slice_components_ref: `.hld/slices/${id}/components.json`,
    slice_contracts_ref: `.hld/slices/${id}/contracts.json`,
    slice_flows_ref: `.hld/slices/${id}/flows.json`,
    skeleton_build_plan_ref: ".build/skeleton/build-plan.json",
    rerank_ref: ".roadmap/08-rerank.json",
    adr_lock_ref: ".adr/adr.lock",
    aprd_lock_ref: ".aprd/aprd.lock",
    locks_verified: true,
    class: comps.class,
    mode: "slice-build",
    slice_id: id,
    slice_name: comps.slice_name,
    slice_flow: flows.flows[0].id,
    build_set: buildSet,
    prior_built_components: priorBuilt,
    later_slice_components: laterSlice,
    build_order: buildOrder,
    parallel_groups: parallelGroups(buildOrder, waves),
    build_units: units,
    mock_map: mockMap(units),
    lock_set: [],  // single-slice invocation, no shared concurrent contract (delta Rule 4)
    coverage: {
      slice_flow: flows.flows[0].id,
      slice_path_components: slicePath,
      build_set_components: buildSet,
      prior_built_on_path: priorOnPath,
      components_planned: buildOrder,
      unplanned_build_set_components: buildSet.filter((c) => !buildOrder.includes(c)),
      consumed_seams_total: total,
      consumed_seams_classified: total,
      real_seams: realSeams,
      mocked_seams: mockedSeams,
      provided_seams: provided,
    },
    structural_defects: [],
    build_plan_counts: {
      build_units: buildSet.length,
      real_seams: realSeams.length,
      mocked_seams: mockedSeams.length,
      active_waves: activeWaves,
      locks: 0,
    },
  };
}

// --- emitBuildPlan: dispatch on disk state (mode override optional) ----------
export function emitBuildPlan(fixtureRoot, { mode, sliceId } = {}) {
  const root = path.resolve(fixtureRoot);
  const skelPresent = exists(path.join(root, ".build/skeleton/build-plan.json"));
  const m = mode || (skelPresent ? "slice-build" : "skeleton-build");
  return m === "skeleton-build" ? emitSkeleton(root) : emitSlice(root, sliceId);
}

export { emitSkeleton, emitSlice, seamMap, filterOrder, parallelGroups, autoSelectSlice };

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [fixtureRoot, sliceId] = process.argv.slice(2);
  if (!fixtureRoot) {
    console.error("usage: node build-plan.mjs <fixtureRoot> [sliceId]");
    process.exit(2);
  }
  let out;
  try { out = emitBuildPlan(fixtureRoot, { sliceId }); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  if (out === null) { console.log("STOP — no ready slice"); process.exit(0); }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
