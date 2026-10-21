import Link from "next/link"
import { Search, ShoppingBag, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { MobileNavigation } from "@/components/layout/mobile-navigation"
import { MainNavigation } from "@/components/layout/main-navigation"

export function SiteHeader() {
  return (
    <header
      role="banner"
      className="sticky top-0 z-40 w-full border-b border-sand/40 bg-ivory/95 backdrop-blur supports-[backdrop-filter]:bg-ivory/80"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Sisi Kiri: Tombol Hamburger Menu (Mobile) */}
          <div className="flex items-center md:hidden">
            <MobileNavigation />
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
            <MainNavigation />
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

            <Link
              href="/cart"
              aria-label="Keranjang belanja (0 item)"
              className="relative inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-md text-espresso/80 transition-colors hover:text-espresso hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <ShoppingBag className="size-5" />
              <Badge
                variant="default"
                className="absolute top-1 right-1 h-4 min-w-4 px-1 rounded-full text-[10px] font-bold flex items-center justify-center bg-espresso text-ivory pointer-events-none"
              >
                0
              </Badge>
            </Link>
          </div>
        </div>

        {/* Bar navigasi untuk tablet/layar medium (md hingga lg) */}
        <div className="hidden md:flex lg:hidden pb-3 justify-center border-t border-sand/30 pt-2">
          <MainNavigation />
        </div>
      </div>
    </header>
  )
}
