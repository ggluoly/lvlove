import { useEffect, useRef, useState } from 'react'

export function useInView<T extends Element>(rootMargin = '240px') {
  const ref = useRef<T>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const element = ref.current
    if (!element || isVisible) return
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true)
        observer.disconnect()
      }
    }, { rootMargin })
    observer.observe(element)
    return () => observer.disconnect()
  }, [isVisible, rootMargin])

  return { ref, isVisible }
}
