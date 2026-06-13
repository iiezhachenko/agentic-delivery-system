#!/usr/bin/env node
// project.mjs — context projector: slices files per projection spec, compact context instead of whole-file reads
// Usage: node project.mjs <relPath> [--project '{"type":"key-pattern","pattern":"CT*"}'] [--root <dir>]

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export class ProjectionError extends Error {
  constructor(message) {
    super(message)
    this.name = 'ProjectionError'
  }
}

// Apply projection spec to file content
// fileContent: string, isJson: boolean, spec: object|undefined → string (projected slice)
export function applyProjection(fileContent, isJson, spec) {
  // No spec or whole-file → return full content (back-compat default)
  if (!spec || spec.type === 'whole-file') {
    return fileContent
  }

  // JSON projection on non-JSON file → error
  if (!isJson) {
    throw new ProjectionError(`Projection type "${spec.type}" requires JSON file`)
  }

  let data
  try {
    data = JSON.parse(fileContent)
  } catch (err) {
    throw new ProjectionError(`JSON parse failed: ${err.message}`)
  }

  switch (spec.type) {
    case 'key-pattern': {
      if (typeof data !== 'object' || Array.isArray(data)) {
        throw new ProjectionError('key-pattern requires object, not array/primitive')
      }
      const pattern = spec.pattern
      const regex = new RegExp(`^${pattern.replace(/\*/g, '.*')}$`)
      const filtered = {}
      for (const [key, value] of Object.entries(data)) {
        if (regex.test(key)) {
          filtered[key] = value
        }
      }
      return JSON.stringify(filtered, null, 2)
    }

    case 'dot-path': {
      const pathStr = spec.path
      const parts = pathStr.split('.')
      let result = data
      for (const part of parts) {
        if (result == null || typeof result !== 'object') {
          throw new ProjectionError(`dot-path "${pathStr}" not found (traversal stopped at non-object)`)
        }
        result = result[part]
      }
      if (result === undefined) {
        throw new ProjectionError(`dot-path "${pathStr}" not found`)
      }
      // Return string as-is, objects as JSON
      return typeof result === 'string' ? result : JSON.stringify(result, null, 2)
    }

    case 'array-filter': {
      if (!Array.isArray(data)) {
        throw new ProjectionError('array-filter requires array')
      }
      const { field, value } = spec
      const filtered = data.filter(item => item?.[field] === value)
      return JSON.stringify(filtered, null, 2)
    }

    default:
      throw new ProjectionError(`Unknown projection type: ${spec.type}`)
  }
}

// Main projection function
// resolvedInputs: [{path, hint, optional?, project?}], root: string → [{path, hint, slice}]
export function project(resolvedInputs, root) {
  const results = []

  for (const input of resolvedInputs) {
    const absPath = path.isAbsolute(input.path) ? input.path : path.resolve(root, input.path)

    // Defensive: resolve.mjs already validated existence, but check again
    if (!fs.existsSync(absPath)) {
      throw new ProjectionError(`File not found: ${input.path}`)
    }

    const fileContent = fs.readFileSync(absPath, 'utf8')
    const isJson = absPath.endsWith('.json')
    const slice = applyProjection(fileContent, isJson, input.project)

    results.push({
      path: input.path,
      hint: input.hint,
      slice
    })
  }

  return results
}

// CLI: standalone projection for single file
if (import.meta.url === `file://${process.argv[1]}`) {
  const args = process.argv.slice(2)
  const relPath = args[0]
  const projectIdx = args.indexOf('--project')
  const rootIdx = args.indexOf('--root')

  const projectSpec = projectIdx >= 0 ? JSON.parse(args[projectIdx + 1]) : undefined
  const root = rootIdx >= 0 ? args[rootIdx + 1] : process.cwd()

  if (!relPath) {
    console.error('Usage: node project.mjs <relPath> [--project json-spec] [--root dir]')
    process.exit(1)
  }

  try {
    const absPath = path.resolve(root, relPath)
    const fileContent = fs.readFileSync(absPath, 'utf8')
    const isJson = absPath.endsWith('.json')
    const slice = applyProjection(fileContent, isJson, projectSpec)
    console.log(slice)
  } catch (err) {
    console.error(`Error: ${err.message}`)
    process.exit(1)
  }
}
