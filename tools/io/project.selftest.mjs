#!/usr/bin/env node
// Both-directions selftest for context projector (project.mjs).
// forward: all projection types + whole project() call PASS on valid input.
// reverse: dropped-key/error-path defects caught (planted defect provokes failure).
// Exits 0 all-green, 1 any-fail. Zero deps, mirrors resolve.selftest.mjs.
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { applyProjection, project, ProjectionError } from '/workspace/tools/io/project.mjs'

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`) } }
function throwsProjection(fn, msg) {
  try { fn(); fail++; console.log(`  FAIL: ${msg} — no throw`) }
  catch (e) {
    if (e instanceof ProjectionError) pass++
    else { fail++; console.log(`  FAIL: ${msg} — wrong error type: ${e.constructor.name}: ${e.message}`) }
  }
}

// helper: apply key-pattern and parse result
const kp = (obj, pattern) => JSON.parse(applyProjection(JSON.stringify(obj), true, { type: 'key-pattern', pattern }))

// ===========================================================================
// FORWARD — whole-file (no spec + explicit spec): content returned unchanged.
// ===========================================================================
{
  const c = 'hello world\nline2'
  ok(applyProjection(c, false, undefined) === c, 'F1: no spec returns full content')
  ok(applyProjection('{"a":1}', true, { type: 'whole-file' }) === '{"a":1}', 'F2: whole-file spec unchanged')
}

// ===========================================================================
// FORWARD — key-pattern: only matching keys returned; non-matching absent.
// ===========================================================================
{
  const ct = kp({ CT1: 'a', CT2: 'b', other: 'c' }, 'CT*')
  ok(ct.CT1 === 'a' && ct.CT2 === 'b', 'F3a: CT* keys present')
  ok(!ct.hasOwnProperty('other'), 'F3b: non-CT* key absent')

  const r = kp({ R1: 'x', R2: 'y', S1: 'z' }, 'R*')
  ok(r.R1 === 'x' && r.R2 === 'y', 'F4a: R* keys present')
  ok(!r.hasOwnProperty('S1'), 'F4b: non-R* key absent')
}

// ===========================================================================
// FORWARD — dot-path: string leaf as-is, array leaf as JSON.
// ===========================================================================
{
  const strResult = applyProjection(JSON.stringify({ foo: { bar: 'deep' } }), true, { type: 'dot-path', path: 'foo.bar' })
  ok(strResult === 'deep', 'F5: dot-path string leaf returned as-is')

  const arrResult = applyProjection(JSON.stringify({ items: [1, 2, 3] }), true, { type: 'dot-path', path: 'items' })
  ok(JSON.parse(arrResult).length === 3, 'F6: dot-path array returned as JSON')
}

// ===========================================================================
// FORWARD — array-filter: only matching items.
// ===========================================================================
{
  const arr = [{ phase: 'build', name: 'a' }, { phase: 'adr', name: 'b' }, { phase: 'build', name: 'c' }]
  const filtered = JSON.parse(applyProjection(JSON.stringify(arr), true, { type: 'array-filter', field: 'phase', value: 'build' }))
  ok(filtered.length === 2 && filtered.every(x => x.phase === 'build'), 'F7: array-filter returns only matching items')
}

// ===========================================================================
// FORWARD — project() end-to-end: 2 inputs, results carry path+hint+slice.
// ===========================================================================
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-selftest-'))
  fs.writeFileSync(path.join(root, 'data.json'), JSON.stringify({ CT1: 'v1', CT2: 'v2', other: 'x' }))
  fs.writeFileSync(path.join(root, 'notes.txt'), 'plain text')
  const inputs = [
    { path: 'data.json', hint: 'CT* for seams', project: { type: 'key-pattern', pattern: 'CT*' } },
    { path: 'notes.txt', hint: 'full notes' }
  ]
  const results = project(inputs, root)
  ok(results.length === 2, 'F8a: project() returns 2 results')
  ok(results[0].path === 'data.json' && results[0].hint === 'CT* for seams', 'F8b: result has path+hint')
  const s = JSON.parse(results[0].slice)
  ok(s.CT1 === 'v1' && !s.hasOwnProperty('other'), 'F8c: slice projected to CT* only')
  ok(results[1].slice === 'plain text', 'F8d: whole-file input returned intact')
  fs.rmSync(root, { recursive: true })
}

// ===========================================================================
// REVERSE — planted defect: non-matching key must be absent after key-pattern.
//   If applyProjection broken (passes all keys), !hasOwnProperty('other') fails → catches defect.
// ===========================================================================
{
  const r = kp({ CT1: 'a', other: 'b' }, 'CT*')
  ok(!r.hasOwnProperty('other'), 'R1: reverse guard — non-matching key dropped')
}

// ===========================================================================
// REVERSE — error paths: missing traversal, wrong input types, unknown type.
// ===========================================================================
throwsProjection(() => applyProjection('{}', true, { type: 'dot-path', path: 'x.y.z' }), 'R2a: dot-path missing deep throws')
throwsProjection(() => applyProjection('{"a":1}', true, { type: 'dot-path', path: 'missing' }), 'R2b: dot-path missing shallow throws')
throwsProjection(() => applyProjection('{"a":1}', true, { type: 'array-filter', field: 'a', value: 1 }), 'R3: array-filter on non-array throws')
throwsProjection(() => applyProjection('[1,2,3]', true, { type: 'key-pattern', pattern: 'R*' }), 'R4: key-pattern on array throws')
throwsProjection(() => applyProjection('{"a":1}', true, { type: 'bad-type' }), 'R5: unknown type throws')

// ===========================================================================
// DETERMINISM — same inputs twice: byte-identical.
// ===========================================================================
{
  const json = JSON.stringify({ CT1: 'a', CT2: 'b', other: 'c' })
  const spec = { type: 'key-pattern', pattern: 'CT*' }
  ok(applyProjection(json, true, spec) === applyProjection(json, true, spec), 'D1: determinism — byte-identical across two calls')
}

// ===========================================================================
// ERROR PATHS — each must throw ProjectionError (not generic Error).
// ===========================================================================
throwsProjection(() => applyProjection('not json', false, { type: 'key-pattern', pattern: 'R*' }), 'E1: non-JSON file + key-pattern throws')
throwsProjection(() => applyProjection('{bad json', true, { type: 'key-pattern', pattern: 'R*' }), 'E2: malformed JSON throws')
{
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'proj-selftest-err-'))
  throwsProjection(() => project([{ path: 'no-such-file.json', hint: 'test' }], root), 'E3: project() missing file throws')
  fs.rmSync(root, { recursive: true })
}
throwsProjection(() => applyProjection(JSON.stringify({ a: null }), true, { type: 'dot-path', path: 'a.b' }), 'E4: dot-path through null throws')

console.log(`\nproject selftest: ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
