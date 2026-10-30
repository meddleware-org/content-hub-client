#!/usr/bin/env node
// Structural check of a vectors file (used here in CI, and by content-hub-service on its copy):
//
//   node scripts/check-vectors.mjs <vectors.json> [--against <other vectors.json>]
//
// Fails on an unknown or missing section, a non-string enumeration value, a duplicate, an actor outside
// operator/worker/janitor, or (with --against) any byte-level difference from the other file.
import { readFileSync } from 'node:fs'

const [file, flag, other] = process.argv.slice(2)
if (!file || (flag && (flag !== '--against' || !other))) {
  console.error('usage: check-vectors.mjs <vectors.json> [--against <other vectors.json>]')
  process.exit(2)
}
const text = readFileSync(file, 'utf8')
const v = JSON.parse(text)
const problems = []
const sections = ['schema_version', 'description', 'enumerations', 'task_transitions', 'instance_transitions', 'counting', 'rendering', 'segmentation', 'limits']
for (const k of Object.keys(v)) if (!sections.includes(k)) problems.push(`unknown section ${k}`)
for (const k of sections) if (!(k in v)) problems.push(`missing section ${k}`)
if (v.schema_version !== 1) problems.push(`schema_version ${v.schema_version}`)
for (const [name, values] of Object.entries(v.enumerations ?? {})) {
  if (!/^[a-z_]+\.[a-z_]+$/.test(name)) problems.push(`enumeration name ${name}`)
  if (!Array.isArray(values) || !values.every((x) => typeof x === 'string' && x.length > 0)) problems.push(`${name}: values`)
  else if (new Set(values).size !== values.length) problems.push(`${name}: duplicate value`)
}
const tasks = v.enumerations?.['tasks.status'] ?? []
for (const t of v.task_transitions ?? []) {
  if (t.length !== 2 || !t.every((s) => tasks.includes(s))) problems.push(`task transition ${JSON.stringify(t)}`)
}
const inst = v.enumerations?.['platform_instances.status'] ?? []
for (const t of v.instance_transitions ?? []) {
  if (t.length !== 3 || !inst.includes(t[0]) || !inst.includes(t[1]) || !['operator', 'worker', 'janitor'].includes(t[2])) {
    problems.push(`instance transition ${JSON.stringify(t)}`)
  }
}
for (const k of ['counting', 'rendering', 'segmentation', 'limits']) if (!Array.isArray(v[k])) problems.push(`${k} is not a list`)
if (other && readFileSync(other, 'utf8') !== text) problems.push(`${file} differs from ${other}`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${file}: ok`)
