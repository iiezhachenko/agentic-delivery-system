#!/usr/bin/env node
// Both-directions selftest for adp-server/tier-router.js (routeTier).
// Direction 1: known-good inputs → correct tier for tier-1/Class-A/Class-B/unknown roles.
// Direction 2: planted swap defects caught — Class-A vs Class-B confusion detected.
// Determinism: same inputs twice → byte-identical. Exits 0 all-green, 1 any-fail.
import { routeTier, TIER1_ROLES, CLASS_A_ROLES, CLASS_B_ROLES, HOLE_TYPE_TIER } from '/workspace/adp-server/tier-router.js'

let pass = 0, fail = 0
const ok = (cond, msg) => { if (cond) pass++; else { fail++; console.log(`  FAIL: ${msg}`) } }

// ===========================================================================
// FORWARD — Direction 1: known-good inputs → correct tier
// ===========================================================================
console.log('=== Direction 1 (FORWARD): known-good inputs → correct tier ===')

// F1: Tier-1 role + narration hole → "tier-1" (tier-1 short-circuit, hole irrelevant)
{
  const t = routeTier('BASELINE-MAP', 'narration')
  ok(t === 'tier-1', `F1: BASELINE-MAP+narration expected tier-1, got ${t}`)
  console.log(`  F1: BASELINE-MAP+narration → ${t}`)
}

// F2: Tier-1 role + judgment hole → "tier-1" (hole type irrelevant for tier-1)
{
  const t = routeTier('VERIFY-OUTPUT', 'judgment')
  ok(t === 'tier-1', `F2: VERIFY-OUTPUT+judgment expected tier-1, got ${t}`)
  console.log(`  F2: VERIFY-OUTPUT+judgment → ${t}`)
}

// F3: Class-A role + narration hole → "local-8b" (narration ∈ HOLE_TYPE_TIER → local-8b)
{
  const t = routeTier('IMPLEMENT', 'narration')
  ok(t === 'local-8b', `F3: IMPLEMENT+narration expected local-8b, got ${t}`)
  console.log(`  F3: IMPLEMENT+narration → ${t}`)
}

// F4: Class-A role + decision hole → "claude" (decision ∈ HOLE_TYPE_TIER → claude override)
{
  const t = routeTier('IMPLEMENT', 'decision')
  ok(t === 'claude', `F4: IMPLEMENT+decision expected claude, got ${t}`)
  console.log(`  F4: IMPLEMENT+decision → ${t}`)
}

// F5: Class-A role + unknown hole type → "local-8b" (class-A default when hole not in table)
{
  const t = routeTier('RE-RANK', 'unknown-hole')
  ok(t === 'local-8b', `F5: RE-RANK+unknown-hole expected local-8b, got ${t}`)
  console.log(`  F5: RE-RANK+unknown-hole → ${t}`)
}

// F6: Class-B role + judgment hole → "claude" (judgment ∈ HOLE_TYPE_TIER → claude)
{
  const t = routeTier('GAP-DETECT', 'judgment')
  ok(t === 'claude', `F6: GAP-DETECT+judgment expected claude, got ${t}`)
  console.log(`  F6: GAP-DETECT+judgment → ${t}`)
}

// F7: Class-B role + narration hole → "local-8b" (narration ∈ HOLE_TYPE_TIER → local-8b override)
{
  const t = routeTier('CRITIQUE', 'narration')
  ok(t === 'local-8b', `F7: CRITIQUE+narration expected local-8b, got ${t}`)
  console.log(`  F7: CRITIQUE+narration → ${t}`)
}

// F8: Class-B role + unknown hole type → "claude" (class-B default when hole not in table)
{
  const t = routeTier('DERIVE-COMPONENTS', 'unknown-hole')
  ok(t === 'claude', `F8: DERIVE-COMPONENTS+unknown-hole expected claude, got ${t}`)
  console.log(`  F8: DERIVE-COMPONENTS+unknown-hole → ${t}`)
}

