// The canonical post format (a small CommonMark subset). A line-for-line port of content-hub-service
// crates/core/src/text/markup.rs; vectors.json pins both. Offsets here are CODE-POINT offsets.
//
// Role: turn the hub's canonical post text (a small CommonMark subset: bold, italic, code, links, bare URLs, bullets, line and paragraph breaks) into tokens that the renderers, counters and
// segmenters share. It never fails: anything that is not markup is text. It must agree with the Rust parser on every input (the vectors pin both), because a preview that disagrees with the
// server would show a person a post the platform will not receive. Main exports: `parse`, `scanUrl`. Tested in `tests/text.test.ts` and `tests/vectors.test.ts`.

/** One piece of a parsed post: text, an opening or closing mark, code, a link or bare URL, or a break. */
export type Token =
  | { kind: 'text'; text: string }
  | { kind: 'strongOpen' }
  | { kind: 'strongClose' }
  | { kind: 'emphOpen' }
  | { kind: 'emphClose' }
  | { kind: 'code'; text: string }
  | { kind: 'link'; text: string; url: string }
  | { kind: 'url'; url: string }
  | { kind: 'lineBreak' }
  | { kind: 'paragraphBreak' }
  | { kind: 'bullet' }

/** A token with the code-point range of the source it came from. */
export interface Spanned {
  /** The token. */
  token: Token
  /** Code-point offsets into the source. */
  start: number
  end: number
}

/** The characters a backslash can escape. */
const ESCAPABLE = new Set(['\\', '*', '_', '`', '[', ']', '(', ')'])
/** A letter or number in any script (Unicode Alphabetic or Number). */
const ALNUM = /^[\p{Alphabetic}\p{N}]$/u
/** Any Unicode white space. */
const WS = /^\p{White_Space}$/u

/** True if `c` is a single letter or number (`undefined`, the position past the end, is not). */
export const isAlphanumeric = (c: string | undefined): boolean => c !== undefined && ALNUM.test(c)
/** True if `c` is a single white-space character. */
export const isWhitespace = (c: string | undefined): boolean => c !== undefined && WS.test(c)

/** True for a character that ends a bare URL: white space, an angle bracket, or a quote or backtick. */
const endsUrl = (c: string): boolean => isWhitespace(c) || c === '<' || c === '>' || c === '"' || c === "'" || c === '`'

/** True if the code points of `cps` from index `i` begin with the text `s` (compared per code point, not per UTF-16 unit). */
const startsWith = (cps: string[], i: number, s: string): boolean => {
  const want = Array.from(s)
  if (i + want.length > cps.length) return false
  for (let k = 0; k < want.length; k++) if (cps[i + k] !== want[k]) return false
  return true
}

/** If a bare URL starts at code point `i`, its end (exclusive); see markup.rs `scan_url`. */
export function scanUrl(cps: string[], i: number): number | null {
  // Only http and https URLs are links; the scheme's length is 8 or 7 code points.
  const scheme = startsWith(cps, i, 'https://') ? 8 : startsWith(cps, i, 'http://') ? 7 : 0
  if (scheme === 0) return null
  // A URL must start at a word boundary: `xhttps://` is not a link.
  if (i > 0 && isAlphanumeric(cps[i - 1])) return null
  // Take everything up to a character that ends a URL...
  let end = i + scheme
  while (end < cps.length && !endsUrl(cps[end]!)) end++
  const afterScheme = i + scheme
  // ...then give back trailing punctuation that belongs to the sentence, not the URL.
  while (end > afterScheme) {
    const c = cps[end - 1]!
    let strip = '.,;:!?*'.includes(c)
    // A closing parenthesis is part of the URL only if it balances one inside it (`…/wiki/Foo_(bar)` keeps it; `(see https://x.y)` does not).
    if (c === ')') {
      let open = 0
      let close = 0
      for (let k = i; k < end; k++) {
        if (cps[k] === '(') open++
        else if (cps[k] === ')') close++
      }
      strip = open < close
    }
    if (!strip) break
    end--
  }
  // A URL that is only a scheme is not a link.
  return end > afterScheme ? end : null
}

