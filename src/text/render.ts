// Renderers (port of render.rs): the canonical format to each platform's payload, plus the visible text the
// platform counts (different from the payload only for Telegram HTML).

import type { Markup } from '../model.js'
import { parse, type Spanned } from './markup.js'

export interface Rendered {
  payload: string
  visible: string
}

const escapeMarkdown = (s: string): string => Array.from(s).map((c) => ('\\*_`[]'.includes(c) ? `\\${c}` : c)).join('')

const escapeHtml = (s: string): string =>
  Array.from(s)
    .map((c) => (c === '&' ? '&amp;' : c === '<' ? '&lt;' : c === '>' ? '&gt;' : c === '"' ? '&quot;' : c))
    .join('')

export function render(markup: Markup, tokens: Spanned[]): Rendered {
  let payload = ''
  let visible = ''
  const md = markup === 'markdown' || markup === 'discord_md'
  for (const { token: t } of tokens) {
    switch (t.kind) {
      case 'text':
        payload += md ? escapeMarkdown(t.text) : markup === 'telegram_html' ? escapeHtml(t.text) : t.text
        visible += t.text
        break
      case 'strongOpen':
      case 'strongClose':
      case 'emphOpen':
      case 'emphClose': {
        const open = t.kind === 'strongOpen' || t.kind === 'emphOpen'
        const strong = t.kind === 'strongOpen' || t.kind === 'strongClose'
        let mark = ''
        if (md) mark = strong ? '**' : '*'
        else if (markup === 'telegram_html') mark = `<${open ? '' : '/'}${strong ? 'b' : 'i'}>`
        else if (markup === 'bbcode') mark = `[${open ? '' : '/'}${strong ? 'b' : 'i'}]`
        payload += mark
        if (markup !== 'telegram_html') visible += mark
        break
      }
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
          payload += t.text
          visible += t.text
        }
        break
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
      case 'url':
        payload += markup === 'telegram_html' ? escapeHtml(t.url) : t.url
        visible += t.url
        break
      case 'lineBreak':
        payload += '\n'
        visible += '\n'
        break
      case 'paragraphBreak':
        payload += '\n\n'
        visible += '\n\n'
        break
      case 'bullet': {
        const b = md ? '- ' : '• '
        payload += b
        visible += b
        break
      }
    }
  }
  return { payload, visible }
}

export const renderSource = (markup: Markup, source: string): Rendered => render(markup, parse(source))
