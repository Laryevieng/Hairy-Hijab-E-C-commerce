import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { CatalogListing } from '@/components/product/catalog-listing'
import { getCategories, getCatalogFilterOptions, listProducts } from '@/services/catalog.service'
import { createPublicClient } from '@/lib/supabase/public'
import { parsePageSearchParams, toURLSearchParams, type PageSearchParams } from '@/lib/catalog/page-data'

type CategoryParams = Promise<{ slug: string }>

async function getActiveCategory(slug: string) {
  const { data, error } = await createPublicClient()
    .from('categories')
    .select('name, slug, description')
    .eq('slug', slug)
    .eq('is_active', true)
    .maybeSingle()
  if (error) throw new Error('Kategori tidak dapat dimuat.')
  return data
}

export async function generateMetadata({ params }: { params: CategoryParams }): Promise<Metadata> {
  const { slug } = await params
  const category = await getActiveCategory(slug)
  if (!category) return { title: 'Kategori tidak ditemukan | Hairy Hijab', robots: { index: false } }
  return {
    title: `${category.name} | Hairy Hijab`,
    description: category.description?.trim() || `Jelajahi koleksi ${category.name} dari Hairy Hijab.`,
    alternates: { canonical: `/categories/${category.slug}` },
  }
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: CategoryParams
  searchParams: Promise<PageSearchParams>
}) {
  const [{ slug }, rawSearchParams] = await Promise.all([params, searchParams])
  const category = await getActiveCategory(slug)
  if (!category) notFound()

  const queryParams = parsePageSearchParams({ ...rawSearchParams, category: slug }, { category: slug })
  const [result, categories, options] = await Promise.all([
    listProducts(queryParams), getCategories(), getCatalogFilterOptions(),
  ])

  return (
    <CatalogListing
      title={category.name}
      description={category.description?.trim() || `Jelajahi koleksi ${category.name} dari Hairy Hijab.`}
      data={result.data}
      count={result.count}
      page={result.page}
      pageSize={result.pageSize}
      pathname={`/categories/${slug}`}
      searchParams={toURLSearchParams({ ...rawSearchParams, category: slug })}
      sizes={options.sizes}
      colors={options.colors}
      categories={categories.map(({ slug: categorySlug, name }) => ({ slug: categorySlug, name }))}
    />
  )
}
