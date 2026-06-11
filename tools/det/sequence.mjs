#!/usr/bin/env node
// Topo-sort + fixed priority: SEQUENCE (prompts/01-roadmap/SEQUENCE.md) + RE-RANK anti-thrash.
// Pure core fns take already-loaded slice bodies, return ordered list + dependency_check.
// Zero deps, ESM, deterministic. Mirrors graph-lint.mjs split (pure core, no disk).
//
// Algorithm (SEQUENCE.md "ordering rule" / doc-00):
//   skeleton pinned position 1; greedy frontier fill respecting depends_on as hard topo;
//   tie-break comparator in order: (a) value high>med>low (b) retires_risk != null first
//   (c) lower cost_proxy (d) lowest S* numeric index. Cycle/dangling → dependency_defect.
// cost_proxy = len(requirements)+len(acceptance) (declared proxy; SEQUENCE.md Rule 4).
// RE-RANK reuses the same topo+priority; emits verdict:unchanged when NO material change.

const VALUE_RANK = { high: 0, med: 1, low: 2 };  // high>med>low (lower rank = higher priority)

// --- cost proxy: feature depth = requirements + acceptance count (SEQUENCE.md Rule 4) ---
export function costProxy(slice) {
  return (slice.requirements || []).length + (slice.acceptance || []).length;
}

// --- S* numeric index for deterministic tiebreak (lowest first) -----------------
function sIndex(id) {
  const m = /(\d+)$/.exec(id);
  return m ? Number(m[1]) : Number.MAX_SAFE_INTEGER;
}

// --- priority comparator: (a) value (b) retires_risk!=null (c) cost (d) S* index ---
function comparePriority(a, b) {
  const va = VALUE_RANK[a.value] ?? 99, vb = VALUE_RANK[b.value] ?? 99;
  if (va !== vb) return va - vb;
  const ra = a.retires_risk != null ? 0 : 1, rb = b.retires_risk != null ? 0 : 1;
  if (ra !== rb) return ra - rb;
  const ca = costProxy(a), cb = costProxy(b);
  if (ca !== cb) return ca - cb;
  return sIndex(a.id) - sIndex(b.id);
}

// --- cycle detect: DFS over depends_on restricted to set; returns cycle path or null ---
function findCycle(byId, ids) {
  const state = {};  // id -> 0 unvisited, 1 in-stack, 2 done
  const stack = [];
  let cyclePath = null;
  const dfs = (id) => {
    if (cyclePath) return;
    state[id] = 1; stack.push(id);
    for (const dep of byId[id].depends_on || []) {
      if (!(dep in byId)) continue;  // dangling handled separately
      if (state[dep] === 1) { cyclePath = [...stack.slice(stack.indexOf(dep)), dep]; return; }
      if (state[dep] === undefined) dfs(dep);
      if (cyclePath) return;
    }
    stack.pop(); state[id] = 2;
  };
  for (const id of ids) if (state[id] === undefined) dfs(id);
  return cyclePath;
}

