import type { CartViewLine } from '@/lib/cart/compute-cart-view'

export interface CartTotals {
  /** Jumlah unit pada baris berstatus `ok`. */
  itemCount: number
  /** Subtotal rupiah (integer) dari baris berstatus `ok`; ongkir dihitung saat checkout. */
  subtotal: number
  /** Jumlah baris yang tidak `ok` (habis, stok kurang, atau tidak tersedia). */
  problemCount: number
  /** Checkout hanya boleh bila keranjang berisi dan semua baris `ok`. */
  canCheckout: boolean
}

export function computeCartTotals(lines: CartViewLine[]): CartTotals {
  const okLines = lines.filter((line) => line.status === 'ok')
  const problemCount = lines.length - okLines.length
  return {
    itemCount: okLines.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: okLines.reduce((sum, line) => sum + line.price * line.quantity, 0),
    problemCount,
    canCheckout: lines.length > 0 && problemCount === 0,
  }
}

export function cartLineProblem(line: CartViewLine): string | null {
  switch (line.status) {
    case 'ok':
      return null
    case 'out_of_stock':
      return 'Stok habis. Hapus produk ini untuk melanjutkan.'
    case 'insufficient':
      return `Stok tersisa ${line.stockQuantity}. Kurangi jumlah untuk melanjutkan.`
    case 'unavailable':
      return 'Produk tidak lagi tersedia. Hapus dari keranjang untuk melanjutkan.'
  }
}

export function cartLineVariantLabel(line: Pick<CartViewLine, 'size' | 'colorName'>): string | null {
  return [line.size, line.colorName].filter(Boolean).join(' · ') || null
}

export function productImageUrl(path: string | null): string | null {
  if (!path) return null
  const safePath = path.split('/').map(encodeURIComponent).join('/')
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${safePath}`
}
