import { useEffect, useState } from 'react'

export function useScrollProgress() {
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    let frame = 0
    const updateProgress = () => {
      frame = 0
      const scrollableHeight = document.documentElement.scrollHeight - window.innerHeight
      setProgress(scrollableHeight > 0 ? Math.min(1, window.scrollY / scrollableHeight) : 0)
    }
    const onScroll = () => {
      if (!frame) frame = window.requestAnimationFrame(updateProgress)
    }

    updateProgress()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])

  return progress
}