// --- sequence: slices + skeletonId -> ordered positions + dependency_check ------
// slices: [{ id, name, value, retires_risk, depends_on, requirements, acceptance }]
// Returns { verdict, sequence[], dependency_check, coverage }.
export function sequence(slices, { skeletonId } = {}) {
  const byId = {};
  for (const s of slices) byId[s.id] = s;
  const eligible = slices.map(s => s.id);
  const eligibleSet = new Set(eligible);

  // dangling: any depends_on id not in eligible set (SEQUENCE.md Rule 5)
  const dangling = [];
  for (const s of slices) for (const d of s.depends_on || []) if (!eligibleSet.has(d)) dangling.push(d);

  // skeleton-is-root: skeleton carries empty depends_on (SEQUENCE.md Rule 1 / escapes)
  const skel = skeletonId ? byId[skeletonId] : null;
  const skeletonIsRoot = skeletonId ? !!skel && (skel.depends_on || []).length === 0 : true;

  const cycle = findCycle(byId, eligible);

  if (cycle || dangling.length > 0 || !skeletonIsRoot) {
    return {
      verdict: "dependency_defect",
      sequence: [],
      dependency_check: {
        acyclic: !cycle,
        skeleton_is_root: skeletonIsRoot,
        cycles: cycle ? [cycle] : [],
        dangling_depends_on: [...new Set(dangling)],
      },
      coverage: { eligible_slices: eligible, sequenced: [], missing: eligible.slice(), duplicated: [] },
    };
  }

  // greedy frontier fill: skeleton pinned position 1, then topo+priority
  const placed = new Set();
  const order = [];
  if (skeletonId) { order.push(skeletonId); placed.add(skeletonId); }
  while (placed.size < eligible.length) {
    const frontier = eligible.filter(id =>
      !placed.has(id) && (byId[id].depends_on || []).every(d => placed.has(d)));
    if (frontier.length === 0) break;  // should not happen (acyclic + no dangling)
    frontier.sort((x, y) => comparePriority(byId[x], byId[y]));
    const winner = frontier[0];
    order.push(winner); placed.add(winner);
  }

  const seq = order.map((id, i) => {
    const s = byId[id];
    return {
      position: i + 1,
      id,
      name: s.name,
      skeleton: id === skeletonId,
      value: s.value,
      retires_risk: s.retires_risk ?? null,
      depends_on: s.depends_on || [],
      cost_proxy: costProxy(s),
    };
  });

  return {
    verdict: "sequenced",
    sequence: seq,
    dependency_check: { acyclic: true, skeleton_is_root: skeletonIsRoot, cycles: [], dangling_depends_on: [] },
    coverage: {
      eligible_slices: eligible,
      sequenced: order.slice(),
      missing: eligible.filter(id => !placed.has(id)),
      duplicated: [],
    },
  };
}

// --- material-change detector for RE-RANK anti-thrash gate (RE-RANK.md discriminator 6) ---
// Material change iff: added/removed real dep, OR value/risk changed, for any slice.
// prev/current keyed by id: { id, value, retires_risk, depends_on }.
export function hasMaterialChange(prev, current) {
  const prevById = {}; for (const s of prev) prevById[s.id] = s;
  for (const c of current) {
    const p = prevById[c.id];
    if (!p) return true;  // new slice
    const pd = new Set(p.depends_on || []), cd = new Set(c.depends_on || []);
    if (pd.size !== cd.size) return true;
    for (const d of cd) if (!pd.has(d)) return true;       // added dep
    for (const d of pd) if (!cd.has(d)) return true;       // removed dep
    if (p.value !== c.value) return true;                  // value change
    if ((p.retires_risk ?? null) !== (c.retires_risk ?? null)) return true;  // risk change
  }
  return false;
}

// --- rerank: prev order + current slice bodies -> re-ranked order or unchanged ---
// No MATERIAL change → verdict:unchanged + base order preserved (anti-thrash gate).
export function rerank(prev, current, { skeletonId } = {}) {
  if (!hasMaterialChange(prev, current)) {
    return { verdict: "unchanged", sequence: prev.slice() };
  }
  const res = sequence(current, { skeletonId });
  return { ...res, verdict: res.verdict === "dependency_defect" ? "dependency_defect" : "re_ranked" };
}

// --- CLI: read a slices.json + optional --skeleton, print sequence --------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const fs = await import("node:fs");
  const args = process.argv.slice(2);
  const file = args.find(a => !a.startsWith("--"));
  const skIdx = args.indexOf("--skeleton");
  const skeletonId = skIdx >= 0 ? args[skIdx + 1] : undefined;
  if (!file) { console.error("usage: node sequence.mjs <slices.json> [--skeleton <S*>]"); process.exit(2); }
  let slices;
  try { slices = JSON.parse(fs.readFileSync(file, "utf8")).slices; }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  const res = sequence(slices, { skeletonId });
  console.log(JSON.stringify(res, null, 2));
  process.exit(res.verdict === "dependency_defect" ? 1 : 0);
}
