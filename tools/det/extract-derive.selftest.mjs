#!/usr/bin/env node
// Self-test for extract-derive.mjs — 4 cases: golden parity, R* contiguity, high-water, rationale presence.
// Exit 0 = all pass; exit 1 = any failure.
import { readFileSync } from "fs";
import { deriveExtraction } from "./extract-derive.mjs";

let pass = 0, fail = 0;
const ok = (cond, msg) => {
  if (cond) { pass++; }
  else { fail++; console.log(`  FAIL: ${msg}`); }
};

// ---------------------------------------------------------------------------
// Case 1 — parity with greenfield-clean golden
// Strip ids + explicit/implied inferred flags; run deriveExtraction; assert match.
// Golden: E1-E7, R1-R4 explicit (inferred:false), R5-R10 implied (inferred:true), C1-C3, U1-U12
// ---------------------------------------------------------------------------
console.log("=== Case 1: parity with greenfield-clean golden ===");
{
  const golden = JSON.parse(
    readFileSync(
      new URL("../../_fixtures/greenfield-clean/.aprd/02-extraction.json", import.meta.url),
      "utf8"
    )
  );

  // Build primitives by stripping ids (and inferred from explicit/implied — spine stamps those).
  const primitives = {
    entities: golden.entities.map(({ id: _id, ...rest }) => rest),
    explicit_requirements: golden.explicit_requirements.map(({ id: _id, inferred: _inf, ...rest }) => rest),
    implied_requirements: golden.implied_requirements.map(({ id: _id, inferred: _inf, ...rest }) => rest),
    stated_constraints: golden.stated_constraints.map(({ id: _id, ...rest }) => rest),
    unknowns: golden.unknowns.map(({ id: _id, ...rest }) => rest),
  };

  const result = deriveExtraction(primitives);

  // Entity ids + inferred flags + names.
  ok(result.entities.length === golden.entities.length,
    `entities length: expected ${golden.entities.length}, got ${result.entities.length}`);
  golden.entities.forEach((ge, i) => {
    ok(result.entities[i]?.id === ge.id,
      `entities[${i}].id: expected ${ge.id}, got ${result.entities[i]?.id}`);
    ok(result.entities[i]?.inferred === ge.inferred,
      `entities[${i}].inferred: expected ${ge.inferred}, got ${result.entities[i]?.inferred}`);
    ok(result.entities[i]?.name === ge.name,
      `entities[${i}].name: expected ${ge.name}, got ${result.entities[i]?.name}`);
    // rationale present iff inferred===true.
    if (ge.inferred) {
      ok("rationale" in result.entities[i], `entities[${i}] (inferred) missing rationale`);
    } else {
      ok(!("rationale" in result.entities[i]), `entities[${i}] (not inferred) has spurious rationale`);
    }
  });

  // Explicit requirements.
  ok(result.explicit_requirements.length === golden.explicit_requirements.length,
    `explicit_requirements length: expected ${golden.explicit_requirements.length}, got ${result.explicit_requirements.length}`);
  golden.explicit_requirements.forEach((gr, i) => {
    ok(result.explicit_requirements[i]?.id === gr.id,
      `explicit[${i}].id: expected ${gr.id}, got ${result.explicit_requirements[i]?.id}`);
    ok(result.explicit_requirements[i]?.inferred === false,
      `explicit[${i}].inferred: expected false, got ${result.explicit_requirements[i]?.inferred}`);
    ok(result.explicit_requirements[i]?.text === gr.text,
      `explicit[${i}].text mismatch`);
  });

  // Implied requirements.
  ok(result.implied_requirements.length === golden.implied_requirements.length,
    `implied_requirements length: expected ${golden.implied_requirements.length}, got ${result.implied_requirements.length}`);
  golden.implied_requirements.forEach((gr, i) => {
    ok(result.implied_requirements[i]?.id === gr.id,
      `implied[${i}].id: expected ${gr.id}, got ${result.implied_requirements[i]?.id}`);
    ok(result.implied_requirements[i]?.inferred === true,
      `implied[${i}].inferred: expected true, got ${result.implied_requirements[i]?.inferred}`);
    ok(result.implied_requirements[i]?.text === gr.text,
      `implied[${i}].text mismatch`);
  });

  // Stated constraints.
  ok(result.stated_constraints.length === golden.stated_constraints.length,
    `stated_constraints length: expected ${golden.stated_constraints.length}, got ${result.stated_constraints.length}`);
  golden.stated_constraints.forEach((gc, i) => {
    ok(result.stated_constraints[i]?.id === gc.id,
      `constraints[${i}].id: expected ${gc.id}, got ${result.stated_constraints[i]?.id}`);
    ok(result.stated_constraints[i]?.inferred === gc.inferred,
      `constraints[${i}].inferred: expected ${gc.inferred}, got ${result.stated_constraints[i]?.inferred}`);
    ok(result.stated_constraints[i]?.text === gc.text,
      `constraints[${i}].text mismatch`);
  });

  // Unknowns.
  ok(result.unknowns.length === golden.unknowns.length,
    `unknowns length: expected ${golden.unknowns.length}, got ${result.unknowns.length}`);
  golden.unknowns.forEach((gu, i) => {
    ok(result.unknowns[i]?.id === gu.id,
      `unknowns[${i}].id: expected ${gu.id}, got ${result.unknowns[i]?.id}`);
    ok(result.unknowns[i]?.text === gu.text,
      `unknowns[${i}].text mismatch`);
  });

  console.log(`  entities: ${result.entities.map(e=>e.id).join(",")} | explicit: ${result.explicit_requirements.map(r=>r.id).join(",")} | implied: ${result.implied_requirements.map(r=>r.id).join(",")} | constraints: ${result.stated_constraints.map(c=>c.id).join(",")} | unknowns: ${result.unknowns.map(u=>u.id).join(",")}`);
}

