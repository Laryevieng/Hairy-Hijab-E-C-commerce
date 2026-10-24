import Link from 'next/link'

export default function CategoryNotFound() {
  return (
    <section className="container mx-auto flex min-h-[45vh] flex-col items-center justify-center px-4 py-16 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">Kategori</p>
      <h1 className="mt-3 font-serif text-3xl font-semibold text-espresso">Kategori tidak ditemukan</h1>
      <p className="mt-2 max-w-lg text-sm text-espresso/70">Kategori ini tidak tersedia atau sudah tidak aktif.</p>
      <Link href="/products" className="mt-6 inline-flex min-h-11 items-center rounded-md bg-espresso px-5 text-sm font-semibold text-ivory">
        Kembali ke semua produk
      </Link>
    </section>
  )
}
