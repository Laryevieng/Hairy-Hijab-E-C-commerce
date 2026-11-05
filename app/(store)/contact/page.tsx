import type { Metadata } from 'next'
import Link from 'next/link'
import { ChevronRight, Mail, Clock, MapPin, MessageCircle } from 'lucide-react'
import { siteConfig } from '@/config/site'
import { getStoreContactWhatsApp } from '@/services/store-settings.service'
import { WhatsAppButton } from '@/components/common/whatsapp-button'

export const metadata: Metadata = {
  title: 'Hubungi Kami | Hairy Hijab',
  description: 'Hubungi tim layanan pelanggan resmi Hairy Hijab via WhatsApp dan email resmi.',
  alternates: { canonical: '/contact' },
}

export default async function ContactPage() {
  const contactWhatsApp = await getStoreContactWhatsApp()

  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 max-w-4xl space-y-8">
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="size-3 text-stone-400" />
        <span className="font-medium text-stone-900">Kontak Kami</span>
      </nav>

      {/* Header Halaman */}
      <div className="space-y-2 border-b border-sand pb-6">
        <h1 className="font-heading text-2xl sm:text-3xl text-espresso tracking-tight">
          Hubungi Kami
        </h1>
        <p className="text-sm text-stone-600 max-w-2xl leading-relaxed">
          Punya pertanyaan seputar ukuran hijab, ketersediaan produk, atau konfirmasi pesanan?
          Tim layanan pelanggan Hairy Hijab siap membantu Anda.
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        {/* Kartu WhatsApp */}
        <div className="rounded-xl border border-sand bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="size-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageCircle className="size-5" />
            </div>
            <div>
              <h2 className="font-medium text-espresso text-base">Chat via WhatsApp</h2>
              <p className="text-xs text-stone-500 mt-1 leading-relaxed">
                Respon cepat untuk konsultasi produk, panduan bahan, dan bantuan transaksi harian.
              </p>
            </div>
          </div>

          {/* Tombol WhatsApp (P7-02): bila nomor kosong, tombol tidak dirender */}
          <div>
            {contactWhatsApp ? (
              <WhatsAppButton
                phone={contactWhatsApp}
                message="Halo Hairy Hijab, saya ingin bertanya tentang produk dan pesanan."
                className="w-full justify-center"
              >
                Mulai Chat WhatsApp
              </WhatsAppButton>
            ) : (
              <p className="text-xs text-stone-400 italic">
                Layanan WhatsApp sedang dalam pemeliharaan. Silakan hubungi kami via email.
              </p>
            )}
          </div>
        </div>

        {/* Kartu Email & Jam Operasional */}
        <div className="rounded-xl border border-sand bg-white p-6 shadow-xs space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-sand/30 text-espresso/70 flex items-center justify-center shrink-0 mt-0.5">
                <Mail className="size-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-medium text-espresso">Email Resmi</p>
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="text-stone-600 hover:text-espresso underline transition-colors"
                >
                  {siteConfig.contact.email}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-sand/30 text-espresso/70 flex items-center justify-center shrink-0 mt-0.5">
                <Clock className="size-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-medium text-espresso">Jam Operasional Layanan</p>
                <p className="text-stone-600">{siteConfig.contact.hours}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="size-8 rounded-full bg-sand/30 text-espresso/70 flex items-center justify-center shrink-0 mt-0.5">
                <MapPin className="size-4" />
              </div>
              <div className="text-xs space-y-0.5">
                <p className="font-medium text-espresso">Lokasi</p>
                <p className="text-stone-600">{siteConfig.contact.address}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
