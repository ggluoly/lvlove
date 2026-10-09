import type { CSSProperties } from 'react'
import type { Letter } from '../types/letter'
import { fullDateFormatter } from '../utils/photos'
import { LetterEnvelope } from './LetterEnvelope'

interface LetterCardProps {
  letter: Letter
  index: number
  onOpen: (letter: Letter) => void
}

export function LetterCard({ letter, index, onOpen }: LetterCardProps) {
  const letterDate = fullDateFormatter.format(new Date(`${letter.date}T00:00:00`))

  return (
    <button
      type="button"
      className="letter-card"
      style={{ '--letter-delay': `${Math.min(index, 9) * 70}ms` } as CSSProperties}
      onClick={() => onOpen(letter)}
      aria-label={`拆开 ${letterDate} 的信：${letter.title}`}
    >
      <LetterEnvelope title={letter.title} date={letter.date} />
      <span className="letter-card__body">
        <strong>{letter.title}</strong>
        <small>{letterDate}</small>
      </span>
    </button>
  )
}
