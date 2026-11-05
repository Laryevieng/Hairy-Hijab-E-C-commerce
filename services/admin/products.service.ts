import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { mapDbError } from '@/lib/errors'
import { suggestNextSlug } from '@/lib/utils/slug'
import type {
  AdminProductsSearchParams,
  ProductValidData,
} from '@/lib/validations/product'
import type { ActionResult } from '@/types/action'
import type { Database } from '@/types/database.types'

export type ProductRow = Database['public']['Tables']['products']['Row']
export type ProductVariantRow =
  Database['public']['Tables']['product_variants']['Row']
export type ProductImageRow =
  Database['public']['Tables']['product_images']['Row']

export interface AdminProductListItem {
  id: string
  name: string
  slug: string
  category_id: string
  category_name: string
  category_slug: string
  is_active: boolean
  is_featured: boolean
  variant_count: number
  active_variant_count: number
  total_stock: number
  has_orders: boolean
  created_at: string
  updated_at: string
}

export interface AdminProductDetail extends ProductRow {
  category: {
    id: string
    name: string
    slug: string
    requires_size: boolean
    size_options: string[]
  } | null
  variants: ProductVariantRow[]
  images: ProductImageRow[]
  has_orders: boolean
}

export const ADMIN_PRODUCTS_PAGE_SIZE = 20

const PRODUCT_HAS_ORDERS_MESSAGE =
  'Produk tidak dapat dihapus karena sudah pernah dipesan (D-15). Nonaktifkan produk jika tidak ingin ditampilkan.'

function escapeIlike(value: string): string {
  return value.replace(/[\\%_]/g, '\\$&')
}

async function suggestAvailableProductSlug(
  supabase: Awaited<ReturnType<typeof createClient>>,
  desiredSlug: string,
  excludeProductId?: string
): Promise<string> {
  const baseSlug = desiredSlug.replace(/-\d+$/, '') || desiredSlug
  let query = supabase
    .from('products')
    .select('id, slug')
    .ilike('slug', `${escapeIlike(baseSlug)}%`)

  if (excludeProductId) {
    query = query.neq('id', excludeProductId)
  }

  const { data } = await query
  const existingSlugs = (data ?? []).map((row) => row.slug)
  return suggestNextSlug(desiredSlug, existingSlugs)
}

function buildDuplicateSlugFailure(
  desiredSlug: string,
  suggestedSlug: string
): Extract<ActionResult<never>, { ok: false }> {
  const message = `Slug "${desiredSlug}" sudah digunakan. Disarankan menggunakan "${suggestedSlug}".`
  return {
    ok: false,
    error: {
      code: 'DUPLICATE_SLUG',
      message,
      fieldErrors: {
        slug: [message],
        suggestedSlug: [suggestedSlug],
      },
    },
  }
}

export async function listAdminProducts(
  params: AdminProductsSearchParams
): Promise<{
  data: AdminProductListItem[]
  count: number
  page: number
  pageSize: number
}> {
  const supabase = await createClient()
  const from = (params.page - 1) * ADMIN_PRODUCTS_PAGE_SIZE
  const to = from + ADMIN_PRODUCTS_PAGE_SIZE - 1

  let query = supabase
    .from('products')
    .select(
      'id, name, slug, category_id, is_active, is_featured, created_at, updated_at, category:categories(id, name, slug), variants:product_variants(id, stock_quantity, is_active)',
      { count: 'exact' }
    )

  if (params.q) {
    query = query.ilike('name', `%${escapeIlike(params.q)}%`)
  }
  if (params.category) {
    query = query.eq('category_id', params.category)
  }
  if (params.status === 'active') {
    query = query.eq('is_active', true)
  } else if (params.status === 'inactive') {
    query = query.eq('is_active', false)
  }

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .order('id', { ascending: true })
    .range(from, to)

  if (error) {
    throw new Error('Gagal memuat daftar produk.')
  }

  const rows = data ?? []
  const allVariantIds = rows.flatMap((row) =>
    Array.isArray(row.variants) ? row.variants.map((v) => v.id) : []
  )

  const orderedVariantIds = new Set<string>()
  if (allVariantIds.length > 0) {
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('variant_id')
      .in('variant_id', allVariantIds)

    for (const item of orderItems ?? []) {
      if (item.variant_id) {
        orderedVariantIds.add(item.variant_id)
      }
    }
  }

  const items: AdminProductListItem[] = rows.map((row) => {
    const variants = Array.isArray(row.variants) ? row.variants : []
    const categoryObj = Array.isArray(row.category)
      ? row.category[0]
      : row.category

    const totalStock = variants.reduce(
      (sum, v) => sum + (v.stock_quantity ?? 0),
      0
    )
    const activeVariantCount = variants.filter((v) => v.is_active).length
    const hasOrders = variants.some((v) => orderedVariantIds.has(v.id))

    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      category_id: row.category_id,
      category_name: categoryObj?.name ?? 'Tanpa Kategori',
      category_slug: categoryObj?.slug ?? '',
      is_active: row.is_active,
      is_featured: row.is_featured,
      variant_count: variants.length,
      active_variant_count: activeVariantCount,
      total_stock: totalStock,
      has_orders: hasOrders,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }
  })

  return {
    data: items,
    count: count ?? 0,
    page: params.page,
    pageSize: ADMIN_PRODUCTS_PAGE_SIZE,
  }
}

