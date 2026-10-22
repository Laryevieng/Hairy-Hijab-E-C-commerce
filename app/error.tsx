"use client"

import { useEffect } from "react"
import Link from "next/link"
import { AlertTriangle, Home, RefreshCw } from "lucide-react"
import { AnnouncementBar, SiteFooter, SiteHeader } from "@/components/layout"
import { Button } from "@/components/ui/button"

interface RootErrorProps {
  error: Error & { digest?: string }
  reset: () => void
}

/**
 * Root Error Boundary Hairy Hijab.
 * Menangkap runtime error pada segmen halaman sesuai konvensi App Router.
 * Sesuai panduan §10.2 dan §12.1.
 */
export default function RootError({ error, reset }: RootErrorProps) {
  useEffect(() => {
    // Log error untuk kebutuhan pemantauan teknis (tanpa mengekspos secret/data sensitif)
    console.error("Unhandled runtime error caught by root boundary:", error)
  }, [error])

  return (
    <div className="flex min-h-screen flex-col bg-ivory text-espresso">
      <AnnouncementBar />
      <SiteHeader />

      <main
        id="main-content"
        className="flex flex-1 items-center justify-center px-4 py-16 sm:py-24"
        role="alert"
        aria-live="assertive"
      >
        <div className="mx-auto max-w-lg text-center space-y-6">
          <div className="inline-flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger mx-auto">
            <AlertTriangle className="size-7" aria-hidden="true" />
          </div>

          <div className="space-y-3">
            <h1 className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-espresso">
              Terjadi Kesalahan Teknis
            </h1>
            <p className="text-sm sm:text-base text-espresso/75 leading-relaxed">
              Maaf, kami mengalami kendala saat memproses permintaan Anda.
              Silakan coba memuat ulang halaman ini.
            </p>
            {error.digest && (
              <p className="text-xs text-espresso/50 font-mono">
                Kode kesalahan: {error.digest}
              </p>
            )}
          </div>

          {/* Tombol Aksi: Coba lagi atau Kembali ke Beranda (§12.1 target ≥ 44px) */}
          <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
            <Button
              type="button"
              size="lg"
              onClick={() => reset()}
              className="min-h-[44px] bg-espresso text-ivory hover:bg-espresso/90 focus-visible:ring-ring px-6 font-medium inline-flex items-center gap-2"
            >
              <RefreshCw className="size-4" aria-hidden="true" />
              <span>Coba Muat Ulang</span>
            </Button>

            <Button
              asChild
              variant="outline"
              size="lg"
              className="min-h-[44px] border-sand bg-ivory text-espresso hover:bg-sand/30 px-6 font-medium"
            >
              <Link href="/" className="inline-flex items-center gap-2">
                <Home className="size-4" aria-hidden="true" />
                <span>Kembali ke Beranda</span>
              </Link>
            </Button>
          </div>
        </div>
      </main>

      <SiteFooter />
    </div>
  )
}
