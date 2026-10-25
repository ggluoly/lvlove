import { useEffect, useId, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import { AnniversaryRibbon } from './AnniversaryRibbon'
import type { RibbonTone } from './AnniversaryRibbon'
import { getRibbonGeometry } from '../utils/ribbon-motion'

// Stable positions avoid rearranging particles on date checks or other rerenders.
const ribbons = [6, 22, 35, 48, 63, 76, 87, 95]
const petals = [6, 16, 29, 43, 64, 77, 89, 96]
const hearts = [4, 14, 26, 46, 66, 80, 91, 97]
const sparkles = [[7, 18], [20, 30], [32, 12], [48, 24], [58, 10], [68, 37], [84, 13], [94, 29], [6, 67], [92, 57], [96, 77], [66, 70]]
const openingPieces = [8, 25, 73, 92]
const ribbonTones: RibbonTone[] = ['rose', 'gold', 'peach', 'berry', 'gold', 'peach']
const heartPath = 'M50 24C36 6 10 12 10 34C10 55 37 75 50 85C63 75 90 55 90 34C90 12 64 6 50 24Z'

function cssVars(values: Record<string, string>) {
  return values as CSSProperties
}

export function AnniversaryEffects() {
  const reducedMotion = useReducedMotion()
  const layer = useRef<HTMLDivElement>(null)
  const [openingComplete, setOpeningComplete] = useState(false)
  const ribbonTime = useRef(0)
  const artworkId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  useEffect(() => {
    const element = layer.current
    if (!element) return
    let inView = false
    let frame: number | undefined
    let lastTime: number | undefined
    let lastDraw = 0
    let disposed = false
    const mobile = window.matchMedia('(max-width: 760px)')
    let ribbonNodes = [...element.querySelectorAll<SVGSVGElement>('[data-ribbon-seed]')].map((svg) => ({
      svg,
      seed: Number(svg.dataset.ribbonSeed),
      surface: svg.querySelector<SVGPathElement>('[data-ribbon-surface]')!,
      highlight: svg.querySelector<SVGPathElement>('[data-ribbon-highlight]')!,
      edge: svg.querySelector<SVGPathElement>('[data-ribbon-edge]')!,
      desktopOnly: !!svg.closest('.anniversary-effects__desktop-extra') || !!svg.closest('.anniversary-effects__opening-piece:nth-child(even)'),
    }))

    const draw = (now: number) => {
      frame = undefined
      if (disposed || document.hidden || !inView || reducedMotion) return
      if (lastTime !== undefined) ribbonTime.current += Math.min(now - lastTime, 100) / 1000
      lastTime = now
      if (now - lastDraw >= 1000 / 30) {
        lastDraw = now
        ribbonNodes = ribbonNodes.filter((node) => node.svg.isConnected)
        for (const node of ribbonNodes) {
          if (mobile.matches && node.desktopOnly) continue
          const geometry = getRibbonGeometry(ribbonTime.current, node.seed)
          node.surface.setAttribute('d', geometry.surface)
          node.highlight.setAttribute('d', geometry.highlight)
          node.edge.setAttribute('d', geometry.edge)
        }
      }
      frame = window.requestAnimationFrame(draw)
    }

    const updatePlayback = () => {
      if (disposed) return
      const paused = document.hidden || !inView
      element.dataset.paused = String(paused)
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      frame = undefined
      lastTime = undefined
      if (!disposed && !paused && !reducedMotion) frame = window.requestAnimationFrame(draw)
    }
    const observer = new IntersectionObserver(([entry]) => {
      inView = entry.isIntersecting
      updatePlayback()
    })
    observer.observe(element)
    updatePlayback()
    document.addEventListener('visibilitychange', updatePlayback)
    return () => {
      disposed = true
      if (frame !== undefined) window.cancelAnimationFrame(frame)
      observer.disconnect()
      document.removeEventListener('visibilitychange', updatePlayback)
    }
  }, [reducedMotion])

  return (
    <div ref={layer} className={`anniversary-effects ${reducedMotion ? 'anniversary-effects--reduced' : ''}`} aria-hidden="true">
      <div className="anniversary-effects__ambience" />
      <div className="anniversary-effects__emblem">
        <svg className="anniversary-effects__double-heart" viewBox="0 0 250 185" focusable="false">
          <defs>
            <linearGradient id={`${artworkId}-rose`} x2=".8" y2="1">
              <stop stopColor="#ffe7da" /><stop offset=".35" stopColor="#e89aa9" /><stop offset="1" stopColor="#b65879" />
            </linearGradient>
            <linearGradient id={`${artworkId}-gold`} x2=".8" y2="1">
              <stop stopColor="#fff1cf" /><stop offset=".6" stopColor="#e9c08b" /><stop offset="1" stopColor="#cf8d83" />
            </linearGradient>
          </defs>
          <g className="anniversary-effects__heart-pair">
            <path d={heartPath} transform="translate(15 9) rotate(-12 50 50) scale(1.35)" fill={`url(#${artworkId}-rose)`} fillOpacity=".35" stroke={`url(#${artworkId}-rose)`} strokeWidth="3" />
            <path d={heartPath} transform="translate(86 30) rotate(12 50 50) scale(1.25)" fill={`url(#${artworkId}-gold)`} fillOpacity=".12" stroke={`url(#${artworkId}-gold)`} strokeWidth="2.4" />
            <path d="M41 49Q48 28 69 36 M124 68Q132 50 147 56" fill="none" stroke="#fff1d9" strokeWidth="2" strokeLinecap="round" opacity=".7" />
            <path d="M81 137Q120 146 178 137 M116 143C83 107 63 153 114 151C151 179 162 133 116 143 M117 149Q110 166 90 178 M122 151Q136 170 151 174" fill="none" stroke={`url(#${artworkId}-gold)`} strokeWidth="2" strokeLinecap="round" />
          </g>
          <path className="anniversary-effects__emblem-star" d="M211 15L213 22L220 24L213 26L211 33L209 26L202 24L209 22Z" fill="#ffe6b8" />
          <path className="anniversary-effects__emblem-star" d="M24 110L26 115L31 117L26 119L24 124L22 119L17 117L22 115Z" fill="#ffe0c6" />
        </svg>
      </div>
      <div className="anniversary-effects__particles">
        {ribbons.map((left, index) => (
          <span className={`anniversary-effects__particle anniversary-effects__ribbon ${index % 2 ? 'anniversary-effects__desktop-extra' : 'anniversary-effects__ribbon--foreground'}`} key={`ribbon-${index}`} style={cssVars({ '--celebrate-left': `${left}%`, '--celebrate-delay': `${-index * 1.7}s`, '--celebrate-duration': `${11 + index % 4 * 1.3}s`, '--celebrate-rotate': `${index % 2 ? 10 : -12}deg`, '--ribbon-height': `${index % 2 ? 168 + index % 3 * 12 : 218 + index % 3 * 12}px`, '--ribbon-opacity': index % 2 ? '.62' : '.9', '--celebrate-drift': `${index < 4 ? 54 : -54}px` })}>
            <AnniversaryRibbon tone={ribbonTones[index % 6]} seed={index * 1.37} />
          </span>
        ))}
        {petals.map((left, index) => (
          <span className={`anniversary-effects__particle anniversary-effects__petal anniversary-effects__tone--${index % 2 ? 'rose' : 'peach'} ${index % 2 ? 'anniversary-effects__desktop-extra' : ''}`} key={`petal-${index}`} style={cssVars({ '--celebrate-left': `${left}%`, '--celebrate-top': `${12 + index % 4 * 7}%`, '--celebrate-delay': `${-index * 2.1}s`, '--celebrate-duration': `${16 + index % 4 * 1.4}s`, '--celebrate-size': `${12 + index % 3 * 3}px`, '--celebrate-rotate': `${index * 27}deg`, '--celebrate-drift': `${index % 2 ? -35 : 35}px` })} />
        ))}
        {hearts.map((left, index) => (
          <span className={`anniversary-effects__particle anniversary-effects__heart anniversary-effects__tone--${index % 2 ? 'peach' : 'rose'} ${index % 2 ? 'anniversary-effects__desktop-extra' : ''}`} key={`heart-${index}`} style={cssVars({ '--celebrate-left': `${left}%`, '--celebrate-bottom': `${5 + index % 3 * 8}%`, '--celebrate-delay': `${-index * 1.7}s`, '--celebrate-duration': `${14 + index % 4 * 1.8}s`, '--celebrate-size': `${18 + index % 3 * 5}px`, '--celebrate-drift': `${index % 2 ? -18 : 18}px` })}>{index % 3 === 1 ? '♡' : '♥'}</span>
        ))}
        {sparkles.map(([left, top], index) => (
          <span className={`anniversary-effects__particle anniversary-effects__sparkle ${index % 2 ? 'anniversary-effects__desktop-extra' : ''}`} key={`sparkle-${index}`} style={cssVars({ '--celebrate-left': `${left}%`, '--celebrate-top': `${top}%`, '--celebrate-delay': `${-index * .7}s`, '--celebrate-duration': `${4.5 + index % 4}s`, '--celebrate-size': `${8 + index % 3 * 3}px` })}>{index % 3 ? '✦' : '•'}</span>
        ))}
        {!reducedMotion && !openingComplete && <div className="anniversary-effects__opening" onAnimationEnd={(event) => {
          if (event.target === event.currentTarget && event.animationName === 'anniversary-opening-finish') setOpeningComplete(true)
        }}>
          {openingPieces.map((left, index) => <span className="anniversary-effects__particle anniversary-effects__opening-piece" key={left} style={cssVars({ '--celebrate-left': `${left}%`, '--celebrate-delay': `${1.1 + index * .3}s`, '--celebrate-rotate': `${index % 2 ? 12 : -16}deg`, '--ribbon-height': `${245 + index % 2 * 16}px`, '--celebrate-drift': `${index < 2 ? 90 : -90}px` })}>
            <AnniversaryRibbon tone={index % 2 ? 'gold' : 'rose'} seed={index * 1.8 + .6} />
          </span>)}
        </div>}
      </div>
    </div>
  )
}
