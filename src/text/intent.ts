// Manual-assist links (port of intent.rs): fill a definition's URL template. Values are percent-encoded per
// RFC 3986 (only unreserved characters stay literal); {target_base} must be an https URL and is inserted as is.

const encoder = new TextEncoder()

function encode(v: string): string {
  let out = ''
  for (const b of encoder.encode(v)) {
    const c = String.fromCharCode(b)
    out += /[A-Za-z0-9\-._~]/.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, '0')}`
  }
  return out
}

export class IntentError extends Error {}

export function fillIntent(template: string, values: Readonly<Record<string, string>>): string {
  let out = ''
  let rest = template
  for (;;) {
    const open = rest.indexOf('{')
    if (open < 0) break
    out += rest.slice(0, open)
    const after = rest.slice(open + 1)
    const close = after.indexOf('}')
    if (close < 0) throw new IntentError('the template is malformed')
    const name = after.slice(0, close)
    const v = values[name] ?? ''
    if (name === 'target_base') {
      if (!v.startsWith('https://') || /\s/.test(v)) throw new IntentError('target_base must be an https URL without spaces')
      out += v.replace(/\/+$/, '')
    } else {
      out += encode(v)
    }
    rest = after.slice(close + 1)
  }
  out += rest
  if (!out.startsWith('https://')) throw new IntentError('the result is not an https URL')
  return out
}
