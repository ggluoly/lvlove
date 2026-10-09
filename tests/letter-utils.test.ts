import { describe, expect, it } from 'vitest'
import {
  compareLettersByDateDescending,
  isValidIsoDate,
  parseFrontmatter,
  parseLetterFilename,
  splitParagraphs,
} from '../scripts/letter-utils.mjs'

describe('信件文件名解析', () => {
  it('解析规范信件文件名', () => {
    const parsed = parseLetterFilename('001-想对你说的第一句话.md')
    expect(parsed?.order).toBe(1)
    expect(parsed?.slug).toBe('想对你说的第一句话')
  })

  it('拒绝不符合规则的文件名', () => {
    expect(parseLetterFilename('想对你说的第一句话.md')).toBeNull()
    expect(parseLetterFilename('001-想对你说的第一句话.txt')).toBeNull()
  })
})

describe('信件 frontmatter 解析', () => {
  it('解析 frontmatter 字段与正文', () => {
    const content = '---\ntitle: 晚风与路灯\ndate: 2026-09-24\nsignature: 写信的人\n---\n\n第一段。\n\n第二段。\n'
    const { data, body } = parseFrontmatter(content)
    expect(data).toMatchObject({ title: '晚风与路灯', date: '2026-09-24', signature: '写信的人' })
    expect(body).toBe('第一段。\n\n第二段。')
  })

  it('去除带引号的字段值两端引号', () => {
    const content = '---\ntitle: "带引号的标题"\ndate: 2026-09-20\n---\n\n正文内容。\n'
    const { data } = parseFrontmatter(content)
    expect(data.title).toBe('带引号的标题')
  })

  it('没有 frontmatter 时整体视为正文', () => {
    const { data, body } = parseFrontmatter('没有 frontmatter 的内容。')
    expect(data).toEqual({})
    expect(body).toBe('没有 frontmatter 的内容。')
  })
})

describe('日期校验', () => {
  it('接受合法的 ISO 日期', () => {
    expect(isValidIsoDate('2026-09-24')).toBe(true)
  })

  it('拒绝非法或不存在的日期', () => {
    expect(isValidIsoDate('2026-13-01')).toBe(false)
    expect(isValidIsoDate('2026-02-30')).toBe(false)
    expect(isValidIsoDate('not-a-date')).toBe(false)
    expect(isValidIsoDate(undefined)).toBe(false)
  })
})

describe('正文分段', () => {
  it('按空行拆分段落并合并单行换行', () => {
    const body = '第一行\n接着第一行。\n\n第二段。\n\n\n第三段。'
    expect(splitParagraphs(body)).toEqual([
      '第一行 接着第一行。',
      '第二段。',
      '第三段。',
    ])
  })

  it('忽略空白段落', () => {
    expect(splitParagraphs('\n\n  \n\n正文。\n\n')).toEqual(['正文。'])
  })
})

describe('信件排序', () => {
  it('按日期倒序排列，日期相同时按顺序号倒序', () => {
    const letters = [
      { id: '001', order: 1, date: '2026-09-20' },
      { id: '002', order: 2, date: '2026-09-24' },
      { id: '003', order: 3, date: '2026-09-24' },
    ]
    expect(letters.sort(compareLettersByDateDescending).map((letter) => letter.id)).toEqual([
      '003',
      '002',
      '001',
    ])
  })
})
