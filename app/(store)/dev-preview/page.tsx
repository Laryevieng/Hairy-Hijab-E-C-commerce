"use client"

import { MOCK_PRODUCTS } from "@/lib/mock/products"
import { MOCK_CATEGORIES } from "@/lib/mock/categories"
import { ProductGrid } from "@/components/product/product-grid"
import { PriceDisplay } from "@/components/product/price-display"
import { StockBadge } from "@/components/product/stock-badge"
import { CategoryCard } from "@/components/category/category-card"
import { EmptyState } from "@/components/common/empty-state"
import { LoadingState } from "@/components/common/loading-state"
import { ErrorState } from "@/components/common/error-state"

export default function DevPreviewPage() {
  return (
    <div className="container mx-auto px-4 py-12 space-y-16">
      <div className="border-b border-sand pb-4">
        <h1 className="font-serif text-3xl font-bold text-espresso">
          [DEV ONLY] Pratinjau Komponen Presentasional (P1-04)
        </h1>
        <p className="text-sm text-espresso/70 mt-1">
          Halaman sementara untuk pengujian visual desain. Dihapus pada Prompt 10.
        </p>
      </div>

      {/* 1. Grid Katalog Produk (Responsif 2/3/4 kolom) */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-semibold text-espresso">
            1. ProductGrid & ProductCard (2 / 3 / 4 Kolom)
          </h2>
          <span className="text-xs text-gold-deep font-medium">
            8 Produk Mock
          </span>
        </div>
        <ProductGrid products={MOCK_PRODUCTS} />
      </section>

      {/* 2. Grid Kategori */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-espresso">
          2. CategoryCard (8 Kategori §6.1)
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {MOCK_CATEGORIES.map((cat) => (
            <CategoryCard
              key={cat.id}
              id={cat.id}
              name={cat.name}
              slug={cat.slug}
              description={cat.description}
              productCount={12}
            />
          ))}
        </div>
      </section>

      {/* 3. Variasi PriceDisplay */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-espresso">
          3. Variasi PriceDisplay & Perhitungan Diskon
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-md border border-sand/40 bg-sand/10">
          <div className="space-y-1">
            <p className="text-xs text-espresso/60 font-medium">Ukuran Small (Katalog)</p>
            <PriceDisplay price={65000} compareAtPrice={85000} size="sm" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-espresso/60 font-medium">Ukuran Medium (Default)</p>
            <PriceDisplay price={99000} compareAtPrice={125000} size="md" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-espresso/60 font-medium">Ukuran Large (Detail Produk)</p>
            <PriceDisplay price={119000} compareAtPrice={149000} size="lg" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-espresso/60 font-medium">Tanpa Diskon</p>
            <PriceDisplay price={89000} size="md" />
          </div>
        </div>
      </section>

      {/* 4. Variasi StockBadge */}
      <section className="space-y-4">
        <h2 className="font-serif text-2xl font-semibold text-espresso">
          4. Variasi StockBadge
        </h2>
        <div className="flex flex-wrap gap-4 items-center p-6 rounded-md border border-sand/40 bg-sand/10">
          <div>
            <p className="text-xs text-espresso/60 mb-1">Stok 0</p>
            <StockBadge stock={0} />
          </div>
          <div>
            <p className="text-xs text-espresso/60 mb-1">Stok 2 (Menipis)</p>
            <StockBadge stock={2} />
          </div>
          <div>
            <p className="text-xs text-espresso/60 mb-1">Stok 20 (Aman)</p>
            <StockBadge stock={20} showInStock />
          </div>
        </div>
      </section>

      {/* 5. Feedback State: Empty, Loading, Error */}
      <section className="space-y-6">
        <h2 className="font-serif text-2xl font-semibold text-espresso">
          5. State Feedback (EmptyState, LoadingState, ErrorState)
        </h2>
        <div className="space-y-6">
          <EmptyState
            title="Hasil Pencarian Tidak Ditemukan"
            description="Coba gunakan kata kunci pencarian yang berbeda atau periksa ejaan Anda."
            actionLabel="Jelajahi Semua Produk"
            actionHref="/products"
          />
          <ErrorState
            title="Gagal Memuat Katalog"
            message="Terjadi gangguan saat memuat data produk dari server."
            onRetry={() => {}}
          />
          <div>
            <p className="text-xs text-espresso/60 mb-2">Skeleton Loading Grid (4 item)</p>
            <LoadingState count={4} />
          </div>
        </div>
      </section>
    </div>
  )
}
