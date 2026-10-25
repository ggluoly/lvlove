import { ArrowDownRight } from 'lucide-react'
import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../data/site-config'
import { AnniversaryEffects } from './AnniversaryEffects'
import { useLoveAnniversary } from '../hooks/useLoveAnniversary'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Photo } from '../types/photo'
import { assetUrl } from '../utils/url'

interface HeroProps {
  photos: Photo[]
}

export function Hero({ photos }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const isAnniversary = useLoveAnniversary()
  const today = new Date()
  const todayAtMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  const togetherSince = new Date(2026, 8, 25)
  const daysTogether = Math.max(1, Math.floor((todayAtMidnight.getTime() - togetherSince.getTime()) / 86_400_000) + 1)
  const latest = photos[0]
  const previous = photos[1]
  const years = new Set(photos.map((photo) => photo.year))
  const albums = new Set(photos.map((photo) => photo.album))
  const yearRange = years.size ? `${Math.min(...years)} - ${new Date().getFullYear()}` : '等待第一张照片'
  const backgroundImage = latest ? assetUrl(latest.sources.webp.at(-1) ?? latest.source) : undefined
  const updateParallax = (event: PointerEvent<HTMLElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const horizontal = (event.clientX - bounds.left) / bounds.width - 0.5
    const vertical = (event.clientY - bounds.top) / bounds.height - 0.5
    sectionRef.current?.style.setProperty('--hero-x', `${horizontal * 14}px`)
    sectionRef.current?.style.setProperty('--hero-y', `${vertical * 10}px`)
  }
  const resetParallax = () => {
    sectionRef.current?.style.removeProperty('--hero-x')
    sectionRef.current?.style.removeProperty('--hero-y')
  }

  return (
    <section className={`hero ${latest ? 'hero--has-photo' : ''} ${isAnniversary ? 'hero--anniversary' : ''}`} ref={sectionRef} onPointerMove={updateParallax} onPointerLeave={resetParallax}>
      <div className="hero__image" style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined} />
      <div className="hero__glow hero__glow--one" aria-hidden="true" />
      <div className="hero__glow hero__glow--two" aria-hidden="true" />
      <div className="hero__grain" />
      {isAnniversary && <AnniversaryEffects />}
      {latest && <div className="hero__memory-cards" aria-hidden="true">
        <aside className="hero__memory-card hero__memory-card--latest">
          {isAnniversary && <span className="hero__anniversary-bow" aria-hidden="true" />}
          <div className="hero__memory-image" style={{ backgroundImage: `url(${backgroundImage})` }} />
          <span>A SMALL DAY / {latest.date}</span>
        </aside>
        {previous && <aside className="hero__memory-card hero__memory-card--previous">
          {isAnniversary && <span className="hero__anniversary-bow" aria-hidden="true" />}
          <div className="hero__memory-image" style={{ backgroundImage: `url(${assetUrl(previous.sources.webp.at(-1) ?? previous.source)})` }} />
          <span>KEPT CLOSE / {previous.date}</span>
        </aside>}
      </div>}
      <div className="hero__content container">
        <p className="eyebrow hero__eyebrow">{siteConfig.eyebrow}</p>
        <h1>{siteConfig.title}</h1>
        <p className="hero__together" aria-label={`今天是我们在一起的第 ${daysTogether} 天！`}>
          <span className="hero__together-copy">今天是我们在一起的第</span>
          <span className="hero__together-days"><i className="hero__together-heart hero__together-heart--left" aria-hidden="true">♥</i><strong>{daysTogether}</strong><i className="hero__together-heart hero__together-heart--right" aria-hidden="true">♥</i><i className="hero__together-spark" aria-hidden="true">✦</i></span>
          <span className="hero__together-copy">天！</span>
          {isAnniversary && <span className="hero__anniversary-note">9.25 · 我们的恋爱纪念日 <span aria-hidden="true">♡</span></span>}
        </p>
        <div className="hero__footer">
          <div className="hero__archive-meta">
            <p className="hero__statement">{siteConfig.statement}</p>
            <div className="hero__metrics">
              <span>{yearRange}</span>
              <span><strong>{photos.length}</strong> 张照片</span>
              <span><strong>{albums.size}</strong> 个分类</span>
            </div>
          </div>
          <Link className="round-link" to="/gallery">岁月留香 <ArrowDownRight aria-hidden="true" /></Link>
        </div>
      </div>
      {latest && <p className="hero__caption">A LITTLE MOMENT / {latest.date}</p>}
    </section>
  )
}
