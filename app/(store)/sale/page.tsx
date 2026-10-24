import type { Metadata } from 'next'
import { CatalogListing } from '@/components/product/catalog-listing'
import { getCategories, getCatalogFilterOptions, getSaleProducts } from '@/services/catalog.service'
import { parsePageSearchParams, toURLSearchParams, type PageSearchParams } from '@/lib/catalog/page-data'

export const metadata: Metadata = {
  title: 'Promo Hijab | Hairy Hijab',
  description: 'Lihat produk Hairy Hijab yang sedang ditawarkan dengan harga promo.',
  alternates: { canonical: '/sale' },
}

export default async function SalePage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const rawSearchParams = await searchParams
  const params = parsePageSearchParams(rawSearchParams)
  const [result, categories, options] = await Promise.all([
    getSaleProducts(params), getCategories(), getCatalogFilterOptions(),
  ])

  return (
    <CatalogListing
      title="Promo"
      description="Jelajahi pilihan produk Hairy Hijab yang sedang ditawarkan dengan harga promo."
      data={result.data}
      count={result.count}
      page={result.page}
      pageSize={result.pageSize}
      pathname="/sale"
      searchParams={toURLSearchParams(rawSearchParams)}
      sizes={options.sizes}
      colors={options.colors}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
    />
  )
}
