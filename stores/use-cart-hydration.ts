'use client'

import { useEffect } from 'react'
import { useCartStore } from '@/stores/cart.store'

/** Call from a Client Component; persisted values become visible only after mount. */
export function useCartHydration() {
  const hasHydrated = useCartStore((state) => state.hasHydrated)
  useEffect(() => {
    void useCartStore.persist.rehydrate()
  }, [])
  return hasHydrated
}
