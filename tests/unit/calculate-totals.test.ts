import { describe, expect, it } from 'vitest'
import { calculateTotals } from '@/lib/pricing/calculate-totals'

describe('calculateTotals', () => {
  it('sums line totals and adds shipping', () => {
    expect(calculateTotals({
      lines: [{ price: 125000, quantity: 2 }, { price: 89000, quantity: 1 }],
      shippingCost: 20000,
    })).toEqual({ subtotal: 339000, shippingCost: 20000, discount: 0, grandTotal: 359000 })
  })

  it('subtracts the discount from the grand total', () => {
    expect(calculateTotals({
      lines: [{ price: 100000, quantity: 1 }],
      shippingCost: 15000,
      discount: 5000,
    })).toEqual({ subtotal: 100000, shippingCost: 15000, discount: 5000, grandTotal: 110000 })
  })

  it('returns zeros for an empty cart with free shipping', () => {
    expect(calculateTotals({ lines: [], shippingCost: 0 })).toEqual({
      subtotal: 0, shippingCost: 0, discount: 0, grandTotal: 0,
    })
  })

  it('handles zero-priced lines and zero quantity', () => {
    expect(calculateTotals({
      lines: [{ price: 0, quantity: 3 }, { price: 50000, quantity: 0 }],
      shippingCost: 20000,
    })).toEqual({ subtotal: 0, shippingCost: 20000, discount: 0, grandTotal: 20000 })
  })

  it('allows a discount equal to subtotal plus shipping', () => {
    expect(calculateTotals({ lines: [{ price: 10000, quantity: 1 }], shippingCost: 5000, discount: 15000 }).grandTotal)
      .toBe(0)
  })

  it.each([
    ['fractional price', { lines: [{ price: 1000.5, quantity: 1 }], shippingCost: 0 }],
    ['negative price', { lines: [{ price: -1, quantity: 1 }], shippingCost: 0 }],
    ['fractional quantity', { lines: [{ price: 1000, quantity: 1.5 }], shippingCost: 0 }],
    ['negative quantity', { lines: [{ price: 1000, quantity: -1 }], shippingCost: 0 }],
    ['fractional shipping', { lines: [], shippingCost: 0.1 }],
    ['negative shipping', { lines: [], shippingCost: -20000 }],
    ['fractional discount', { lines: [], shippingCost: 0, discount: 0.5 }],
    ['negative discount', { lines: [], shippingCost: 0, discount: -1 }],
    ['NaN price', { lines: [{ price: Number.NaN, quantity: 1 }], shippingCost: 0 }],
    ['infinite shipping', { lines: [], shippingCost: Number.POSITIVE_INFINITY }],
    ['unsafe integer subtotal', { lines: [{ price: Number.MAX_SAFE_INTEGER, quantity: 2 }], shippingCost: 0 }],
    ['discount larger than the total', { lines: [{ price: 10000, quantity: 1 }], shippingCost: 0, discount: 10001 }],
  ])('throws for %s', (_label, input) => {
    expect(() => calculateTotals(input)).toThrow(RangeError)
  })
})
