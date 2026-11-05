import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { mapDbError } from '@/lib/errors'
import type { CategoryValidData } from '@/lib/validations/category'
import type { ActionResult } from '@/types/action'
import type { Database } from '@/types/database.types'

export type CategoryRow = Database['public']['Tables']['categories']['Row']

export interface AdminCategoryItem extends CategoryRow {
  product_count: number
}

const DUPLICATE_SLUG_MESSAGE =
  'Slug kategori sudah digunakan. Silakan gunakan slug lain.'
const CATEGORY_HAS_PRODUCTS_MESSAGE =
  'Kategori tidak dapat dihapus karena masih memiliki produk. Nonaktifkan kategori jika tidak ingin ditampilkan.'

/**
 * Mengambil seluruh kategori untuk halaman admin beserta jumlah produk per kategori.
 * Menggunakan klien sesi (RLS is_staff() / is_admin()).
 */
export async function listAdminCategories(): Promise<AdminCategoryItem[]> {
  const supabase = await createClient()

  const [categoriesRes, productsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true }),
    supabase.from('products').select('category_id'),
  ])

  if (categoriesRes.error) {
    throw new Error('Gagal memuat daftar kategori.')
  }

  const productCounts = new Map<string, number>()
  for (const prod of productsRes.data ?? []) {
    productCounts.set(
      prod.category_id,
      (productCounts.get(prod.category_id) ?? 0) + 1
    )
  }

  return (categoriesRes.data ?? []).map((cat) => ({
    ...cat,
    product_count: productCounts.get(cat.id) ?? 0,
  }))
}

export async function createCategoryRecord(
  data: CategoryValidData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  const { data: created, error } = await supabase
    .from('categories')
    .insert({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_path: data.image_path,
      requires_size: data.requires_size,
      size_options: data.size_options,
      is_active: data.is_active,
      sort_order: data.sort_order,
    })
    .select('id, slug')
    .single()

  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: DUPLICATE_SLUG_MESSAGE,
          fieldErrors: { slug: [DUPLICATE_SLUG_MESSAGE] },
        },
      }
    }
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return { ok: true, data: { id: created.id, slug: created.slug } }
}

export async function updateCategoryRecord(
  id: string,
  data: CategoryValidData
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('categories')
    .update({
      name: data.name,
      slug: data.slug,
      description: data.description,
      image_path: data.image_path,
      requires_size: data.requires_size,
      size_options: data.size_options,
      is_active: data.is_active,
      sort_order: data.sort_order,
    })
    .eq('id', id)
    .select('id, slug')
    .maybeSingle()

  if (error) {
    if (error.code === '23505') {
      return {
        ok: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message: DUPLICATE_SLUG_MESSAGE,
          fieldErrors: { slug: [DUPLICATE_SLUG_MESSAGE] },
        },
      }
    }
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!updated) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Kategori tidak ditemukan.',
      },
    }
  }

  return { ok: true, data: { id: updated.id, slug: updated.slug } }
}

export async function setCategoryActiveStatus(
  id: string,
  isActive: boolean
): Promise<ActionResult<{ id: string; slug: string }>> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('categories')
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
        message: 'Kategori tidak ditemukan.',
      },
    }
  }

  return { ok: true, data: { id: updated.id, slug: updated.slug } }
}

export async function deleteCategoryRecord(
  id: string
): Promise<ActionResult<void>> {
  const supabase = await createClient()

  // Cek apakah kategori sudah memiliki produk
  const { count, error: countError } = await supabase
    .from('products')
    .select('id', { count: 'exact', head: true })
    .eq('category_id', id)

  if (countError) {
    const mapped = mapDbError(countError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: {
        code: 'CATEGORY_HAS_PRODUCTS',
        message: CATEGORY_HAS_PRODUCTS_MESSAGE,
      },
    }
  }

  const { error: deleteError } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)

  if (deleteError) {
    if (deleteError.code === '23503') {
      return {
        ok: false,
        error: {
          code: 'CATEGORY_HAS_PRODUCTS',
          message: CATEGORY_HAS_PRODUCTS_MESSAGE,
        },
      }
    }
    const mapped = mapDbError(deleteError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return { ok: true, data: undefined }
}
