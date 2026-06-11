#!/usr/bin/env node
// DERIVE-TESTS deterministic emitter (ADR-0026/D26). Replaces stochastic prompt.
// Reproduces DETERMINISTIC products of DERIVE-TESTS: skeleton test-specs + build-dag,
//   increment slice test-specs. Prose fields (shape_assertion/expected_behavior/
//   assertion/expected_terminal_state) = LLM layer → deterministic templates here
//   (selftest compares deterministic fields only, behavior-over-byte).
// Pure exported fns + thin CLI. Zero deps, ESM, deterministic. Mirrors verdict.mjs idiom.
// Usage: node derive-tests.mjs <fixtureRoot>  → emits skeleton OR increment (mode dispatch).
import fs from "node:fs";
import path from "node:path";
import { bijection } from "../coverage.mjs";

// --- topo sort: components edges → nodes(depends_on) + waves + order + cycles -----
// edge {from,to} = `from` depends on `to`. node.depends_on = `to` of edges whose from==node.
// wave = 1+max(wave of depends_on); leaves wave 0. build_order = waves concat, ascending C* within wave.
// cycle (node unplaceable) → cycles[]; never break it (boundary defect → DERIVE-COMPONENTS).
export function buildDag(components) {
  const nodes = components.components.map(c => ({ id: c.id, name: c.name }));
  const ids = nodes.map(n => n.id);
  const idSet = new Set(ids);
  const dependsOn = {};
  for (const id of ids) dependsOn[id] = [];
  for (const e of components.edges) {
    if (idSet.has(e.from) && idSet.has(e.to)) dependsOn[e.from].push(e.to);
  }
  for (const id of ids) dependsOn[id] = uniqSortC(dependsOn[id]);

  // assign waves via Kahn-style fixpoint; unplaceable nodes = cycle
  const wave = {};
  let changed = true;
  while (changed) {
    changed = false;
    for (const id of ids) {
      if (wave[id] !== undefined) continue;
      const deps = dependsOn[id];
      if (deps.every(d => wave[d] !== undefined)) {
        wave[id] = deps.length === 0 ? 0 : 1 + Math.max(...deps.map(d => wave[d]));
        changed = true;
      }
    }
  }
  const placed = ids.filter(id => wave[id] !== undefined);
  const unplaced = ids.filter(id => wave[id] === undefined);
  const cycles = unplaced.length ? [{ nodes: unplaced.slice(), route: "DERIVE-COMPONENTS" }] : [];

  // waves: group placed by wave number, ascending C* within wave
  const maxWave = placed.reduce((m, id) => Math.max(m, wave[id]), -1);
  const build_waves = [];
  for (let w = 0; w <= maxWave; w++) {
    const comps = sortC(placed.filter(id => wave[id] === w));
    if (comps.length) build_waves.push({ wave: w, components: comps, rationale: waveRationale(w) });
  }
  const build_order = build_waves.flatMap(w => w.components);

  return {
    nodesOut: nodes.map(n => ({ id: n.id, name: n.name, depends_on: dependsOn[n.id] })),
    build_waves,
    build_order,
    cycles,
    counts: { nodes: ids.length, edges: components.edges.length, waves: build_waves.length },
    nodesOrdered: build_order.length,
    allOrdered: unplaced.length === 0,
  };
}

function waveRationale(w) {
  return w === 0 ? "no dependencies — builds first" : `wave = 1 + max(wave of depends_on) = ${w}`;
}

// --- C* sort helpers: numeric ascending --------------------------------------
function cNum(id) { const m = /(\d+)$/.exec(id); return m ? Number(m[1]) : 0; }
function sortC(arr) { return arr.slice().sort((a, b) => cNum(a) - cNum(b)); }
function uniqSortC(arr) { return sortC([...new Set(arr)]); }

