#!/usr/bin/env node
// Structural check of a vectors file (used here in CI, and by content-hub-service on its copy):
//
//   node scripts/check-vectors.mjs <vectors.json> [--against <other vectors.json>]
//
// Fails on an unknown or missing section, a non-string enumeration value, a duplicate, an actor outside
// operator/worker/janitor, or (with --against) any byte-level difference from the other file.
//
// Why: the vectors are the contract between this package and the Rust service. If this copy and the service's drift apart, the two would each pass their own tests while disagreeing. The `--against`
// form is how the service's CI proves its copy is byte-identical to the published one.
//
// Usage:      node scripts/check-vectors.mjs <vectors.json> [--against <other vectors.json>]   (npm run check:vectors checks vectors.json alone)
// Reads:      the file(s) named; nothing else. Writes nothing and makes no network call.
// Exit codes: 0 when the file is well-formed (and identical to the other, if given); 1 with the problems listed on stderr; 2 on a usage error.
import { readFileSync } from 'node:fs'

// The arguments: the file, and optionally `--against <other>`.
const [file, flag, other] = process.argv.slice(2)
if (!file || (flag && (flag !== '--against' || !other))) {
  console.error('usage: check-vectors.mjs <vectors.json> [--against <other vectors.json>]')
  process.exit(2)
}
// Everything found wrong is collected and reported together, not one at a time.
const text = readFileSync(file, 'utf8')
const v = JSON.parse(text)
const problems = []
// The exact set of top-level sections: an unknown one is as suspicious as a missing one.
const sections = ['schema_version', 'description', 'enumerations', 'task_transitions', 'instance_transitions', 'counting', 'rendering', 'segmentation', 'limits']
for (const k of Object.keys(v)) if (!sections.includes(k)) problems.push(`unknown section ${k}`)
for (const k of sections) if (!(k in v)) problems.push(`missing section ${k}`)
if (v.schema_version !== 1) problems.push(`schema_version ${v.schema_version}`)
// Each enumeration is named `table.column`, holds non-empty strings, and has no duplicate.
for (const [name, values] of Object.entries(v.enumerations ?? {})) {
  if (!/^[a-z_]+\.[a-z_]+$/.test(name)) problems.push(`enumeration name ${name}`)
  if (!Array.isArray(values) || !values.every((x) => typeof x === 'string' && x.length > 0)) problems.push(`${name}: values`)
  else if (new Set(values).size !== values.length) problems.push(`${name}: duplicate value`)
}
// A task move is a pair of known task statuses.
const tasks = v.enumerations?.['tasks.status'] ?? []
for (const t of v.task_transitions ?? []) {
  if (t.length !== 2 || !t.every((s) => tasks.includes(s))) problems.push(`task transition ${JSON.stringify(t)}`)
}
// An instance move is two known instance statuses and one of the three actors.
const inst = v.enumerations?.['platform_instances.status'] ?? []
for (const t of v.instance_transitions ?? []) {
  if (t.length !== 3 || !inst.includes(t[0]) || !inst.includes(t[1]) || !['operator', 'worker', 'janitor'].includes(t[2])) {
    problems.push(`instance transition ${JSON.stringify(t)}`)
  }
}
// The four case lists must at least be lists (their contents are checked by the tests that consume them).
for (const k of ['counting', 'rendering', 'segmentation', 'limits']) if (!Array.isArray(v[k])) problems.push(`${k} is not a list`)
// Byte for byte: even a whitespace difference means the copies were edited separately.
if (other && readFileSync(other, 'utf8') !== text) problems.push(`${file} differs from ${other}`)
if (problems.length) {
  console.error(problems.join('\n'))
  process.exit(1)
}
console.log(`${file}: ok`)
