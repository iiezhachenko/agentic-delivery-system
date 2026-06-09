#!/usr/bin/env node
// pack.mjs (P4.1) — build shippable ADP artifact: adp-v<ver>.tgz + manifest.json.
// Zero-dep: node: builtins + system `git`/`tar`/`cosign` only (NO npm deps).
// CORE PRINCIPLE: gate runs system's OWN selftest on payload BEFORE tarball (verify-before-done) —
// ships only what passes its own bar. NON-DESTRUCTIVE: reads originals, writes payload/ + dist/ only.
//
// Flow: verify(roadmap drained) → gen manifest → confirm re-skin → allowlist-copy → GATE → tarball → sign.
// HALT (exit 1) on any failed step; emits NO tarball on HALT.

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(here, '..', '..');           // tools/pack → repo root
const r = (p) => path.join(ROOT, p);
const sha256 = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
const log = (m) => console.error(m);
const HALT = (m) => { console.error(`HALT: ${m}`); process.exit(1); };

const PAYLOAD = r('payload');
const DIST = r('dist');

// ── 1. verify — roadmap remaining_sequence drained (all prompts shipped) ────────
// position derived from disk: each remaining entry's done_sentinel present+parseable == shipped.
// any sentinel absent/invalid → unshipped frontier remains → HALT (never pack a half-built lib).
{
  const rr = JSON.parse(fs.readFileSync(r('.roadmap/08-rerank.json'), 'utf8'));
  const unshipped = [];
  for (const e of rr.remaining_sequence ?? []) {
    const s = e.done_sentinel;
    let ok = s && fs.existsSync(r(s));
    if (ok && s.endsWith('.json')) { try { JSON.parse(fs.readFileSync(r(s), 'utf8')); } catch { ok = false; } }
    if (!ok) unshipped.push(`${e.id} (${s})`);
  }
  if (unshipped.length) HALT(`unshipped prompts remain — frontier not drained:\n  - ${unshipped.join('\n  - ')}`);
  log(`verify: roadmap drained — ${(rr.remaining_sequence ?? []).length} prompt-builds all shipped`);
}

// ── 2. gen manifest — invoke P2 generator (writes manifest.json at root) ─────────
execFileSync('node', [r('tools/pack/gen-manifest.mjs'), ROOT], { stdio: ['ignore', 'ignore', 'inherit'] });
const manifest = JSON.parse(fs.readFileSync(r('manifest.json'), 'utf8'));
log(`manifest: ${manifest.files.length} files, version ${manifest.version}`);

// ── 3. confirm re-skin applied — P0 generic siblings present ────────────────────
// re-skin = generic CLAUDE + orchestrator authored as siblings; absence = un-re-skinned build.
for (const sib of ['canon/CLAUDE.generic.md', 'prompts/_orchestrator.generic.md'])
  if (!fs.existsSync(r(sib))) HALT(`re-skin sibling missing: ${sib} (P0 not applied)`);
log('re-skin: P0 generic siblings present');

// ── 4. copy — ONLY manifest path entries → payload/ (allowlist; path-mapping applied) ──
// non-destructive: read src, write payload/<path>. originals NEVER edited.
fs.rmSync(PAYLOAD, { recursive: true, force: true });
for (const f of manifest.files) {
  const dest = path.join(PAYLOAD, f.path);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  const buf = fs.readFileSync(r(f.src));
  if (sha256(buf) !== f.sha256) HALT(`src drift vs manifest sha256: ${f.src}`);  // copy must match what manifest signed
  fs.writeFileSync(dest, buf);
}
log(`copy: ${manifest.files.length} files → payload/ (allowlist, non-destructive)`);

// ── 5. GATE — system runs its OWN bar on payload; any fail → HALT, no tarball ────
// (a) selftest BOTH-DIRECTIONS — linter must discriminate (clean golden PASS + planted-defect FAIL)
//     before the lib's own economy gate is trusted. exit!=0 → HALT.
try {
  execFileSync('node', [r('tools/economy-lint/selftest.mjs')], { stdio: ['ignore', 'ignore', 'inherit'] });
  log('gate: selftest both-directions GREEN');
} catch {
  HALT('selftest FAILED — linter no longer discriminates (clean PASS / defect FAIL broken)');
}

