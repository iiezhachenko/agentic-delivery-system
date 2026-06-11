#!/usr/bin/env node
// Zero-dep JSON-Schema draft-2020-12 SUBSET validator.
// Supports: type, required, properties, items, additionalProperties(bool),
//   enum, const, pattern, minItems, minimum, maximum, dependentRequired,
//   if/then/else, allOf, anyOf, oneOf. Ignores: x-*, description, title, $id, $schema.
// $ref resolution via _meta.json registry ids.
// Usage: node validate.mjs <artifact.json> <schemaId>  → verdict, exits 0/1.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const REGISTRY_DIR = path.resolve(here, "..", "..", "schemas");

// --- registry helpers -------------------------------------------------------
function loadMeta(registryDir) {
  const p = path.join(registryDir, "_meta.json");
  return JSON.parse(fs.readFileSync(p, "utf8"));
}

function loadSchemaById(id, registryDir) {
  const meta = loadMeta(registryDir);
  const entry = meta[id];
  if (!entry) throw new Error(`schema id not in registry: ${id}`);
  const schemaPath = path.join(registryDir, entry.path);
  return JSON.parse(fs.readFileSync(schemaPath, "utf8"));
}

// --- type checking ----------------------------------------------------------
function checkType(val, typeSpec) {
  if (Array.isArray(typeSpec)) return typeSpec.some(t => checkType(val, t));
  switch (typeSpec) {
    case "object":  return typeof val === "object" && val !== null && !Array.isArray(val);
    case "array":   return Array.isArray(val);
    case "string":  return typeof val === "string";
    case "number":  return typeof val === "number";
    case "integer": return typeof val === "number" && Number.isInteger(val);
    case "boolean": return typeof val === "boolean";
    case "null":    return val === null;
    default:        return false;
  }
}

// --- core validator ---------------------------------------------------------
function validate(instance, schemaIdOrObj, { registryDir = REGISTRY_DIR } = {}) {
  const schema = typeof schemaIdOrObj === "string"
    ? loadSchemaById(schemaIdOrObj, registryDir)
    : schemaIdOrObj;
  const errors = [];
  _validate(instance, schema, "", errors, registryDir);
  return { valid: errors.length === 0, errors };
}

