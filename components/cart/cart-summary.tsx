import Link from 'next/link'
import { useId } from 'react'
import type { CartTotals } from '@/lib/cart/cart-totals'
import { formatRupiah } from '@/lib/utils/format'

export function CartSummary({ totals, isRefreshing = false }: { totals: CartTotals; isRefreshing?: boolean }) {
  const reasonId = useId()
  const blocked = !totals.canCheckout || isRefreshing
  const reason = totals.problemCount > 0
    ? `${totals.problemCount} produk perlu diperbaiki sebelum checkout.`
    : isRefreshing
      ? 'Memperbarui harga dan stok…'
      : null

  return (
    <section aria-labelledby={`${reasonId}-title`} className="space-y-4 rounded-md border border-sand/60 bg-ivory p-5 lg:sticky lg:top-24">
      <h2 id={`${reasonId}-title`} className="font-serif text-xl font-semibold text-espresso">Ringkasan</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>Subtotal ({totals.itemCount} item)</dt>
          <dd className="font-semibold">{formatRupiah(totals.subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4 text-espresso/70">
          <dt>Ongkos kirim</dt>
          <dd>Dihitung saat checkout</dd>
        </div>
      </dl>

      {blocked ? (
        <button
          type="button"
          disabled
          aria-describedby={reason ? reasonId : undefined}
          className="inline-flex min-h-[44px] w-full cursor-not-allowed items-center justify-center rounded bg-espresso px-5 py-3 font-medium text-ivory opacity-60"
        >
          Lanjut ke Checkout
        </button>
      ) : (
        <Link
          href="/checkout"
          className="inline-flex min-h-[44px] w-full items-center justify-center rounded bg-espresso px-5 py-3 font-medium text-ivory transition-colors hover:bg-espresso/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        >
          Lanjut ke Checkout
        </Link>
      )}
      {reason && <p id={reasonId} role="status" className={totals.problemCount > 0 ? 'text-sm text-danger' : 'text-sm text-espresso/70'}>{reason}</p>}
      <p className="text-xs text-espresso/70">Harga dan stok diperiksa ulang oleh server saat pesanan dibuat.</p>
    </section>
  )
}
