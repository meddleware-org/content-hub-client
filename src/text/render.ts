// Renderers (port of render.rs): the canonical format to each platform's payload, plus the visible text the
// platform counts (different from the payload only for Telegram HTML).
//
// Role: a person previews a post as each platform will receive it. The payload (what is sent) and the visible text (what a reader sees, and what most platforms count) are built in one pass
// from the same tokens, so they cannot disagree. Escaping matters: in Markdown and Telegram HTML a character in the post could otherwise be read as markup. Main exports: `render`,
// `renderSource`. Tested in `tests/text.test.ts` and `tests/vectors.test.ts` (the vectors pin the Rust renderer too).

import type { Markup } from '../model.js'
import { parse, type Spanned } from './markup.js'

/** A post rendered for one platform. */
export interface Rendered {
  /** What is sent to the platform. */
  payload: string
  /** What a reader sees (the payload without markup that the platform interprets: only Telegram HTML differs). */
  visible: string
}

/** Backslash-escape the characters Markdown would read as markup. */
const escapeMarkdown = (s: string): string => Array.from(s).map((c) => ('\\*_`[]'.includes(c) ? `\\${c}` : c)).join('')

/** Escape the characters HTML (Telegram) would read as markup: `& < > "`. */
const escapeHtml = (s: string): string =>
  Array.from(s)
    .map((c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : c))
    .join('')

/** Render parsed tokens for `markup`. Plain text keeps the words and drops the marks; Markdown and Discord use `**` and `*`; Telegram uses `<b>` `<i>` `<code>` `<a>`; BBCode uses `[b]` `[i]` `[code]` `[url]`. */
export function render(markup: Markup, tokens: Spanned[]): Rendered {
  let payload = ''
  let visible = ''
  // Markdown and Discord Markdown share their marks.
  const md = markup === 'markdown' || markup === 'discord_md'
  for (const { token: t } of tokens) {
    switch (t.kind) {
      // Text is escaped in the payload for the markups that read characters as syntax, and kept as it is in the visible text.
      case 'text':
        payload += md ? escapeMarkdown(t.text) : markup === 'telegram_html' ? escapeHtml(t.text) : t.text
        visible += t.text
        break
      case 'strongOpen':
      case 'strongClose':
      case 'emphOpen':
      case 'emphClose': {
        // Which of the four tokens this is: opening or closing, strong or emphasis.
        const open = t.kind === 'strongOpen' || t.kind === 'emphOpen'
        const strong = t.kind === 'strongOpen' || t.kind === 'strongClose'
        let mark = ''
        if (md) mark = strong ? '**' : '*'
        else if (markup === 'telegram_html') mark = `<${open ? '' : '/'}${strong ? 'b' : 'i'}>`
        else if (markup === 'bbcode') mark = `[${open ? '' : '/'}${strong ? 'b' : 'i'}]`
        payload += mark
        // Telegram interprets its tags, so a reader does not see them; for the others the marks are part of what is seen.
        if (markup !== 'telegram_html') visible += mark
        break
      }
      // Code: backticks in Markdown, `<code>` in Telegram, `[code]` in BBCode.
      case 'code':
        if (md) {
          payload += `\`${t.text}\``
          visible += `\`${t.text}\``
        } else if (markup === 'telegram_html') {
          payload += `<code>${escapeHtml(t.text)}</code>`
          visible += t.text
        } else if (markup === 'bbcode') {
          payload += `[code]${t.text}[/code]`
          visible += `[code]${t.text}[/code]`
        } else {
          // Plain text has no code formatting: the text is kept as it is.
          payload += t.text
          visible += t.text
        }
        break
      // A link: Markdown keeps the link syntax, Telegram makes an anchor, BBCode a `[url]`; plain text shows `text (url)` unless they are the same.
      case 'link':
        if (md) {
          const x = `[${escapeMarkdown(t.text)}](${t.url})`
          payload += x
          visible += x
        } else if (markup === 'telegram_html') {
          payload += `<a href="${escapeHtml(t.url)}">${escapeHtml(t.text)}</a>`
          visible += t.text
        } else if (markup === 'bbcode') {
          const x = `[url=${t.url}]${t.text}[/url]`
          payload += x
          visible += x
        } else {
          const x = t.text === t.url ? t.url : `${t.text} (${t.url})`
          payload += x
          visible += x
        }
        break
      // A bare URL is kept as it is (escaped only for HTML).
      case 'url':
        payload += markup === 'telegram_html' ? escapeHtml(t.url) : t.url
        visible += t.url
        break
      // Breaks are newlines in every markup.
      case 'lineBreak':
        payload += '\n'
        visible += '\n'
        break
      case 'paragraphBreak':
        payload += '\n\n'
        visible += '\n\n'
        break
      // A bullet is `- ` in Markdown and a bullet character elsewhere.
      case 'bullet': {
        const b = md ? '- ' : '• '
        payload += b
        visible += b
        break
      }
    }
  }
  // Both strings were built together, so they describe the same post.
  return { payload, visible }
}

/** Parse `source` and render it for `markup` in one call. */
export const renderSource = (markup: Markup, source: string): Rendered => render(markup, parse(source))
