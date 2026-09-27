import { Expand } from 'lucide-react'
import { useState } from 'react'
import type { PointerEvent } from 'react'
import { useInView } from '../hooks/useInView'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Photo } from '../types/photo'
import { fullDateFormatter } from '../utils/photos'
import { assetUrl } from '../utils/url'

interface PhotoCardProps {
  photo: Photo
  onOpen: (photo: Photo) => void
  priority?: boolean
}

export function PhotoCard({ photo, onOpen, priority = false }: PhotoCardProps) {
  const { ref, isVisible } = useInView<HTMLButtonElement>()
  const [loaded, setLoaded] = useState(false)
  const reducedMotion = useReducedMotion()
  const shouldLoad = priority || isVisible
  const preview = assetUrl(photo.placeholder)
  const avifSources = photo.sources.avif.map(assetUrl)
  const webpSources = photo.sources.webp.map(assetUrl)
  const sourceSet = (sources: string[]) => sources.map((source, sourceIndex) => `${source} ${[480, 960, 1440][sourceIndex]}w`).join(', ')
  const updateTilt = (event: PointerEvent<HTMLButtonElement>) => {
    if (reducedMotion || event.pointerType !== 'mouse') return
    const bounds = event.currentTarget.getBoundingClientRect()
    const offsetX = (event.clientX - bounds.left) / bounds.width - 0.5
    const offsetY = (event.clientY - bounds.top) / bounds.height - 0.5
    event.currentTarget.style.setProperty('--tilt-x', `${-offsetY * 2.3}deg`)
    event.currentTarget.style.setProperty('--tilt-y', `${offsetX * 2.3}deg`)
    event.currentTarget.style.setProperty('--glow-x', `${(offsetX + 0.5) * 100}%`)
    event.currentTarget.style.setProperty('--glow-y', `${(offsetY + 0.5) * 100}%`)
  }
  const resetTilt = (event: PointerEvent<HTMLButtonElement>) => {
    event.currentTarget.style.removeProperty('--tilt-x')
    event.currentTarget.style.removeProperty('--tilt-y')
    event.currentTarget.style.removeProperty('--glow-x')
    event.currentTarget.style.removeProperty('--glow-y')
  }

  return (
    <button
      className={`photo-card ${loaded ? 'photo-card--loaded' : ''} ${shouldLoad ? 'photo-card--visible' : ''}`}
      ref={ref}
      type="button"
      onClick={() => onOpen(photo)}
      onPointerMove={updateTilt}
      onPointerLeave={resetTilt}
      aria-label={`查看照片：${photo.title}`}
      style={{ backgroundImage: `url(${preview})` }}
    >
      {shouldLoad && (
        <picture>
          <source type="image/avif" srcSet={sourceSet(avifSources)} sizes="(max-width: 720px) 92vw, (max-width: 1100px) 45vw, 28vw" />
          <source type="image/webp" srcSet={sourceSet(webpSources)} sizes="(max-width: 720px) 92vw, (max-width: 1100px) 45vw, 28vw" />
          <img src={webpSources[1] ?? assetUrl(photo.source)} alt={photo.title} width={photo.width} height={photo.height} loading={priority ? 'eager' : 'lazy'} decoding="async" onLoad={() => setLoaded(true)} />
        </picture>
      )}
      <span className="photo-card__veil" />
      <span className="photo-card__meta">
        <span>
          <strong>{photo.title}</strong>
          <small>{fullDateFormatter.format(new Date(`${photo.date}T00:00:00`))}{photo.location ? ` · ${photo.location}` : ''}</small>
        </span>
        <span className="photo-card__action"><Expand size={17} aria-hidden="true" /></span>
      </span>
    </button>
  )
}
