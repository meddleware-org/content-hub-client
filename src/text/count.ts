// Counters (port of count.rs). Rust is authoritative; this is for previews, and vectors.json pins both.
//
// Role: each platform counts a post differently (X weights characters and shortens every URL, Mastodon counts a mention by its local part, others count graphemes, UTF-16 units, code points
// or bytes). A preview that miscounts would tell a person a post fits when the platform will refuse it. Main exports: `count`, `graphemes`, `utf8Length`, `X_URL_WEIGHT`. Tested in
// `tests/text.test.ts` and `tests/vectors.test.ts`.

import type { CountingMethod } from '../model.js'
import { isAlphanumeric, scanUrl } from './markup.js'

/** How a platform counts: the method, and the two substitutions some platforms apply first. */
export interface CountRules {
  /** The counting method. */
  method: CountingMethod
  /** Each URL counts as this many characters (X always uses 23). */
  urlWeight?: number | null
  /** `@user@host` counts as `@user` (Mastodon). */
  mentionLocalPart?: boolean
}

/** X counts every URL as 23 characters, whatever its length. */
export const X_URL_WEIGHT = 23

/** The platform's grapheme segmenter (what a reader perceives as one character, e.g. an emoji with a modifier). */
const graphemeSegmenter = new Intl.Segmenter('und', { granularity: 'grapheme' })
/** The user-perceived characters of `s`. */
export const graphemes = (s: string): string[] => Array.from(graphemeSegmenter.segment(s), (x) => x.segment)

/** A character allowed in a mention's user part. */
const asciiWord = (c: string | undefined) => c !== undefined && /^[A-Za-z0-9_]$/.test(c)
/** A character allowed in a mention's host part. */
const asciiHost = (c: string | undefined) => c !== undefined && /^[A-Za-z0-9.-]$/.test(c)

/**
 * Apply the substitutions some platforms make before counting: each URL becomes `urlWeight` placeholder characters, and a fediverse mention `@user@host` counts as `@user`.
 */
function substitute(text: string, urlWeight: number | null | undefined, mentionLocalPart: boolean): string {
  // Code points, so offsets match the markup parser's.
  const cps = Array.from(text)
  let out = ''
  let i = 0
  while (i < cps.length) {
    const c = cps[i]!
    // A URL (only an `h` can start one) is replaced by its weight in placeholder characters.
    if (urlWeight != null && c === 'h') {
      const end = scanUrl(cps, i)
      if (end !== null) {
        out += 'x'.repeat(urlWeight)
        i = end
        continue
      }
    }
    // A mention starts at an `@` that is not part of a word (so an email address is not a mention).
    if (mentionLocalPart && c === '@' && !(isAlphanumeric(cps[i - 1]) || cps[i - 1] === '_')) {
      let u = i + 1
      while (asciiWord(cps[u])) u++
      // `@user@host`: a non-empty user, a second `@`, then a host that contains a dot (trailing dots are punctuation, not part of the host).
      if (u > i + 1 && cps[u] === '@') {
        let h = u + 1
        while (asciiHost(cps[h])) h++
        let hostEnd = h
        while (hostEnd > u + 1 && cps[hostEnd - 1] === '.') hostEnd--
        if (cps.slice(u + 1, hostEnd).includes('.')) {
          // Keep `@user`, drop `@host`.
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

/** X's weight of one code point: 1 for the Latin, general-punctuation and similar ranges X counts singly, 2 for everything else (CJK, most symbols). */
const xWeight = (c: string): number => {
  const u = c.codePointAt(0)!
  return u <= 0x10ff || (u >= 0x2000 && u <= 0x200d) || (u >= 0x2010 && u <= 0x201f) || (u >= 0x2032 && u <= 0x2037) ? 1 : 2
}

/** True if a grapheme is an emoji sequence (more than one code point including a joiner, variation selector, keycap, skin-tone modifier or a pictograph): X counts each as 2. */
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

/** The X-weighted length: NFC-normalised, URLs at 23, then 2 per emoji sequence and per double-weight character. */
function xWeighted(text: string): number {
  // NFC first, so a letter and its combining accent count as the single character a reader sees.
  const s = substitute(text.normalize('NFC'), X_URL_WEIGHT, false)
  let n = 0
  for (const g of graphemes(s)) n += isEmojiSequence(g) ? 2 : Array.from(g).reduce((a, c) => a + xWeight(c), 0)
  return n
}

/** The UTF-8 encoder used for byte counts. */
const encoder = new TextEncoder()

/** The length of `text` under `rules`. Rust's counter is authoritative; this must give the same answer (the vectors check it). */
export function count(rules: CountRules, text: string): number {
  // X has its own algorithm (weights, emoji, fixed URL weight).
  if (rules.method === 'x_weighted') return xWeighted(text)
  // The other methods apply the substitutions only when asked.
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

/** The number of UTF-8 bytes in `s`. */
export const utf8Length = (s: string): number => encoder.encode(s).length
