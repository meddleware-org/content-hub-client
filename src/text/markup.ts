// The canonical post format (a small CommonMark subset). A line-for-line port of content-hub-service
// crates/core/src/text/markup.rs; vectors.json pins both. Offsets here are CODE-POINT offsets.

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

export interface Spanned {
  token: Token
  /** Code-point offsets into the source. */
  start: number
  end: number
}

const ESCAPABLE = new Set(['\\', '*', '_', '`', '[', ']', '(', ')'])
const ALNUM = /^[\p{Alphabetic}\p{N}]$/u
const WS = /^\p{White_Space}$/u

export const isAlphanumeric = (c: string | undefined): boolean => c !== undefined && ALNUM.test(c)
export const isWhitespace = (c: string | undefined): boolean => c !== undefined && WS.test(c)

const endsUrl = (c: string): boolean => isWhitespace(c) || c === '<' || c === '>' || c === '"' || c === "'" || c === '`'

const startsWith = (cps: string[], i: number, s: string): boolean => {
  const want = Array.from(s)
  if (i + want.length > cps.length) return false
  for (let k = 0; k < want.length; k++) if (cps[i + k] !== want[k]) return false
  return true
}

/** If a bare URL starts at code point `i`, its end (exclusive); see markup.rs `scan_url`. */
export function scanUrl(cps: string[], i: number): number | null {
  const scheme = startsWith(cps, i, 'https://') ? 8 : startsWith(cps, i, 'http://') ? 7 : 0
  if (scheme === 0) return null
  if (i > 0 && isAlphanumeric(cps[i - 1])) return null
  let end = i + scheme
  while (end < cps.length && !endsUrl(cps[end]!)) end++
  const afterScheme = i + scheme
  while (end > afterScheme) {
    const c = cps[end - 1]!
    let strip = '.,;:!?*'.includes(c)
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
  return end > afterScheme ? end : null
}

function scanLink(cps: string[], i: number): [string, string, number] | null {
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

type Raw = { tok: Token } | { delim: { len: number; canOpen: boolean; canClose: boolean } }

/** Parse the canonical format. Never fails: anything that is not markup is text. */
export function parse(source: string): Spanned[] {
  const cps = Array.from(source)
  const raw: Array<{ r: Raw; start: number; end: number }> = []
  let text = ''
  let textStart = 0
  const flush = (end: number) => {
    if (text !== '') {
      raw.push({ r: { tok: { kind: 'text', text } }, start: textStart, end })
      text = ''
    }
  }
  const addText = (s: string, at: number) => {
    if (text === '') textStart = at
    text += s
  }
  let i = 0
  let lineStart = true
  while (i < cps.length) {
    const c = cps[i]!
    if (lineStart && (startsWith(cps, i, '- ') || startsWith(cps, i, '* '))) {
      flush(i)
      raw.push({ r: { tok: { kind: 'bullet' } }, start: i, end: i + 2 })
      i += 2
      textStart = i
      lineStart = false
      continue
    }
    lineStart = false
    if (c === '\n') {
      flush(i)
      let n = 0
      while (cps[i + n] === '\n') n++
      raw.push({ r: { tok: { kind: n >= 2 ? 'paragraphBreak' : 'lineBreak' } }, start: i, end: i + n })
      i += n
      textStart = i
      lineStart = true
      continue
    }
    if (c === '\\') {
      const next = cps[i + 1]
      if (next !== undefined && ESCAPABLE.has(next)) {
        addText(next, i)
        i += 2
        continue
      }
    }
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
      addText('*'.repeat(run), i)
      i += run
      continue
    }
    addText(c, i)
    i += 1
  }
  flush(cps.length)

  const kind: Array<Token | null> = raw.map(() => null)
  const stack: Array<[number, number]> = []
  raw.forEach((x, idx) => {
    if (!('delim' in x.r)) return
    const { len, canOpen, canClose } = x.r.delim
    let pos = -1
    if (canClose) {
      for (let k = stack.length - 1; k >= 0; k--) {
        if (stack[k]![1] === len) {
          pos = k
          break
        }
      }
    }
    if (pos >= 0) {
      const openIdx = stack[pos]![0]
      stack.length = pos
      kind[openIdx] = len === 2 ? { kind: 'strongOpen' } : { kind: 'emphOpen' }
      kind[idx] = len === 2 ? { kind: 'strongClose' } : { kind: 'emphClose' }
    } else if (canOpen) {
      stack.push([idx, len])
    }
  })

  const out: Spanned[] = []
  raw.forEach((x, idx) => {
    const token: Token = 'tok' in x.r ? x.r.tok : (kind[idx] ?? { kind: 'text', text: '*'.repeat(x.r.delim.len) })
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
