"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, Search, ShoppingBag, User } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils/cn"
import type { CategoryListItem } from "@/types/domain"

export function MobileNavigation({ categories = [] }: { categories?: Pick<CategoryListItem, "id" | "name" | "slug">[] }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  const handleLinkClick = () => {
    setOpen(false)
  }

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden min-h-[44px] min-w-[44px] text-espresso hover:bg-sand/30 focus-visible:ring-2 focus-visible:ring-ring"
          aria-label="Buka menu navigasi"
        >
          <Menu className="size-6" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="w-[300px] sm:w-[350px] bg-ivory text-espresso p-0 flex flex-col"
      >
        <SheetHeader className="p-6 pb-2 text-left border-b border-sand/40">
          <SheetTitle className="font-serif text-2xl font-bold tracking-tight text-espresso">
            Hairy Hijab
          </SheetTitle>
          <SheetDescription className="text-xs text-espresso/70">
            Katalog Hijab & Koleksi Muslimah
          </SheetDescription>
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
          {/* Menu Kategori */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-espresso/60 mb-2">
              Kategori Hijab
            </p>
            <nav aria-label="Kategori Navigasi Mobile">
              <ul className="space-y-1">
                {categories.map((cat) => {
                  const href = `/categories/${cat.slug}`
                  const isActive = pathname === href
                  return (
                    <li key={cat.id}>
                      <Link
                        href={href}
                        onClick={handleLinkClick}
                        aria-current={isActive ? "page" : undefined}
                        className={cn(
                          "flex items-center px-3 py-2.5 rounded-md text-sm text-espresso/80 hover:text-espresso hover:bg-sand/30 transition-colors min-h-[44px]",
                          isActive && "bg-sand/40 font-semibold text-espresso"
                        )}
                      >
                        {cat.name}
                      </Link>
                    </li>
                  )
                })}
                <li>
                  <Link
                    href="/sale"
                    onClick={handleLinkClick}
                    aria-current={pathname === "/sale" ? "page" : undefined}
                    className={cn(
                      "flex items-center px-3 py-2.5 rounded-md text-sm text-danger font-semibold hover:bg-danger/10 transition-colors min-h-[44px]",
                      pathname === "/sale" && "bg-danger/15"
                    )}
                  >
                    Promo / Sale
                  </Link>
                </li>
              </ul>
            </nav>
          </div>

          <Separator className="bg-sand/50" />

          {/* Menu Belanja */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-espresso/60 mb-2">
              Menu Belanja
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/products"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2.5 rounded-md text-sm text-espresso/80 hover:text-espresso hover:bg-sand/30 transition-colors min-h-[44px]"
                >
                  Semua Produk
                </Link>
              </li>
              <li>
                <Link
                  href="/search"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-espresso/80 hover:text-espresso hover:bg-sand/30 transition-colors min-h-[44px]"
                >
                  <Search className="size-4" />
                  <span>Pencarian</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/cart"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-espresso/80 hover:text-espresso hover:bg-sand/30 transition-colors min-h-[44px]"
                >
                  <ShoppingBag className="size-4" />
                  <span>Keranjang Belanja</span>
                </Link>
              </li>
              <li>
                <Link
                  href="/account"
                  onClick={handleLinkClick}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-md text-sm text-espresso/80 hover:text-espresso hover:bg-sand/30 transition-colors min-h-[44px]"
                >
                  <User className="size-4" />
                  <span>Akun Saya</span>
                </Link>
              </li>
            </ul>
          </div>

          <Separator className="bg-sand/50" />

          {/* Bantuan & Panduan */}
          <div>
            <p className="px-3 text-xs font-semibold uppercase tracking-wider text-espresso/60 mb-2">
              Bantuan & Panduan
            </p>
            <ul className="space-y-1">
              <li>
                <Link
                  href="/size-guide"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-sm text-espresso/70 hover:text-espresso hover:bg-sand/20 rounded-md min-h-[44px]"
                >
                  Panduan Ukuran
                </Link>
              </li>
              <li>
                <Link
                  href="/care-guide"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-sm text-espresso/70 hover:text-espresso hover:bg-sand/20 rounded-md min-h-[44px]"
                >
                  Panduan Perawatan
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  onClick={handleLinkClick}
                  className="flex items-center px-3 py-2 text-sm text-espresso/70 hover:text-espresso hover:bg-sand/20 rounded-md min-h-[44px]"
                >
                  Hubungi Kami
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  )
}
