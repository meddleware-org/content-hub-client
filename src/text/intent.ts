// Manual-assist links (port of intent.rs): fill a definition's URL template. Values are percent-encoded per
// RFC 3986 (only unreserved characters stay literal); {target_base} must be an https URL and is inserted as is.
//
// Role: for a platform with no posting API the hub opens a pre-filled "compose" page; the link is built from a template in the platform's definition. Every value is percent-encoded so text in a post
// can never add a parameter or change the host, and the result must be an https URL. Main exports: `fillIntent`, `IntentError`. Tested in `tests/text.test.ts`.

/** The UTF-8 encoder (percent-encoding works on bytes). */

const encoder = new TextEncoder()

/** Percent-encode `v` per RFC 3986: unreserved characters stay, every other byte becomes `%XX` (upper-case hex). */
function encode(v: string): string {
  let out = ''
  // Per byte of the UTF-8 form, so a multi-byte character becomes several escapes.
  for (const b of encoder.encode(v)) {
    const c = String.fromCharCode(b)
    out += /[A-Za-z0-9\-._~]/.test(c) ? c : `%${b.toString(16).toUpperCase().padStart(2, '0')}`
  }
  return out
}

/** Thrown when a template or a value cannot produce a safe link. */
export class IntentError extends Error {}

/**
 * Fill `template` (text with `{name}` placeholders) from `values`. A missing value is empty. `{target_base}` must be an https URL without spaces and is inserted with trailing slashes removed;
 * every other value is percent-encoded.
 *
 * @throws {IntentError} for a malformed template, a bad `target_base`, or a result that is not an https URL.
 */
export function fillIntent(template: string, values: Readonly<Record<string, string>>): string {
  // Walk the template: copy text up to each `{`, fill the placeholder, continue after its `}`.
  let out = ''
  let rest = template
  for (;;) {
    const open = rest.indexOf('{')
    if (open < 0) break
    out += rest.slice(0, open)
    const after = rest.slice(open + 1)
    const close = after.indexOf('}')
    // An unclosed `{` is a template error, not text.
    if (close < 0) throw new IntentError('the template is malformed')
    const name = after.slice(0, close)
    const v = values[name] ?? ''
    // The one placeholder that is a URL, not a value: it must be https (a `javascript:` or `http:` base is refused) and is not encoded.
    if (name === 'target_base') {
      if (!v.startsWith('https://') || /\s/.test(v)) throw new IntentError('target_base must be an https URL without spaces')
      out += v.replace(/\/+$/, '')
    } else {
      out += encode(v)
    }
    rest = after.slice(close + 1)
  }
  out += rest
  // The final check: whatever the template did, the result must be an https URL.
  if (!out.startsWith('https://')) throw new IntentError('the result is not an https URL')
  return out
}
