import Link from "next/link"
import { siteConfig } from "@/config/site"
import { buildWhatsAppLink } from "@/lib/utils/phone"
import { MessageCircle, Mail, MapPin, Clock } from "lucide-react"
import type { CategoryListItem } from "@/types/domain"

export function SiteFooter({ categories = [] }: { categories?: Pick<CategoryListItem, "id" | "name" | "slug">[] }) {
  const whatsappUrl = buildWhatsAppLink(
    siteConfig.contact.phone,
    "Halo Hairy Hijab, saya ingin bertanya seputar produk."
  )

  return (
    <footer
      role="contentinfo"
      className="border-t border-sand/40 bg-ivory text-espresso pt-12 pb-8 mt-auto"
    >
      <div className="container mx-auto px-4 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Kolom 1: Profil Brand & Kontak */}
          <div className="space-y-4">
            <Link
              href="/"
              className="font-serif text-2xl font-bold tracking-tight text-espresso inline-block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
            >
              {siteConfig.name}
            </Link>
            <p className="text-sm text-espresso/70 leading-relaxed">
              {siteConfig.description}
            </p>
            <div className="space-y-2 text-sm text-espresso/80 pt-2">
              {whatsappUrl && (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-espresso transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  aria-label={`Hubungi via WhatsApp ${siteConfig.contact.whatsappFormatted}`}
                >
                  <MessageCircle className="size-4 shrink-0 text-success" />
                  <span>{siteConfig.contact.whatsappFormatted}</span>
                </a>
              )}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex items-center gap-2 hover:text-espresso transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                aria-label={`Kirim email ke ${siteConfig.contact.email}`}
              >
                <Mail className="size-4 shrink-0" />
                <span>{siteConfig.contact.email}</span>
              </a>
              <div className="flex items-center gap-2 text-espresso/70 min-h-[32px]">
                <Clock className="size-4 shrink-0" />
                <span>{siteConfig.contact.hours}</span>
              </div>
              <div className="flex items-center gap-2 text-espresso/70 min-h-[32px]">
                <MapPin className="size-4 shrink-0" />
                <span>{siteConfig.contact.address}</span>
              </div>
            </div>
          </div>

          {/* Kolom 2: Koleksi Kategori */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-espresso mb-4">
              Koleksi Hijab
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/products"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Semua Produk
                </Link>
              </li>
              {categories.map((cat) => (
                <li key={cat.id}>
                  <Link
                    href={`/categories/${cat.slug}`}
                    className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/sale"
                  className="inline-flex items-center text-sm font-semibold text-danger hover:text-danger/80 transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Promo / Sale
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 3: Bantuan & Informasi */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-espresso mb-4">
              Bantuan & Panduan
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/about"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Tentang Hairy Hijab
                </Link>
              </li>
              <li>
                <Link
                  href="/size-guide"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Panduan Ukuran
                </Link>
              </li>
              <li>
                <Link
                  href="/care-guide"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Panduan Perawatan
                </Link>
              </li>
              <li>
                <Link
                  href="/contact"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Kontak Kami
                </Link>
              </li>
              <li>
                <Link
                  href="/account/orders"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Status Pesanan
                </Link>
              </li>
            </ul>
          </div>

          {/* Kolom 4: Kebijakan Toko */}
          <div>
            <h3 className="font-serif text-lg font-semibold text-espresso mb-4">
              Kebijakan Toko
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href="/privacy-policy"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  href="/terms"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Syarat & Ketentuan
                </Link>
              </li>
              <li>
                <Link
                  href="/shipping-policy"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Kebijakan Pengiriman
                </Link>
              </li>
              <li>
                <Link
                  href="/returns-policy"
                  className="inline-flex items-center text-sm text-espresso/70 hover:text-espresso transition-colors min-h-[36px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
                >
                  Kebijakan Pengembalian
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bar Bawah / Copyright */}
        <div className="mt-12 pt-6 border-t border-sand/40 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-espresso/60">
          <p>© 2026 {siteConfig.name}. Hak cipta dilindungi undang-undang.</p>
          <p className="text-center sm:text-right">
            Hijab berkualitas untuk gaya sehari-hari dengan kenyamanan terbaik.
          </p>
        </div>
      </div>
    </footer>
  )
}
