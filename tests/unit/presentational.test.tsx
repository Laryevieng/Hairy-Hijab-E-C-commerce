import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { StockBadge } from '@/components/product/stock-badge'
import { ProductCard } from '@/components/product/product-card'
import { ProductGrid } from '@/components/product/product-grid'
import { CategoryCard } from '@/components/category/category-card'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { LoadingState } from '@/components/common/loading-state'
import { MOCK_PRODUCTS } from '@/lib/mock/products'

describe('Komponen Presentasional (P1-04)', () => {
  describe('StockBadge', () => {
    it('menampilkan "Sold Out" dengan gaya destructive ketika stok 0', () => {
      render(<StockBadge stock={0} />)
      expect(screen.getByText('Sold Out')).toBeInTheDocument()
    })

    it('menampilkan "Sisa X item" ketika stok menipis (<= threshold)', () => {
      render(<StockBadge stock={3} />)
      expect(screen.getByText('Sisa 3 item')).toBeInTheDocument()
    })

    it('tidak merender apa pun jika stok aman dan showInStock false', () => {
      const { container } = render(<StockBadge stock={15} />)
      expect(container.firstChild).toBeNull()
    })

    it('menampilkan "Tersedia" jika showInStock true dan stok aman', () => {
      render(<StockBadge stock={15} showInStock />)
      expect(screen.getByText('Tersedia')).toBeInTheDocument()
    })
  })

  describe('ProductCard', () => {
    const mockProduct = MOCK_PRODUCTS[0]

    it('merender nama produk, kategori, harga, dan tautan ke detail produk', () => {
      render(<ProductCard product={mockProduct} />)
      expect(screen.getByText(mockProduct.categoryName)).toBeInTheDocument()
      expect(screen.getByText(mockProduct.name)).toBeInTheDocument()
      expect(screen.getByText('Rp 65.000')).toBeInTheDocument()

      const titleLink = screen.getByRole('link', { name: mockProduct.name })
      expect(titleLink).toHaveAttribute('href', `/products/${mockProduct.slug}`)
    })

    it('menampilkan badge Sold Out pada produk dengan stok 0', () => {
      const soldOutProduct = MOCK_PRODUCTS.find((p) => p.totalStock === 0)!
      render(<ProductCard product={soldOutProduct} />)
      expect(screen.getByText('Sold Out')).toBeInTheDocument()
    })
  })

  describe('ProductGrid', () => {
    it('memiliki kelas CSS grid 2 kolom di mobile, 3 di tablet, 4 di desktop (grid-cols-2 md:grid-cols-3 lg:grid-cols-4)', () => {
      render(<ProductGrid products={MOCK_PRODUCTS} />)
      const grid = screen.getByTestId('product-grid')
      expect(grid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4')
    })

    it('merender seluruh produk yang diberikan', () => {
      render(<ProductGrid products={MOCK_PRODUCTS} />)
      for (const product of MOCK_PRODUCTS) {
        expect(screen.getByText(product.name)).toBeInTheDocument()
      }
    })
  })

  describe('CategoryCard', () => {
    it('merender nama kategori, deskripsi, dan tautan yang benar', () => {
      render(
        <CategoryCard
          id="cat-1"
          name="Bergo Non Karet"
          slug="bergo-non-karet"
          description="Koleksi bergo nyaman harian"
          productCount={8}
        />
      )
      expect(screen.getByText('Bergo Non Karet')).toBeInTheDocument()
      expect(screen.getByText('Koleksi bergo nyaman harian')).toBeInTheDocument()
      expect(screen.getByText('8 Produk')).toBeInTheDocument()

      const link = screen.getByRole('link', { name: /Jelajahi kategori Bergo Non Karet/i })
      expect(link).toHaveAttribute('href', '/categories/bergo-non-karet')
    })
  })

  describe('EmptyState, LoadingState, ErrorState', () => {
    it('EmptyState merender judul, deskripsi, dan tautan aksi dengan benar', () => {
      render(
        <EmptyState
          title="Tidak Ada Data"
          description="Deskripsi kosong"
          actionLabel="Kembali Belanja"
          actionHref="/products"
        />
      )
      expect(screen.getByRole('status')).toBeInTheDocument()
      expect(screen.getByText('Tidak Ada Data')).toBeInTheDocument()
      expect(screen.getByText('Deskripsi kosong')).toBeInTheDocument()
      expect(screen.getByRole('link', { name: 'Kembali Belanja' })).toHaveAttribute(
        'href',
        '/products'
      )
    })

    it('LoadingState merender elemen skeleton dengan aria-busy="true"', () => {
      render(<LoadingState count={4} />)
      const status = screen.getByRole('status')
      expect(status).toHaveAttribute('aria-busy', 'true')
    })

    it('ErrorState merender pesan kesalahan dan tombol coba lagi', () => {
      let retried = false
      render(
        <ErrorState
          title="Gagal Memuat"
          message="Server sedang sibuk"
          onRetry={() => {
            retried = true
          }}
          retryLabel="Muat Ulang"
        />
      )
      expect(screen.getByRole('alert')).toBeInTheDocument()
      expect(screen.getByText('Gagal Memuat')).toBeInTheDocument()
      expect(screen.getByText('Server sedang sibuk')).toBeInTheDocument()

      const retryBtn = screen.getByRole('button', { name: 'Muat Ulang' })
      retryBtn.click()
      expect(retried).toBe(true)
    })
  })
})
