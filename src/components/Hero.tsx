import { ArrowDownRight } from 'lucide-react'
import { useRef } from 'react'
import type { PointerEvent } from 'react'
import { Link } from 'react-router-dom'
import { siteConfig } from '../data/site-config'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Photo } from '../types/photo'
import { assetUrl } from '../utils/url'

interface HeroProps {
  photos: Photo[]
}

export function Hero({ photos }: HeroProps) {
  const sectionRef = useRef<HTMLElement>(null)
  const reducedMotion = useReducedMotion()
  const latest = photos[0]
  const years = new Set(photos.map((photo) => photo.year))
  const albums = new Set(photos.map((photo) => photo.album))
  const yearRange = years.size ? `${Math.min(...years)} - ${Math.max(...years)}` : '等待第一张照片'
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
    <section className="hero" ref={sectionRef} onPointerMove={updateParallax} onPointerLeave={resetParallax}>
      <div className="hero__image" style={backgroundImage ? { backgroundImage: `url(${backgroundImage})` } : undefined} />
      <div className="hero__grain" />
      <div className="hero__content container">
        <p className="eyebrow hero__eyebrow">{siteConfig.eyebrow}</p>
        <h1>{siteConfig.title}</h1>
        <p className="hero__statement">{siteConfig.statement}</p>
        <div className="hero__footer">
          <div className="hero__metrics">
            <span>{yearRange}</span>
            <span><strong>{photos.length}</strong> 张影像</span>
            <span><strong>{albums.size}</strong> 个分类</span>
          </div>
          <Link className="round-link" to="/gallery">浏览影像 <ArrowDownRight aria-hidden="true" /></Link>
        </div>
      </div>
      {latest && <p className="hero__caption">LATEST FRAME / {latest.date}</p>}
    </section>
  )
}
