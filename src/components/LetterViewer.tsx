import { Lock, X } from 'lucide-react'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import type { AnimationEvent, FormEvent, MouseEvent } from 'react'
import { useReducedMotion } from '../hooks/useReducedMotion'
import type { Letter } from '../types/letter'
import { fullDateFormatter } from '../utils/photos'
import { LetterEnvelope } from './LetterEnvelope'
import { LetterContent } from './LetterContent'

interface LetterViewerProps {
  letter: Letter
  onClose: () => void
}

const GATE_QUESTION = '恋爱纪念日？'
const GATE_ANSWER = '中秋节'

type Phase = 'locked' | 'unlocking' | 'centering' | 'unsealing' | 'opening' | 'extracting' | 'unfolding' | 'revealing' | 'reading'

const sequence: Partial<Record<Phase, { next: Phase; duration: number; animation: string }>> = {
  unlocking: { next: 'centering', duration: 360, animation: 'letter-gate-out' },
  centering: { next: 'unsealing', duration: 700, animation: 'letter-envelope-arrive' },
  unsealing: { next: 'opening', duration: 900, animation: 'letter-heart-release' },
  opening: { next: 'extracting', duration: 950, animation: 'letter-flap-open' },
  extracting: { next: 'unfolding', duration: 950, animation: 'letter-paper-extract' },
  unfolding: { next: 'revealing', duration: 800, animation: 'letter-sheet-unfold' },
  revealing: { next: 'reading', duration: 950, animation: 'letter-content-in' },
}

