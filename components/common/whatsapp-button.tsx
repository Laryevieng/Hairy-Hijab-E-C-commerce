import * as React from 'react'
import { MessageCircle } from 'lucide-react'
import { buildWhatsAppLink } from '@/lib/utils/phone'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils/cn'
import type { VariantProps } from 'class-variance-authority'

export interface WhatsAppButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * Nomor WhatsApp toko (misal: "081234567890", "+62 812...", dsb).
   * Bila nomor tidak ada, kosong, atau tidak valid, komponen mengembalikan `null` (P7-02).
   */
  phone?: string | null
  /**
   * Nomor pesanan opsional (misal: "HH-261105-ABCDE").
   * Bila ada, akan menyusun pesan awal:
   * "Halo Hairy Hijab, saya ingin konfirmasi pesanan HH-261105-ABCDE."
   */
  orderNumber?: string
  /**
   * Teks pesan awal kustom. Jika diisi, mengabaikan template default pesanan.
   */
  message?: string
  /**
   * Teks atau elemen kustom di dalam tombol.
   */
  children?: React.ReactNode
  /**
   * Gunakan palet warna hijau khas WhatsApp (bawaan true).
   */
  isBrandColor?: boolean
}

/**
 * Komponen tombol WhatsApp (P7-02).
 * Dipasang di halaman pesanan, `/contact`, dan footer.
 * Selesai jika: Tautan benar; bila nomor kosong, tombol tidak ditampilkan.
 */
export function WhatsAppButton({
  phone,
  orderNumber,
  message,
  children,
  className,
  variant = 'default',
  size = 'default',
  isBrandColor = true,
  ...props
}: WhatsAppButtonProps) {
  if (!phone || typeof phone !== 'string' || phone.trim() === '') {
    return null
  }

  let finalMessage: string
  if (message) {
    finalMessage = message
  } else if (orderNumber) {
    finalMessage = `Halo Hairy Hijab, saya ingin konfirmasi pesanan ${orderNumber}.`
  } else {
    finalMessage = 'Halo Hairy Hijab, saya ingin bertanya tentang produk dan pesanan.'
  }

  const url = buildWhatsAppLink(phone, finalMessage)
  if (!url) {
    return null
  }

  const defaultContent = (
    <>
      <MessageCircle className="size-4 shrink-0" />
      <span>Hubungi via WhatsApp</span>
    </>
  )

  const brandClasses = isBrandColor && variant === 'default'
    ? 'bg-emerald-600 text-white hover:bg-emerald-700 focus-visible:ring-emerald-500 shadow-xs'
    : ''

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(buttonVariants({ variant, size }), brandClasses, className)}
      aria-label={typeof children === 'string' ? children : 'Hubungi customer service Hairy Hijab via WhatsApp'}
      {...props}
    >
      {children ?? defaultContent}
    </a>
  )
}
