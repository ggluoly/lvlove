import { useId } from 'react'
import { getRibbonGeometry } from '../utils/ribbon-motion'

export type RibbonTone = 'rose' | 'gold' | 'peach' | 'berry'

const palettes = {
  rose: ['#bc728c', '#e9a9bc', '#ffe7df', '#ce8ba4'],
  gold: ['#c49764', '#e9c795', '#fff0ce', '#d3ac76'],
  peach: ['#d39085', '#f0bdac', '#fff0e0', '#dda392'],
  berry: ['#a56281', '#d597b1', '#f9d9e4', '#ba7e9c'],
} as const

interface AnniversaryRibbonProps {
  tone: RibbonTone
  seed: number
}

export function AnniversaryRibbon({ tone, seed }: AnniversaryRibbonProps) {
  const id = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const [edge, face, light, shade] = palettes[tone]
  const geometry = getRibbonGeometry(0, seed)

  return <svg className="anniversary-ribbon__art" viewBox="0 0 140 280" aria-hidden="true" focusable="false" data-ribbon-seed={seed}>
      <defs>
        <linearGradient id={`${id}-face`} x1="0" y1="0" x2=".85" y2="1">
          <stop stopColor={face} /><stop offset=".22" stopColor={light} />
          <stop offset=".45" stopColor={shade} /><stop offset=".7" stopColor={face} />
          <stop offset="1" stopColor={light} />
        </linearGradient>
        <linearGradient id={`${id}-sheen`} x1="0" y1="0" x2="0" y2="1">
          <stop stopColor={light} stopOpacity=".12" /><stop offset=".3" stopColor={light} stopOpacity=".65" />
          <stop offset=".6" stopColor={light} stopOpacity=".08" /><stop offset="1" stopColor={light} stopOpacity=".5" />
        </linearGradient>
      </defs>
      <path data-ribbon-surface d={geometry.surface} fill={`url(#${id}-face)`} stroke={edge} strokeOpacity=".35" strokeWidth=".6" />
      <path data-ribbon-highlight d={geometry.highlight} fill={`url(#${id}-sheen)`} />
      <path data-ribbon-edge d={geometry.edge} fill="none" stroke={light} strokeOpacity=".65" strokeWidth=".8" />
    </svg>
}
