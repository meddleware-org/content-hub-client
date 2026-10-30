// Counters (port of count.rs). Rust is authoritative; this is for previews, and vectors.json pins both.

import type { CountingMethod } from '../model.js'
import { isAlphanumeric, scanUrl } from './markup.js'

export interface CountRules {
  method: CountingMethod
  /** Each URL counts as this many characters (X always uses 23). */
  urlWeight?: number | null
  /** `@user@host` counts as `@user` (Mastodon). */
  mentionLocalPart?: boolean
}

export const X_URL_WEIGHT = 23

const graphemeSegmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })
export const graphemes = (s: string): string[] => Array.from(graphemeSegmenter.segment(s), (x) => x.segment)

const asciiWord = (c: string | undefined) => c !== undefined && /^[A-Za-z0-9_]$/.test(c)
const asciiHost = (c: string | undefined) => c !== undefined && /^[A-Za-z0-9.-]$/.test(c)

function substitute(text: string, urlWeight: number | null | undefined, mentionLocalPart: boolean): string {
  const cps = Array.from(text)
  let out = ''
  let i = 0
  while (i < cps.length) {
    const c = cps[i]!
    if (urlWeight != null && c === 'h') {
      const end = scanUrl(cps, i)
      if (end !== null) {
        out += 'x'.repeat(urlWeight)
        i = end
        continue
      }
    }
    if (mentionLocalPart && c === '@' && !(isAlphanumeric(cps[i - 1]) || cps[i - 1] === '_')) {
      let u = i + 1
      while (asciiWord(cps[u])) u++
      if (u > i + 1 && cps[u] === '@') {
        let h = u + 1
        while (asciiHost(cps[h])) h++
        let hostEnd = h
        while (hostEnd > u + 1 && cps[hostEnd - 1] === '.') hostEnd--
        if (cps.slice(u + 1, hostEnd).includes('.')) {
          out += cps.slice(i, u).join('')
          i = hostEnd
          continue
        }
      }
    }
    out += c
    i++
  }
  return out
}

const xWeight = (c: string): number => {
  const u = c.codePointAt(0)!
  return u <= 0x10ff || (u >= 0x2000 && u <= 0x200d) || (u >= 0x2010 && u <= 0x201f) || (u >= 0x2032 && u <= 0x2037) ? 1 : 2
}

function isEmojiSequence(g: string): boolean {
  const cps = Array.from(g)
  return (
    cps.length > 1 &&
    cps.some((c) => {
      const u = c.codePointAt(0)!
      return u === 0x200d || u === 0xfe0f || u === 0x20e3 || (u >= 0x1f3fb && u <= 0x1f3ff) || u >= 0x1f000
    })
  )
}

function xWeighted(text: string): number {
  const s = substitute(text.normalize('NFC'), X_URL_WEIGHT, false)
  let n = 0
  for (const g of graphemes(s)) n += isEmojiSequence(g) ? 2 : Array.from(g).reduce((a, c) => a + xWeight(c), 0)
  return n
}

const encoder = new TextEncoder()

export function count(rules: CountRules, text: string): number {
  if (rules.method === 'x_weighted') return xWeighted(text)
  const t =
    rules.urlWeight != null || rules.mentionLocalPart ? substitute(text, rules.urlWeight, rules.mentionLocalPart === true) : text
  switch (rules.method) {
    case 'bytes':
      return encoder.encode(t).length
    case 'codepoints':
      return Array.from(t).length
    case 'utf16':
      return t.length
    case 'graphemes':
      return graphemes(t).length
  }
}

export const utf8Length = (s: string): number => encoder.encode(s).length