// --- skeleton test-specs: contract_tests + flow_tests + coverage + counts --------
// one contract_test per CT* (CT* id order, bijection); failure_assertions one per
//   declared failure_mode (array order, mode carried verbatim). one flow_test per F*.
export function emitSkeletonTestSpecs(contracts, flows, components) {
  const contract_tests = contracts.contracts.map(ct => ({
    id: `T-${ct.id}`,
    target: ct.id,
    between: ct.between,
    contract_kind: ct.kind,
    shape_assertion: shapeAssertion(ct),
    failure_assertions: ct.failure_modes.map(fm => ({
      failure_mode: fm,                       // VERBATIM from contract
      expected_behavior: expectedBehavior(fm),
    })),
    traces: ct.traces,
  }));

  const structural_defects = contracts.contracts
    .filter(ct => !ct.failure_modes || ct.failure_modes.length === 0)
    .map(ct => ({ target: ct.id, gap: "no declared failure_mode — no failure test authorable", route: "DEFINE-CONTRACTS" }));

  const aprd_defects = [];
  const flow_tests = flows.flows.map(f => {
    const acs = (f.traces || []).filter(isAc);
    if (acs.length === 0) aprd_defects.push({ target: f.id, gap: "flow traces no AC* — no arrival oracle", route: "Phase 0" });
    return {
      id: `T-${f.id}`,
      target: f.id,
      slice: f.slice,
      path: f.path,
      via: f.via,
      happy_path: { assertion: flowAssertion(f), asserts_ac: acs },
      failure_path: {
        exercises: f.failure_path.exercises,
        expected_terminal_state: f.failure_path.arrives_at,
      },
      traces: f.traces,
    };
  });

  const contractIds = contracts.contracts.map(c => c.id);
  const flowIds = flows.flows.map(f => f.id);
  const failureModesTotal = contracts.contracts.reduce((n, c) => n + (c.failure_modes || []).length, 0);
  const failureAssertions = contract_tests.reduce((n, t) => n + t.failure_assertions.length, 0);

  const coverage = {
    contracts_in_scope: contractIds,
    contracts_tested: contract_tests.map(t => t.target),
    contract_orphans: bijection(contractIds, contract_tests.map(t => t.target)).orphans,
    flows_in_scope: flowIds,
    flows_tested: flow_tests.map(t => t.target),
    flow_orphans: bijection(flowIds, flow_tests.map(t => t.target)).orphans,
    failure_modes_total: failureModesTotal,
    failure_modes_covered: failureAssertions,
  };

  const test_counts = {
    contract_tests: contract_tests.length,
    flow_tests: flow_tests.length,
    shape_assertions: contract_tests.length,
    failure_assertions: failureAssertions,
  };

  return { contract_tests, flow_tests, coverage, structural_defects, aprd_defects, test_counts };
}

// --- build full skeleton test-specs doc (refs + meta + products) -----------------
export function skeletonTestSpecsDoc(contracts, flows, components, meta) {
  const p = emitSkeletonTestSpecs(contracts, flows, components);
  return {
    contracts_ref: ".hld/skeleton/contracts.json",
    flows_ref: ".hld/skeleton/flows.json",
    components_ref: ".hld/skeleton/components.json",
    aprd_ref: meta.aprd_ref,
    foundation_cut_ref: ".roadmap/06-foundation-cut.json",
    adr_lock_ref: ".adr/adr.lock",
    lock_verified: true,
    class: meta.class,
    mode: "skeleton",
    skeleton_id: meta.skeleton_id,
    layer: "design-layer oracle — component/contract + flow tests derived from the HLD; DISTINCT from the aPRD black-box acceptance oracle (Phase 0). SPECS not code (Phase 4 MATERIALIZE-ORACLE writes the code).",
    contract_tests: p.contract_tests,
    flow_tests: p.flow_tests,
    coverage: p.coverage,
    structural_defects: p.structural_defects,
    aprd_defects: p.aprd_defects,
    test_counts: p.test_counts,
  };
}

// --- build full skeleton build-dag doc -------------------------------------------
export function buildDagDoc(components, meta) {
  const d = buildDag(components);
  return {
    components_ref: ".hld/skeleton/components.json",
    lock_verified: true,
    class: meta.class,
    mode: "skeleton",
    skeleton_id: meta.skeleton_id,
    edge_semantics: "edge {from,to} from components.json = `from` depends on `to`'s contract; `to` builds before `from`. A slice is a vertical PATH through this DAG (Phase 4 activates one; the DAG is emitted once).",
    nodes: d.nodesOut,
    build_waves: d.build_waves,
    build_order: d.build_order,
    cycles: d.cycles,
    coverage: { nodes: d.counts.nodes, edges: d.counts.edges, nodes_ordered: d.nodesOrdered, all_nodes_ordered: d.allOrdered },
    dag_counts: d.counts,
  };
}