// ---------------------------------------------------------------------------
// Case 2 — R* contiguity: 2 explicit + 2 implied → R1,R2,R3,R4 in order.
// explicit get R1,R2 (inferred:false); implied continue R3,R4 (inferred:true).
// ---------------------------------------------------------------------------
console.log("\n=== Case 2: R* contiguity — 2 explicit + 2 implied ===");
{
  const primitives = {
    entities: [],
    explicit_requirements: [
      { text: "Explicit req A.", source: "src A", sr_ref: "SR1" },
      { text: "Explicit req B.", source: "src B", sr_ref: "SR1" },
    ],
    implied_requirements: [
      { text: "Implied req C.", source: "src C", sr_ref: "SR1", rationale: "reason C" },
      { text: "Implied req D.", source: "src D", sr_ref: "SR1", rationale: "reason D" },
    ],
    stated_constraints: [],
    unknowns: [],
  };
  const result = deriveExtraction(primitives);

  ok(result.explicit_requirements[0]?.id === "R1", `explicit[0].id: expected R1, got ${result.explicit_requirements[0]?.id}`);
  ok(result.explicit_requirements[1]?.id === "R2", `explicit[1].id: expected R2, got ${result.explicit_requirements[1]?.id}`);
  ok(result.explicit_requirements[0]?.inferred === false, `explicit[0].inferred: expected false`);
  ok(result.explicit_requirements[1]?.inferred === false, `explicit[1].inferred: expected false`);
  ok(result.implied_requirements[0]?.id === "R3", `implied[0].id: expected R3, got ${result.implied_requirements[0]?.id}`);
  ok(result.implied_requirements[1]?.id === "R4", `implied[1].id: expected R4, got ${result.implied_requirements[1]?.id}`);
  ok(result.implied_requirements[0]?.inferred === true, `implied[0].inferred: expected true`);
  ok(result.implied_requirements[1]?.inferred === true, `implied[1].inferred: expected true`);

  console.log(`  explicit ids: ${result.explicit_requirements.map(r=>r.id).join(",")} implied ids: ${result.implied_requirements.map(r=>r.id).join(",")}`);
}