/**
 * If an inline link `[text](https://url)` starts at code point `i`, its text, its URL and its end (exclusive); otherwise `null`. The text may not be empty, contain a newline or a `[`, and the URL must
 * be http(s) with no white space or `<>"(`. A line-for-line port of the Rust scanner.
 */
function scanLink(cps: string[], i: number): [string, string, number] | null {
  // The first `]` after the opening bracket ends the text.
  let close = -1
  for (let k = i + 1; k < cps.length; k++) {
    if (cps[k] === ']') {
      close = k
      break
    }
  }
  if (close < 0) return null
  const text = cps.slice(i + 1, close)
  if (text.length === 0 || text.includes('\n') || text.includes('[')) return null
  // The URL must follow immediately in parentheses; its first `)` ends it.
  if (cps[close + 1] !== '(') return null
  const urlStart = close + 2
  let urlEnd = -1
  for (let k = urlStart; k < cps.length; k++) {
    if (cps[k] === ')') {
      urlEnd = k
      break
    }
  }
  if (urlEnd < 0) return null
  const url = cps.slice(urlStart, urlEnd)
  const scheme = startsWith(url, 0, 'https://') ? 8 : startsWith(url, 0, 'http://') ? 7 : 0
  if (scheme === 0) return null
  if (url.length <= scheme || url.some((c) => isWhitespace(c) || c === '<' || c === '>' || c === '"' || c === '(')) return null
  return [text.join(''), url.join(''), urlEnd + 1]
}

/** A first-pass item: a finished token, or an asterisk run whose meaning (open, close or plain text) is decided in the second pass. */
type Raw = { tok: Token } | { delim: { len: number; canOpen: boolean; canClose: boolean } }

