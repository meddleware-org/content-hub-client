import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

import {
  ENUMERATIONS,
  INSTANCE_TRANSITIONS,
  INSTANCE_STATUS_VALUES,
  TASK_STATUS_VALUES,
  TASK_TRANSITIONS,
  operatorMoves,
  taskMoveAllowed,
} from '../src/index.js'
import type { Vectors } from '../src/vectors.js'

const vectors = JSON.parse(readFileSync(new URL('../vectors.json', import.meta.url), 'utf8')) as Vectors

describe('vectors.json', () => {
  it('is schema version 1 with every section present', () => {
    expect(vectors.schema_version).toBe(1)
    for (const k of ['enumerations', 'task_transitions', 'instance_transitions', 'counting', 'rendering', 'segmentation', 'limits']) {
      expect(vectors).toHaveProperty(k)
    }
  })

  it('lists exactly the enumerations this package exports, value for value and in order', () => {
    expect(Object.keys(vectors.enumerations).sort()).toEqual(Object.keys(ENUMERATIONS).sort())
    for (const [name, values] of Object.entries(ENUMERATIONS)) {
      expect(vectors.enumerations[name], name).toEqual([...values])
    }
  })

  it('agrees with the state machines', () => {
    const sorted = (xs: ReadonlyArray<ReadonlyArray<string>>) => xs.map((x) => x.join(' ')).sort()
    expect(sorted(vectors.task_transitions)).toEqual(sorted(TASK_TRANSITIONS))
    expect(sorted(vectors.instance_transitions)).toEqual(sorted(INSTANCE_TRANSITIONS))
  })
})

describe('state machines', () => {
  it('only the worker enters sending, and nothing retries an unknown send', () => {
    for (const [from, to, actor] of INSTANCE_TRANSITIONS) {
      if (to === 'sending') expect([from, actor]).toEqual(['queued', 'worker'])
      if (from === 'unknown') {
        expect(actor).toBe('operator')
        expect(['posted', 'failed']).toContain(to)
      }
      expect(from).not.toBe('posted')
    }
  })

  it('previews the operator moves', () => {
    expect(operatorMoves('unknown').sort()).toEqual(['failed', 'posted'])
    expect(operatorMoves('sending')).toEqual([])
    expect(operatorMoves('posted')).toEqual([])
    for (const s of INSTANCE_STATUS_VALUES) expect(operatorMoves(s)).not.toContain('sending')
  })

  it('has no task self-moves and allows reopening a done task only to in_progress', () => {
    for (const s of TASK_STATUS_VALUES) expect(taskMoveAllowed(s, s)).toBe(false)
    expect(TASK_STATUS_VALUES.filter((t) => taskMoveAllowed('done', t))).toEqual(['in_progress'])
  })
})
