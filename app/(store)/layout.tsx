import type { ReactNode } from "react"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"
import { Toaster } from "@/components/ui/sonner"
import { getCategories } from "@/services/catalog.service"

// Navigasi membaca kategori dari database pada request; izinkan layout toko memblokir render awal.
export const instant = false

interface StoreLayoutProps {
  children: ReactNode
}

export default async function StoreLayout({ children }: StoreLayoutProps) {
  const categories = await getCategories()
  return (
    <div className="flex min-h-screen flex-col bg-ivory text-espresso">
      {/* Skip link untuk aksesibilitas keyboard dan pembaca layar */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:px-4 focus:py-2 focus:bg-espresso focus:text-ivory focus:rounded-md focus:shadow-md focus:outline-none focus:ring-2 focus:ring-ring"
      >
        Lewati ke konten utama
      </a>
      <AnnouncementBar />
      <SiteHeader categories={categories} />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter categories={categories} />
      <Toaster position="top-center" />
    </div>
  )
}