// --- increment slice test-specs: ONE new flow test + inherited contract tests ----
// inherited_contract_tests = touched CT* by reference (id order). new_contract_tests
//   only for slice new_contracts. skeleton_fidelity + coverage + counts walked.
export function emitIncrementTestSpecs(sliceFlows, sliceContracts, baseTestSpecs) {
  const flow = sliceFlows.flows[0];
  const acs = (flow.traces || []).filter(isAc);
  const aprd_defects = acs.length === 0
    ? [{ target: flow.id, gap: "slice flow traces no AC* — no arrival oracle", route: "Phase 0" }]
    : [];
  const flowOrdinal = cNum(flow.id);
  const flow_tests = [{
    id: `T-F${flowOrdinal}`,
    target: flow.id,
    slice: flow.slice,
    path: flow.path,
    via: flow.via,
    happy_path: { assertion: flowAssertion(flow), asserts_ac: acs },
    failure_path: {
      exercises: flow.failure_path.exercises,
      expected_terminal_state: flow.failure_path.arrives_at,
    },
    traces: flow.traces,
  }];

  // index frozen skeleton contract tests by target for inheritance-by-reference
  const frozenByTarget = {};
  for (const t of baseTestSpecs.contract_tests) frozenByTarget[t.target] = t;

  const touched = (sliceContracts.touched_contracts || []).map(c => c.id);
  const structural_defects = [];
  const inherited_contract_tests = [];
  for (const ctId of sortC(touched)) {
    const frozen = frozenByTarget[ctId];
    if (!frozen) {
      structural_defects.push({ target: ctId, gap: "touched CT* has no frozen T-CT* in skeleton test-specs", route: "DERIVE-TESTS skeleton" });
      continue;
    }
    inherited_contract_tests.push({
      id: frozen.id,
      target: frozen.target,
      between: frozen.between,
      contract_kind: frozen.contract_kind,
      source_ref: ".hld/skeleton/test-specs.json",
    });
  }

  // new_contract_tests for slice new_contracts (empty in greenfield); same shape as skeleton
  const new_contract_tests = (sliceContracts.new_contracts || []).map(ct => {
    if (!ct.failure_modes || ct.failure_modes.length === 0) {
      structural_defects.push({ target: ct.id, gap: "new_contract has empty failure_modes", route: "DEFINE-CONTRACTS" });
    }
    return {
      id: `T-${ct.id}`,
      target: ct.id,
      between: ct.between,
      contract_kind: ct.kind,
      shape_assertion: shapeAssertion(ct),
      failure_assertions: (ct.failure_modes || []).map(fm => ({ failure_mode: fm, expected_behavior: expectedBehavior(fm) })),
      traces: ct.traces,
    };
  });

  const inheritedIds = inherited_contract_tests.map(t => t.id);
  const coveredTargets = [...inherited_contract_tests.map(t => t.target), ...new_contract_tests.map(t => t.target)];
  const skeleton_fidelity = {
    inherited_contract_tests: inheritedIds,
    re_authored_contract_tests: [],
    re_tested_flows: [],
    build_dag_re_emitted: false,
    verdict: "inherits-frozen-oracle",
  };
  const coverage = {
    touched_contracts: sortC(touched),
    contracts_covered: sortC(coveredTargets),
    contract_orphans: bijection(sortC(touched), coveredTargets).orphans,
    slice_flow: flow.id,
    flow_tested: flow.id,
    asserted_acs: acs,
  };
  const test_counts = {
    flow_tests: flow_tests.length,
    inherited_contract_tests: inherited_contract_tests.length,
    new_contract_tests: new_contract_tests.length,
  };

  return { flow_tests, inherited_contract_tests, new_contract_tests, skeleton_fidelity, coverage, structural_defects, aprd_defects, test_counts };
}

export function incrementTestSpecsDoc(sliceFlows, sliceContracts, baseTestSpecs, meta) {
  const p = emitIncrementTestSpecs(sliceFlows, sliceContracts, baseTestSpecs);
  const sliceId = sliceFlows.slice_id;
  return {
    aprd_ref: meta.aprd_ref,
    adr_lock_ref: ".adr/adr.lock",
    base_test_specs_ref: ".hld/skeleton/test-specs.json",
    base_contracts_ref: ".hld/skeleton/contracts.json",
    skeleton_lock_ref: ".hld/skeleton.lock",
    slice_flows_ref: `.hld/slices/${sliceId}/flows.json`,
    slice_contracts_ref: `.hld/slices/${sliceId}/contracts.json`,
    skeleton_frozen_verified: true,
    class: meta.class,
    mode: "increment",
    slice_id: sliceId,
    slice_name: sliceFlows.slice_name,
    layer: "design-layer oracle — the slice's flow test (new) + the frozen contract tests its seams inherit (by reference); DISTINCT from the aPRD black-box acceptance oracle (Phase 0). SPECS not code. No build DAG (emitted once in the skeleton, H7).",
    flow_tests: p.flow_tests,
    inherited_contract_tests: p.inherited_contract_tests,
    new_contract_tests: p.new_contract_tests,
    skeleton_fidelity: p.skeleton_fidelity,
    coverage: p.coverage,
    structural_defects: p.structural_defects,
    frame_conflicts: [],
    aprd_defects: p.aprd_defects,
    test_counts: p.test_counts,
  };
}