function _validate(instance, schema, ptr, errors, registryDir) {
  if (typeof schema !== "object" || schema === null) return;

  // --- $ref resolution ------------------------------------------------------
  if (schema.$ref) {
    let refSchema;
    try { refSchema = loadSchemaById(schema.$ref, registryDir); }
    catch (e) { errors.push({ path: ptr, msg: `$ref unresolvable: ${schema.$ref}`, keyword: "$ref" }); return; }
    _validate(instance, refSchema, ptr, errors, registryDir);
    return;
  }

  // --- type -----------------------------------------------------------------
  if (schema.type !== undefined) {
    if (!checkType(instance, schema.type)) {
      errors.push({ path: ptr, msg: `expected type ${JSON.stringify(schema.type)}, got ${typeOf(instance)}`, keyword: "type" });
      return; // no point checking further if type wrong
    }
  }

  // --- const ----------------------------------------------------------------
  if ("const" in schema) {
    if (!deepEqual(instance, schema.const)) {
      errors.push({ path: ptr, msg: `expected const ${JSON.stringify(schema.const)}, got ${JSON.stringify(instance)}`, keyword: "const" });
    }
  }

  // --- enum -----------------------------------------------------------------
  if (schema.enum !== undefined) {
    if (!schema.enum.some(v => deepEqual(instance, v))) {
      errors.push({ path: ptr, msg: `value not in enum ${JSON.stringify(schema.enum)}`, keyword: "enum" });
    }
  }

  // --- pattern (strings only) -----------------------------------------------
  if (schema.pattern !== undefined && typeof instance === "string") {
    if (!new RegExp(schema.pattern).test(instance)) {
      errors.push({ path: ptr, msg: `string "${instance}" does not match pattern ${schema.pattern}`, keyword: "pattern" });
    }
  }

  // --- minimum / maximum (numbers only) -------------------------------------
  if (schema.minimum !== undefined && typeof instance === "number") {
    if (instance < schema.minimum) {
      errors.push({ path: ptr, msg: `value ${instance} < minimum ${schema.minimum}`, keyword: "minimum" });
    }
  }
  if (schema.maximum !== undefined && typeof instance === "number") {
    if (instance > schema.maximum) {
      errors.push({ path: ptr, msg: `value ${instance} > maximum ${schema.maximum}`, keyword: "maximum" });
    }
  }

  // --- minItems (arrays only) -----------------------------------------------
  if (schema.minItems !== undefined && Array.isArray(instance)) {
    if (instance.length < schema.minItems) {
      errors.push({ path: ptr, msg: `array length ${instance.length} < minItems ${schema.minItems}`, keyword: "minItems" });
    }
  }
  if (schema.maxItems !== undefined && Array.isArray(instance)) {
    if (instance.length > schema.maxItems) {
      errors.push({ path: ptr, msg: `array length ${instance.length} > maxItems ${schema.maxItems}`, keyword: "maxItems" });
    }
  }

  // --- object validations ---------------------------------------------------
  if (typeof instance === "object" && instance !== null && !Array.isArray(instance)) {
    // required
    if (Array.isArray(schema.required)) {
      for (const key of schema.required) {
        if (!(key in instance)) {
          errors.push({ path: ptr ? `${ptr}/${key}` : key, msg: `required property missing: ${key}`, keyword: "required" });
        }
      }
    }
    // properties
    if (schema.properties && typeof schema.properties === "object") {
      for (const [key, propSchema] of Object.entries(schema.properties)) {
        if (key in instance) {
          _validate(instance[key], propSchema, ptr ? `${ptr}/${key}` : key, errors, registryDir);
        }
      }
    }
    // additionalProperties: false
    if (schema.additionalProperties === false) {
      const allowed = new Set(Object.keys(schema.properties || {}));
      for (const key of Object.keys(instance)) {
        if (!allowed.has(key)) {
          errors.push({ path: ptr ? `${ptr}/${key}` : key, msg: `additional property not allowed: ${key}`, keyword: "additionalProperties" });
        }
      }
    }
    // dependentRequired
    if (schema.dependentRequired && typeof schema.dependentRequired === "object") {
      for (const [dep, required] of Object.entries(schema.dependentRequired)) {
        if (dep in instance) {
          for (const req of required) {
            if (!(req in instance)) {
              errors.push({ path: ptr, msg: `dependentRequired: ${dep} present but ${req} missing`, keyword: "dependentRequired" });
            }
          }
        }
      }
    }
  }

  // --- array validations ----------------------------------------------------
  if (Array.isArray(instance)) {
    if (schema.items !== undefined) {
      for (let i = 0; i < instance.length; i++) {
        _validate(instance[i], schema.items, `${ptr}/${i}`, errors, registryDir);
      }
    }
  }

  // --- if/then/else ---------------------------------------------------------
  if (schema.if !== undefined) {
    const ifErrors = [];
    _validate(instance, schema.if, ptr, ifErrors, registryDir);
    const ifPassed = ifErrors.length === 0;
    if (ifPassed && schema.then !== undefined) {
      _validate(instance, schema.then, ptr, errors, registryDir);
    } else if (!ifPassed && schema.else !== undefined) {
      _validate(instance, schema.else, ptr, errors, registryDir);
    }
  }

  // --- allOf ----------------------------------------------------------------
  if (Array.isArray(schema.allOf)) {
    for (const sub of schema.allOf) {
      _validate(instance, sub, ptr, errors, registryDir);
    }
  }

  // --- anyOf ----------------------------------------------------------------
  if (Array.isArray(schema.anyOf)) {
    const anyPassed = schema.anyOf.some(sub => {
      const subErrors = [];
      _validate(instance, sub, ptr, subErrors, registryDir);
      return subErrors.length === 0;
    });
    if (!anyPassed) {
      errors.push({ path: ptr, msg: `value does not match any anyOf schema`, keyword: "anyOf" });
    }
  }

  // --- oneOf ----------------------------------------------------------------
  if (Array.isArray(schema.oneOf)) {
    const passing = schema.oneOf.filter(sub => {
      const subErrors = [];
      _validate(instance, sub, ptr, subErrors, registryDir);
      return subErrors.length === 0;
    });
    if (passing.length !== 1) {
      errors.push({ path: ptr, msg: `value must match exactly one oneOf schema (matched ${passing.length})`, keyword: "oneOf" });
    }
  }
}

// --- helpers ----------------------------------------------------------------
function typeOf(v) {
  if (v === null) return "null";
  if (Array.isArray(v)) return "array";
  return typeof v;
}

function deepEqual(a, b) {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (typeof a !== "object" || a === null) return false;
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every(k => deepEqual(a[k], b[k]));
}

export function validateFile(artifactPath, schemaId, { registryDir = REGISTRY_DIR } = {}) {
  const instance = JSON.parse(fs.readFileSync(artifactPath, "utf8"));
  return validate(instance, schemaId, { registryDir });
}

export { validate };

// --- CLI -------------------------------------------------------------------
if (import.meta.url === `file://${process.argv[1]}`) {
  const [artifactPath, schemaId] = process.argv.slice(2);
  if (!artifactPath || !schemaId) {
    console.error("usage: node validate.mjs <artifact.json> <schemaId>");
    process.exit(2);
  }
  let result;
  try {
    result = validateFile(path.resolve(artifactPath), schemaId);
  } catch (e) {
    console.error(`ERROR: ${e.message}`);
    process.exit(2);
  }
  if (result.valid) {
    console.log(`VALID — ${schemaId}`);
    process.exit(0);
  } else {
    console.log(`INVALID — ${schemaId}`);
    for (const err of result.errors) {
      console.log(`  [${err.keyword}] ${err.path}: ${err.msg}`);
    }
    process.exit(1);
  }
}
