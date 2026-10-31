'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ShoppingBag } from 'lucide-react'
import { Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { useCartSnapshot } from '@/components/cart/use-cart-snapshot'
import { cartLineProblem, cartLineVariantLabel, computeCartTotals } from '@/lib/cart/cart-totals'
import { formatRupiah } from '@/lib/utils/format'
import { selectCartItemCount, useCartStore } from '@/stores/cart.store'
import { useCartHydration } from '@/stores/use-cart-hydration'

const linkButton = 'inline-flex min-h-[44px] w-full items-center justify-center rounded bg-espresso px-5 py-3 font-medium text-ivory transition-colors hover:bg-espresso/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2'

export function CartSheet() {
  const [open, setOpen] = useState(false)
  const hydrated = useCartHydration()
  const storedCount = useCartStore(selectCartItemCount)
  // Nilai tersimpan hanya ditampilkan setelah mount agar markup server dan klien sama.
  const count = hydrated ? storedCount : 0
  const snapshot = useCartSnapshot(open)
  const close = () => setOpen(false)

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label={`Keranjang belanja (${count} item)`}
          className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-espresso/80 transition-colors hover:bg-sand/30 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ShoppingBag className="size-5" aria-hidden="true" />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute top-1 right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-espresso px-1 text-[10px] font-bold text-ivory"
          >
            {count > 99 ? '99+' : count}
          </span>
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-full bg-ivory text-espresso sm:max-w-md">
        <SheetHeader className="border-b border-sand/50">
          <SheetTitle className="font-serif text-2xl text-espresso">Keranjang</SheetTitle>
          <SheetDescription className="text-sm text-espresso/70">
            {count > 0 ? `${count} item di keranjang Anda.` : 'Keranjang Anda masih kosong.'}
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4">
          {snapshot.status === 'loading' && <p role="status" className="py-6 text-sm text-espresso/70">Memuat keranjang…</p>}
          {snapshot.status === 'empty' && (
            <div className="space-y-4 py-6">
              <p className="text-sm text-espresso/80">Belum ada produk di keranjang.</p>
              <Link href="/products" onClick={close} className={linkButton}>Mulai Belanja</Link>
            </div>
          )}
          {snapshot.status === 'error' && (
            <div role="alert" className="space-y-3 py-6 text-sm">
              <p className="text-danger">{snapshot.error}</p>
              <button type="button" onClick={snapshot.retry} className="min-h-[44px] rounded border border-espresso px-4 font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">Coba Lagi</button>
            </div>
          )}
          {snapshot.status === 'ready' && (
            <ul className="divide-y divide-sand/50" aria-label="Produk di keranjang">
              {snapshot.lines.map((line) => {
                const variant = cartLineVariantLabel(line)
                const problem = cartLineProblem(line)
                return (
                  <li key={line.variantId} className="space-y-1 py-4 text-sm">
                    <p className="font-medium">{line.productName}</p>
                    {variant && <p className="text-espresso/70">{variant}</p>}
                    <p className="text-espresso/80">
                      {line.quantity} × {line.status === 'unavailable' ? '—' : formatRupiah(line.price)}
                    </p>
                    {problem && <p className="text-danger">{problem}</p>}
                  </li>
                )
              })}
            </ul>
          )}
        </div>

        {snapshot.status === 'ready' && (
          <SheetFooter className="border-t border-sand/50">
            <div className="flex items-baseline justify-between text-sm">
              <span>Subtotal</span>
              <span className="text-base font-semibold">{formatRupiah(computeCartTotals(snapshot.lines).subtotal)}</span>
            </div>
            <p className="text-xs text-espresso/70">Ongkos kirim dihitung saat checkout.</p>
            <Link href="/cart" onClick={close} className={linkButton}>Lihat Keranjang</Link>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  )
}