export function LetterViewer({ letter, onClose }: LetterViewerProps) {
  const reducedMotion = useReducedMotion()
  const closeButton = useRef<HTMLButtonElement>(null)
  const answerInput = useRef<HTMLInputElement>(null)
  const dialog = useRef<HTMLDivElement>(null)
  const paper = useRef<HTMLElement>(null)
  const extractedPaper = useRef<DOMRect | null>(null)
  const returnFocus = useRef<HTMLElement | null>(null)
  const closeAction = useRef(onClose)
  closeAction.current = onClose
  const letterDate = fullDateFormatter.format(new Date(`${letter.date}T00:00:00`))
  const [phase, setPhase] = useState<Phase>('locked')
  const [answer, setAnswer] = useState('')
  const [wrongAnswer, setWrongAnswer] = useState(false)
  const showGate = phase === 'locked' || phase === 'unlocking'
  const showEnvelope = ['centering', 'unsealing', 'opening', 'extracting', 'unfolding'].includes(phase)
  const showPaper = ['unfolding', 'revealing', 'reading'].includes(phase)
  const showContent = phase === 'revealing' || phase === 'reading'

  const rememberExtractedPaper = () => {
    extractedPaper.current = dialog.current?.querySelector('.letter-envelope__insert')?.getBoundingClientRect() ?? null
  }

  useLayoutEffect(() => {
    if (phase !== 'unfolding' || !paper.current || !extractedPaper.current) return
    const sheet = paper.current
    // Match the actual extracted paper before expanding to the final reading size.
    sheet.style.animation = 'none'
    const target = sheet.getBoundingClientRect()
    const source = extractedPaper.current
    sheet.style.setProperty('--unfold-x', `${source.x + source.width / 2 - target.x - target.width / 2}px`)
    sheet.style.setProperty('--unfold-y', `${source.y + source.height / 2 - target.y - target.height / 2}px`)
    sheet.style.setProperty('--unfold-width', String(source.width / target.width))
    sheet.style.setProperty('--unfold-height', String(source.height / target.height))
    sheet.style.removeProperty('animation')
  }, [phase])

  useEffect(() => {
    const step = sequence[phase]
    if (!step) return
    if (reducedMotion) {
      setPhase('reading')
      return
    }
    // Fallback if the browser suppresses animationend (for example in a background tab).
    const timer = window.setTimeout(() => {
      if (phase === 'extracting') rememberExtractedPaper()
      setPhase((current) => current === phase ? step.next : current)
    }, step.duration + 120)
    return () => window.clearTimeout(timer)
  }, [phase, reducedMotion])

  const finishPhase = (event: AnimationEvent<HTMLDivElement>) => {
    const step = sequence[phase]
    if (step && event.animationName === step.animation) {
      if (phase === 'extracting') rememberExtractedPaper()
      setPhase((current) => current === phase ? step.next : current)
    }
  }

  useEffect(() => {
    if (!returnFocus.current && document.activeElement instanceof HTMLElement) returnFocus.current = document.activeElement
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    answerInput.current?.focus({ preventScroll: true })
    const root = document.getElementById('root')
    const wasInert = root?.inert ?? false
    if (root) root.inert = true

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeAction.current()
        return
      }
      if (event.key === 'Tab') {
        const focusable = [...(dialog.current?.querySelectorAll<HTMLElement>('button:not([disabled]), [href], input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])') ?? [])]
          .filter((element) => element.getClientRects().length && !element.closest('[inert]'))
        if (!focusable?.length) return
        const first = focusable[0]
        const last = focusable[focusable.length - 1]
        if (event.shiftKey && (document.activeElement === first || document.activeElement === paper.current)) {
          event.preventDefault()
          last.focus()
        } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === paper.current)) {
          event.preventDefault()
          first.focus()
        }
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = previousOverflow
      if (root) root.inert = wasInert
      window.removeEventListener('keydown', onKeyDown)
      returnFocus.current?.focus({ preventScroll: true })
    }
  }, [])

  useEffect(() => {
    if (phase === 'unlocking') closeButton.current?.focus({ preventScroll: true })
    if (phase === 'reading') paper.current?.focus({ preventScroll: true })
  }, [phase])

  const onOverlayClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget && (phase === 'locked' || phase === 'reading')) onClose()
  }

  const onAnswerSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (phase !== 'locked') return
    if (answer.trim() === GATE_ANSWER) {
      setPhase(reducedMotion ? 'reading' : 'unlocking')
      setWrongAnswer(false)
      return
    }
    setWrongAnswer(true)
    setAnswer('')
    answerInput.current?.focus()
  }

  return createPortal(
    <div className={`letter-viewer letter-viewer--${phase}`} ref={dialog} role="dialog" aria-modal="true" aria-label={`${showContent ? '阅读' : '拆开'} ${letterDate} 的信：${letter.title}`} data-phase={phase} onAnimationEnd={finishPhase} onClick={onOverlayClick}>
        <button ref={closeButton} type="button" className="letter-viewer__close" aria-label="关闭这封信" onClick={onClose}>
          <X aria-hidden="true" />
        </button>
        <span className="letter-viewer__status" role="status">{phase === 'locked' ? '回答问题，打开这封信' : phase === 'reading' ? '信已展开' : '正在轻轻拆开信封…'}</span>
        {showGate && (
          <form className="letter-viewer__gate" onSubmit={onAnswerSubmit} inert={phase !== 'locked'}>
            <span className="letter-viewer__gate-icon" aria-hidden="true"><Lock /></span>
            <p className="letter-viewer__gate-question">{GATE_QUESTION}</p>
            <input
              ref={answerInput}
              type="text"
              className="letter-viewer__gate-input"
              value={answer}
              onChange={(event) => { setAnswer(event.target.value); setWrongAnswer(false) }}
              placeholder="输入答案"
              aria-label="解锁问题的答案"
              aria-invalid={wrongAnswer}
              aria-describedby={wrongAnswer ? 'letter-answer-error' : undefined}
              autoComplete="off"
            />
            {wrongAnswer && <p id="letter-answer-error" className="letter-viewer__gate-error" role="alert">答案不对哦，再想想。</p>}
            <button type="submit" className="letter-viewer__gate-submit" disabled={phase !== 'locked'}>拆开这封信</button>
          </form>
        )}
        {showEnvelope && <div className="letter-viewer__ceremony" aria-hidden="true">
          <div className="letter-viewer__halo" />
          <LetterEnvelope title={letter.title} date={letter.date} />
          <span className="letter-viewer__spark letter-viewer__spark--one" />
          <span className="letter-viewer__spark letter-viewer__spark--two" />
          <span className="letter-viewer__spark letter-viewer__spark--three" />
        </div>}
        {showPaper && <div className="letter-viewer__reading" onClick={onOverlayClick}>
          <article className="letter-viewer__sheet" ref={paper} tabIndex={-1} aria-label="信件内容" aria-hidden={!showContent} inert={!showContent}>
            <div className="letter-viewer__content">
              <header className="letter-viewer__heading"><p className="eyebrow">WORDS KEPT FOR YOU</p><h2 className="letter-viewer__title">{letter.title}</h2></header>
              <LetterContent content={letter.content} />
              <footer className="letter-viewer__signoff">
                {letter.signature && <p className="letter-viewer__signature">{letter.signature}</p>}
                <p className="letter-viewer__date">{letterDate}</p>
              </footer>
            </div>
          </article>
        </div>}
    </div>,
    document.body,
  )
}
