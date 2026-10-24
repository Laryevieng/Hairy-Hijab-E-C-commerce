import { EmptyState } from '@/components/common/empty-state'
import { CatalogProductCard, type CatalogProduct } from '@/components/product/catalog-product-card'
import { Pagination } from '@/components/product/pagination'
import { ProductFilters } from '@/components/product/product-filters'
import { SortSelector } from '@/components/product/sort-selector'
import { SearchBar } from '@/components/product/search-bar'

interface CatalogListingProps {
  title: string
  description: string
  data: CatalogProduct[]
  count: number
  page: number
  pageSize: number
  pathname: string
  searchParams: URLSearchParams
  sizes: string[]
  colors: string[]
  categories: Array<{ slug: string; name: string }>
  search?: boolean
  query?: string
}

export function CatalogListing({
  title, description, data, count, page, pageSize, pathname, searchParams,
  sizes, colors, categories, search = false, query,
}: CatalogListingProps) {
  return (
    <section className="container mx-auto px-4 py-8 sm:py-12 lg:px-8">
      <header className="mb-8 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold-deep">Hairy Hijab</p>
        <h1 className="font-serif text-3xl font-semibold text-espresso sm:text-4xl">{title}</h1>
        <p className="max-w-2xl text-sm leading-relaxed text-espresso/70 sm:text-base">{description}</p>
        {search && <SearchBar query={query} />}
      </header>

      <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-espresso/70" aria-live="polite">{count} produk ditemukan</p>
        <SortSelector pathname={pathname} searchParams={searchParams.toString()} />
      </div>

      <div className="grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]">
        <ProductFilters sizes={sizes} colors={colors} categories={categories} pathname={pathname} searchParams={searchParams.toString()} />
        <div>
          {data.length ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-5 xl:grid-cols-4">
              {data.map((product) => (
                <CatalogProductCard
                  key={product.id}
                  product={product}
                  categoryName={categories.find((category) => category.slug === product.category_slug)?.name}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Produk tidak ditemukan"
              description="Belum ada produk yang sesuai dengan pilihan Anda. Coba ubah filter atau lihat seluruh katalog."
              actionLabel="Lihat semua produk"
              actionHref="/products"
            />
          )}
        <Pagination page={page} pageSize={pageSize} count={count} pathname={pathname} searchParams={searchParams.toString()} />
        </div>
      </div>
    </section>
  )
}
