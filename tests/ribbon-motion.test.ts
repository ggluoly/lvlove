import { describe, expect, it } from 'vitest'
import { getRibbonGeometry, ribbonCenter } from '../src/utils/ribbon-motion'

describe('柔性彩带的连续带面', () => {
  it('相邻帧带身会变形，带尾在带头回转后继续跟随', () => {
    const first = getRibbonGeometry(1, 0)
    const next = getRibbonGeometry(1.1, 0)
    expect(next.surface).not.toBe(first.surface)
    expect(next.highlight).not.toBe(first.highlight)
    expect(ribbonCenter(0, 1.1, 0).x).toBeLessThan(ribbonCenter(0, 1, 0).x)
    expect(ribbonCenter(1, 1.1, 0).x).toBeGreaterThan(ribbonCenter(1, 1, 0).x)
  })

  it('不同种子错开形态，同一时刻可重复生成相同几何', () => {
    expect(getRibbonGeometry(2, 1.37)).toEqual(getRibbonGeometry(2, 1.37))
    expect(getRibbonGeometry(2, 0).surface).not.toBe(getRibbonGeometry(2, 1.37).surface)
  })

  it('持续变形的曲线有界、宽度始终为正，首尾不会抽成尖结', () => {
    let invalidPaths = 0
    let invalidOrder = 0
    let minX = Infinity
    let maxX = -Infinity
    let minY = Infinity
    let maxY = -Infinity
    let minWidth = Infinity
    let maxWidth = -Infinity
    for (const seed of [0, 2.74, 5.48, 9.59]) {
      for (const time of [0, 1.5, 4.25, 8.75, 15.5, 23.25, 30]) {
        const frame = getRibbonGeometry(time, seed * 1.37)
        for (const path of [frame.surface, frame.highlight, frame.edge]) {
          if (/NaN|Infinity/.test(path) || !path.startsWith('M')) invalidPaths += 1
        }
        if (!frame.surface.endsWith('Z') || !frame.highlight.endsWith('Z')) invalidPaths += 1
        for (let i = 0; i < frame.center.length; i += 1) {
          const point = frame.center[i]
          minX = Math.min(minX, point.x)
          maxX = Math.max(maxX, point.x)
          minY = Math.min(minY, point.y)
          maxY = Math.max(maxY, point.y)
          minWidth = Math.min(minWidth, frame.widths[i])
          maxWidth = Math.max(maxWidth, frame.widths[i])
          if (i > 0 && point.y >= frame.center[i - 1].y) invalidOrder += 1
        }
      }
    }
    expect(invalidPaths).toBe(0)
    expect(invalidOrder).toBe(0)
    expect(minX).toBeGreaterThan(15)
    expect(maxX).toBeLessThan(125)
    expect(minY).toBeGreaterThanOrEqual(20)
    expect(maxY).toBeLessThanOrEqual(260)
    expect(minWidth).toBeGreaterThan(1)
    expect(maxWidth).toBeLessThanOrEqual(8.25)
  })

  it('30fps 下每个点的帧间位移平缓，不突然跳到另一条曲线', () => {
    for (let time = 0; time < 16; time += .1) {
      const first = getRibbonGeometry(time, 2.74).center
      const next = getRibbonGeometry(time + 1 / 30, 2.74).center
      expect(Math.max(...first.map((point, index) => Math.hypot(point.x - next[index].x, point.y - next[index].y)))).toBeLessThan(2.8)
    }
  })
})