// --- prose templates (LLM layer; deterministic placeholders) ---------------------
function shapeAssertion(ct) {
  return `Seam ${ct.id} between ${ct.between.join(" and ")} carries declared shape (named-not-designed): ${ct.shape}`;
}
function expectedBehavior(fm) {
  // derive one-line behavior from failure_mode's own declared consequence (after em-dash)
  const i = fm.indexOf("—");
  return i >= 0 ? fm.slice(i + 1).trim() : fm;
}
function flowAssertion(f) {
  return `Flow ${f.id} path ${(f.path || []).join("→")} traverses ${(f.via || []).join(", ")} and arrives at acceptance oracle ${(f.traces || []).filter(isAc).join(", ")}.`;
}
function isAc(id) { return /^AC[0-9]+$/.test(id); }

// --- slice auto-select (increment): first remaining slice with flows+contracts, no test-specs ---
export function autoSelectSlice(root, rerank) {
  const remaining = (rerank.remaining_sequence || []).map(s => s.id);
  for (const id of remaining) {
    const dir = path.join(root, ".hld", "slices", id);
    const hasFlows = fs.existsSync(path.join(dir, "flows.json"));
    const hasContracts = fs.existsSync(path.join(dir, "contracts.json"));
    const hasSpecs = fs.existsSync(path.join(dir, "test-specs.json"));
    if (hasFlows && hasContracts && !hasSpecs) return id;
  }
  return null;
}

// --- mode dispatch + disk IO -----------------------------------------------------
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));

// emit(root) → { mode, docs } where docs maps relative output path → object.
// no skeleton test-specs on disk → skeleton pass; present → increment pass.
export function emit(root) {
  const skeletonSpecsPath = path.join(root, ".hld", "skeleton", "test-specs.json");
  const contracts = readJSON(path.join(root, ".hld", "skeleton", "contracts.json"));
  const meta = { aprd_ref: contracts.aprd_ref, class: contracts.class, skeleton_id: contracts.skeleton_id };

  if (!fs.existsSync(skeletonSpecsPath)) {
    const flows = readJSON(path.join(root, ".hld", "skeleton", "flows.json"));
    const components = readJSON(path.join(root, ".hld", "skeleton", "components.json"));
    return {
      mode: "skeleton",
      docs: {
        ".hld/skeleton/test-specs.json": skeletonTestSpecsDoc(contracts, flows, components, meta),
        ".hld/skeleton/build-dag.json": buildDagDoc(components, meta),
      },
    };
  }

  // increment: auto-select target slice
  const baseTestSpecs = readJSON(skeletonSpecsPath);
  const rerank = readJSON(path.join(root, ".roadmap", "08-rerank.json"));
  const sliceId = autoSelectSlice(root, rerank);
  if (!sliceId) return { mode: "increment", docs: {}, note: "no ready slice — STOP clean" };
  const sliceFlows = readJSON(path.join(root, ".hld", "slices", sliceId, "flows.json"));
  const sliceContracts = readJSON(path.join(root, ".hld", "slices", sliceId, "contracts.json"));
  return {
    mode: "increment",
    sliceId,
    docs: { [`.hld/slices/${sliceId}/test-specs.json`]: incrementTestSpecsDoc(sliceFlows, sliceContracts, baseTestSpecs, meta) },
  };
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const root = process.argv[2];
  if (!root) { console.error("usage: node derive-tests.mjs <fixtureRoot>"); process.exit(2); }
  let res;
  try { res = emit(path.resolve(root)); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  for (const [rel, doc] of Object.entries(res.docs)) {
    const out = path.join(path.resolve(root), rel);
    fs.mkdirSync(path.dirname(out), { recursive: true });
    fs.writeFileSync(out, JSON.stringify(doc, null, 2) + "\n");
    console.log(`wrote ${rel} (${res.mode})`);
  }
  if (Object.keys(res.docs).length === 0) console.log(res.note || `${res.mode}: nothing to emit`);
  process.exit(0);
}