export async function getAdminProductById(
  id: string
): Promise<AdminProductDetail | null> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('products')
    .select(
      '*, category:categories(id, name, slug, requires_size, size_options), variants:product_variants(*), images:product_images(*)'
    )
    .eq('id', id)
    .maybeSingle()

  if (error || !data) {
    return null
  }

  const variants = Array.isArray(data.variants) ? data.variants : []
  const images = Array.isArray(data.images)
    ? [...data.images].sort((a, b) => a.sort_order - b.sort_order)
    : []
  const categoryObj = Array.isArray(data.category)
    ? data.category[0] ?? null
    : data.category

  let hasOrders = false
  if (variants.length > 0) {
    const variantIds = variants.map((v) => v.id)
    const { count } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('variant_id', variantIds)

    hasOrders = (count ?? 0) > 0
  }

  return {
    ...data,
    category: categoryObj,
    variants,
    images,
    has_orders: hasOrders,
  }
}

export async function createProductRecord(
  data: ProductValidData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  // 1. Pastikan kategori ada di database
  const { data: categoryRow, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', data.category_id)
    .maybeSingle()

  if (categoryError || !categoryRow) {
    return {
      ok: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori produk wajib dipilih dan harus terdaftar.',
        fieldErrors: {
          category_id: ['Pilih kategori produk yang valid.'],
        },
      },
    }
  }

  // 2. Cek apakah slug sudah dipakai
  const { data: existingSlug } = await supabase
    .from('products')
    .select('id, slug')
    .eq('slug', data.slug)
    .maybeSingle()

  if (existingSlug) {
    const suggestedSlug = await suggestAvailableProductSlug(supabase, data.slug)
    return buildDuplicateSlugFailure(data.slug, suggestedSlug)
  }

  // 3. Simpan produk baru
  const { data: created, error } = await supabase
    .from('products')
    .insert({
      name: data.name,
      slug: data.slug,
      category_id: data.category_id,
      description: data.description,
      material: data.material,
      care_instructions: data.care_instructions,
      specs: data.specs,
      is_active: data.is_active,
      is_featured: data.is_featured,
    })
    .select('id, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      const suggestedSlug = await suggestAvailableProductSlug(
        supabase,
        data.slug
      )
      return buildDuplicateSlugFailure(data.slug, suggestedSlug)
    }
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return { ok: true, data: { id: created.id, slug: created.slug } }
}

export async function updateProductRecord(
  id: string,
  data: ProductValidData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  // 1. Pastikan kategori ada
  const { data: categoryRow, error: categoryError } = await supabase
    .from('categories')
    .select('id')
    .eq('id', data.category_id)
    .maybeSingle()

  if (categoryError || !categoryRow) {
    return {
      ok: false,
      error: {
        code: 'CATEGORY_NOT_FOUND',
        message: 'Kategori produk wajib dipilih dan harus terdaftar.',
        fieldErrors: {
          category_id: ['Pilih kategori produk yang valid.'],
        },
      },
    }
  }

  // 2. Cek apakah slug bentrok dengan produk lain
  const { data: existingSlug } = await supabase
    .from('products')
    .select('id, slug')
    .eq('slug', data.slug)
    .neq('id', id)
    .maybeSingle()

  if (existingSlug) {
    const suggestedSlug = await suggestAvailableProductSlug(
      supabase,
      data.slug,
      id
    )
    return buildDuplicateSlugFailure(data.slug, suggestedSlug)
  }

  // 3. Update produk
  const { data: updated, error } = await supabase
    .from('products')
    .update({
      name: data.name,
      slug: data.slug,
      category_id: data.category_id,
      description: data.description,
      material: data.material,
      care_instructions: data.care_instructions,
      specs: data.specs,
      is_active: data.is_active,
      is_featured: data.is_featured,
    })
    .eq('id', id)
    .select('id, slug')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      const suggestedSlug = await suggestAvailableProductSlug(
        supabase,
        data.slug,
        id
      )
      return buildDuplicateSlugFailure(data.slug, suggestedSlug)
    }
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!updated) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  return { ok: true, data: { id: updated.id, slug: updated.slug } }
}

export async function setProductActiveStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('products')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id, slug')
    .maybeSingle()

  if (error) {
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!updated) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  return { ok: true, data: { id: updated.id, slug: updated.slug } }
}

export async function deleteProductRecord(
  id: string
): Promise<ActionResult<{ slug?: string }>> {
  const supabase = await createClient()

  // Ambil produk & varian untuk cek apakah pernah dipesan (D-15)
  const { data: product, error: prodError } = await supabase
    .from('products')
    .select('id, slug, variants:product_variants(id)')
    .eq('id', id)
    .maybeSingle()

  if (prodError) {
    const mapped = mapDbError(prodError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!product) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  const variantIds = Array.isArray(product.variants)
    ? product.variants.map((v) => v.id)
    : []

  if (variantIds.length > 0) {
    const { count, error: orderCheckError } = await supabase
      .from('order_items')
      .select('id', { count: 'exact', head: true })
      .in('variant_id', variantIds)

    if (orderCheckError) {
      const mapped = mapDbError(orderCheckError)
      return { ok: false, error: { code: mapped.code, message: mapped.message } }
    }

    if ((count ?? 0) > 0) {
      return {
        ok: false,
        error: {
          code: 'PRODUCT_HAS_ORDERS',
          message: PRODUCT_HAS_ORDERS_MESSAGE,
        },
      }
    }
  }

  const { error: deleteError } = await supabase
    .from('products')
    .delete()
    .eq('id', id)

  if (deleteError) {
    const mapped = mapDbError(deleteError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return { ok: true, data: { slug: product.slug } }
}
