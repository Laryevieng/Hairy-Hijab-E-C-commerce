import Link from 'next/link'
import { FileQuestion } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function OrderNotFound() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-16 sm:py-24 text-center space-y-6">
      <div className="mx-auto flex size-16 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <FileQuestion className="size-8" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-stone-900 sm:text-3xl">
          Pesanan Tidak Ditemukan
        </h1>
        <p className="text-sm text-stone-600 max-w-md mx-auto leading-relaxed">
          Pesanan yang Anda cari tidak ditemukan atau tautan akses tidak valid. Pastikan nomor pesanan dan tautan token sudah lengkap dan benar.
        </p>
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
        <Button asChild variant="default">
          <Link href="/">Kembali ke Beranda</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/products">Jelajahi Produk</Link>
        </Button>
      </div>
    </div>
  )
}
