import { describe, expect, it } from 'vitest'
import { compareByCapturedAtDescending, parseDateFromFilename, parseStandardFilename } from '../scripts/photo-utils.mjs'
import type { Photo } from '../src/types/photo'
import { groupPhotosByYearAndMonth, mergePhotoMetadata } from '../src/utils/photos'

describe('照片文件名解析', () => {
  it('解析规范文件名', () => {
    const parsed = parseStandardFilename('20260925001.jpg')
    expect(parsed?.date.getFullYear()).toBe(2026)
    expect(parsed?.date.getMonth()).toBe(8)
    expect(parsed?.date.getDate()).toBe(25)
    expect(parsed?.sequence).toBe(1)
  })

  it('解析相机文件名时间', () => {
    const parsed = parseDateFromFilename('IMG_20260925_203432.jpg')
    expect(parsed?.date.getHours()).toBe(20)
    expect(parsed?.date.getMinutes()).toBe(34)
    expect(parsed?.date.getSeconds()).toBe(32)
  })

  it('解析导出图片的毫秒时间戳', () => {
    const parsed = parseDateFromFilename('mmexport1790490931415.jpg')
    expect(parsed?.source).toBe('export-timestamp')
    expect(parsed?.date.getTime()).toBe(1790490931415)
  })

  it('按精确时间和标识稳定倒序排序', () => {
    const records = [
      { id: '20260925001', capturedAt: '2026-09-25T20:00:00+08:00' },
      { id: '20260925002', capturedAt: '2026-09-25T20:00:00+08:00' },
      { id: '20260926001', capturedAt: '2026-09-26T20:00:00+08:00' },
    ]
    expect(records.sort(compareByCapturedAtDescending).map((record) => record.id)).toEqual([
      '20260926001',
      '20260925002',
      '20260925001',
    ])
  })
})

describe('照片前端数据处理', () => {
  const photo = (id: string, year: number, month: number, capturedAt: string): Photo => ({
    id,
    source: `photos/${id}.jpg`,
    date: `${year}-${String(month).padStart(2, '0')}-01`,
    capturedAt,
    dateSource: 'filename',
    year,
    month,
    day: 1,
    width: 100,
    height: 100,
    title: id,
    location: null,
    album: '未分类',
    tags: [],
    placeholder: '',
    sources: { avif: [], webp: [] },
    sha256: '',
  })

  it('按年份和月份保留已排序照片的分组顺序', () => {
    const result = groupPhotosByYearAndMonth([
      photo('20260901001', 2026, 9, '2026-09-01T00:00:00+08:00'),
      photo('20260801001', 2026, 8, '2026-08-01T00:00:00+08:00'),
      photo('20251201001', 2025, 12, '2025-12-01T00:00:00+08:00'),
    ])
    expect(result.map((entry) => entry.year)).toEqual([2026, 2025])
    expect(result[0].months.map((entry) => entry.month)).toEqual([9, 8])
  })

  it('合并元数据时保留未覆写字段并清理标签空白', () => {
    const result = mergePhotoMetadata(photo('20260901001', 2026, 9, '2026-09-01T00:00:00+08:00'), {
      title: '  夜色  ', tags: [' street ', ''], album: 'Life',
    })
    expect(result).toMatchObject({ title: '夜色', album: 'Life', location: null, tags: ['street'] })
  })
})
