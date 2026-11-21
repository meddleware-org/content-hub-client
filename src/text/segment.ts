// Segmentation (port of segment.rs): how much of a post fits each selected platform. Positions are code-point
// offsets. The binary search is the same as Rust's, so results are identical (vectors.json).
//
// Role: a long post can be split into a thread; each platform takes as much as fits. This module finds, for each chosen platform, the longest prefix of the post that fits, never cutting a link
// or URL in half and never inside a grapheme, and the bands between those cuts (which platforms a given stretch fits). Main exports: `segment`, `fits`. Tested in `tests/text.test.ts`
// and `tests/vectors.test.ts`.

import type { Markup } from '../model.js'
import { count, utf8Length, graphemes, type CountRules } from './count.js'
import { parse } from './markup.js'
import { render } from './render.js'

/** The limits of one target. */
export interface Limits {
  /** How the target counts. */
  rules: CountRules
  /** The main length limit, if any. */
  primary?: number | null
  /** A limit on the UTF-8 bytes of the payload, if any. */
  bytes?: number | null
  /** A limit on the title, if any. */
  title?: number | null
}

/** One platform a post is to be sent to. */
export interface SegmentTarget {
  /** The target's id (opaque). */
  id: string
  /** The markup the target accepts. */
  markup: Markup
  /** The target's limits. */
  limits: Limits
}

/** A stretch of the post, in code points, and the ids of the targets that can carry all of it. */
export interface Band {
  /** The start offset. */
  start: number
  /** The end offset (exclusive). */
  end: number
  /** The targets whose cut is at or after `end`. */
  fits: string[]
}

/** Where each target's cut is, and the bands between the cuts. */
export interface Segmentation {
  /** `[target id, code-point offset]`: how much of the post that target takes. */
  cuts: Array<[string, number]>
  /** The bands, in order. */
  bands: Band[]
}

/** True if the whole `source`, rendered for `markup`, is within `limits` (Telegram counts the visible text; the byte limit applies to the payload). */
export function fits(markup: Markup, limits: Limits, source: string): boolean {
  // Render as the platform will receive it; the count and the byte check use different strings for Telegram.
  const r = render(markup, parse(source))
  const counted = markup === 'telegram_html' ? r.visible : r.payload
  return (limits.primary == null || count(limits.rules, counted) <= limits.primary) && (limits.bytes == null || utf8Length(r.payload) <= limits.bytes)
}

/** The offsets where the post may be cut: every grapheme boundary except inside a link or a URL (which must stay whole). */
function candidates(source: string): number[] {
  // The ranges that must not be split.
  const atomic = parse(source)
    .filter((t) => t.token.kind === 'link' || t.token.kind === 'url')
    .map((t) => [t.start, t.end] as const)
  // Start at 0, then add each boundary after a whole grapheme (counted in code points) that is not inside an atomic range.
  const out = [0]
  let pos = 0
  for (const g of graphemes(source)) {
    pos += Array.from(g).length
    if (!atomic.some(([s, e]) => s < pos && pos < e) && out[out.length - 1] !== pos) out.push(pos)
  }
  return out
}

/** The largest candidate offset whose prefix fits `t` (the whole post if it all fits). A binary search: fitting is monotone, a longer prefix never fits better. */
function cutFor(cps: string[], cands: number[], t: SegmentTarget): number {
  const prefix = (n: number) => cps.slice(0, n).join('')
  // `lo` always fits (the empty prefix does); `hi` is the longest candidate.
  let lo = 0
  let hi = cands.length - 1
  if (fits(t.markup, t.limits, prefix(cands[hi]!))) return cands[hi]!
  while (lo + 1 < hi) {
    const mid = lo + Math.floor((hi - lo) / 2)
    if (fits(t.markup, t.limits, prefix(cands[mid]!))) lo = mid
    else hi = mid
  }
  return cands[lo]!
}

/** Cut `source` for each target and build the bands. Offsets are code points. */
export function segment(source: string, targets: SegmentTarget[]): Segmentation {
  const cps = Array.from(source)
  const cands = candidates(source)
  const cuts = targets.map((t) => [t.id, cutFor(cps, cands, t)] as [string, number])
  // The band boundaries: the start, the end and every cut, sorted and de-duplicated.
  const points = [...new Set([0, cps.length, ...cuts.map(([, c]) => c)])].sort((a, b) => a - b)
  const bands: Band[] = []
  for (let k = 0; k + 1 < points.length; k++) {
    const start = points[k]!
    const end = points[k + 1]!
    // A target can carry a band if its cut is at or after the band's end.
    bands.push({ start, end, fits: cuts.filter(([, c]) => c >= end).map(([id]) => id) })
  }
  return { cuts, bands }
}
