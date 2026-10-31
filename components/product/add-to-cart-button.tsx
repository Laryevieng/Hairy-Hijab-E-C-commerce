'use client'

import { useId, useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { MAX_QUANTITY, useCartStore } from '@/stores/cart.store'
import { useCartHydration } from '@/stores/use-cart-hydration'

export interface AddToCartButtonProps {
  /** `null` bila belum ada varian yang dipilih. */
  variantId: string | null
  productName: string
  variantLabel: string
  stockQuantity: number
}

export function AddToCartButton({ variantId, productName, variantLabel, stockQuantity }: AddToCartButtonProps) {
  const hydrated = useCartHydration()
  const add = useCartStore((state) => state.add)
  const quantityInCart = useCartStore((state) =>
    variantId ? state.lines.find((line) => line.variantId === variantId)?.quantity ?? 0 : 0,
  )
  const [statusMessage, setStatusMessage] = useState('')
  const reasonId = useId()

  const soldOut = stockQuantity <= 0
  const limit = Math.min(MAX_QUANTITY, stockQuantity)
  // Stok di halaman ini hanya untuk tampilan; validasi final ada di snapshot server dan checkout.
  const reason = !variantId
    ? 'Pilih varian terlebih dahulu.'
    : soldOut
      ? 'Varian ini sedang habis (Sold Out).'
      : hydrated && quantityInCart >= limit
        ? `Jumlah di keranjang sudah mencapai batas ${limit} untuk varian ini.`
        : null
  // Tunggu hidrasi agar penambahan tidak menimpa isi keranjang yang tersimpan.
  const disabled = !hydrated || reason !== null

  function handleAdd() {
    if (disabled || !variantId) return
    add(variantId, 1)
    const message = `${productName} (${variantLabel}) ditambahkan ke keranjang.`
    setStatusMessage(message)
    toast.success(message)
  }

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={handleAdd}
        disabled={disabled}
        aria-describedby={reason ? reasonId : undefined}
        className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded bg-espresso px-5 py-3 font-medium text-ivory transition-colors hover:bg-espresso/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <ShoppingBag className="size-4" aria-hidden="true" />
        {soldOut ? 'Sold Out' : 'Tambah ke Keranjang'}
      </button>
      {reason && <p id={reasonId} className="text-sm text-espresso/70">{reason}</p>}
      <p role="status" className="sr-only">{statusMessage}</p>
    </div>
  )
}
