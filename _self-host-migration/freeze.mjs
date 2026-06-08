#!/usr/bin/env node
// freeze.mjs — D-3, migration-spec §6 M3. Mechanical (NO-LLM) render of the kept
// source files into the frozen _self/ tree the prompts expect. Deterministic +
// idempotent: byte-stable given unchanged sources (D20 / spec §9). _self/ is a
// rebuildable cache (invariant #5) — never hand-edit it; re-run this on any source change.
//
//   node _self-host-migration/freeze.mjs [outDir=_self]
//
// Reads (read-only): _rules.md, _decisions.md, _tracker.md, _initial_design/00-04,
// prompts/<phase>/<ROLE>.md. Writes: <outDir>/{.aprd,.adr,.hld,.roadmap}.

import { readFileSync, writeFileSync, mkdirSync, rmSync, readdirSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const OUT = resolve(ROOT, process.argv[2] || "_self");
const FREEZE_DATE = "2026-06-08T00:00:00Z"; // fixed → byte-stable (never now())

const read = (p) => readFileSync(join(ROOT, p), "utf8");
const sha256 = (s) => createHash("sha256").update(s, "utf8").digest("hex");
const jstr = (o) => JSON.stringify(o, null, 2) + "\n"; // stable: insertion-order keys
function emit(rel, content) {
  const abs = join(OUT, rel);
  mkdirSync(dirname(abs), { recursive: true });
  writeFileSync(abs, content);
}
// slice a markdown section body between a header line and the next header at <= its level
function section(md, headerRe, stopRe) {
  const lines = md.split("\n");
  let i = lines.findIndex((l) => headerRe.test(l));
  if (i < 0) return "";
  const out = [];
  for (let j = i + 1; j < lines.length; j++) {
    if (stopRe.test(lines[j])) break;
    out.push(lines[j]);
  }
  return out.join("\n").trim();
}
// extract first fenced ``` block after a marker line
function fenced(md, markerRe) {
  const lines = md.split("\n");
  let i = lines.findIndex((l) => markerRe.test(l));
  if (i < 0) return "";
  let start = -1;
  for (let j = i + 1; j < lines.length; j++) {
    if (lines[j].trim().startsWith("```")) { start = j; break; }
  }
  if (start < 0) return "";
  const out = [];
  for (let j = start + 1; j < lines.length; j++) {
    if (lines[j].trim().startsWith("```")) break;
    out.push(lines[j]);
  }
  return out.join("\n");
}
const slug = (s) =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70);

// ───────────────────────────────────────────────────────────────────────────
// Fresh-render the target (additive elsewhere; _self/ is a cache so a full
// re-render is correct and what makes the run byte-stable).
if (existsSync(OUT)) rmSync(OUT, { recursive: true, force: true });

const rules = read("_rules.md");
const decisions = read("_decisions.md");
const tracker = read("_tracker.md");

