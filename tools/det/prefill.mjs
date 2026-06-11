#!/usr/bin/env node
// PREFILL (integration module): write schema shell, fill MECHANICAL fields, mark JUDGMENT holes.
// Source: doc-00 §"Bottom line" (code fills deterministic, LLM fills only holes) + D26.
//   Reuses validate.mjs registry loader idiom (_meta.json). Pure compute core + thin disk/CLI.
// Contract: shell with holes filled by LLM MUST validate against schema; shell alone
//   (holes null) is the enforced skeleton. FLAG-not-fix: prefill authors no fix field.
// Mechanical fields:
//   - value present in `computed` (by property name) — ids/counts/verdict/route from other 5 modules;
//   - schema const / single-enum defaults.
// Judgment holes: free-text string leaves (finding/rationale/why_rejected/title bodies) absent
//   from computed + not const/single-enum → JSON-pointer path collected into holes[], left null.
// Zero deps, ESM, deterministic. Mirrors validate.mjs/graph-lint.mjs idiom.
// Usage: node prefill.mjs <schemaId> '<computed-json>' [--registry <dir>]
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.resolve(here, "..", "..", "schemas");

// --- registry loader (mirror validate.mjs) ----------------------------------
function loadMeta(registryDir) {
  return JSON.parse(fs.readFileSync(path.join(registryDir, "_meta.json"), "utf8"));
}
export function loadSchemaById(id, registryDir = REGISTRY_DIR) {
  const meta = loadMeta(registryDir);
  const entry = meta[id];
  if (!entry) throw new Error(`schema id not in registry: ${id}`);
  return JSON.parse(fs.readFileSync(path.join(registryDir, entry.path), "utf8"));
}

// --- schema-default: const or single-enum → that literal value; else undefined ----
function schemaDefault(schema) {
  if ("const" in schema) return schema.const;
  if (Array.isArray(schema.enum) && schema.enum.length === 1) return schema.enum[0];
  return undefined;
}

// --- schemaType: normalize type (array form → first non-null) -------------------
function schemaType(schema) {
  const t = schema.type;
  if (Array.isArray(t)) return t.find(x => x !== "null") || t[0];
  return t;
}

// --- buildShell: recursive walk. Returns the shell node; pushes hole pointers ----
// computed scoped by property name at the object level it sits in (flat bag lookup by key).
function buildNode(schema, ptr, computed, holes) {
  if (!schema || typeof schema !== "object") return null;

  // const / single-enum → mechanical default (no hole)
  const def = schemaDefault(schema);
  if (def !== undefined) return def;

  const t = schemaType(schema);

  if (t === "object") {
    const obj = {};
    const props = schema.properties || {};
    const required = new Set(schema.required || []);
    for (const [key, sub] of Object.entries(props)) {
      const childPtr = `${ptr}/${key}`;
      // mechanical: value supplied in computed bag by property name
      if (computed && Object.prototype.hasOwnProperty.call(computed, key)) {
        obj[key] = computed[key];
        continue;
      }
      obj[key] = buildNode(sub, childPtr, computed, holes);
    }
    return obj;
  }

  if (t === "array") {
    // arrays of judgment rows = LLM authored → empty shell + hole at the array path.
    // (Code cannot mint row count/bodies; LLM fills the array, then it must validate.)
    holes.push(ptr);
    return [];
  }

  // scalar leaf
  if (t === "string") {
    // free-text judgment leaf → hole (left null). (finding/rationale/title/why_rejected.)
    holes.push(ptr);
    return null;
  }
  // number/integer/boolean leaf with no computed source → hole (deterministic value owed by a module)
  holes.push(ptr);
  return null;
}

// --- prefill: schemaId + computed bag -> { shell, holes } ------------------------
// computed = flat bag of mechanical field values (by property name) from the other 5 modules.
export function prefill(schemaId, computed = {}, { registryDir = REGISTRY_DIR } = {}) {
  const schema = loadSchemaById(schemaId, registryDir);
  const holes = [];
  const shell = buildNode(schema, "", computed, holes);
  return { shell, holes };
}

// --- CLI --------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2);
  const regIdx = args.indexOf("--registry");
  const registryDir = regIdx >= 0 ? args[regIdx + 1] : REGISTRY_DIR;
  // positionals = args minus --registry flag + its value
  const positionals = args.filter((a, i) => a !== "--registry" && !(regIdx >= 0 && i === regIdx + 1));
  const schemaId = positionals[0];
  const computedRaw = positionals[1];
  if (!schemaId) { console.error("usage: node prefill.mjs <schemaId> '<computed-json>' [--registry <dir>]"); process.exit(2); }
  let computed = {};
  try { if (computedRaw) computed = JSON.parse(computedRaw); }
  catch (e) { console.error(`bad computed json: ${e.message}`); process.exit(2); }
  let out;
  try { out = prefill(schemaId, computed, { registryDir }); }
  catch (e) { console.error(`ERROR: ${e.message}`); process.exit(2); }
  console.log(JSON.stringify(out, null, 2));
  process.exit(0);
}
