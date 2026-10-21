import type { ReactNode } from "react"
import { AnnouncementBar } from "@/components/layout/announcement-bar"
import { SiteHeader } from "@/components/layout/site-header"
import { SiteFooter } from "@/components/layout/site-footer"

interface StoreLayoutProps {
  children: ReactNode
}

export default function StoreLayout({ children }: StoreLayoutProps) {
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
      <SiteHeader />
      <main id="main-content" className="flex-1">
        {children}
      </main>
      <SiteFooter />
    </div>
  )
}
