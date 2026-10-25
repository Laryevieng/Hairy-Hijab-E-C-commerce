import { describe, expect, it } from 'vitest'
import { computeCartView, type CartCatalogItem } from '@/lib/cart/compute-cart-view'

const item: CartCatalogItem = {
  variantId: '11111111-1111-4111-8111-111111111111',
  productName: 'Produk server',
  productSlug: 'produk-server',
  imagePath: 'product/image.jpg',
  imageAlt: 'Foto produk',
  size: 'M',
  colorName: 'Hitam',
  price: 75000,
  compareAtPrice: 90000,
  stockQuantity: 3,
}

describe('computeCartView', () => {
  it('marks available line ok and uses catalog-owned price and stock', () => {
    const [line] = computeCartView([{ variantId: item.variantId, quantity: 2 }], [item])
    expect(line.status).toBe('ok')
    expect(line.price).toBe(75000)
    expect(line.stockQuantity).toBe(3)
  })

  it('marks zero stock, insufficient stock, and missing catalog row distinctly', () => {
    const zero = { ...item, stockQuantity: 0 }
    const [out] = computeCartView([{ variantId: item.variantId, quantity: 1 }], [zero])
    expect(out.status).toBe('out_of_stock')
    const [insufficient] = computeCartView([{ variantId: item.variantId, quantity: 4 }], [item])
    expect(insufficient.status).toBe('insufficient')
    const [unavailable] = computeCartView([{ variantId: item.variantId, quantity: 1 }], [])
    expect(unavailable.status).toBe('unavailable')
  })
})