// F9: Unknown role + any hole → "claude" (safe default, never silently offload unknown)
{
  const t = routeTier('NOT-A-ROLE', 'narration')
  ok(t === 'claude', `F9: NOT-A-ROLE+narration expected claude, got ${t}`)
  console.log(`  F9: NOT-A-ROLE+narration → ${t}`)
}

// F10: All HOLE_TYPE_TIER entries for Class-A role (IMPLEMENT) → each maps to declared tier
{
  let allMatch = true
  const mismatches = []
  for (const [holeType, expectedTier] of Object.entries(HOLE_TYPE_TIER)) {
    const got = routeTier('IMPLEMENT', holeType)
    if (got !== expectedTier) {
      allMatch = false
      mismatches.push(`${holeType}: expected ${expectedTier}, got ${got}`)
    }
  }
  ok(allMatch, `F10: HOLE_TYPE_TIER entries for IMPLEMENT mismatch: ${mismatches.join('; ')}`)
  console.log(`  F10: all ${Object.keys(HOLE_TYPE_TIER).length} HOLE_TYPE_TIER entries verified for IMPLEMENT → ${allMatch ? 'all match' : 'MISMATCH'}`)
}

// ===========================================================================
// REVERSE — Direction 2: planted defects caught (swap would break these)
// ===========================================================================
console.log('\n=== Direction 2 (REVERSE): planted swap defects caught ===')

// R1: Class-A narration route differs from Class-B unknown-hole route
//   Class-A+narration → local-8b; Class-B+unknown → claude. If swapped, they'd match.
{
  const a = routeTier('IMPLEMENT', 'narration')   // Class-A + narration → local-8b
  const b = routeTier('GAP-DETECT', 'unknown')    // Class-B + unknown → claude
  ok(a === 'local-8b', `R1a: Class-A narration must be local-8b, got ${a}`)
  ok(b === 'claude', `R1b: Class-B unknown must be claude, got ${b}`)
  ok(a !== b, `R1: Class-A narration vs Class-B unknown must differ — swap would equate them`)
  console.log(`  R1: IMPLEMENT+narration=${a} vs GAP-DETECT+unknown=${b} (must differ)`)
}

// R2: Class-A decision hole → "claude" (not the Class-A default "local-8b")
//   Planted swap (Class-A ignores hole override) → returns "local-8b" → test catches it
{
  const t = routeTier('RECONCILE', 'decision')
  ok(t === 'claude', `R2: Class-A decision hole must override to claude, got ${t}`)
  console.log(`  R2: RECONCILE+decision → ${t} (must be claude, not class-A default local-8b)`)
}

// R3: Class-B narration hole → "local-8b" (not the Class-B default "claude")
//   Planted swap (Class-B ignores hole override) → returns "claude" → test catches it
{
  const t = routeTier('SYNTHESIZE', 'narration')
  ok(t === 'local-8b', `R3: Class-B narration hole must override to local-8b, got ${t}`)
  console.log(`  R3: SYNTHESIZE+narration → ${t} (must be local-8b, not class-B default claude)`)
}

// R4: Tier-1 short-circuit beats hole-type override: BUILD-PLAN+decision → "tier-1" not "claude"
//   Planted swap (hole processed before tier-1 check) → returns "claude" → test catches it
{
  const t = routeTier('BUILD-PLAN', 'decision')
  ok(t === 'tier-1', `R4: tier-1 must short-circuit before hole-type override, got ${t}`)
  console.log(`  R4: BUILD-PLAN+decision → ${t} (must be tier-1, not hole-override claude)`)
}

// ===========================================================================
// DETERMINISM — same inputs twice → byte-identical
// ===========================================================================
console.log('\n=== Determinism check ===')
{
  const a = routeTier('IMPLEMENT', 'narration')
  const b = routeTier('IMPLEMENT', 'narration')
  ok(a === b, `D1: determinism — two calls differ: ${a} vs ${b}`)
  console.log(`  D1: routeTier('IMPLEMENT','narration') twice → ${a === b ? 'stable' : 'DRIFT'}`)
}

console.log(`\nroute-tier selftest: ${pass} passed, ${fail} failed`)
process.exit(fail ? 1 : 0)
