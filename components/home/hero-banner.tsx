import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils/cn"

export interface HeroBannerProps {
  className?: string
}

/**
 * HeroBanner - Bagian utama (Hero Section) beranda Hairy Hijab.
 * Mengikuti arahan editorial premium §12.1.
 * Dilarang membuat klaim/testimoni/angka palsu.
 *
 * TODO(owner): Copywriting headline, subheadline, dan visual hero banner final ditentukan oleh pemilik.
 */
export function HeroBanner({ className }: HeroBannerProps) {
  return (
    <section
      aria-label="Sorotan Utama Koleksi Hairy Hijab"
      className={cn(
        "relative overflow-hidden border-b border-sand/40 bg-gradient-to-b from-sand/15 to-ivory py-12 sm:py-16 lg:py-20",
        className
      )}
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
          {/* Kolom Teks / Call to Action */}
          <div className="flex flex-col items-start space-y-6 lg:col-span-7">
            {/* Tag / Micro-copy editorial */}
            <div className="inline-flex items-center gap-2 rounded-full border border-sand bg-sand/30 px-3.5 py-1 text-xs font-medium tracking-wide text-espresso">
              <Sparkles className="size-3.5 text-gold-deep" aria-hidden="true" />
              <span>Koleksi Esensial Harian</span>
            </div>

            {/* Judul Utama Editorial */}
            <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-espresso leading-[1.15]">
              Keanggunan Sederhana untuk Kenyamanan Sehari-hari
            </h1>

            {/* Deskripsi / Subheadline */}
            <p className="max-w-2xl text-base sm:text-lg text-espresso/80 leading-relaxed">
              Koleksi hijab bergo, pashmina, dan segi empat dengan kurasi bahan
              pilihan yang sejuk, jatuh sempurna, dan nyaman menemani setiap
              aktivitas Anda.
            </p>

            {/* Aksi / CTA Buttons (Target sentuh minimal 44px §12.1) */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 pt-2">
              <Button
                asChild
                size="lg"
                className="min-h-[44px] min-w-[140px] bg-espresso text-ivory hover:bg-espresso/90 focus-visible:ring-ring px-6 text-sm sm:text-base font-medium shadow-sm"
              >
                <Link href="/products">
                  <span>Lihat Semua Produk</span>
                  <ArrowRight className="ml-2 size-4" aria-hidden="true" />
                </Link>
              </Button>

              <Button
                asChild
                variant="outline"
                size="lg"
                className="min-h-[44px] min-w-[140px] border-sand bg-ivory/60 text-espresso hover:bg-sand/30 hover:text-espresso px-6 text-sm sm:text-base font-medium"
              >
                <Link href="#kategori-pilihan">Jelajahi Kategori</Link>
              </Button>
            </div>
          </div>

          {/* Kolom Visual Editorial */}
          <div className="relative w-full lg:col-span-5">
            <div className="relative mx-auto aspect-[4/3] sm:aspect-[16/10] lg:aspect-[4/5] w-full max-w-[500px] overflow-hidden rounded-lg border border-sand/60 bg-sand/20 shadow-md">
              <Image
                src="/images/placeholders/hero-placeholder.svg"
                alt="Editorial Koleksi Hijab Hairy Hijab"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 42vw"
                className="object-cover object-center transition-transform duration-500 hover:scale-102"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