// ---------------------------------------------------------------------------
// Case 3 — feature-add high-water: { E:5, R:9, C:2, U:7 }
// First entity → E6; first explicit req → R10; first constraint → C3; first unknown → U8.
// ---------------------------------------------------------------------------
console.log("\n=== Case 3: feature-add high-water ===");
{
  const primitives = {
    entities: [
      { name: "Widget", note: "new entity", inferred: false, source: "widget", sr_ref: "SR1" },
    ],
    explicit_requirements: [
      { text: "Add widget creation.", source: "widget", sr_ref: "SR1" },
    ],
    implied_requirements: [
      { text: "Widget must be persisted.", source: "widget", sr_ref: "SR1", rationale: "creation implies storage" },
    ],
    stated_constraints: [
      { text: "Must run on Kubernetes.", kind: "platform", inferred: false, source: "k8s", sr_ref: "SR1" },
    ],
    unknowns: [
      { text: "Widget schema?", source: "widget", sr_ref: "SR1" },
    ],
  };
  const opts = { highWater: { E: 5, R: 9, C: 2, U: 7 } };
  const result = deriveExtraction(primitives, opts);

  ok(result.entities[0]?.id === "E6", `entities[0].id: expected E6, got ${result.entities[0]?.id}`);
  ok(result.explicit_requirements[0]?.id === "R10", `explicit[0].id: expected R10, got ${result.explicit_requirements[0]?.id}`);
  ok(result.implied_requirements[0]?.id === "R11", `implied[0].id: expected R11, got ${result.implied_requirements[0]?.id}`);
  ok(result.stated_constraints[0]?.id === "C3", `constraints[0].id: expected C3, got ${result.stated_constraints[0]?.id}`);
  ok(result.unknowns[0]?.id === "U8", `unknowns[0].id: expected U8, got ${result.unknowns[0]?.id}`);

  console.log(`  E: ${result.entities[0]?.id} R-explicit: ${result.explicit_requirements[0]?.id} R-implied: ${result.implied_requirements[0]?.id} C: ${result.stated_constraints[0]?.id} U: ${result.unknowns[0]?.id}`);
}

// ---------------------------------------------------------------------------
// Case 4 — rationale presence rules:
// explicit req → NO rationale key.
// implied req → HAS rationale key.
// inferred entity → HAS rationale key.
// non-inferred entity → NO rationale key.
// ---------------------------------------------------------------------------
console.log("\n=== Case 4: rationale presence rules ===");
{
  const primitives = {
    entities: [
      { name: "Explicit Entity", note: "stated", inferred: false, source: "src", sr_ref: "SR1" },
      { name: "Inferred Entity", note: "forced", inferred: true, source: "src", sr_ref: "SR1", rationale: "forced by domain" },
    ],
    explicit_requirements: [
      { text: "Explicit req.", source: "src", sr_ref: "SR1" },
    ],
    implied_requirements: [
      { text: "Implied req.", source: "src", sr_ref: "SR1", rationale: "entailed by explicit" },
    ],
    stated_constraints: [],
    unknowns: [],
  };
  const result = deriveExtraction(primitives);

  ok(!("rationale" in result.explicit_requirements[0]),
    "explicit req must NOT have rationale key");
  ok("rationale" in result.implied_requirements[0],
    "implied req MUST have rationale key");
  ok(result.implied_requirements[0]?.rationale === "entailed by explicit",
    `implied rationale value mismatch: got ${result.implied_requirements[0]?.rationale}`);
  ok(!("rationale" in result.entities[0]),
    "non-inferred entity must NOT have rationale key");
  ok("rationale" in result.entities[1],
    "inferred entity MUST have rationale key");
  ok(result.entities[1]?.rationale === "forced by domain",
    `inferred entity rationale value mismatch: got ${result.entities[1]?.rationale}`);

  console.log(`  explicit rationale present: ${"rationale" in result.explicit_requirements[0]} implied rationale present: ${"rationale" in result.implied_requirements[0]} non-inferred-entity rationale: ${"rationale" in result.entities[0]} inferred-entity rationale: ${"rationale" in result.entities[1]}`);
}

// ---------------------------------------------------------------------------
// Summary
// ---------------------------------------------------------------------------
console.log(`\n${fail === 0 ? "PASS" : "FAIL"} — ${pass} ok, ${fail} failed`);
process.exit(fail === 0 ? 0 : 1);
