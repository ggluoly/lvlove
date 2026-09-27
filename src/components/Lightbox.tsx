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

const confessions = [
  '你在身边的时候，连平常的日子都有了光。',
  '想把每一次并肩而行，都留成可以回看的风景。',
  '晚风路过的时候，忽然很想和你说声谢谢。',
  '原来心安这件事，也可以有具体的模样。',
  '不必刻意纪念，和你有关的日子都值得记得。',
  '愿往后的每一段路，都有温柔的光落在我们身上。',
  '有你在的片刻，时间总会走得慢一点。',
  '想把所有平凡的瞬间，慢慢讲给你听。',
  '看见你笑的时候，今天就已经很好了。',
  '路很长，但有些陪伴本身就是答案。',
  '想和你一起，把寻常日子过得再慢一点。',
  '你不用说很多话，出现就已经足够。',
  '那些细小的快乐，总是刚好和你有关。',
  '愿每一次抬头，都能遇见恰好的晴天。',
  '有些话藏在眼神里，比说出口更温柔。',
  '原来最好的风景，是有人愿意一起看。',
  '你让那些普通的下午，也有了特别的名字。',
  '想把今天的云、风和晚霞，都分给你一半。',
  '不急着抵达哪里，和你走着就很好。',
  '愿每个疲惫的傍晚，都有一盏灯等着你。',
  '有你分享的日常，连沉默都变得可爱。',
  '世界很大，而刚好遇见你是一件小小的幸运。',
  '我喜欢那些不用约定，也会自然靠近的时刻。',
  '愿你被生活温柔以待，也被我悄悄惦记。',
  '每一张照片背后，都是舍不得忘记的片刻。',
  '想和你把季节一页一页地翻过去。',
  '你看，连光落下来的方向都变得柔软。',
  '有些心意不需要很大声，刚好听见就好。',
  '愿你在每个寻常早晨，都有新的期待。',
  '认识你以后，时间好像多了一种颜色。',
  '想把最轻的风，留在你经过的地方。',
  '有你在，回家的路也会显得近一些。',
  '不需要完美的安排，刚好一起就很好。',
  '愿所有来不及说的话，都变成温柔的注视。',
  '你的名字经过心里时，总会带来一点暖意。',
  '希望每个值得开心的瞬间，你都在场。',
  '日子偶尔慌张，但想到你就会安静下来。',
  '把喜欢藏进细节里，是一件很长久的事。',
  '愿你一直保有对生活微小事物的欢喜。',
  '那些一起度过的时间，后来都会发光。',
  '如果今天有一点好，那一定也和你有关。',
  '愿你走过的每一段路，都有被好好照亮。',
  '你不必成为谁的例外，你本来就很珍贵。',
  '想在每个季节里，都留下一点关于你的颜色。',
  '和你说话的时候，连时间都愿意停一停。',
  '有些相遇没有声音，却让人记了很久。',
  '愿你抬头时有云，低头时有花。',
  '想把那些没说完的话，留给下一个见面。',
  '你像傍晚的风，轻轻吹散一天的疲惫。',
  '每一个被记住的瞬间，都因为你而温柔。',
  '愿你的快乐不需要理由，也不需要等待。',
  '不管天气怎样，见到你就像有了晴天。',
  '想和你一起，认真浪费一些无所事事的下午。',
  '你让平淡的日子，也有了值得期待的部分。',
  '愿所有小小的心愿，都能慢慢来到你身边。',
  '有些人出现以后，四季就不再只是四季。',
  '想把路边的花、窗外的雨和夜里的月亮讲给你听。',
  '你在的时候，连等待也不会显得太长。',
  '愿你眼里的光，一直都不被岁月吹散。',
  '我喜欢和你有关的一切平常。',
  '那些没有刻意安排的瞬间，最让人心动。',
  '希望每一个明天，都能比今天多一点轻松。',
  '你是我想在忙乱日子里，认真留住的安静。',
  '愿你被理解，也被毫无保留地偏爱。',
  '一起看过的风景，会在记忆里慢慢长大。',
  '如果可以，想把每次道别都换成下次见。',
  '你的存在，让很多事情忽然有了意义。',
  '愿所有温柔的事，都会在恰好的时候发生。',
  '想在你需要的时候，成为一阵刚好的风。',
  '有你在的地方，连空气都像是甜的。',
  '愿每一次疲惫以后，你都能找到安心的方向。',
  '那些被日常轻轻覆盖的心意，其实一直都在。',
  '想把今天的好心情，认真地分给你。',
  '遇见你之后，很多瞬间开始值得被收藏。',
  '愿你的每一步，都走向自己喜欢的生活。',
  '不必总是勇敢，偶尔依靠一下也没有关系。',
  '有些陪伴像灯，不耀眼，却一直亮着。',
  '希望你永远知道，自己值得被好好对待。',
  '想和你把每一个普通的节日，都过得有一点不同。',
  '你看向我的时候，世界会安静一会儿。',
  '愿时光走得慢一点，好让我们多记住一些。',
  '每次想起你，心里都会留出一小块晴朗。',
  '想在所有忙碌之外，给你留一段安静的时间。',
  '你的温柔，让很多看似艰难的日子变得轻一点。',
  '愿你始终被爱意围绕，也始终保有自由。',
  '我喜欢和你一起看天色慢慢变暗。',
  '有些故事没有结尾，也依然足够美好。',
  '愿生活把最柔软的一面，都留给你。',
  '如果日子会说话，它一定记得你的笑声。',
  '想把每一次偶然遇见，都当成小小的庆祝。',
  '你让我相信，平凡也能是一种浪漫。',
  '愿你经过的地方，都留下让人安心的气息。',
  '有你在的日子，连晚安都会更有分量。',
  '想把那些笨拙的关心，慢慢变成你能感受到的温暖。',
  '你不说话的时候，也像一首安静的歌。',
  '愿每一个需要拥抱的时刻，你都不必独自经过。',
  '有些喜欢不是热烈，是长久地放在心上。',
  '想和你一起，把以后过成很多个今天。',
  '愿你的心里，永远有一处地方可以安放柔软。',
  '如果世界偶尔不够温柔，希望我能替它补上一点。',
  '每一段路都有终点，但想和你多走一会儿。',
  '愿你在每一次回头时，都能看见被珍惜的自己。',
  '有些话不必说完，彼此明白就已经很好。',
  '想把所有好天气，都变成和你有关的记忆。',
  '愿明天比今天更轻，也比今天更亮。',
]

