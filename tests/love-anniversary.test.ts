import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getShanghaiDateParts, isLoveAnniversary, millisecondsUntilNextShanghaiDate, watchLoveAnniversary } from '../src/utils/love-anniversary'

describe('中国时区恋爱纪念日', () => {
  it('严格按 Asia/Shanghai 判断 9 月 25 日，而不是设备本地日期', () => {
    expect(isLoveAnniversary(new Date('2026-09-24T15:59:00.000Z'))).toBe(false)
    expect(isLoveAnniversary(new Date('2026-09-24T16:00:00.000Z'))).toBe(true)
    expect(isLoveAnniversary(new Date('2026-09-25T04:00:00.000Z'))).toBe(true)
    expect(isLoveAnniversary(new Date('2026-09-25T15:59:59.999Z'))).toBe(true)
    expect(isLoveAnniversary(new Date('2026-09-25T16:00:00.000Z'))).toBe(false)
  })

  it('每年 9 月 25 日都生效，其他月份不会触发', () => {
    expect(isLoveAnniversary(new Date('2027-09-24T16:00:00.000Z'))).toBe(true)
    expect(isLoveAnniversary(new Date('2028-02-24T16:00:00.000Z'))).toBe(false)
  })

  it('提取的日期始终是中国标准时间日期', () => {
    expect(getShanghaiDateParts(new Date('2026-09-24T16:00:00.000Z'))).toEqual({ year: '2026', month: '09', day: '25' })
  })

  it('计算至下一次中国日期切换的时间', () => {
    expect(millisecondsUntilNextShanghaiDate(new Date('2026-09-24T15:59:30.000Z'))).toBe(30_000)
    expect(millisecondsUntilNextShanghaiDate(new Date('2026-09-25T15:59:59.999Z'))).toBe(1)
  })

  it.each([
    ['2026-09-24T23:59:00+08:00', false],
    ['2026-09-24T23:59:59.999+08:00', false],
    ['2026-09-25T00:00:00+08:00', true],
    ['2026-09-25T12:00:00+08:00', true],
    ['2026-09-25T23:59:00+08:00', true],
    ['2026-09-25T23:59:59.999+08:00', true],
    ['2026-09-26T00:00:00+08:00', false],
    ['2026-10-25T12:00:00+08:00', false],
    ['2025-09-25T12:00:00+08:00', true],
    ['2032-09-25T12:00:00+08:00', true],
    ['2026-09-24T09:00:00-07:00', true],
    ['2026-09-25T09:00:00-07:00', false],
    ['2026-09-24T18:00:00+02:00', true],
  ])('时刻 %s 的判定为 %s', (time, expected) => {
    expect(isLoveAnniversary(new Date(time))).toBe(expected)
  })

  it('下一次中国午夜支持跨年、月底及闰日', () => {
    for (const time of ['2026-12-31T23:59:59.999+08:00', '2028-02-29T23:59:59.999+08:00', '2026-09-30T23:59:59.999+08:00']) {
      expect(millisecondsUntilNextShanghaiDate(new Date(time))).toBe(1)
    }
    expect(millisecondsUntilNextShanghaiDate(new Date('2026-09-25T00:00:00+08:00'))).toBe(86_400_000)
  })
})

