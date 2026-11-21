// The shape of vectors.json (imported by consumers as `@meddleware/content-hub-client/vectors.json`).
//
// Role: the golden vectors are the one fixture the TypeScript client and the Rust service both test against, so a rule (an enumeration, a state move, how a post is counted, rendered, cut or
// limited) cannot change on one side only. This file types them for the TypeScript side; the Rust service reads the same JSON. Types only. Tested in `tests/vectors.test.ts`; the file's own
// structure is checked by `scripts/check-vectors.mjs`.

import type { CountingMethod, Markup } from './model.js'
import type { Actor } from './state.js'

/** The whole vectors file. */
export interface Vectors {
  /** The file format's version; a change means a breaking change of the format. */
  readonly schema_version: 1
  /** What the file is for. */
  readonly description: string
  /** Every enumeration by `table.column`, the same lists as `ENUMERATIONS`. */
  readonly enumerations: Readonly<Record<string, readonly string[]>>
  /** The task moves, as `[from, to]`. */
  readonly task_transitions: ReadonlyArray<readonly [string, string]>
  /** The instance moves, as `[from, to, actor]`. */
  readonly instance_transitions: ReadonlyArray<readonly [string, string, Actor]>
  /** Counting cases: a text and the length each counting method must give it. */
  readonly counting: ReadonlyArray<{
    method: CountingMethod
    url_weight: number | null
    mention_local_part: boolean
    text: string
    count: number
  }>
  /** Rendering cases: a source in the canonical format, and what each markup must produce (the payload to send and the text a reader sees). */
  readonly rendering: ReadonlyArray<{ markup: Markup; source: string; payload: string; visible: string }>
  /** Segmentation cases: where a long text may be cut for each target, and which targets each band fits. */
  readonly segmentation: ReadonlyArray<{
    source: string
    targets: ReadonlyArray<{ id: string; markup: Markup; method: CountingMethod; limit: number }>
    cuts: ReadonlyArray<[string, number]>
    bands: ReadonlyArray<{ start: number; end: number; fits: string[] }>
  }>
  /** Limit-check cases: a platform definition and a post, and the limits and verdict that must result. */
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
