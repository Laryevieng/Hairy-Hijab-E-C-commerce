import Link from "next/link"
import { Suspense } from "react"
import { Search, User } from "lucide-react"
import { CartSheet } from "@/components/cart/cart-sheet"
import { MobileNavigation } from "@/components/layout/mobile-navigation"
import { MainNavigation } from "@/components/layout/main-navigation"
import type { CategoryListItem } from "@/types/domain"

export function SiteHeader({ categories = [] }: { categories?: Pick<CategoryListItem, "id" | "name" | "slug">[] }) {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-sand/40 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Sisi Kiri: Tombol Hamburger Menu (Mobile) */}
          <div className="flex items-center md:hidden">
            <Suspense fallback={<div className="size-11" />}>
              <MobileNavigation categories={categories} />
            </Suspense>
          </div>

          {/* Wordmark Logo Hairy Hijab */}
          <div className="flex items-center justify-center md:justify-start">
            <Link
              href="/"
              className="font-serif text-2xl lg:text-3xl font-bold tracking-tight text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm py-1"
              aria-label="Hairy Hijab Beranda"
            >
              Hairy Hijab
            </Link>
          </div>

          {/* Tengah: MainNavigation (desktop lg+) */}
          <div className="hidden lg:flex flex-1 justify-center">
            <Suspense fallback={<div className="h-11" />}>
              <MainNavigation categories={categories} />
            </Suspense>
          </div>

          {/* Sisi Kanan: Aksi Pengguna (Pencarian, Akun, Keranjang) */}
          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              href="/search"
              aria-label="Pencarian produk"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-espresso/80 transition-colors hover:text-espresso hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <Search className="size-5" />
            </Link>

            <Link
              href="/account"
              aria-label="Akun saya"
              className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-espresso/80 transition-colors hover:text-espresso hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <User className="size-5" />
            </Link>

            <CartSheet />
          </div>
        </div>

        {/* Bar navigasi untuk tablet/layar medium (md hingga lg) */}
        <div className="hidden md:flex lg:hidden pb-3 justify-center border-t border-sand/30 pt-2">
          <Suspense fallback={<div className="h-11" />}>
            <MainNavigation categories={categories} />
          </Suspense>
        </div>
      </div>
    </header>
  )
}
