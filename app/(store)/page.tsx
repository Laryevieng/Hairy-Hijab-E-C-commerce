import Link from "next/link"
import { ArrowRight, Feather, HeartHandshake, PackageCheck, Scissors } from "lucide-react"
import { HeroBanner } from "@/components/home"
import { CategoryCard } from "@/components/category"
import { ProductGrid } from "@/components/product"
import { Button } from "@/components/ui/button"
import { MOCK_CATEGORIES } from "@/lib/mock/categories"
import { MOCK_PRODUCTS } from "@/lib/mock/products"

/**
 * Halaman Beranda Hairy Hijab (Store Front).
 * Sesuai spesifikasi §8.1 dan §12.1.
 * Menggunakan data mock Fase 1 untuk 8 kategori dan produk terbaru.
 *
 * Catatan penting:
 * - Tidak memuat klaim sepihak, testimoni palsu, atau angka karangan.
 * - Copywriting placeholder ditandai TODO(owner) dan dicatat di plan §19.
 */
export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* 1. Hero Banner */}
      <HeroBanner />

      {/* 2. Grid 8 Kategori Pilihan */}
      <section
        id="kategori-pilihan"
        aria-label="Kategori Pilihan Hijab"
        className="py-12 sm:py-16 lg:py-20"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 sm:mb-12 text-center md:text-left flex flex-col md:flex-row md:items-end md:justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-gold-deep">
                Eksplorasi Koleksi
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-espresso">
                Delapan Kategori Pilihan
              </h2>
              {/* TODO(owner): Deskripsi bagian kategori final disesuaikan oleh pemilik */}
              <p className="text-sm sm:text-base text-espresso/70 max-w-xl">
                Temukan model hijab yang paling pas dengan rutinitas Anda, mulai
                dari bergo praktis hingga pashmina dan segi empat klasik.
              </p>
            </div>
          </div>

          {/* Grid 8 Kategori: 2 kolom (mobile) -> 4 kolom (desktop) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
            {MOCK_CATEGORIES.map((category) => (
              <CategoryCard
                key={category.id}
                id={category.id}
                name={category.name}
                slug={category.slug}
                description={category.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* 3. Bagian Produk Terbaru (Mock Data) */}
      <section
        aria-label="Koleksi Produk Terbaru"
        className="border-t border-sand/40 bg-sand/10 py-12 sm:py-16 lg:py-20"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 sm:mb-12 flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div className="space-y-2">
              <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-gold-deep">
                Rilisan Terkini
              </span>
              <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-espresso">
                Produk Terbaru
              </h2>
              {/* TODO(owner): Deskripsi bagian produk terbaru disesuaikan oleh pemilik */}
              <p className="text-sm sm:text-base text-espresso/70 max-w-xl">
                Koleksi hijab dengan pilihan warna netral elegan dan bahan sejuk
                berkualitas.
              </p>
            </div>

            <Button
              asChild
              variant="outline"
              className="self-start sm:self-auto min-h-[44px] border-sand bg-ivory text-espresso hover:bg-sand/30"
            >
              <Link href="/products" className="inline-flex items-center gap-2">
                <span>Lihat Semua Katalog</span>
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>

          {/* Grid Produk Responsif 2/3/4 kolom (§12.1) */}
          <ProductGrid products={MOCK_PRODUCTS} />
        </div>
      </section>

      {/* 4. Nilai & Komitmen Kualitas Brand (Bukan klaim/testimoni karangan) */}
      <section
        aria-label="Komitmen Kualitas Hairy Hijab"
        className="border-t border-sand/40 py-12 sm:py-16"
      >
        <div className="container mx-auto px-4 lg:px-8">
          <div className="mb-8 sm:mb-10 text-center">
            <span className="text-xs sm:text-sm font-semibold tracking-wider uppercase text-gold-deep">
              Kenyamanan Tanpa Kompromi
            </span>
            <h2 className="mt-1 font-serif text-2xl sm:text-3xl font-bold tracking-tight text-espresso">
              Komitmen Kualitas Kami
            </h2>
            {/* TODO(owner): Copywriting pilar nilai dan komitmen brand disesuaikan oleh pemilik */}
            <p className="mt-2 text-sm sm:text-base text-espresso/70 max-w-lg mx-auto">
              Setiap helai hijab dipersiapkan dengan perhatian pada detail bahan,
              potongan, dan kerapian.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="rounded-md border border-sand/40 bg-ivory p-6 space-y-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-sand/30 text-gold-deep">
                <Feather className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                Bahan Pilihan Sejuk
              </h3>
              <p className="text-xs sm:text-sm text-espresso/75 leading-relaxed">
                Pemilihan kain berpori baik yang ringan, lembut di kulit, dan
                tidak gerah saat beraktivitas.
              </p>
            </div>

            <div className="rounded-md border border-sand/40 bg-ivory p-6 space-y-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-sand/30 text-gold-deep">
                <Scissors className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                Potongan Pas & Rapi
              </h3>
              <p className="text-xs sm:text-sm text-espresso/75 leading-relaxed">
                Pola potongan dirancang proporsional membingkai wajah tanpa rasa
                menekan di pelipis.
              </p>
            </div>

            <div className="rounded-md border border-sand/40 bg-ivory p-6 space-y-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-sand/30 text-gold-deep">
                <HeartHandshake className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                Kerapian Jahitan
              </h3>
              <p className="text-xs sm:text-sm text-espresso/75 leading-relaxed">
                Standar jahitan tepi yang kuat, lurus, dan awet dicuci untuk
                pemakaian jangka panjang.
              </p>
            </div>

            <div className="rounded-md border border-sand/40 bg-ivory p-6 space-y-3">
              <div className="inline-flex size-10 items-center justify-center rounded-full bg-sand/30 text-gold-deep">
                <PackageCheck className="size-5" aria-hidden="true" />
              </div>
              <h3 className="font-serif text-lg font-bold text-espresso">
                Pengemasan Terjaga
              </h3>
              <p className="text-xs sm:text-sm text-espresso/75 leading-relaxed">
                Pesanan diperiksa kembali sebelum dikemas rapi untuk memastikan
                kualitas sampai di tangan Anda.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Banner Ajak Belanja Penutup */}
      <section
        aria-label="Ajakan Berbelanja"
        className="border-t border-sand/40 bg-espresso text-ivory py-12 sm:py-16"
      >
        <div className="container mx-auto px-4 lg:px-8 text-center space-y-6 max-w-2xl">
          <h2 className="font-serif text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-ivory">
            Temukan Hijab Nyaman untuk Setiap Hari
          </h2>
          {/* TODO(owner): Teks CTA penutup beranda final disesuaikan oleh pemilik */}
          <p className="text-sm sm:text-base text-ivory/80 leading-relaxed">
            Jelajahi seluruh variasi hijab, pilih warna favorit Anda, dan nikmati
            kemudahan berbelanja online.
          </p>
          <div className="flex flex-wrap justify-center gap-4 pt-2">
            <Button
              asChild
              size="lg"
              className="min-h-[44px] bg-gold-deep text-ivory hover:bg-gold-deep/90 focus-visible:ring-ring px-6 font-medium"
            >
              <Link href="/products">Mulai Belanja</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] border-sand/50 bg-transparent text-ivory hover:bg-ivory/10 hover:text-ivory px-6 font-medium"
            >
              <Link href="/sale">Lihat Koleksi Sale</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  )
}
