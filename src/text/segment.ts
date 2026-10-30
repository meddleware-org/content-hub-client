// Segmentation (port of segment.rs): how much of a post fits each selected platform. Positions are code-point
// offsets. The binary search is the same as Rust's, so results are identical (vectors.json).

import type { Markup } from '../model.js'
import { count, utf8Length, graphemes, type CountRules } from './count.js'
import { parse } from './markup.js'
import { render } from './render.js'

export interface Limits {
  rules: CountRules
  primary?: number | null
  bytes?: number | null
  title?: number | null
}

export interface SegmentTarget {
  id: string
  markup: Markup
  limits: Limits
}

export interface Band {
  start: number
  end: number
  fits: string[]
}

export interface Segmentation {
  cuts: Array<[string, number]>
  bands: Band[]
}

export function fits(markup: Markup, limits: Limits, source: string): boolean {
  const r = render(markup, parse(source))
  const counted = markup === 'telegram_html' ? r.visible : r.payload
  return (limits.primary == null || count(limits.rules, counted) <= limits.primary) && (limits.bytes == null || utf8Length(r.payload) <= limits.bytes)
}

function candidates(source: string): number[] {
  const atomic = parse(source)
    .filter((t) => t.token.kind === 'link' || t.token.kind === 'url')
    .map((t) => [t.start, t.end] as const)
  const out = [0]
  let pos = 0
  for (const g of graphemes(source)) {
    pos += Array.from(g).length
    if (!atomic.some(([s, e]) => s < pos && pos < e) && out[out.length - 1] !== pos) out.push(pos)
  }
  return out
}

function cutFor(cps: string[], cands: number[], t: SegmentTarget): number {
  const prefix = (n: number) => cps.slice(0, n).join('')
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

export function segment(source: string, targets: SegmentTarget[]): Segmentation {
  const cps = Array.from(source)
  const cands = candidates(source)
  const cuts = targets.map((t) => [t.id, cutFor(cps, cands, t)] as [string, number])
  const points = [...new Set([0, cps.length, ...cuts.map(([, c]) => c)])].sort((a, b) => a - b)
  const bands: Band[] = []
  for (let k = 0; k + 1 < points.length; k++) {
    const start = points[k]!
    const end = points[k + 1]!
    bands.push({ start, end, fits: cuts.filter(([, c]) => c >= end).map(([id]) => id) })
  }
  return { cuts, bands }
}
