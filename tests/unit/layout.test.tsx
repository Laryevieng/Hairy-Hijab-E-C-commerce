import { render, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/actions/cart.actions', () => ({ getCartSnapshot: vi.fn(async () => ({ ok: true, data: [] })) }))
import { AnnouncementBar } from '@/components/layout/announcement-bar'
import { MainNavigation } from '@/components/layout/main-navigation'
import { SiteHeader } from '@/components/layout/site-header'
import { SiteFooter } from '@/components/layout/site-footer'
import { siteConfig } from '@/config/site'

const categories = Array.from({ length: 8 }, (_, index) => ({ id: `cat-${index}`, name: `Kategori ${index}`, slug: `kategori-${index}` }))

describe('Komponen Layout Toko (P1-03)', () => {
  describe('AnnouncementBar', () => {
    it('merender pengumuman dengan benar dan role semantik yang tepat', () => {
      render(<AnnouncementBar />)
      const aside = screen.getByLabelText('Pengumuman toko')
      expect(aside).toBeInTheDocument()
      expect(screen.getByText(/Gratis ongkir/i)).toBeInTheDocument()
    })
  })

  describe('MainNavigation', () => {
    it('merender kategori yang diterima dari database dan tautan Sale', () => {
      render(<MainNavigation categories={categories} />)
      const nav = screen.getByRole('navigation', { name: 'Navigasi Utama' })
      expect(nav).toBeInTheDocument()

      expect(categories).toHaveLength(8)
      for (const cat of categories) {
        const link = within(nav).getByRole('link', { name: cat.name })
        expect(link).toBeInTheDocument()
        expect(link).toHaveAttribute('href', `/categories/${cat.slug}`)
      }

      const saleLink = within(nav).getByRole('link', { name: 'Sale' })
      expect(saleLink).toBeInTheDocument()
      expect(saleLink).toHaveAttribute('href', '/sale')
    })
  })

  describe('SiteHeader', () => {
    it('merender banner header dengan wordmark, tombol cari, akun, dan keranjang dengan badge', () => {
      render(<SiteHeader categories={categories} />)
      const banner = screen.getByRole('banner')
      expect(banner).toBeInTheDocument()

      const brandLink = within(banner).getByLabelText('Hairy Hijab Beranda')
      expect(brandLink).toBeInTheDocument()
      expect(brandLink).toHaveAttribute('href', '/')

      const searchLink = within(banner).getByLabelText('Pencarian produk')
      expect(searchLink).toHaveAttribute('href', '/search')

      const accountLink = within(banner).getByLabelText('Akun saya')
      expect(accountLink).toHaveAttribute('href', '/account')

      const cartButton = within(banner).getByRole('button', { name: 'Keranjang belanja (0 item)' })
      expect(cartButton).toHaveAttribute('aria-haspopup', 'dialog')
      expect(cartButton).toHaveTextContent('0')

      const mobileMenuButton = within(banner).getByRole('button', { name: 'Buka menu navigasi' })
      expect(mobileMenuButton).toBeInTheDocument()
    })
  })

  describe('SiteFooter', () => {
    it('merender informasi profil, kontak resmi, tautan kategori, bantuan, dan kebijakan', () => {
      render(<SiteFooter categories={categories} />)
      const footer = screen.getByRole('contentinfo')
      expect(footer).toBeInTheDocument()

      // Brand & Kontak
      expect(within(footer).getAllByText(siteConfig.name).length).toBeGreaterThan(0)
      expect(within(footer).getByText(siteConfig.contact.email)).toBeInTheDocument()
      expect(within(footer).getByText(siteConfig.contact.whatsappFormatted)).toBeInTheDocument()

      // Tautan kategori
      for (const cat of categories) {
        expect(within(footer).getByRole('link', { name: cat.name })).toHaveAttribute(
          'href',
          `/categories/${cat.slug}`
        )
      }

      // Tautan bantuan & kebijakan (§8.1)
      expect(within(footer).getByRole('link', { name: 'Tentang Hairy Hijab' })).toHaveAttribute('href', '/about')
      expect(within(footer).getByRole('link', { name: 'Panduan Ukuran' })).toHaveAttribute('href', '/size-guide')
      expect(within(footer).getByRole('link', { name: 'Panduan Perawatan' })).toHaveAttribute('href', '/care-guide')
      expect(within(footer).getByRole('link', { name: 'Kontak Kami' })).toHaveAttribute('href', '/contact')
      expect(within(footer).getByRole('link', { name: 'Kebijakan Privasi' })).toHaveAttribute('href', '/privacy-policy')
      expect(within(footer).getByRole('link', { name: 'Syarat & Ketentuan' })).toHaveAttribute('href', '/terms')
      expect(within(footer).getByRole('link', { name: 'Kebijakan Pengiriman' })).toHaveAttribute('href', '/shipping-policy')
      expect(within(footer).getByRole('link', { name: 'Kebijakan Pengembalian' })).toHaveAttribute('href', '/returns-policy')
    })
  })
})
