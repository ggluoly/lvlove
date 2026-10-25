import { useEffect, useState } from 'react'
import { isLoveAnniversary, watchLoveAnniversary } from '../utils/love-anniversary'

export function useLoveAnniversary() {
  const [isAnniversary, setIsAnniversary] = useState(() => isLoveAnniversary())

  useEffect(() => watchLoveAnniversary(setIsAnniversary), [])

  return isAnniversary
}
