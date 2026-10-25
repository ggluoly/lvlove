export interface RibbonPoint {
  x: number
  y: number
}

// A traveling wave reaches the tail later than the leading end (s = 0).
export function ribbonCenter(s: number, seconds: number, seed: number): RibbonPoint {
  const delayedTime = seconds - s * .85
  return {
    x: 70 + Math.sin(delayedTime * 1.7 + seed) * (10 + 24 * s)
      + Math.sin(s * 7.2 - seconds * 1.1 + seed * .7) * 20 * s,
    y: 260 - 240 * s,
  }
}

function smoothPath(points: RibbonPoint[]) {
  const coordinate = (n: number) => n.toFixed(2)
  let path = `M${coordinate(points[0].x)},${coordinate(points[0].y)}`
  for (let i = 0; i < points.length - 1; i += 1) {
    const previous = points[Math.max(0, i - 1)]
    const current = points[i]
    const next = points[i + 1]
    const after = points[Math.min(points.length - 1, i + 2)]
    path += `C${coordinate(current.x + (next.x - previous.x) / 6)},${coordinate(current.y + (next.y - previous.y) / 6)} ${coordinate(next.x - (after.x - current.x) / 6)},${coordinate(next.y - (after.y - current.y) / 6)} ${coordinate(next.x)},${coordinate(next.y)}`
  }
  return path
}

export function getRibbonGeometry(seconds: number, seed = 0) {
  const center = Array.from({ length: 25 }, (_, i) => ribbonCenter(i / 24, seconds, seed))
  const widths: number[] = []
  const normals = center.map((point, i) => {
    const before = center[Math.max(0, i - 1)]
    const after = center[Math.min(center.length - 1, i + 1)]
    const length = Math.hypot(after.x - before.x, after.y - before.y)
    const s = i / 24
    // Never turn fully edge-on; taper smoothly rather than forming pinched knots.
    widths.push(8.25 * (1 - .48 * s * s) * (.72 + .28 * Math.cos(seconds * .8 - s * 3.8 + seed) ** 2))
    return { x: -(after.y - before.y) / length, y: (after.x - before.x) / length, center: point }
  })
  const edge = (factor: number) => normals.map((normal, i) => ({
    x: normal.center.x + normal.x * widths[i] * factor,
    y: normal.center.y + normal.y * widths[i] * factor,
  }))
  const closedStrip = (a: RibbonPoint[], b: RibbonPoint[]) => `${smoothPath(a)}${smoothPath([...b].reverse()).replace(/^M/, 'L')}Z`
  return {
    center,
    widths,
    surface: closedStrip(edge(-1), edge(1)),
    highlight: closedStrip(edge(-.4), edge(.04)),
    edge: smoothPath(edge(-.92)),
  }
}
