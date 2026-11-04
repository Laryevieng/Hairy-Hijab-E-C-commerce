'use client'

import Link from 'next/link'
import { useId } from 'react'
import { AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  cartLineProblem,
  cartLineVariantLabel,
  productImageUrl,
  type CartTotals,
} from '@/lib/cart/cart-totals'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'
import type { Totals } from '@/lib/pricing/calculate-totals'
import { formatRupiah } from '@/lib/utils/format'
import type { ShippingQuote } from '@/services/shipping.service'

export type ShippingState =
  | { status: 'idle' }
  | { status: 'loading'; province: string }
  | { status: 'ready'; province: string; quote: ShippingQuote }
  | { status: 'error'; province: string; message: string }

interface CheckoutSummaryProps {
  lines: CartViewLine[]
  cartTotals: CartTotals
  shippingState: ShippingState
  totals: Totals | null
  isSubmitting: boolean
  isRefreshing?: boolean
}

export function CheckoutSummary({
  lines,
  cartTotals,
  shippingState,
  totals,
  isSubmitting,
  isRefreshing = false,
}: CheckoutSummaryProps) {
  const reasonId = useId()
  const isShippingError = shippingState.status === 'error'
  const isShippingLoading = shippingState.status === 'loading'
  const blocked =
    !cartTotals.canCheckout ||
    isShippingError ||
    isShippingLoading ||
    isSubmitting ||
    isRefreshing

  let disabledReason: string | null = null
  if (cartTotals.problemCount > 0) {
    disabledReason = `${cartTotals.problemCount} produk bermasalah. Perbaiki di keranjang sebelum checkout.`
  } else if (isShippingLoading) {
    disabledReason = 'Sedang menghitung ongkos kirim…'
  } else if (isShippingError) {
    disabledReason = shippingState.message
  } else if (isRefreshing) {
    disabledReason = 'Sedang memperbarui ketersediaan stok…'
  }

  return (
    <section
      aria-labelledby="summary-heading"
      className="space-y-6 rounded-lg border border-sand/60 bg-ivory p-5 sm:p-6 lg:sticky lg:top-24"
    >
      <div className="flex items-center justify-between border-b border-sand/40 pb-4">
        <h2 id="summary-heading" className="font-serif text-xl font-semibold text-espresso">
          Ringkasan Pesanan
        </h2>
        <Link href="/cart" className="text-xs text-espresso/70 underline hover:text-espresso">
          Ubah keranjang
        </Link>
      </div>

      {/* Daftar ringkas produk */}
      <div className="space-y-3">
        <ul aria-label="Item yang dibeli" className="max-h-64 divide-y divide-sand/40 overflow-y-auto pr-1 text-sm">
          {lines.map((line) => {
            const problem = cartLineProblem(line)
            const variantText = cartLineVariantLabel(line)
            const photoSrc = productImageUrl(line.imagePath)

            return (
              <li key={line.variantId} className="flex gap-3 py-3 first:pt-0 last:pb-0">
                <div className="relative aspect-[3/4] w-12 shrink-0 overflow-hidden rounded bg-sand/30">
                  {photoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoSrc}
                      alt={line.imageAlt ?? line.productName}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-[10px] text-espresso/60">
                      Hijab
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-espresso">{line.productName}</p>
                  {variantText && <p className="text-xs text-espresso/70">{variantText}</p>}
                  <p className="mt-1 text-xs text-espresso/80">
                    {line.quantity} × {formatRupiah(line.price)}
                  </p>
                  {problem && (
                    <p className="mt-1 flex items-center gap-1 text-xs font-medium text-destructive">
                      <AlertCircle className="size-3 shrink-0" aria-hidden="true" />
                      <span>{problem}</span>
                    </p>
                  )}
                </div>

                <div className="text-right text-xs font-semibold text-espresso">
                  {formatRupiah(line.price * line.quantity)}
                </div>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Rincian biaya */}
      <dl className="space-y-2 border-t border-sand/40 pt-4 text-sm text-espresso">
        <div className="flex justify-between gap-4">
          <dt>Subtotal ({cartTotals.itemCount} unit)</dt>
          <dd className="font-semibold">{formatRupiah(cartTotals.subtotal)}</dd>
        </div>

        <div className="flex items-center justify-between gap-4">
          <dt>Ongkos kirim</dt>
          <dd className="text-right">
            {shippingState.status === 'idle' && (
              <span className="text-xs text-espresso/60">Pilih provinsi</span>
            )}
            {shippingState.status === 'loading' && (
              <span className="inline-flex items-center gap-1.5 text-xs text-espresso/70">
                <Loader2 className="size-3 animate-spin" aria-hidden="true" />
                <span>Menghitung…</span>
              </span>
            )}
            {shippingState.status === 'ready' && (
              <div className="text-right">
                <span className="font-semibold">{formatRupiah(shippingState.quote.cost)}</span>
                <span className="block text-[11px] text-espresso/70">
                  {shippingState.quote.label} ({shippingState.quote.estimatedDays})
                </span>
              </div>
            )}
            {shippingState.status === 'error' && (
              <span className="text-xs font-medium text-destructive">Tidak tersedia</span>
            )}
          </dd>
        </div>

        {totals && totals.discount > 0 && (
          <div className="flex justify-between gap-4 text-forest">
            <dt>Diskon</dt>
            <dd className="font-semibold">- {formatRupiah(totals.discount)}</dd>
          </div>
        )}

        <div className="flex items-baseline justify-between gap-4 border-t border-sand/40 pt-3 text-base font-semibold">
          <dt>Total Tagihan</dt>
          <dd className="text-lg text-espresso">
            {totals ? formatRupiah(totals.grandTotal) : formatRupiah(cartTotals.subtotal)}
          </dd>
        </div>
        {!totals && (
          <p className="text-right text-[11px] text-espresso/60">
            * Belum termasuk ongkos kirim
          </p>
        )}
      </dl>

      {/* Tombol Buat Pesanan */}
      <div className="space-y-3">
        <Button
          type="submit"
          disabled={blocked}
          aria-describedby={disabledReason ? reasonId : undefined}
          className="h-12 w-full bg-espresso text-base font-medium text-ivory hover:bg-espresso/90 disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 size-4 animate-spin" aria-hidden="true" />
              Memproses Pesanan…
            </>
          ) : (
            'Buat Pesanan'
          )}
        </Button>

        {disabledReason && (
          <p
            id={reasonId}
            role="status"
            className={`text-xs ${
              cartTotals.problemCount > 0 || shippingState.status === 'error'
                ? 'text-destructive font-medium'
                : 'text-espresso/70'
            }`}
          >
            {disabledReason}
          </p>
        )}
      </div>

      <p className="text-center text-[11px] leading-relaxed text-espresso/60">
        Total akhir, ketersediaan stok, dan ongkos kirim dikonfirmasi ulang oleh sistem saat pesanan dibuat.
      </p>
    </section>
  )
}
