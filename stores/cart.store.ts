import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'

export interface CartLine {
  variantId: string
  quantity: number
}

interface CartState {
  lines: CartLine[]
  hasHydrated: boolean
  add: (variantId: string, quantity?: number) => void
  setQuantity: (variantId: string, quantity: number) => void
  remove: (variantId: string) => void
  clear: () => void
  setHasHydrated: (hasHydrated: boolean) => void
}

const MAX_QUANTITY = 20

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      lines: [],
      hasHydrated: false,
      add: (variantId, quantity = 1) => {
        if (!variantId || !Number.isInteger(quantity) || quantity < 1) return
        set((state) => {
          const existing = state.lines.find((line) => line.variantId === variantId)
          if (existing) {
            return { lines: state.lines.map((line) => line.variantId === variantId
              ? { ...line, quantity: Math.min(MAX_QUANTITY, line.quantity + quantity) }
              : line) }
          }
          return { lines: [...state.lines, { variantId, quantity: Math.min(MAX_QUANTITY, quantity) }] }
        })
      },
      setQuantity: (variantId, quantity) => {
        if (!Number.isInteger(quantity)) return
        if (quantity < 1) {
          set((state) => ({ lines: state.lines.filter((line) => line.variantId !== variantId) }))
          return
        }
        set((state) => ({ lines: state.lines.map((line) => line.variantId === variantId
          ? { ...line, quantity: Math.min(MAX_QUANTITY, quantity) }
          : line) }))
      },
      remove: (variantId) => set((state) => ({ lines: state.lines.filter((line) => line.variantId !== variantId) })),
      clear: () => set({ lines: [] }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
    }),
    {
      name: 'hairy-cart-v1',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ lines: state.lines }),
      skipHydration: true,
      onRehydrateStorage: () => (state) => state?.setHasHydrated(true),
    },
  ),
)

export function selectCartItemCount(state: CartState) {
  return state.lines.reduce((sum, line) => sum + line.quantity, 0)
}
