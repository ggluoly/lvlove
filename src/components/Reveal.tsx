import type { CSSProperties, PropsWithChildren } from 'react'
import { useInView } from '../hooks/useInView'

interface RevealProps extends PropsWithChildren {
  className?: string
  delay?: number
}

export function Reveal({ children, className = '', delay = 0 }: RevealProps) {
  const { ref, isVisible } = useInView<HTMLDivElement>('0px 0px -8% 0px')
  return <div ref={ref} className={`reveal ${isVisible ? 'reveal--visible' : ''} ${className}`} style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}>{children}</div>
}
