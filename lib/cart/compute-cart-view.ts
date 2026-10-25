import type { CartLine } from '@/stores/cart.store'

export interface CartCatalogItem {
  variantId: string
  productName: string
  productSlug: string
  imagePath: string | null
  imageAlt: string | null
  size: string | null
  colorName: string | null
  price: number
  compareAtPrice: number | null
  stockQuantity: number
}

export type CartLineStatus = 'ok' | 'out_of_stock' | 'insufficient' | 'unavailable'

export interface CartViewLine extends CartCatalogItem, CartLine {
  status: CartLineStatus
}

export function computeCartView(lines: CartLine[], catalog: CartCatalogItem[]): CartViewLine[] {
  const byVariant = new Map(catalog.map((item) => [item.variantId, item]))
  return lines.map((line) => {
    const item = byVariant.get(line.variantId)
    if (!item) {
      return {
        ...line,
        productName: 'Produk tidak tersedia',
        productSlug: '',
        imagePath: null,
        imageAlt: null,
        size: null,
        colorName: null,
        price: 0,
        compareAtPrice: null,
        stockQuantity: 0,
        status: 'unavailable',
      }
    }
    const status: CartLineStatus = item.stockQuantity <= 0
      ? 'out_of_stock'
      : line.quantity > item.stockQuantity ? 'insufficient' : 'ok'
    return { ...line, ...item, status }
  })
}
