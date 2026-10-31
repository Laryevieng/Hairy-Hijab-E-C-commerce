import { describe, expect, it } from 'vitest'
import { cartLineProblem, computeCartTotals } from '@/lib/cart/cart-totals'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'

function line(overrides: Partial<CartViewLine>): CartViewLine {
  return {
    variantId: '11111111-1111-4111-8111-111111111111',
    quantity: 1,
    productName: 'Pashmina',
    productSlug: 'pashmina',
    imagePath: null,
    imageAlt: null,
    size: null,
    colorName: 'Mocca',
    price: 75000,
    compareAtPrice: null,
    stockQuantity: 10,
    status: 'ok',
    ...overrides,
  }
}

describe('computeCartTotals', () => {
  it('menjumlahkan subtotal integer dari baris ok dan mengizinkan checkout', () => {
    const totals = computeCartTotals([line({ quantity: 2 }), line({ variantId: 'b', price: 125000 })])
    expect(totals).toEqual({ itemCount: 3, subtotal: 275000, problemCount: 0, canCheckout: true })
  })

  it('memblokir checkout bila ada baris tidak ok dan tidak menghitungnya di subtotal', () => {
    const totals = computeCartTotals([
      line({ quantity: 2 }),
      line({ variantId: 'b', status: 'insufficient', quantity: 5, stockQuantity: 3 }),
      line({ variantId: 'c', status: 'unavailable', price: 0 }),
    ])
    expect(totals).toEqual({ itemCount: 2, subtotal: 150000, problemCount: 2, canCheckout: false })
  })

  it('memblokir checkout untuk keranjang kosong', () => {
    expect(computeCartTotals([]).canCheckout).toBe(false)
  })
})

describe('cartLineProblem', () => {
  it('memberi pesan untuk setiap status bermasalah', () => {
    expect(cartLineProblem(line({}))).toBeNull()
    expect(cartLineProblem(line({ status: 'out_of_stock', stockQuantity: 0 }))).toMatch(/habis/)
    expect(cartLineProblem(line({ status: 'insufficient', stockQuantity: 3 }))).toMatch(/tersisa 3/)
    expect(cartLineProblem(line({ status: 'unavailable' }))).toMatch(/tidak lagi tersedia/)
  })
})
