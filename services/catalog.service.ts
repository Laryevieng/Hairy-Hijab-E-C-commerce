import 'server-only'

import { createPublicClient } from '@/lib/supabase/public'
import type { CatalogSearchParams } from '@/lib/validations/catalog'

const PAGE_SIZE = 24

function escapeIlike(value: string) {
  return value.replace(/[\\%_]/g, '\\$&')
}

function applyFilters(params: CatalogSearchParams) {
  let query = createPublicClient().from('product_listing').select('*', { count: 'exact' })
  if (params.category) query = query.eq('category_slug', params.category)
  if (params.size.length) query = query.overlaps('sizes', params.size)
  if (params.color.length) query = query.overlaps('colors', params.color)
  if (params.min !== undefined) query = query.gte('max_price', params.min)
  if (params.max !== undefined) query = query.lte('min_price', params.max)
  return query
}

function applySort(query: ReturnType<typeof applyFilters>, sort: CatalogSearchParams['sort']) {
  if (sort === 'price_asc') return query.order('min_price', { ascending: true }).order('id')
  if (sort === 'price_desc') return query.order('min_price', { ascending: false }).order('id')
  return query.order('created_at', { ascending: false }).order('id')
}

function pageRange(page: number) {
  const from = (page - 1) * PAGE_SIZE
  return { from, to: from + PAGE_SIZE - 1 }
}

export async function getCategories() {
  const { data, error } = await createPublicClient()
    .from('categories')
    .select('id, name, slug, description, image_path, sort_order')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw new Error('Katalog kategori tidak dapat dimuat.')
  return data
}

export async function getCatalogFilterOptions() {
  const { data, error } = await createPublicClient()
    .from('product_listing')
    .select('sizes, colors')
  if (error) throw new Error('Filter katalog tidak dapat dimuat.')
  return {
    sizes: [...new Set(data.flatMap((product) => product.sizes ?? []))].sort(),
    colors: [...new Set(data.flatMap((product) => product.colors ?? []))].sort(),
  }
}

export async function getFeaturedProducts() {
  const { data, error } = await createPublicClient()
    .from('product_listing')
    .select('*')
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)
  if (error) throw new Error('Produk unggulan tidak dapat dimuat.')
  return data
}

export async function getLatestProducts() {
  const { data, error } = await createPublicClient()
    .from('product_listing')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(PAGE_SIZE)
  if (error) throw new Error('Produk terbaru tidak dapat dimuat.')
  return data
}

export async function listProducts(params: CatalogSearchParams) {
  const { from, to } = pageRange(params.page)
  const query = applySort(applyFilters(params), params.sort)
  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error('Daftar produk tidak dapat dimuat.')
  return { data, count: count ?? 0, page: params.page, pageSize: PAGE_SIZE }
}

export async function getSaleProducts(params: CatalogSearchParams) {
  const { from, to } = pageRange(params.page)
  const query = applySort(applyFilters(params).eq('on_sale', true), params.sort)
  const { data, error, count } = await query.range(from, to)
  if (error) throw new Error('Produk promo tidak dapat dimuat.')
  return { data, count: count ?? 0, page: params.page, pageSize: PAGE_SIZE }
}

export async function searchProducts(params: CatalogSearchParams) {
  const { from, to } = pageRange(params.page)
  let query = applyFilters(params)
  if (params.q) query = query.ilike('name', `%${escapeIlike(params.q)}%`)
  const { data, error, count } = await applySort(query, params.sort).range(from, to)
  if (error) throw new Error('Pencarian produk tidak dapat dilakukan.')
  return { data, count: count ?? 0, page: params.page, pageSize: PAGE_SIZE }
}

export async function getProductBySlug(slug: string) {
  const { data, error } = await createPublicClient()
    .from('products')
    .select(
      'id, slug, name, description, material, care_instructions, specs, is_featured, created_at, category:categories!inner(id, name, slug, requires_size, size_options), variants:product_variants(id, sku, size, color_name, color_hex, color_hex_2, price, compare_at_price, stock_quantity, is_active), images:product_images(id, storage_path, alt_text, sort_order, variant_id)',
    )
    .eq('slug', slug)
    .eq('is_active', true)
    .eq('category.is_active', true)
    .eq('variants.is_active', true)
    .order('sort_order', { referencedTable: 'images' })
    .maybeSingle()
  if (error) throw new Error('Detail produk tidak dapat dimuat.')
  return data
}
