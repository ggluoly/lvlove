export interface ShanghaiDateParts {
  year: string
  month: string
  day: string
}

const shanghaiDateFormatter = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Shanghai',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
})

export function getShanghaiDateParts(date = new Date()): ShanghaiDateParts {
  const values = Object.fromEntries(
    shanghaiDateFormatter
      .formatToParts(date)
      .filter((part) => part.type !== 'literal')
      .map((part) => [part.type, part.value]),
  )

  return {
    year: values.year,
    month: values.month,
    day: values.day,
  }
}

export function isLoveAnniversary(date = new Date()) {
  const { month, day } = getShanghaiDateParts(date)
  return month === '09' && day === '25'
}

export function millisecondsUntilNextShanghaiDate(date = new Date()) {
  const { year, month, day } = getShanghaiDateParts(date)
  // China is UTC+8, so its following midnight is 16:00 UTC on the current Shanghai date.
  const nextShanghaiMidnight = Date.UTC(Number(year), Number(month) - 1, Number(day) + 1) - 8 * 60 * 60 * 1000
  return Math.max(0, nextShanghaiMidnight - date.getTime())
}

export function watchLoveAnniversary(onChange: (isAnniversary: boolean) => void) {
  let timer: number | undefined
  let disposed = false
  let previous: boolean | undefined

  const refresh = () => {
    if (disposed) return
    window.clearTimeout(timer)
    const now = new Date()
    const current = isLoveAnniversary(now)
    if (current !== previous) {
      previous = current
      onChange(current)
    }

    // One timer: a low-frequency clock-change check, shortened to the exact China midnight.
    const interval = document.visibilityState === 'hidden' ? 15 * 60_000 : 60_000
    const delay = Math.max(1, Math.min(interval, millisecondsUntilNextShanghaiDate(now)))
    timer = window.setTimeout(refresh, delay)
  }

  refresh()
  document.addEventListener('visibilitychange', refresh)
  window.addEventListener('focus', refresh)
  window.addEventListener('pageshow', refresh)

  return () => {
    disposed = true
    window.clearTimeout(timer)
    document.removeEventListener('visibilitychange', refresh)
    window.removeEventListener('focus', refresh)
    window.removeEventListener('pageshow', refresh)
  }
}
