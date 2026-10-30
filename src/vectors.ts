// The shape of vectors.json (imported by consumers as `@meddleware/content-hub-client/vectors.json`).

import type { CountingMethod, Markup } from './model.js'
import type { Actor } from './state.js'

export interface Vectors {
  readonly schema_version: 1
  readonly description: string
  readonly enumerations: Readonly<Record<string, readonly string[]>>
  readonly task_transitions: ReadonlyArray<readonly [string, string]>
  readonly instance_transitions: ReadonlyArray<readonly [string, string, Actor]>
  readonly counting: ReadonlyArray<{
    method: CountingMethod
    url_weight: number | null
    mention_local_part: boolean
    text: string
    count: number
  }>
  readonly rendering: ReadonlyArray<{ markup: Markup; source: string; payload: string; visible: string }>
  readonly segmentation: ReadonlyArray<{
    source: string
    targets: ReadonlyArray<{ id: string; markup: Markup; method: CountingMethod; limit: number }>
    cuts: ReadonlyArray<[string, number]>
    bands: ReadonlyArray<{ start: number; end: number; fits: string[] }>
  }>
  readonly limits: ReadonlyArray<{
    input: {
      markup: Markup
      counting_method: CountingMethod | null
      primary_limit: number | null
      secondary_limits: Readonly<Record<string, unknown>>
      target_config: Readonly<Record<string, unknown>>
      title: string
      body: string
    }
    result: {
      limits: {
        method: CountingMethod
        url_weight: number | null
        mention_local_part: boolean
        primary: number | null
        bytes: number | null
        title: number | null
      } | null
      payload: string
      counted?: number
      bytes?: number
      title_counted?: number | null
      fits?: boolean
    }
  }>
}
