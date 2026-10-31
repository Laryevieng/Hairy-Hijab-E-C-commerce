import type { Metadata } from 'next'
import { CartView } from '@/components/cart/cart-view'

export const metadata: Metadata = {
  title: 'Keranjang',
  description: 'Ringkasan produk di keranjang belanja Hairy Hijab.',
  robots: { index: false, follow: false },
}

export default function CartPage() {
  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:py-12 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-espresso">Keranjang</h1>
      {/* Isi keranjang tersimpan di browser; harga dan stok diambil dari server setelah mount. */}
      <CartView />
    </div>
  )
}
