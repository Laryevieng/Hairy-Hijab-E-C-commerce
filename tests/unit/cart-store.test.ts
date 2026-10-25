import { afterEach, describe, expect, it } from 'vitest'
import { selectCartItemCount, useCartStore } from '@/stores/cart.store'

const first = '11111111-1111-4111-8111-111111111111'
const second = '22222222-2222-4222-8222-222222222222'

afterEach(() => {
  useCartStore.getState().clear()
  localStorage.clear()
})

describe('cart store', () => {
  it('adds lines, merges matching variants, and caps quantity at 20', () => {
    useCartStore.getState().add(first, 3)
    useCartStore.getState().add(first, 5)
    useCartStore.getState().add(first, 30)
    expect(useCartStore.getState().lines).toEqual([{ variantId: first, quantity: 20 }])
    expect(selectCartItemCount(useCartStore.getState())).toBe(20)
  })

  it('adds separate variant lines and ignores invalid quantity', () => {
    useCartStore.getState().add(first)
    useCartStore.getState().add(second, 2)
    useCartStore.getState().add(second, 0)
    expect(useCartStore.getState().lines).toEqual([
      { variantId: first, quantity: 1 },
      { variantId: second, quantity: 2 },
    ])
    expect(selectCartItemCount(useCartStore.getState())).toBe(3)
  })

  it('sets quantities, removes a line when set below one, removes and clears', () => {
    useCartStore.getState().add(first, 2)
    useCartStore.getState().add(second, 3)
    useCartStore.getState().setQuantity(first, 7)
    expect(useCartStore.getState().lines[0].quantity).toBe(7)
    useCartStore.getState().setQuantity(first, 0)
    expect(useCartStore.getState().lines).toHaveLength(1)
    useCartStore.getState().remove(second)
    expect(useCartStore.getState().lines).toHaveLength(0)
    useCartStore.getState().add(first)
    useCartStore.getState().clear()
    expect(useCartStore.getState().lines).toEqual([])
  })

  it('persists only variantId and quantity using the specified key and version', () => {
    useCartStore.getState().add(first, 4)
    const persisted = JSON.parse(localStorage.getItem('hairy-cart-v1') ?? '{}')
    expect(persisted.version).toBe(1)
    expect(persisted.state).toEqual({ lines: [{ variantId: first, quantity: 4 }] })
    expect(JSON.stringify(persisted)).not.toMatch(/price|stock|name/i)
  })
})