function shuffledConfessions(exclude: string | null = null) {
  const deck = [...confessions]
  for (let index = deck.length - 1; index > 0; index -= 1) {
    const replacement = Math.floor(Math.random() * (index + 1))
    ;[deck[index], deck[replacement]] = [deck[replacement], deck[index]]
  }

  const nextIndex = deck.length - 1
  if (exclude && deck[nextIndex] === exclude && deck.length > 1) {
    const replacement = deck.findIndex((item) => item !== exclude)
    ;[deck[nextIndex], deck[replacement]] = [deck[replacement], deck[nextIndex]]
  }
  return deck
}

let confessionDeck = shuffledConfessions()
let lastConfession: string | null = null

function takeNextConfession() {
  if (confessionDeck.length === 0) confessionDeck = shuffledConfessions(lastConfession)
  const confession = confessionDeck.pop()!
  lastConfession = confession
  return confession
}

export function Lightbox({ photos, selected, onClose, onSelect }: LightboxProps) {
  const currentIndex = photos.findIndex((photo) => photo.id === selected.id)
  const [zoom, setZoom] = useState(1)
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [confession, setConfession] = useState(takeNextConfession)
  const closeButton = useRef<HTMLButtonElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const stage = useRef<HTMLDivElement>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const displayedPhotoId = useRef(selected.id)
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
    if (displayedPhotoId.current === selected.id) return
    displayedPhotoId.current = selected.id
    setConfession(takeNextConfession())
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
    const onWheel = (event: WheelEvent) => {
      const element = stage.current
      if (!element || !(event.target instanceof Node) || !element.contains(event.target)) return
      event.preventDefault()
      event.stopPropagation()
      setZoom((value) => Math.min(4, Math.max(1, value + (event.deltaY < 0 ? 0.2 : -0.2))))
    }
    document.addEventListener('wheel', onWheel, { capture: true, passive: false })
    return () => document.removeEventListener('wheel', onWheel, true)
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
        <span>{String(currentIndex + 1).padStart(2, '0')} / {String(photos.length).padStart(2, '0')} <i>·</i> {Math.round(zoom * 100)}%</span>
        <button ref={closeButton} type="button" aria-label="关闭查看器" onClick={onClose}><X aria-hidden="true" /></button>
      </div>
      <div className={`lightbox__stage ${zoom > 1 ? 'lightbox__stage--zoomed' : ''}`} ref={stage} onClick={onStageClick} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerEnd} onPointerCancel={onPointerEnd}>
        <div className="lightbox__photo-enter" key={selected.id}>
          <img
            className="lightbox__photo"
            src={assetUrl(selected.source)}
            alt={selected.title}
            draggable={false}
            onDoubleClick={toggleZoom}
            style={{ transform: `translate3d(${position.x}px, ${position.y}px, 0) scale(${zoom})` }}
          />
        </div>
      </div>
      {canNavigate && <>
        <button className="lightbox__nav lightbox__nav--previous" type="button" aria-label="上一张照片" onClick={() => selectOffset(-1)}><ChevronLeft aria-hidden="true" /></button>
        <button className="lightbox__nav lightbox__nav--next" type="button" aria-label="下一张照片" onClick={() => selectOffset(1)}><ChevronRight aria-hidden="true" /></button>
      </>}
      <p className="lightbox__confession" key={`${selected.id}-${confession}`}>{confession}</p>
      <div className="lightbox__details">
        <div><p>{selected.album.toUpperCase()}</p><h2>{selected.title}</h2><span>{fullDateFormatter.format(new Date(`${selected.date}T00:00:00`))}{selected.location ? ` · ${selected.location}` : ''}</span></div>
        <button type="button" aria-label={zoom > 1 ? '还原图片大小' : '放大图片'} onClick={toggleZoom}>{zoom > 1 ? <Minimize2 aria-hidden="true" /> : <Maximize2 aria-hidden="true" />}</button>
      </div>
    </div>
  )
}
