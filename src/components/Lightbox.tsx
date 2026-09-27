import { ChevronLeft, ChevronRight, Maximize2, Minimize2, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { MouseEvent, PointerEvent } from 'react'
import type { Photo } from '../types/photo'
import { fullDateFormatter } from '../utils/photos'
import { assetUrl } from '../utils/url'

interface LightboxProps {
  photos: Photo[]
  selected: Photo
  onClose: () => void
  onSelect: (photo: Photo) => void
}

export function Lightbox({ photos, selected, onClose, onSelect }: LightboxProps) {
  const currentIndex = photos.findIndex((photo) => photo.id === selected.id)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const actions = useRef({ onClose, onSelect, photos, currentIndex })
  const pointers = useRef(new Map<number, { x: number, y: number }>())
  const gesture = useRef<{ x: number; y: number; scale: number; distance: number | null } | null>(null)

  actions.current = { onClose, onSelect, photos, currentIndex }

  const selectOffset = (offset: number) => {
    const { currentIndex: index, onSelect: select, photos: collection } = actions.current
    const next = collection[(index + offset + collection.length) % collection.length]
    select(next)
  }

  useEffect(() => {
    setZoom(1)
    setPosition({ x: 0, y: 0 })
  }, [selected.id])

  useEffect(() => {
    const next = photos[(currentIndex + 1) % photos.length]
    if (!next || next.id === selected.id) return
    const preload = new Image()
    preload.src = assetUrl(next.sources.webp[1] ?? next.sources.webp[0] ?? next.source)
  }, [currentIndex, photos, selected.id])

  useEffect(() => {
    if (!returnFocus.current && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeButton.current?.focus()
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') actions.current.onClose()
      if (event.key === 'ArrowLeft') selectOffset(-1)
      if (event.key === 'ArrowRight') selectOffset(1)
      if (event.key === 'Tab') {
        const focusable = dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input, select, textarea, [tabindex]:not([tabindex="-1"])')
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      window.removeEventListener('keydown', onKeyDown)
      returnFocus.current?.focus()
    }
  }, [])

  useEffect(() => {
    const element = stage.current
    if (!element) return
    const onWheel = (event: WheelEvent) => {
      event.preventDefault()
      setZoom((value) => Math.min(4, Math.max(1, value + (event.deltaY < 0 ? 0.25 : -0.25))))
    }
    element.addEventListener('wheel', onWheel, { passive: false })
    return () => element.removeEventListener('wheel', onWheel)
  }, [])

  const distance = () => {
    const [first, second] = [...pointers.current.values()]
    return first && second ? Math.hypot(first.x - second.x, first.y - second.y) : null
  }

  const onPointerDown = (event: PointerEvent<HTMLDivElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    gesture.current = { x: event.clientX, y: event.clientY, scale: zoom, distance: distance() }
  }

  const onPointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId) || !gesture.current) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    const pinchDistance = distance()
    if (pinchDistance && gesture.current.distance) {
      setZoom(Math.min(4, Math.max(1, gesture.current.scale * (pinchDistance / gesture.current.distance))))
      return
    }
    if (zoom > 1) {
      const deltaX = event.clientX - gesture.current.x
      const deltaY = event.clientY - gesture.current.y
      setPosition((current) => ({ x: current.x + deltaX, y: current.y + deltaY }))
      gesture.current.x = event.clientX
      gesture.current.y = event.clientY
    }
  }

  const onPointerEnd = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    const start = gesture.current
    gesture.current = null
    if (start && zoom === 1 && Math.abs(event.clientX - start.x) > 80 && pointers.current.size === 0) selectOffset(event.clientX > start.x ? -1 : 1)
  }

  const onStageClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && zoom === 1) actions.current.onClose()
  }

  const toggleZoom = () => setZoom((value) => value > 1 ? 1 : 2)
  const canNavigate = photos.length > 1

  return (
    <div className="lightbox" ref={dialog} role="dialog" aria-modal="true" aria-label={`查看照片 ${selected.title}`}>
      <div className="lightbox__toolbar">
        <span>{String(currentIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')}</span>
        <button ref={closeButton} type="button" aria-label="关闭查看器" onClick={onClose}><X aria-hidden="true" /></button>
      </div>
      <div className="lightbox__stage" ref={stage} onClick={onStageClick} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
        <img
          src={assetUrl(selected.source)}
          alt={selected.title}
          draggable={false}
          onDoubleClick={toggleZoom}
          style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` }}
        />
      </div>
      {canNavigate && <>
        <button className="lightbox__nav lightbox__nav--previous" type="button" aria-label="上一张照片" onClick={() => selectOffset(-1)}><ChevronLeft aria-hidden="true" /></button>
        <button className="lightbox__nav lightbox__nav--next" type="button" aria-label="下一张照片" onClick={() => selectOffset(1)}><ChevronRight aria-hidden="true" /></button>
      </>}
      <div className="lightbox__details">
        <div><p>{selected.album.toUpperCase()}</p><h2>{selected.title}</h2><span>{fullDateFormatter.format(new Date(`${selected.date}T00:00:00`))}{selected.location ? ` · ${selected.location}` : ''}</span></div>
        <button type="button" aria-label={zoom > 1 ? '还原图片大小' : '放大图片'} onClick={toggleZoom}>{zoom > 1 ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
      </div>
    </div>
  )
}
