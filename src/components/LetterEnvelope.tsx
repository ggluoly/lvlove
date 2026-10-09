import { useId } from 'react'

interface LetterEnvelopeProps {
  title: string
  date: string
}

export function LetterEnvelope({ title, date }: LetterEnvelopeProps) {
  const sealId = useId().replace(/[^a-zA-Z0-9_-]/g, '')
  const heart = 'M50 22 C39 7 13 10 10 32 C6 53 28 72 46 85 Q50 88 54 85 C72 72 94 53 90 32 C87 10 61 7 50 22 Z'

  return (
    <span className="letter-envelope" aria-hidden="true">
      <span className="letter-envelope__back" />
      <span className="letter-envelope__lining" />
      <span className="letter-envelope__insert">
        <span className="letter-envelope__insert-mark">lvlin</span>
        <span className="letter-envelope__ink" />
        <span className="letter-envelope__ink" />
        <span className="letter-envelope__ink" />
      </span>
      <span className="letter-envelope__pocket" />
      <span className="letter-envelope__flap" />
      <span className="letter-envelope__sticker" />
      <span className="letter-envelope__seal">
        <svg className="letter-envelope__wax" viewBox="0 0 100 100" focusable="false" aria-hidden="true">
          <defs>
            <radialGradient id={`${sealId}-wax`} cx="32%" cy="20%" r="86%">
              <stop offset="0" stopColor="#d69292" />
              <stop offset=".28" stopColor="#bf6a79" />
              <stop offset=".7" stopColor="#9a465e" />
              <stop offset="1" stopColor="#743348" />
            </radialGradient>
            <linearGradient id={`${sealId}-rim`} x1="0" y1="0" x2=".7" y2="1">
              <stop stopColor="#ecc1ab" stopOpacity=".8" />
              <stop offset=".5" stopColor="#b26772" />
              <stop offset="1" stopColor="#753346" />
            </linearGradient>
            <linearGradient id={`${sealId}-sheen`}>
              <stop stopColor="#ffe9cc" stopOpacity="0" />
              <stop offset=".5" stopColor="#ffe9cc" stopOpacity=".4" />
              <stop offset="1" stopColor="#ffe9cc" stopOpacity="0" />
            </linearGradient>
            <clipPath id={`${sealId}-shape`}><path d={heart} /></clipPath>
            <filter id={`${sealId}-grain`} x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency=".8" numOctaves="3" seed="7" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
          </defs>
          <path d={heart} transform="translate(0 2.5)" fill="#79384c" />
          <path d={heart} fill={`url(#${sealId}-wax)`} stroke={`url(#${sealId}-rim)`} strokeWidth="2.3" />
          <g clipPath={`url(#${sealId}-shape)`}>
            <rect width="100" height="100" filter={`url(#${sealId}-grain)`} opacity=".1" style={{ mixBlendMode: 'soft-light' }} />
            <rect className="letter-envelope__sheen" x="-35" y="0" width="48" height="100" fill={`url(#${sealId}-sheen)`} transform="rotate(-18 50 50)" />
          </g>
          <path d={heart} transform="translate(8 8) scale(.84)" fill="none" stroke="#753346" strokeOpacity=".7" strokeWidth="1.2" />
          <path d={heart} transform="translate(8 7) scale(.84)" fill="none" stroke="#e0a597" strokeOpacity=".6" strokeWidth="1" />
          <g fill="none" strokeLinecap="round" strokeLinejoin="round">
            <path d="M50 41 C43 33 32 39 35 47 C37 53 46 59 50 62 C54 59 63 53 65 47 C68 39 57 33 50 41 Z" stroke="#713449" strokeWidth="2.1" transform="translate(0 1)" />
            <path d="M50 41 C43 33 32 39 35 47 C37 53 46 59 50 62 C54 59 63 53 65 47 C68 39 57 33 50 41 Z" stroke="#e4b1a0" strokeWidth="1.2" />
            <path d="M27 46 Q25 60 41 69 M28 52 L23 49 M30 58 L25 57 M34 63 L30 64 M73 46 Q75 60 59 69 M72 52 L77 49 M70 58 L75 57 M66 63 L70 64" stroke="#d9a091" strokeOpacity=".65" strokeWidth="1" />
          </g>
        </svg>
      </span>
      <span className="letter-envelope__address"><span>TO YOU, WITH CARE</span><strong>{title}</strong></span>
      <span className="letter-envelope__postmark">{date}</span>
    </span>
  )
}
