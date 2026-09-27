import { useScrollProgress } from '../hooks/useScrollProgress'

export function ScrollProgress() {
  const progress = useScrollProgress()
  return (
    <div className="scroll-progress" role="progressbar" aria-label="页面阅读进度" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
      <span style={{ transform: `scaleX(${progress})` }} />
    </div>
  )
}
