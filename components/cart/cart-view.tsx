'use client'

import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { toast } from 'sonner'
import { CartItem } from '@/components/cart/cart-item'
import { CartSummary } from '@/components/cart/cart-summary'
import { useCartSnapshot } from '@/components/cart/use-cart-snapshot'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { cartLineVariantLabel, computeCartTotals } from '@/lib/cart/cart-totals'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'
import { useCartStore } from '@/stores/cart.store'

function CartLoading() {
  return (
    <div role="status" aria-label="Memuat keranjang" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-4">
        {[0, 1].map((key) => (
          <div key={key} className="flex gap-4 py-5">
            <div className="aspect-[3/4] w-20 animate-pulse rounded bg-sand/50 sm:w-24" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-2/3 animate-pulse rounded bg-sand/50" />
              <div className="h-4 w-1/3 animate-pulse rounded bg-sand/50" />
            </div>
          </div>
        ))}
      </div>
      <div className="h-48 animate-pulse rounded-md bg-sand/50" />
      <span className="sr-only">Memuat keranjang…</span>
    </div>
  )
}

export function CartView() {
  const snapshot = useCartSnapshot()
  const setQuantity = useCartStore((state) => state.setQuantity)
  const remove = useCartStore((state) => state.remove)
  const [statusMessage, setStatusMessage] = useState('')

  function handleRemove(line: CartViewLine) {
    remove(line.variantId)
    const name = [line.productName, cartLineVariantLabel(line)].filter(Boolean).join(', ')
    const message = `${name} dihapus dari keranjang.`
    setStatusMessage(message)
    toast.success(message)
  }

  return (
    <>
      <p role="status" className="sr-only">{statusMessage}</p>
      {snapshot.status === 'loading' && <CartLoading />}
      {snapshot.status === 'empty' && (
        <EmptyState
          icon={<ShoppingBag className="size-7" aria-hidden="true" />}
          title="Keranjang Anda masih kosong"
          description="Jelajahi koleksi Hairy Hijab dan tambahkan produk pilihan Anda ke keranjang."
          actionLabel="Mulai Belanja"
          actionHref="/products"
        />
      )}
      {snapshot.status === 'error' && (
        <ErrorState title="Keranjang tidak dapat dimuat" message={snapshot.error} onRetry={snapshot.retry} />
      )}
      {snapshot.status === 'ready' && (
        <div className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start">
          <ul aria-label="Produk di keranjang" className="divide-y divide-sand/50 border-y border-sand/50">
            {snapshot.lines.map((line) => (
              <CartItem key={line.variantId} line={line} onQuantityChange={setQuantity} onRemove={handleRemove} />
            ))}
          </ul>
          <CartSummary totals={computeCartTotals(snapshot.lines)} isRefreshing={snapshot.isRefreshing} />
        </div>
      )}
    </>
  )
}
