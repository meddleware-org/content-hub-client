// Per-target limits and the check of one rendered post (port of limits.rs). Rust is authoritative; the `limits`
// section of vectors.json pins both.

import type { CountingMethod, Markup } from '../model.js'
import { count, utf8Length } from './count.js'
import { parse } from './markup.js'
import { render } from './render.js'
import type { Limits } from './segment.js'

/** A platform definition's limit columns (the API's `PlatformDefinition`). */
export interface DefinitionLimits {
  counting_method?: CountingMethod | null
  primary_limit?: number | null
  secondary_limits?: Readonly<Record<string, unknown>> | null
}

const U32_MAX = 4_294_967_295

/** A non-negative integer (what Rust reads with `as_u64`), else undefined. */
const uint = (v: unknown): number | undefined => (typeof v === 'number' && Number.isInteger(v) && v >= 0 ? v : undefined)
/** A positive integer. */
const positive = (v: unknown): number | undefined => {
  const n = uint(v)
  return n !== undefined && n > 0 ? n : undefined
}

/**
 * The limits a definition states. Without a counting method there is no limit to check (`null`).
 * Recognised `secondary_limits`: `url_weight`, `mention_local_part` (1), `bytes`, `title`.
 */
export function limitsFromDefinition(def: DefinitionLimits): Limits | null {
  const method = def.counting_method
  if (!method) return null
  const sec = def.secondary_limits ?? {}
  const primary = def.primary_limit
  return {
    rules: {
      method,
      urlWeight: uint(sec.url_weight) === undefined ? null : Math.min(uint(sec.url_weight)!, U32_MAX),
      mentionLocalPart: uint(sec.mention_local_part) === 1,
    },
    primary: primary != null && primary >= 0 ? primary : null,
    bytes: uint(sec.bytes) ?? null,
    title: uint(sec.title) ?? null,
  }
}

/**
 * The limits that apply to one target: the definition's, adjusted by the target's configuration. A Discord target in
 * `embed` mode is bounded by `embed_description`; a Mastodon target uses its instance's cached `instance_limits`.
 */
export function limitsForTarget(
  base: Limits | null,
  secondary: Readonly<Record<string, unknown>> | null | undefined,
  targetConfig: Readonly<Record<string, unknown>> | null | undefined,
): Limits | null {
  if (!base) return null
  const l: Limits = { ...base, rules: { ...base.rules } }
  const cfg = targetConfig ?? {}
  const embed = positive((secondary ?? {}).embed_description)
  if (cfg.mode === 'embed' && embed !== undefined) l.primary = embed
  const il = cfg.instance_limits
  if (il && typeof il === 'object') {
    const max = positive((il as Record<string, unknown>).max_characters)
    if (max !== undefined) l.primary = max
    const url = positive((il as Record<string, unknown>).characters_reserved_per_url)
    if (url !== undefined) l.rules.urlWeight = Math.min(url, U32_MAX)
  }
  return l
}

/** The result of checking one rendered post against a target. */
export interface Check {
  /** What is sent. */
  payload: string
  /** The counted size under the target's method (Telegram counts the visible text). */
  counted: number
  limit: number | null
  /** UTF-8 bytes of the payload. */
  bytes: number
  byteLimit: number | null
  titleCounted: number | null
  titleLimit: number | null
  fits: boolean
}

/** Render `body` for `markup` and count it under `limits`; count `title` against the title cap. */
export function check(markup: Markup, limits: Limits, title: string | null, body: string): Check {
  const r = render(markup, parse(body))
  const counted = count(limits.rules, markup === 'telegram_html' ? r.visible : r.payload)
  const bytes = utf8Length(r.payload)
  const limit = limits.primary ?? null
  const byteLimit = limits.bytes ?? null
  const titleCounted = title == null ? null : count(limits.rules, title)
  const titleLimit = limits.title ?? null
  const fits =
    (limit === null || counted <= limit) &&
    (byteLimit === null || bytes <= byteLimit) &&
    (titleCounted === null || titleLimit === null || titleCounted <= titleLimit)
  return { payload: r.payload, counted, limit, bytes, byteLimit, titleCounted, titleLimit, fits }
}
