#!/usr/bin/env node
// Both-directions self-test for derive-tests.mjs (skeleton + increment emitter).
// Compares DETERMINISTIC fields ONLY vs goldens (behavior-over-byte, operator bar):
//   build-dag nodes(id+depends_on)/build_waves/build_order/cycles/coverage/dag_counts;
//   test-specs contract_test IDS+targets+between+kind + per-CT failure_assertion COUNT +
//   flow_test ids/targets/path/via/asserts_ac + coverage sets + test_counts.
//   Prose (shape_assertion/expected_behavior/assertion) = LLM layer → NOT compared.
// Direction 1 (known-good): emitter deterministic fields == golden's; validateFile passes.
// Direction 2 (planted-defect): drop a CT* / drop an edge → comparison FLAGS it.
// Determinism: emit twice → deep-equal.
import { emit, buildDag, emitSkeletonTestSpecs, emitIncrementTestSpecs } from "./derive-tests.mjs";
import { validateFile } from "../validate.mjs";
import fs from "node:fs";

const GF = "/workspace/_fixtures/greenfield-clean";
let pass = 0, fail = 0;
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`); } };
const readJSON = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

const contracts = readJSON(`${GF}/.hld/skeleton/contracts.json`);
const flows = readJSON(`${GF}/.hld/skeleton/flows.json`);
const components = readJSON(`${GF}/.hld/skeleton/components.json`);
const goldSpecs = readJSON(`${GF}/.hld/skeleton/test-specs.json`);
const goldDag = readJSON(`${GF}/.hld/skeleton/build-dag.json`);

// deterministic projection of a contract_test (drops prose)
const ctDet = (t) => ({ id: t.id, target: t.target, between: t.between, kind: t.contract_kind, nfail: (t.failure_assertions || []).length, fmodes: (t.failure_assertions || []).map(f => f.failure_mode), traces: t.traces });
const ftDet = (t) => ({ id: t.id, target: t.target, slice: t.slice, path: t.path, via: t.via, asserts_ac: t.happy_path.asserts_ac, exercises: t.failure_path.exercises, traces: t.traces });

// ===========================================================================
// DIRECTION 1 — known-good: emitter deterministic fields == golden
// ===========================================================================
console.log("=== Direction 1: skeleton known-good vs golden ===");
{
  const dag = buildDag(components);
  ok(eq(dag.nodesOut, goldDag.nodes), `build-dag nodes match golden`);
  ok(eq(dag.build_waves.map(w => ({ wave: w.wave, components: w.components })),
        goldDag.build_waves.map(w => ({ wave: w.wave, components: w.components }))), `build_waves match (wave+components)`);
  ok(eq(dag.build_order, goldDag.build_order), `build_order match`);
  ok(eq(dag.cycles, goldDag.cycles), `cycles match (empty)`);
  ok(eq({ nodes: dag.counts.nodes, edges: dag.counts.edges, nodes_ordered: dag.nodesOrdered, all_nodes_ordered: dag.allOrdered }, goldDag.coverage), `dag coverage match`);
  ok(eq(dag.counts, goldDag.dag_counts), `dag_counts match`);
  console.log(`  build_order=${JSON.stringify(dag.build_order)} waves=${dag.counts.waves}`);

  const sk = emitSkeletonTestSpecs(contracts, flows, components);
  ok(eq(sk.contract_tests.map(ctDet), goldSpecs.contract_tests.map(ctDet)), `contract_tests deterministic fields match`);
  ok(eq(sk.flow_tests.map(ftDet), goldSpecs.flow_tests.map(ftDet)), `flow_tests deterministic fields match`);
  ok(eq(sk.coverage, goldSpecs.coverage), `coverage match`);
  ok(eq(sk.test_counts, goldSpecs.test_counts), `test_counts match`);
  ok(sk.structural_defects.length === 0 && sk.aprd_defects.length === 0, `no defects on clean fixture`);
  console.log(`  contract_tests=${sk.test_counts.contract_tests} failure_assertions=${sk.test_counts.failure_assertions}`);
}

console.log("\n=== Direction 1: increment (S4) known-good vs golden ===");
const goldS4 = readJSON(`${GF}/.hld/slices/S4/test-specs.json`);
{
  const sliceFlows = readJSON(`${GF}/.hld/slices/S4/flows.json`);
  const sliceContracts = readJSON(`${GF}/.hld/slices/S4/contracts.json`);
  const inc = emitIncrementTestSpecs(sliceFlows, sliceContracts, goldSpecs);
  ok(eq(inc.flow_tests.map(ftDet), goldS4.flow_tests.map(ftDet)), `S4 flow_test deterministic fields match`);
  ok(eq(inc.inherited_contract_tests, goldS4.inherited_contract_tests), `S4 inherited_contract_tests match (by reference)`);
  ok(eq(inc.new_contract_tests, goldS4.new_contract_tests), `S4 new_contract_tests match ([])`);
  ok(eq(inc.skeleton_fidelity, goldS4.skeleton_fidelity), `S4 skeleton_fidelity match`);
  ok(eq(inc.coverage, goldS4.coverage), `S4 coverage match`);
  ok(eq(inc.test_counts, goldS4.test_counts), `S4 test_counts match`);
  console.log(`  T-F4 asserts_ac=${JSON.stringify(inc.flow_tests[0].happy_path.asserts_ac)} inherited=${JSON.stringify(inc.skeleton_fidelity.inherited_contract_tests)}`);
}

// schema validity: emit to a temp tree, run validateFile against frozen schemas
console.log("\n=== Direction 1: schema validity (validateFile) ===");
{
  const tmp = fs.mkdtempSync("/tmp/derive-tests-");
  // skeleton tree (no skeleton test-specs → skeleton pass)
  fs.mkdirSync(`${tmp}/.hld/skeleton`, { recursive: true });
  fs.copyFileSync(`${GF}/.hld/skeleton/contracts.json`, `${tmp}/.hld/skeleton/contracts.json`);
  fs.copyFileSync(`${GF}/.hld/skeleton/flows.json`, `${tmp}/.hld/skeleton/flows.json`);
  fs.copyFileSync(`${GF}/.hld/skeleton/components.json`, `${tmp}/.hld/skeleton/components.json`);
  const r1 = emit(tmp);
  ok(r1.mode === "skeleton", `temp emit dispatches skeleton (got ${r1.mode})`);
  for (const [rel, doc] of Object.entries(r1.docs)) {
    fs.mkdirSync(`${tmp}/${rel.split("/").slice(0, -1).join("/")}`, { recursive: true });
    fs.writeFileSync(`${tmp}/${rel}`, JSON.stringify(doc, null, 2));
  }
  const vSpecs = validateFile(`${tmp}/.hld/skeleton/test-specs.json`, "test-specs");
  const vDag = validateFile(`${tmp}/.hld/skeleton/build-dag.json`, "build-dag");
  ok(vSpecs.valid, `skeleton test-specs valid vs schema: ${JSON.stringify(vSpecs.errors)}`);
  ok(vDag.valid, `build-dag valid vs schema: ${JSON.stringify(vDag.errors)}`);

  // increment tree: skeleton test-specs now present → increment pass on S4
  fs.mkdirSync(`${tmp}/.hld/slices/S4`, { recursive: true });
  fs.copyFileSync(`${GF}/.hld/slices/S4/flows.json`, `${tmp}/.hld/slices/S4/flows.json`);
  fs.copyFileSync(`${GF}/.hld/slices/S4/contracts.json`, `${tmp}/.hld/slices/S4/contracts.json`);
  fs.mkdirSync(`${tmp}/.roadmap`, { recursive: true });
  fs.copyFileSync(`${GF}/.roadmap/08-rerank.json`, `${tmp}/.roadmap/08-rerank.json`);
  const r2 = emit(tmp);
  ok(r2.mode === "increment" && r2.sliceId === "S4", `temp emit dispatches increment S4 (got ${r2.mode}/${r2.sliceId})`);
  fs.writeFileSync(`${tmp}/.hld/slices/S4/test-specs.json`, JSON.stringify(r2.docs[".hld/slices/S4/test-specs.json"], null, 2));
  const vInc = validateFile(`${tmp}/.hld/slices/S4/test-specs.json`, "test-specs");
  ok(vInc.valid, `increment test-specs valid vs schema: ${JSON.stringify(vInc.errors)}`);
  console.log(`  schemas: test-specs(skeleton+increment) + build-dag all VALID`);
  fs.rmSync(tmp, { recursive: true, force: true });
}

// ===========================================================================
// DIRECTION 2 — planted defects → comparison FLAGS them
// ===========================================================================
console.log("\n=== Direction 2: planted defects → flagged ===");
// (a) drop an edge so a node loses a depends_on / topo order changes
{
  const broken = JSON.parse(JSON.stringify(components));
  broken.edges = broken.edges.filter(e => !(e.from === "C3" && e.to === "C2"));  // C3 loses C2 dep
  const dag = buildDag(broken);
  const c3 = dag.nodesOut.find(n => n.id === "C3");
  ok(!eq(c3.depends_on, goldDag.nodes.find(n => n.id === "C3").depends_on), `dropped edge C3->C2 changes C3 depends_on (defect flagged)`);
  console.log(`  C3 depends_on now ${JSON.stringify(c3.depends_on)} (golden ${JSON.stringify(goldDag.nodes.find(n => n.id === "C3").depends_on)})`);
}
// (b) remove a CT* so bijection breaks (orphan in coverage) + contract_tests count diverges
{
  const broken = JSON.parse(JSON.stringify(contracts));
  broken.contracts = broken.contracts.filter(c => c.id !== "CT5");
  const sk = emitSkeletonTestSpecs(broken, flows, components);
  ok(!eq(sk.contract_tests.map(ctDet), goldSpecs.contract_tests.map(ctDet)), `removed CT5 → contract_tests diverge from golden`);
  ok(sk.test_counts.contract_tests === 10, `count drops to 10 (was 11)`);
  ok(!eq(sk.coverage.contracts_in_scope, goldSpecs.coverage.contracts_in_scope), `coverage in_scope diverges`);
  console.log(`  CT5 removed → contract_tests=${sk.test_counts.contract_tests}`);
}
// (c) drop a declared failure_mode → per-CT failure_assertion COUNT diverges
{
  const broken = JSON.parse(JSON.stringify(contracts));
  broken.contracts.find(c => c.id === "CT1").failure_modes.pop();
  const sk = emitSkeletonTestSpecs(broken, flows, components);
  const got = sk.contract_tests.find(t => t.target === "CT1").failure_assertions.length;
  const want = goldSpecs.contract_tests.find(t => t.target === "CT1").failure_assertions.length;
  ok(got !== want, `dropped CT1 failure_mode → failure_assertion count ${got} != golden ${want}`);
  console.log(`  CT1 failure_assertions now ${got} (golden ${want})`);
}
// (d) increment: drop a touched_contract → inherited set + coverage diverge
{
  const sliceFlows = readJSON(`${GF}/.hld/slices/S4/flows.json`);
  const broken = readJSON(`${GF}/.hld/slices/S4/contracts.json`);
  broken.touched_contracts = broken.touched_contracts.filter(c => c.id !== "CT9");
  const inc = emitIncrementTestSpecs(sliceFlows, broken, goldSpecs);
  ok(!eq(inc.inherited_contract_tests, goldS4.inherited_contract_tests), `dropped touched CT9 → inherited set diverges`);
  ok(inc.test_counts.inherited_contract_tests === 2, `inherited count drops to 2`);
  console.log(`  S4 minus CT9 → inherited=${JSON.stringify(inc.skeleton_fidelity.inherited_contract_tests)}`);
}
// (e) increment: touched CT* with no frozen T-CT* → structural_defect raised
{
  const sliceFlows = readJSON(`${GF}/.hld/slices/S4/flows.json`);
  const broken = readJSON(`${GF}/.hld/slices/S4/contracts.json`);
  broken.touched_contracts.push({ id: "CT99", between: ["C9", "C8"], kind: "sync_api", failure_modes: ["x"], traces: [] });
  const inc = emitIncrementTestSpecs(sliceFlows, broken, goldSpecs);
  ok(inc.structural_defects.some(d => d.target === "CT99"), `unknown touched CT99 → structural_defect to DERIVE-TESTS skeleton`);
  console.log(`  S4 + phantom CT99 → structural_defects=${JSON.stringify(inc.structural_defects.map(d => d.target))}`);
}

// ===========================================================================
// DETERMINISM — emit twice → deep-equal
// ===========================================================================
console.log("\n=== Determinism check ===");
{
  const a = JSON.stringify(emitSkeletonTestSpecs(contracts, flows, components));
  const b = JSON.stringify(emitSkeletonTestSpecs(contracts, flows, components));
  ok(a === b, "skeleton emit determinism");
  const da = JSON.stringify(buildDag(components)), db = JSON.stringify(buildDag(components));
  ok(da === db, "build-dag determinism");
  console.log(`  skeleton + build-dag → ${a === b && da === db ? "stable" : "DRIFT"}`);
}

console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
