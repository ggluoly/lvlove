import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { LetterContent } from '../src/components/LetterContent'
import { parseFrontmatter } from '../scripts/letter-utils.mjs'

describe('信件富文本', () => {
  it('从 Markdown 源文件到阅读组件保留换行、段落和强调', () => {
    const { body } = parseFrontmatter('---\ntitle: 一封信\ndate: 2026-09-24\n---\n\n第一行\n第二行，**认真记得**。\n\n*轻轻说*。')
    const html = renderToStaticMarkup(<LetterContent content={body} />)
    expect(html).toContain('第一行<br/>')
    expect(html).toContain('<strong>认真记得</strong>')
    expect(html).toContain('<p><em>轻轻说</em>。</p>')
  })

  it('支持引用、列表、链接和本地照片', () => {
    const html = renderToStaticMarkup(<LetterContent content={'> 留给你\n\n- 晚风\n- 路灯\n\n[链接](https://example.com)\n\n![一张照片](photos/20260925001.jpg)'} />)
    expect(html).toContain('<blockquote>')
    expect(html).toContain('<ul>')
    expect(html).toContain('href="https://example.com"')
    expect(html).toContain('src="/photos/20260925001.jpg"')
    expect(html).toContain('alt="一张照片"')
  })

  it('不执行原始 HTML，且拒绝脚本 URL', () => {
    const html = renderToStaticMarkup(<LetterContent content={'<script>alert(1)</script>\n\n[不要执行](javascript:alert)\n\n![图片](javascript:alert)'} />)
    expect(html).not.toContain('<script')
    expect(html).not.toContain('javascript:')
  })
})