describe('纪念日监听的午夜切换与清理', () => {
  let page: EventTarget
  let tab: EventTarget
  let visibility: DocumentVisibilityState

  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-09-24T23:59:59.999+08:00'))
    visibility = 'visible'
    tab = new EventTarget()
    page = new EventTarget()
    Object.defineProperty(tab, 'visibilityState', { get: () => visibility })
    Object.assign(page, { setTimeout, clearTimeout })
    vi.stubGlobal('document', tab)
    vi.stubGlobal('window', page)
  })

  afterEach(() => {
    vi.clearAllTimers()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  it('保持首页打开，00:00 开启、次日 00:00 关闭，无额外延迟', () => {
    const changed = vi.fn()
    const stop = watchLoveAnniversary(changed)
    expect(changed).toHaveBeenLastCalledWith(false)
    expect(vi.getTimerCount()).toBe(1)
    vi.advanceTimersByTime(1)
    expect(changed).toHaveBeenLastCalledWith(true)
    vi.advanceTimersByTime(86_399_999)
    expect(changed).toHaveBeenCalledTimes(2)
    vi.advanceTimersByTime(1)
    expect(changed.mock.calls.map(([value]) => value)).toEqual([false, true, false])
    expect(vi.getTimerCount()).toBe(1)
    stop()
    expect(vi.getTimerCount()).toBe(0)
  })

  it('后台改为 15 分钟检查，但仍在中国午夜准点检测', () => {
    vi.setSystemTime(new Date('2026-09-25T12:00:00+08:00'))
    const schedule = vi.spyOn(window, 'setTimeout')
    const changed = vi.fn()
    const stop = watchLoveAnniversary(changed)
    expect(schedule.mock.calls.at(-1)?.[1]).toBe(60_000)
    visibility = 'hidden'
    tab.dispatchEvent(new Event('visibilitychange'))
    expect(schedule.mock.calls.at(-1)?.[1]).toBe(900_000)
    vi.setSystemTime(new Date('2026-09-25T23:59:59.999+08:00'))
    tab.dispatchEvent(new Event('visibilitychange'))
    expect(schedule.mock.calls.at(-1)?.[1]).toBe(1)
    vi.advanceTimersByTime(1)
    expect(changed).toHaveBeenLastCalledWith(false)
    stop()
  })

  it('恢复前台、focus、pageshow 时立即纠正暂停期间的时间变化', () => {
    visibility = 'hidden'
    const changed = vi.fn()
    const stop = watchLoveAnniversary(changed)
    vi.setSystemTime(new Date('2026-09-25T12:00:00+08:00'))
    visibility = 'visible'
    tab.dispatchEvent(new Event('visibilitychange'))
    expect(changed).toHaveBeenLastCalledWith(true)
    vi.setSystemTime(new Date('2026-09-26T00:00:00+08:00'))
    page.dispatchEvent(new Event('focus'))
    expect(changed).toHaveBeenLastCalledWith(false)
    vi.setSystemTime(new Date('2027-09-25T12:00:00+08:00'))
    page.dispatchEvent(new Event('pageshow'))
    expect(changed).toHaveBeenLastCalledWith(true)
    expect(vi.getTimerCount()).toBe(1)
    stop()
  })

  it('重复事件不叠加定时器，严格模式重挂载与卸载均清理资源', () => {
    const changed = vi.fn()
    const stop = watchLoveAnniversary(changed)
    stop()
    const cleanup = watchLoveAnniversary(changed)
    for (let i = 0; i < 5; i += 1) {
      tab.dispatchEvent(new Event('visibilitychange'))
      page.dispatchEvent(new Event('focus'))
    }
    expect(vi.getTimerCount()).toBe(1)
    const removeTab = vi.spyOn(tab, 'removeEventListener')
    const removePage = vi.spyOn(page, 'removeEventListener')
    cleanup()
    expect(removeTab).toHaveBeenCalledWith('visibilitychange', expect.any(Function))
    expect(removePage).toHaveBeenCalledWith('focus', expect.any(Function))
    expect(removePage).toHaveBeenCalledWith('pageshow', expect.any(Function))
    expect(vi.getTimerCount()).toBe(0)
    const calls = changed.mock.calls.length
    vi.setSystemTime(new Date('2026-09-25T12:00:00+08:00'))
    tab.dispatchEvent(new Event('visibilitychange'))
    page.dispatchEvent(new Event('focus'))
    page.dispatchEvent(new Event('pageshow'))
    vi.advanceTimersByTime(86_400_000)
    expect(changed).toHaveBeenCalledTimes(calls)
    expect(vi.getTimerCount()).toBe(0)
  })
})
