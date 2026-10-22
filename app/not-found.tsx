import Link from "next/link"
import { Home, ShoppingBag } from "lucide-react"
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"

/**
 * Halaman 404 - Not Found Hairy Hijab.
 * Ditampilkan saat rute tidak ditemukan (mis. /rute-asal-asalan).
 * Sesuai panduan §8.1 dan §12.1.
 */
export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col bg-ivory text-espresso">
      <AnnouncementBar />
      <SiteHeader />

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-16 sm:py-24"
        role="main"
      >
        <div className="mx-auto max-w-lg text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-sand/30 px-3.5 py-1 text-xs font-semibold uppercase tracking-wider text-gold-deep">
            <span>Galat 404</span>
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-espresso">
              Halaman Tidak Ditemukan
            </h1>
            <p className="text-sm sm:text-base text-espresso/75 leading-relaxed">
              Maaf, halaman yang Anda tuju tidak tersedia, telah dihapus, atau
              tautan yang Anda klik sudah tidak aktif.
            </p>
          </div>

          {/* Tombol Navigasi Alternatif (Target sentuh minimal 44px §12.1) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              asChild
              size="lg"
              className="min-h-[44px] bg-espresso text-ivory hover:bg-espresso/90 focus-visible:ring-ring px-6 font-medium"
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <Home className="size-4" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </Link>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] border-sand bg-ivory text-espresso hover:bg-sand/30 px-6 font-medium"
            >
              <Link href="/products" className="inline-flex items-center gap-2">
                <ShoppingBag className="size-4" aria-hidden="true" />
                <span>Katalog Produk</span>
              </Link>
            </Button>
          </div>

          <div className="pt-6 border-t border-sand/40">
            <p className="text-xs sm:text-sm text-espresso/70">
              Sedang mencari sesuatu? Coba fitur{" "}
              <Link
                href="/search"
                className="font-medium text-gold-deep underline underline-offset-4 hover:text-espresso"
              >
                Pencarian Produk
              </Link>{" "}
              atau kunjungi halaman{" "}
              <Link
                href="/contact"
                className="font-medium text-gold-deep underline underline-offset-4 hover:text-espresso"
              >
                Kontak Bantuan
              </Link>
              .
            </p>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
