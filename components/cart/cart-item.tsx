'use client'

import Link from 'next/link'
import { useId } from 'react'
import { Trash2 } from 'lucide-react'
import { QuantitySelector } from '@/components/product/quantity-selector'
import { cartLineProblem, cartLineVariantLabel, productImageUrl } from '@/lib/cart/cart-totals'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'
import { formatRupiah } from '@/lib/utils/format'
import { MAX_QUANTITY } from '@/stores/cart.store'

export interface CartItemProps {
  line: CartViewLine
  onQuantityChange: (variantId: string, quantity: number) => void
  onRemove: (line: CartViewLine) => void
}

export function CartItem({ line, onQuantityChange, onRemove }: CartItemProps) {
  const problemId = useId()
  const variant = cartLineVariantLabel(line)
  const problem = cartLineProblem(line)
  const imageUrl = productImageUrl(line.imagePath)
  const label = [line.productName, variant].filter(Boolean).join(', ')
  const available = line.status === 'ok' || line.status === 'insufficient'
  // Baris kurang stok tetap boleh dikurangi sampai sesuai stok; batas atas tidak melebihi stok saat ini.
  const max = Math.min(MAX_QUANTITY, Math.max(line.stockQuantity, 1))

  return (
    <li
      aria-describedby={problem ? problemId : undefined}
      className={`flex gap-4 py-5 ${problem ? 'rounded border-l-4 border-danger bg-danger/5 pl-3' : ''}`}
    >
      <div className="relative aspect-[3/4] w-20 shrink-0 overflow-hidden rounded bg-sand/20 sm:w-24">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage URL is assembled from a validated bucket path.
          <img src={imageUrl} alt={line.imageAlt ?? line.productName} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center p-1 text-center text-[10px] text-espresso/60">Foto belum tersedia</div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            {line.productSlug ? (
              <Link href={`/products/${line.productSlug}`} className="font-medium text-espresso underline-offset-2 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                {line.productName}
              </Link>
            ) : (
              <p className="font-medium text-espresso">{line.productName}</p>
            )}
            {variant && <p className="text-sm text-espresso/70">{variant}</p>}
            {available && <p className="text-sm text-espresso/80">{formatRupiah(line.price)} / item</p>}
          </div>
          {available && (
            <p className="shrink-0 font-semibold text-espresso">{formatRupiah(line.price * line.quantity)}</p>
          )}
        </div>

        {problem && <p id={problemId} className="text-sm font-medium text-danger">{problem}</p>}

        <div className="flex flex-wrap items-center justify-between gap-3">
          {available ? (
            <QuantitySelector
              value={line.quantity}
              max={Math.max(max, line.quantity)}
              label={label}
              onChange={(quantity) => onQuantityChange(line.variantId, quantity)}
            />
          ) : (
            <p className="text-sm text-espresso/70">Jumlah: {line.quantity}</p>
          )}
          <button
            type="button"
            onClick={() => onRemove(line)}
            aria-label={`Hapus ${label} dari keranjang`}
            className="inline-flex min-h-[44px] items-center gap-2 rounded px-3 text-sm text-espresso/80 hover:bg-sand/30 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Hapus
          </button>
        </div>
      </div>
    </li>
  )
}