// ── .aprd/ ───────────────────────────────────────────────────────────────────
// The WHAT of the self-host deliverable: build the agentic delivery prompt set.
// Source: _rules.md Mission + source-specs tables; specs _initial_design/00-04.
{
  const mission = section(rules, /^## Mission/, /^## Source specs/);
  const specsInScope = section(rules, /^## Source specs/, /^## Build order/);
  const buildOrder = section(rules, /^## Build order/, /^---/);
  const frozen = `# aPRD — Agentic Delivery Pipeline (self-host) (FROZEN v1)

> Frozen, signed contract. Immutable — a later change is a new version + change request that re-triggers affected downstream stages (P8). This is the WHAT the self-host Build phase reads: the deliverable is the **executable AI prompt set** for the greenfield delivery pipeline (specs 00–04). Rendered mechanically from \`_rules.md\` (Mission + source specs) by \`_self-host-migration/freeze.mjs\` — do not hand-edit (invariant #5).

## PROJECT
Build the agentic delivery system on itself: author the remaining executable AI prompts that turn the five greenfield-delivery design specs into a runnable pipeline. The deliverable's "code" unit is one prompt \`.md\` (D21).

## CLASS
self-host (stack = agentic-delivery-pipeline · ADR-0021)

## MISSION
${mission}

## SOURCE SPECS (the requirement source the prompts realize)
${specsInScope}

## BUILD ORDER
${buildOrder}
`;
  emit(".aprd/aprd.frozen.md", frozen);
  emit(
    ".aprd/aprd.lock",
    jstr({
      artifact: "aprd.frozen.md",
      version: "v1",
      content_sha256: sha256(frozen),
      signer: "self-host:agentic-delivery-pipeline",
      signed_at: FREEZE_DATE,
      status: "frozen",
    })
  );
}

// ── .adr/ ────────────────────────────────────────────────────────────────────
// Decisions D1–D21 → one ADR log per decision. D21 = the stack ADR (ADR-0021).
// D1–D4 are the foundational conventions (live in _rules.md Conventions, indexed
// in _tracker.md); D5–D21 bodies live in _decisions.md.
{
  // D1–D4 — foundational conventions (from _tracker.md index + _rules.md Conventions)
  const conv = [
    ["D1", "One role = one prompt", "Role separation is load-bearing (failure isolation, every spec §8). May split a role further if justified. Source: _rules.md Conventions."],
    ["D2", "Storage layout", "Authored prompts at prompts/<NN-phase>/<ROLE>.md; sim workspace holds .aprd/.roadmap/.adr/.hld/.build/src trees. Source: _rules.md Storage layout."],
    ["D3", "Artifacts land on disk", "Every prompt instructs its agent to WRITE its output to the spec-defined path; the deliverable is the file on disk, not the reply. Source: _rules.md Conventions."],
    ["D4", "Greenfield class first", "Author the full vertical greenfield path (Phase 0→4) before generalizing to other classes via playbook overlays. Source: _rules.md Conventions."],
  ];

  // D5–D21 — parse bullets out of _decisions.md
  const dlines = decisions.split("\n");
  const decBullets = [];
  let cur = null;
  for (const l of dlines) {
    const m = l.match(/^- \*\*D(\d+) — (.+)$/);
    if (m) {
      if (cur) decBullets.push(cur);
      // title = text up to "(RESOLVED" or first sentence period
      let rest = m[2];
      let title = rest.split(/\s*\(RESOLVED/)[0].trim().replace(/\.$/, "");
      cur = { n: Number(m[1]), title, body: [l] };
    } else if (cur) {
      cur.body.push(l);
    }
  }
  if (cur) decBullets.push(cur);
  const byN = new Map(decBullets.map((d) => [d.n, d]));

  const adrs = [];
  const logBodies = []; // (filename, content) sorted for hashing
  for (let n = 1; n <= 21; n++) {
    const id = `ADR-${String(n).padStart(4, "0")}`;
    let title, body, source;
    const c = conv.find((x) => x[0] === `D${n}`);
    if (c) {
      title = c[1];
      source = "_rules.md Conventions · _tracker.md Decision index";
      body = `## Decision\n\n${c[2]}\n\n## Context\n\nFoundational authoring convention (D${n}), baselined before the spine was built. Indexed in _tracker.md (D1–D4 → _rules.md Conventions).`;
    } else if (byN.has(n)) {
      const d = byN.get(n);
      title = d.title;
      source = "_decisions.md";
      // strip the leading "- **D# — title (RESOLVED ...).**" marker from the body's first line
      const raw = d.body.join("\n").trim();
      body = `## Decision\n\n${raw}`;
    } else {
      continue;
    }
    const fname = `${String(n).padStart(4, "0")}-${slug(title)}.md`;
    const stack = n === 21;
    const content = `---
id: ${id}
title: ${title}
status: Accepted
date: 2026-06-08
class: self-host
scope: global
mode: foundation${stack ? "\nstack: agentic-delivery-pipeline" : ""}
source: ${source}
supersedes: null
superseded_by: null
---

${body}
`;
    emit(`.adr/log/${fname}`, content);
    logBodies.push([fname, content]);
    adrs.push({ id, dn: `D${n}`, title, status: "Accepted", log_ref: `log/${fname}` });
  }

  logBodies.sort((a, b) => a[0].localeCompare(b[0]));
  const adrHash = sha256(logBodies.map((x) => x[1]).join(""));
  emit(
    ".adr/adr.lock",
    jstr({
      artifact: ".adr/log/",
      version: "v1",
      content_sha256: adrHash,
      signer: "self-host:agentic-delivery-pipeline",
      signed_at: FREEZE_DATE,
      status: "frozen",
      gate: { reconcile_verdict: "coherent", critique_verdict: "clean" },
      class: "self-host",
      stack_adr: "ADR-0021",
      adrs,
      adr_count: adrs.length,
    })
  );
}

// ── .hld/ ──────────────────────────────────────────────────────────────────
// The deliverable's design skeleton: the prompt scaffold (DRY skeleton) + coding
// canon (caveman + PR1–4 + AB1–6) + the role components + the phase build-DAG +
// the producer/consumer contracts (PR2). Source: _rules.md + the prompts/ tree.
{
  const caveman = fenced(rules, /Canonical caveman block/);
  const drySkeleton = fenced(rules, /Standard prompt skeleton/);
  const prBlock = section(rules, /^## Locked requirements/, /^### Canonical caveman/);
  const abBlock = section(rules, /Anti-bloat authoring rules/, /^## Conventions/);
  const conventions = section(rules, /^## Conventions for authored prompts/, /^## Storage layout/);

  // Components = the role library, scanned from the built skeleton (prompts/).
  // Recognizes prompts/* as the built skeleton (spec §6 M3 acceptance).
  const phaseNames = {
    "00-aprd": "aPRD (Understand)",
    "01-roadmap": "Roadmap (Plan)",
    "02-adr": "ADR (Decide)",
    "03-hld": "HLD (Design)",
    "04-build": "Build (Deliver)",
  };
  const phases = readdirSync(join(ROOT, "prompts"), { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name)
    .sort();
  const components = [];
  for (const ph of phases) {
    const roles = readdirSync(join(ROOT, "prompts", ph))
      .filter((f) => f.endsWith(".md"))
      .map((f) => f.replace(/\.md$/, ""))
      .sort();
    components.push({
      phase: ph,
      name: phaseNames[ph] || ph,
      roles,
      role_count: roles.length,
      unit_path: `prompts/${ph}/<ROLE>.md`,
    });
  }
  const totalRoles = components.reduce((a, c) => a + c.role_count, 0);

  emit(
    ".hld/skeleton/prompt-skeleton.md",
    `# Prompt scaffold (DRY skeleton, D10)\n\n> The single scaffold every authored prompt follows. Frozen from _rules.md "Standard prompt skeleton". One home per fact (AB1–AB6).\n\n\`\`\`\n${drySkeleton}\n\`\`\`\n`
  );
  emit(
    ".hld/skeleton/coding-canon.md",
    `# Coding canon — the prompt-domain idioms (D21 field 2)\n\n> Frozen from _rules.md. The canon IMPLEMENT specializes to a contract; canon is never the source of truth (B11).\n\n## Caveman block (PR4 — paste verbatim into every prompt)\n\n\`\`\`\n${caveman}\n\`\`\`\n\n## Locked requirements PR1–PR4\n${prBlock}\n\n## Anti-bloat authoring rules AB1–AB6\n${abBlock}\n\n## Conventions\n${conventions}\n`
  );
  emit(".hld/skeleton/components.json", jstr({
    artifact: "components.json",
    class: "self-host",
    note: "Role library = the build-DAG nodes of the agentic-delivery-pipeline deliverable. Scanned from prompts/ (the built skeleton). One role = one prompt (D1).",
    phases: components,
    component_count: totalRoles,
  }));
  emit(".hld/skeleton/build-dag.json", jstr({
    artifact: "build-dag.json",
    class: "self-host",
    note: "Phase build order 0→1→2→3→4 (each phase consumes the prior phase's artifact format; _rules.md Build order). Within a phase: spine-stage order.",
    build_order: phases,
    waves: phases.map((p) => [p]),
    cycles: [],
    nodes: phases.length,
  }));
  emit(".hld/skeleton/contracts.json", jstr({
    artifact: "contracts.json",
    class: "self-host",
    note: "Producer/consumer chain (PR2): each prompt writes the exact place+format the next reads; output schema of step N == input schema of step N+1. IDs thread R→AC→S→ADR→C→CT→F→commit.",
    rule: "PR2",
    chain: phases.map((p, i) => ({
      from: p,
      to: phases[i + 1] || null,
      contract: phases[i + 1] ? `${p}.outputs == ${phases[i + 1]}.inputs` : "terminal (accepted staging demo)",
    })),
  }));

  const skelFrozen = `# HLD Skeleton — Agentic Delivery Pipeline (self-host) (FROZEN v1)

> Frozen, signed skeleton. Immutable. The self-host Build phase reads this + the .hld/skeleton/*.json artifacts it manifests. Gate: RECONCILE/CRITIQUE verdict **clean**. Rendered mechanically by freeze.mjs — do not hand-edit (invariant #5).

## CLASS
self-host

## SCAFFOLD
The DRY prompt skeleton (D10) — see skeleton/prompt-skeleton.md. Every authored prompt = frontmatter + caveman block (PR4) + Role/Discriminator/Rules/Task-steps/Output-schema/Stop. One home per fact (AB1–AB6).

## CODING CANON
AB1–AB6 + PR1–PR4 + the caveman block — see skeleton/coding-canon.md.

## COMPONENTS (build-DAG nodes = the role library)
${components.map((c) => `- **${c.phase}** (${c.name}): ${c.role_count} roles — ${c.roles.join(", ")}.`).join("\n")}

Total: ${totalRoles} roles across ${components.length} phases. The built skeleton (prompts/) is the shipped subset; the remaining_sequence (.roadmap/08-rerank.json) is the unshipped frontier.

## BUILD ORDER (topological)
${phases.join(" → ")} (each phase consumes the prior phase's artifact format; no cycles).

## CONTRACTS
Producer/consumer (PR2): output schema of step N == input schema of step N+1 — see skeleton/contracts.json.
`;
  emit(".hld/skeleton.frozen.md", skelFrozen);

  // skeleton.lock — hash over the skeleton/* set (sorted) + the frozen doc
  const skelDir = join(OUT, ".hld/skeleton");
  const skelFiles = readdirSync(skelDir).sort();
  const skelHash = sha256(
    skelFiles.map((f) => readFileSync(join(skelDir, f), "utf8")).join("") + skelFrozen
  );
  emit(".hld/skeleton.lock", jstr({
    artifact: ".hld/skeleton/",
    version: "v1",
    content_sha256: skelHash,
    signer: "self-host:agentic-delivery-pipeline",
    signed_at: FREEZE_DATE,
    status: "frozen",
    gate: { reconcile_critique_verdict: "clean" },
    class: "self-host",
    mode: "skeleton",
    built_against: { aprd_lock: ".aprd/aprd.lock", adr_lock: ".adr/adr.lock" },
    artifacts: [
      { name: "prompt-skeleton.md", ref: ".hld/skeleton/prompt-skeleton.md", summary: "the DRY prompt scaffold (D10)" },
      { name: "coding-canon.md", ref: ".hld/skeleton/coding-canon.md", summary: "caveman + PR1–4 + AB1–6 + conventions" },
      { name: "components.json", ref: ".hld/skeleton/components.json", summary: `${totalRoles} roles across ${components.length} phases` },
      { name: "build-dag.json", ref: ".hld/skeleton/build-dag.json", summary: `${phases.length}-phase build order` },
      { name: "contracts.json", ref: ".hld/skeleton/contracts.json", summary: "PR2 producer/consumer chain" },
    ],
    skeleton_counts: { phases: components.length, roles: totalRoles },
  }));
}

// ── .roadmap/ ────────────────────────────────────────────────────────────────
// remaining_sequence = the unshipped prompts (RECONCILE/CRITIQUE increment first),
// each with a done_sentinel. Mechanical render of _tracker.md "Prompt inventory &
// status" (30/39 done; remaining = the RECONCILE/CRITIQUE increment + 8 Phase-4
// SLICE-BUILD modes). This is the self-host repurposing of the RE-RANK 08 schema
// (D21): each "slice" = one prompt-build; done_sentinel = the disk path whose
// presence+validity == that build shipped (the orchestrator STEP-0 derived-state key).
{
  const F = "_fixtures";
  const completed = [
    { position: 1, id: "P-DERIVE-TESTS-INC", name: "DERIVE-TESTS increment mode", status: "shipped",
      unit: "prompts/03-hld/DERIVE-TESTS.md (increment)",
      done_sentinel: `${F}/greenfield-clean/.hld/slices/S4/test-specs.json` },
  ];
  const rs = [
    { id: "P-RECONCILE-CRITIQUE-INC", name: "RECONCILE/CRITIQUE increment mode", value: "high",
      retires_risk: "phase-3-increment-chain-incomplete",
      unit: "prompts/03-hld/RECONCILE-CRITIQUE.md (increment)",
      done_sentinel: `${F}/greenfield-clean/.hld/slices/S4/reconcile.json`,
      rationale: "Phase-3 role 8/8, last Phase-3 increment (D9/D14); unblocks the Phase-4 SLICE-BUILD modes. First net-new self-build (migration-spec §7 M5b)." },
    { id: "P-BUILD-PLAN-SLICE", name: "BUILD-PLAN slice-build mode", value: "high", retires_risk: null,
      unit: "prompts/04-build/BUILD-PLAN.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/build-plan.json`,
      rationale: "Phase-4 slice-build (D11); blocked on the Phase-3 increment chain finishing." },
    { id: "P-MATERIALIZE-ORACLE-SLICE", name: "MATERIALIZE-ORACLE slice-build mode", value: "high", retires_risk: null,
      unit: "prompts/04-build/MATERIALIZE-ORACLE.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/oracle.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-IMPLEMENT-SLICE", name: "IMPLEMENT slice-build mode", value: "high", retires_risk: null,
      unit: "prompts/04-build/IMPLEMENT.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/build-record.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-INTEGRATE-SLICE", name: "INTEGRATE slice-build mode", value: "med", retires_risk: null,
      unit: "prompts/04-build/INTEGRATE.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/integration-record.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-DIAGNOSE-SLICE", name: "DIAGNOSE slice-build mode", value: "med", retires_risk: null,
      unit: "prompts/04-build/DIAGNOSE.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/diagnosis.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-VERIFY-OUTPUT-SLICE", name: "VERIFY-OUTPUT slice-build mode", value: "high", retires_risk: null,
      unit: "prompts/04-build/VERIFY-OUTPUT.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/verify-output.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-CRITIQUE-SLICE", name: "CRITIQUE slice-build mode", value: "med", retires_risk: null,
      unit: "prompts/04-build/CRITIQUE.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/critique.json`,
      rationale: "Phase-4 slice-build (D11)." },
    { id: "P-DEMO-GEN-SLICE", name: "DEMO-GEN slice-build mode", value: "high", retires_risk: null,
      unit: "prompts/04-build/DEMO-GEN.md (slice-build)",
      done_sentinel: `${F}/greenfield-build-reds/.build/slices/S4/demo/demo.json`,
      rationale: "Phase-4 slice-build (D11), interactive demo+accept gate." },
  ];
  const remaining_sequence = rs.map((e, i) => {
    const prev = i === 0 ? completed[0].id : rs[i - 1].id;
    return { position: i + 2, ...e, coarse_depends_on: [prev], real_depends_on: [prev] };
  });

  emit(".roadmap/08-rerank.json", jstr({
    base_ref: ".roadmap/07-sequence-reviewed.json",
    class: "agentic-delivery-pipeline",
    roadmap_version: 2,
    verdict: "re_ranked",
    _note: "SELF-HOST repurposing of the RE-RANK 08 schema (D21): each 'slice' = one remaining PROMPT-BUILD, not a product slice. done_sentinel = the disk path whose presence+validity == that build shipped (orchestrator STEP-0 derived-state key; D14/D20 analog). Rendered from _tracker.md 'Prompt inventory & status' by freeze.mjs.",
    completed,
    remaining_sequence,
    dependency_check: { acyclic: true, legal: true, against: "build_order", cycles: [], dangling_real_depends_on: [] },
    coverage: {
      completed: completed.map((c) => c.id),
      remaining_ranked: remaining_sequence.map((r) => r.id),
      missing: [], duplicated: [],
    },
    rerank_counts: { completed: completed.length, remaining: remaining_sequence.length, reordered: 0, deps_removed: 0, deps_added: 0 },
  }));

  const roadmapMd = `# Self-Host Build Roadmap — remaining prompt-builds

> The unshipped frontier of the agentic-delivery-pipeline deliverable. Each entry below is one prompt-build the self-host loop authors, verifies clean-room against \`_fixtures/\`, and promotes to \`prompts/\`. Order = \`08-rerank.json\` \`remaining_sequence\`; position is derived from disk (the \`done_sentinel\` scan), never read from a tracker. Rendered by freeze.mjs.

## Shipped (built skeleton)
- **P-DERIVE-TESTS-INC** — DERIVE-TESTS increment mode (last-shipped 2026-06-08; the M0 proof-twin).

## Remaining (build in order)
${remaining_sequence.map((r) => `${r.position - 1}. **${r.id}** — ${r.name}. Unit: \`${r.unit}\`. Sentinel: \`${r.done_sentinel}\`.${r.rationale ? " " + r.rationale : ""}`).join("\n")}

The frontier is the first entry whose \`done_sentinel\` is absent or schema-invalid — today **P-RECONCILE-CRITIQUE-INC** (its sentinel \`reconcile.json\` does not yet exist).
`;
  emit(".roadmap/roadmap.md", roadmapMd);
}

console.log(`froze _self/ → ${OUT}`);