/** Parse the canonical format. Never fails: anything that is not markup is text. */
export function parse(source: string): Spanned[] {
  // Work in code points, so an emoji or an accented letter counts once and offsets match the Rust parser's.
  const cps = Array.from(source)
  // The first pass's items with their source ranges.
  const raw: Array<{ r: Raw; start: number; end: number }> = []
  // Plain text collected so far and where it began; flushed into a text token when something else starts.
  let text = ''
  let textStart = 0
  /** Emit the pending text (if any) as a token ending at `end`. */
  const flush = (end: number) => {
    if (text !== '') {
      raw.push({ r: { tok: { kind: 'text', text } }, start: textStart, end })
      text = ''
    }
  }
  /** Append to the pending text, remembering where it started. */
  const addText = (s: string, at: number) => {
    if (text === '') textStart = at
    text += s
  }
  // The scan: `i` is the current code point; `lineStart` is true at the start of a line (where a bullet may begin).
  let i = 0
  let lineStart = true
  while (i < cps.length) {
    const c = cps[i]!
    // A bullet: `- ` or `* ` at the start of a line.
    if (lineStart && (startsWith(cps, i, '- ') || startsWith(cps, i, '* '))) {
      flush(i)
      raw.push({ r: { tok: { kind: 'bullet' } }, start: i, end: i + 2 })
      // Past the two marker characters; the next text starts here.
      i += 2
      textStart = i
      lineStart = false
      continue
    }
    lineStart = false
    // A newline: one is a line break, two or more a paragraph break.
    if (c === '\n') {
      flush(i)
      // Count the run of newlines.
      let n = 0
      while (cps[i + n] === '\n') n++
      raw.push({ r: { tok: { kind: n >= 2 ? 'paragraphBreak' : 'lineBreak' } }, start: i, end: i + n })
      i += n
      textStart = i
      lineStart = true
      continue
    }
    // A backslash escapes one of the markup characters; before anything else it is itself text.
    if (c === '\\') {
      const next = cps[i + 1]
      if (next !== undefined && ESCAPABLE.has(next)) {
        addText(next, i)
        i += 2
        continue
      }
    }
    // Inline code: from a backtick to the next one, if the body is non-empty and has no blank line; otherwise the backtick is text.
    if (c === '`') {
      let rel = -1
      for (let k = i + 1; k < cps.length; k++) {
        if (cps[k] === '`') {
          rel = k
          break
        }
      }
      if (rel >= 0) {
        const body = cps.slice(i + 1, rel).join('')
        if (body !== '' && !body.includes('\n\n')) {
          flush(i)
          raw.push({ r: { tok: { kind: 'code', text: body } }, start: i, end: rel + 1 })
          i = rel + 1
          textStart = i
          continue
        }
      }
    }
    // An inline link, if one starts here.
    if (c === '[') {
      const link = scanLink(cps, i)
      if (link) {
        flush(i)
        raw.push({ r: { tok: { kind: 'link', text: link[0], url: link[1] } }, start: i, end: link[2] })
        i = link[2]
        textStart = i
        continue
      }
    }
    // A bare URL (only `h` can start one).
    if (c === 'h') {
      const end = scanUrl(cps, i)
      if (end !== null) {
        flush(i)
        raw.push({ r: { tok: { kind: 'url', url: cps.slice(i, end).join('') } }, start: i, end })
        i = end
        textStart = i
        continue
      }
    }
    // An asterisk run: one is emphasis, two is strong, more is text. Whether it opens or closes is decided by its neighbours (an opener is followed by a non-space, a closer preceded by one).
    if (c === '*') {
      let run = 0
      while (cps[i + run] === '*') run++
      if (run <= 2) {
        const before = cps[i - 1]
        const after = cps[i + run]
        const canOpen = after !== undefined && !isWhitespace(after)
        const canClose = before !== undefined && !isWhitespace(before)
        if (canOpen || canClose) {
          flush(i)
          raw.push({ r: { delim: { len: run, canOpen, canClose } }, start: i, end: i + run })
          i += run
          textStart = i
          continue
        }
      }
      // Too many asterisks, or none that can open or close: they are plain text.
      addText('*'.repeat(run), i)
      i += run
      continue
    }
    // Any other character is text.
    addText(c, i)
    i += 1
  }
  // The end of the input flushes the last pending text.
  flush(cps.length)

  // Second pass: pair the asterisk runs. `kind[idx]` becomes an open or close token for a run that found its partner; an unmatched run stays null and is text. `stack` holds the open runs
  // as `[index, length]`.
  const kind: Array<Token | null> = raw.map(() => null)
  const stack: Array<[number, number]> = []
  raw.forEach((x, idx) => {
    if (!('delim' in x.r)) return
    const { len, canOpen, canClose } = x.r.delim
    // A closer pairs with the nearest open run of the same length.
    let pos = -1
    if (canClose) {
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k]![1] === len) {
          pos = k
          break
        }
      }
    }
    // Pair found: both ends get their token, and every open run inside the pair is dropped (they stay text).
    if (pos >= 0) {
      const openIdx = stack[pos]![0]
      stack.length = pos
      kind[openIdx] = len === 2 ? { kind: 'strongOpen' } : { kind: 'emphOpen' }
      kind[idx] = len === 2 ? { kind: 'strongClose' } : { kind: 'emphClose' }
    } else if (canOpen) {
      stack.push([idx, len])
    }
  })

  // Third pass: resolve each item to its token, merging neighbouring text (an unmatched asterisk run next to text becomes one text token).
  // The merged result, in source order.
  const out: Spanned[] = []
  raw.forEach((x, idx) => {
    const token: Token = 'tok' in x.r ? x.r.tok : (kind[idx] ?? { kind: 'text', text: '*'.repeat(x.r.delim.len) })
    // Adjacent text tokens are joined (an unmatched asterisk run turned into text next to ordinary text).
    const prev = out[out.length - 1]
    if (token.kind === 'text' && prev && prev.token.kind === 'text' && prev.end === x.start) {
      prev.token = { kind: 'text', text: prev.token.text + token.text }
      prev.end = x.end
      return
    }
    out.push({ token, start: x.start, end: x.end })
  })
  return out
}
