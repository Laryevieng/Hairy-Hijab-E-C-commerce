import type { Metadata } from 'next'
import { CatalogListing } from '@/components/product/catalog-listing'
import { getCategories, getCatalogFilterOptions, searchProducts } from '@/services/catalog.service'
import { parsePageSearchParams, toURLSearchParams, type PageSearchParams } from '@/lib/catalog/page-data'

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}): Promise<Metadata> {
  const params = parsePageSearchParams(await searchParams)
  return {
    title: params.q ? `Hasil “${params.q}” | Hairy Hijab` : 'Pencarian Produk | Hairy Hijab',
    description: params.q
      ? `Hasil pencarian produk Hairy Hijab untuk ${params.q}.`
      : 'Cari produk dalam koleksi Hairy Hijab.',
    robots: { index: false, follow: true },
  }
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<PageSearchParams>
}) {
  const rawSearchParams = await searchParams
  const params = parsePageSearchParams(rawSearchParams)
  const [result, categories, options] = await Promise.all([
    searchProducts(params), getCategories(), getCatalogFilterOptions(),
  ])
  const title = params.q ? `Hasil pencarian: ${params.q}` : 'Pencarian Produk'

  return (
    <CatalogListing
      title={title}
      description={params.q ? `Produk yang cocok dengan pencarian “${params.q}”.` : 'Masukkan nama produk untuk mencari di katalog Hairy Hijab.'}
      data={result.data}
      count={result.count}
      page={result.page}
      pageSize={result.pageSize}
      pathname="/search"
      searchParams={toURLSearchParams(rawSearchParams)}
      sizes={options.sizes}
      colors={options.colors}
      categories={categories.map(({ slug, name }) => ({ slug, name }))}
      search
      query={params.q}
    />
  )
}