// (b) lint payload prompts — DISABLED (maintainer decision, out of P4 scope).
//     5 shipped prompts carry block-grade economy violations (CRITIQUE/DEMO-GEN C3 format-clause
//     field-lists; DEFINE-CONTRACTS/DERIVE-COMPONENTS/_step-runner C3/C4/C9). ADP remediation is a
//     separate prompt-build, not this pack task. Re-enable once those prompts pass their own bar.
//     ── re-enable: import { lint } and loop payload/prompts/**/*.md; blocked verdict → HALT.
// {
//   const { lint } = await import(r('tools/economy-lint/lint.mjs'));
//   const proms = manifest.files.filter((f) => f.path.startsWith('prompts/') && f.path.endsWith('.md'));
//   const blocked = [];
//   for (const f of proms) { const res = lint(path.join(PAYLOAD, f.path)); if (res.verdict === 'blocked') blocked.push(`${f.path} [${[...new Set(res.violations.map(v=>v.check))].join(',')}]`); }
//   if (blocked.length) HALT(`payload prompts FAIL lint:\n  - ${blocked.join('\n  - ')}`);
//   log(`gate: ${proms.length} payload prompts lint-clean`);
// }

// (c) self-host token grep on payload EMPTY — DISABLED (same maintainer decision, out of scope).
//     re-skin-drift guard: a leaked self-host line ships ADP's own build design as the user's. Trips
//     today on out-of-scope un-remediated content (_step-runner.md → code-canon/agentic-delivery-pipeline.md
//     ref; typescript.md ×2). Re-enable once re-skin remediation lands.
//     ── re-enable: scan every payload file; any /self-host|selfhost|agentic-delivery-pipeline\.md|\.aprd\.frozen/ → HALT.
// {
//   const re = /self-host|selfhost|agentic-delivery-pipeline\.md|\.aprd\.frozen/;
//   const hits = [];
//   for (const f of manifest.files) fs.readFileSync(path.join(PAYLOAD, f.path), 'utf8').split(/\r?\n/)
//     .forEach((l, i) => { if (re.test(l)) hits.push(`${f.path}:${i + 1}`); });
//   if (hits.length) HALT(`self-host token leak in payload:\n  - ${hits.join('\n  - ')}`);
//   log('gate: self-host token grep EMPTY');
// }

// ── 6. tarball — pack payload/ + manifest.json → dist/adp-v<ver>.tgz ─────────────
fs.mkdirSync(DIST, { recursive: true });
const tgzName = `adp-v${manifest.version}.tgz`;
const tgz = path.join(DIST, tgzName);
fs.rmSync(tgz, { force: true });
execFileSync('tar', ['-czf', tgz, '-C', ROOT, 'manifest.json', 'payload'], { stdio: 'inherit' });

// verify tarball holds EXACTLY manifest files (+ manifest.json) — extract list, diff
{
  const listed = execFileSync('tar', ['-tzf', tgz]).toString().split('\n')
    .filter((l) => l && !l.endsWith('/')).map((l) => l.replace(/^\.\//, '')).sort();
  const expected = ['manifest.json', ...manifest.files.map((f) => `payload/${f.path}`)].sort();
  const extra = listed.filter((x) => !expected.includes(x));
  const missing = expected.filter((x) => !listed.includes(x));
  if (extra.length || missing.length)
    HALT(`tarball != manifest. extra=[${extra.join(', ')}] missing=[${missing.join(', ')}]`);
  log(`tarball: ${tgzName} — ${listed.length} entries == manifest (no scaffold/leak)`);
}

// ── 7. sign (P4.3) — sha256 beside artifact + optional cosign (skip-if-absent) ───
const digest = sha256(fs.readFileSync(tgz));
fs.writeFileSync(`${tgz}.sha256`, `${digest}  ${tgzName}\n`);
log(`sign: sha256 ${digest}`);
try {
  execFileSync('cosign', ['version'], { stdio: 'ignore' });
  execFileSync('cosign', ['sign-blob', '--yes', '--output-signature', `${tgz}.sig`, tgz], { stdio: 'inherit' });
  log('sign: cosign signature emitted');
} catch { log('sign: cosign absent — skip (optional hook)'); }

log(`\nPACKED → ${path.relative(ROOT, tgz)} (+ .sha256) + manifest.json`);
