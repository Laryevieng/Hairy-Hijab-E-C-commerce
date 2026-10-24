import type { Metadata } from 'next'
import { CatalogListing } from '@/components/product/catalog-listing'
import { getCategories, getCatalogFilterOptions, listProducts } from '@/services/catalog.service'
import { parsePageSearchParams, toURLSearchParams, type PageSearchParams } from '@/lib/catalog/page-data'

export const metadata: Metadata = {
  title: 'Semua Produk | Hairy Hijab',
  description: 'Jelajahi koleksi hijab Hairy Hijab dan temukan pilihan sesuai kebutuhan Anda.',
  alternates: { canonical: '/products' },
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const rawSearchParams = await searchParams
  const params = parsePageSearchParams(rawSearchParams)
  const [result, categories, options] = await Promise.all([
    listProducts(params), getCategories(), getCatalogFilterOptions(),
  ])

  return (
    <CatalogListing
      title="Semua Produk"
      description="Temukan koleksi hijab untuk melengkapi gaya Anda. Gunakan filter untuk menyaring pilihan."
      data={result.data}
      count={result.count}
      page={result.page}
      pageSize={result.pageSize}
      pathname="/products"
      searchParams={toURLSearchParams(rawSearchParams)}
      sizes={options.sizes}
      colors={options.colors}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
    />
  )
}
