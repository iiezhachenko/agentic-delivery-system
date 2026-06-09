#!/usr/bin/env node
// gen-manifest.mjs (P2.2) — emit manifest.json from SHIP allowlist.
// Zero-dep (node:fs/path/crypto). ALLOWLIST-driven: enumerate includes, NEVER walk-all-then-blacklist.
// Deterministic: files sorted by path, fixed key order, no --dirty → byte-identical on clean tree.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(process.argv[2] ?? '.');
const r = (p) => path.join(ROOT, p);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const hashFile = (rel) => sha256(fs.readFileSync(r(rel)));

// recursive file list (repo-relative, POSIX sep), sorted
function walk(relDir) {
  const out = [];
  for (const e of fs.readdirSync(r(relDir), { withFileTypes: true })) {
    const rel = `${relDir}/${e.name}`;
    if (e.isDirectory()) out.push(...walk(rel));
    else if (e.isFile()) out.push(rel);
  }
  return out;
}

// SHIP allowlist (mirrors task table). Each rule yields {src, path, harness} rows.
const RULES = [
  // 39 role prompts: src==path (phase dir preserved)
  { kind: 'glob', dir: 'prompts', harness: 'all',
    match: (p) => /^prompts\/0\d-[^/]+\/[^/]+\.md$/.test(p) },
  { kind: 'file', src: 'prompts/_step-runner.md',  harness: 'all' },
  { kind: 'file', src: 'prompts/_economy-audit.md', harness: 'all' },
  // path-map: generic sibling → canonical name
  { kind: 'file', src: 'prompts/_orchestrator.generic.md', path: 'prompts/_orchestrator.md', harness: 'all' },
  // whole stack lib EXCEPT self-host stack
  { kind: 'glob', dir: 'code-canon', harness: 'all',
    match: (p) => /^code-canon\/[^/]+\.md$/.test(p) && p !== 'code-canon/agentic-delivery-pipeline.md' },
  { kind: 'file', src: 'tools/economy-lint/lint.mjs',     harness: 'all' },
  { kind: 'file', src: 'tools/economy-lint/selftest.mjs', harness: 'all' },
  { kind: 'file', src: 'tools/economy-lint/README.md',    harness: 'all' },
  { kind: 'file', src: 'tools/fixtures/economy-lint/reference.md', harness: 'all' },
  { kind: 'file', src: 'tools/economy-audit/README.md',   harness: 'all' },
  { kind: 'file', src: 'docs/generic-usage-guide.md', harness: 'all' },
  { kind: 'file', src: 'docs/generic-workflow.md',    harness: 'all' },
  { kind: 'file', src: 'canon/CLAUDE.generic.md',     harness: 'all' },
  // adapter wiring (whole subtree)
  { kind: 'glob', dir: 'adapters/claude', harness: 'claude', match: () => true },
  { kind: 'glob', dir: 'adapters/kiro',   harness: 'kiro',   match: () => true },
];

// expand rules → rows
const rows = [];
const seen = new Set();
const addRow = (src, dest, harness) => {
  if (!fs.existsSync(r(src))) throw new Error(`SHIP src missing: ${src}`);
  if (seen.has(dest)) throw new Error(`dup dest path: ${dest}`);
  seen.add(dest);
  rows.push({ src, path: dest, sha256: hashFile(src), harness });
};
for (const rule of RULES) {
  if (rule.kind === 'file') {
    addRow(rule.src, rule.path ?? rule.src, rule.harness);
  } else {
    for (const src of walk(rule.dir)) if (rule.match(src)) addRow(src, src, rule.harness);
  }
}

// deterministic order: sort by dest path (plain codepoint compare, locale-independent)
rows.sort((a, b) => (a.path < b.path ? -1 : a.path > b.path ? 1 : 0));

// harness-matrix: paths a harness installs = harness ∈ {all, h}
const matrixFor = (h) => rows.filter((x) => x.harness === 'all' || x.harness === h).map((x) => x.path);

// ---- version derive (P2.3) ----
let gitDescribe;
try { gitDescribe = execFileSync('git', ['describe', '--tags', '--always'], { cwd: ROOT }).toString().trim(); }
catch { gitDescribe = '0.0.0'; }

// prompts content-hash = deliverable identity
const promptsHash = sha256(
  rows.filter((x) => x.path.startsWith('prompts/')).map((x) => `${x.path}\n${x.sha256}`).join('\n')
).slice(0, 8);

// lock-hash = root frozen-artifact locks (audit trail of which generation produced build)
const lockRels = ['.aprd', '.adr', '.hld', '.roadmap']
  .filter((d) => fs.existsSync(r(d)))
  .flatMap((d) => walk(d).filter((p) => p.endsWith('.lock')))
  .sort();
const lockHash = sha256(lockRels.map((rel) => `${rel}\n${hashFile(rel)}`).join('\n')).slice(0, 8);

const version = `${gitDescribe}+p${promptsHash}.l${lockHash}`;

const manifest = {
  version,
  files: rows,
  'harness-matrix': { claude: matrixFor('claude'), kiro: matrixFor('kiro') },
};

const outPath = r('manifest.json');
fs.writeFileSync(outPath, JSON.stringify(manifest, null, 2) + '\n');
console.error(`wrote ${outPath} — ${rows.length} files, version ${version}`);
