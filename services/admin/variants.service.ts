import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { mapDbError } from '@/lib/errors'
import {
  validateVariantAgainstCategory,
  type CreateVariantValidData,
  type UpdateVariantValidData,
} from '@/lib/validations/variant'
import type { ActionResult } from '@/types/action'

const DUPLICATE_COMBO_MESSAGE =
  'Kombinasi ukuran dan warna untuk produk ini sudah ada.'
const DUPLICATE_SKU_MESSAGE =
  'SKU varian sudah digunakan. Silakan gunakan SKU lain.'
const VARIANT_HAS_ORDERS_MESSAGE =
  'Varian tidak dapat dihapus karena sudah pernah dipesan (D-15). Nonaktifkan varian jika tidak ingin dijual.'

function mapVariantUniqueError(error: {
  code?: string
  message: string
  details?: unknown
}): Extract<ActionResult<never>, { ok: false }> | null {
  if (error.code !== '23505') return null

  const combined = `${error.message} ${String(error.details ?? '')}`.toLowerCase()
  if (combined.includes('uq_variant_combo')) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_VARIANT_COMBO',
        message: DUPLICATE_COMBO_MESSAGE,
        fieldErrors: {
          color_name: [DUPLICATE_COMBO_MESSAGE],
        },
      },
    }
  }

  if (combined.includes('sku')) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_SKU',
        message: DUPLICATE_SKU_MESSAGE,
        fieldErrors: {
          sku: [DUPLICATE_SKU_MESSAGE],
        },
      },
    }
  }

  return {
    ok: false,
    error: {
      code: 'DUPLICATE_VARIANT',
      message: DUPLICATE_COMBO_MESSAGE,
    },
  }
}

async function loadProductWithCategory(
  supabase: Awaited<ReturnType<typeof createClient>>,
  productId: string
): Promise<{
  id: string
  slug: string
  category: {
    id: string
    requires_size: boolean
    size_options: string[]
  }
} | null> {
  const { data, error } = await supabase
    .from('products')
    .select('id, slug, category:categories(id, requires_size, size_options)')
    .eq('id', productId)
    .maybeSingle()

  if (error || !data) return null
  const categoryObj = Array.isArray(data.category)
    ? data.category[0]
    : data.category
  if (!categoryObj) return null

  return {
    id: data.id,
    slug: data.slug,
    category: {
      id: categoryObj.id,
      requires_size: categoryObj.requires_size,
      size_options: categoryObj.size_options ?? [],
    },
  }
}

async function checkDuplicateVariantFields(
  supabase: Awaited<ReturnType<typeof createClient>>,
  params: {
    productId: string
    sku: string
    size: string | null
    colorName: string | null
    excludeVariantId?: string
  }
): Promise<Extract<ActionResult<never>, { ok: false }> | null> {
  // 1. Cek SKU duplikat
  let skuQuery = supabase
    .from('product_variants')
    .select('id')
    .eq('sku', params.sku)
  if (params.excludeVariantId) {
    skuQuery = skuQuery.neq('id', params.excludeVariantId)
  }
  const { data: existingSku } = await skuQuery.maybeSingle()
  if (existingSku) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_SKU',
        message: DUPLICATE_SKU_MESSAGE,
        fieldErrors: {
          sku: [DUPLICATE_SKU_MESSAGE],
        },
      },
    }
  }

  // 2. Cek kombinasi (product_id, size, color_name) duplikat (NULL dianggap sama)
  let comboQuery = supabase
    .from('product_variants')
    .select('id, size, color_name')
    .eq('product_id', params.productId)

  if (params.excludeVariantId) {
    comboQuery = comboQuery.neq('id', params.excludeVariantId)
  }

  const { data: siblingVariants } = await comboQuery
  const targetSize = (params.size ?? '').trim().toLowerCase()
  const targetColor = (params.colorName ?? '').trim().toLowerCase()

  const duplicateCombo = (siblingVariants ?? []).some((v) => {
    const vSize = (v.size ?? '').trim().toLowerCase()
    const vColor = (v.color_name ?? '').trim().toLowerCase()
    return vSize === targetSize && vColor === targetColor
  })

  if (duplicateCombo) {
    return {
      ok: false,
      error: {
        code: 'DUPLICATE_VARIANT_COMBO',
        message: DUPLICATE_COMBO_MESSAGE,
        fieldErrors: {
          color_name: [DUPLICATE_COMBO_MESSAGE],
        },
      },
    }
  }

  return null
}

export async function createVariantRecord(
  data: CreateVariantValidData
): Promise<
  ActionResult<{ id: string; productId: string; productSlug: string }>
> {
  const supabase = await createClient()

  const product = await loadProductWithCategory(supabase, data.product_id)
  if (!product) {
    return {
      ok: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  // Validasi aturan ukuran terhadap kategori produk (§6.1, §6.2)
  const categoryCheck = validateVariantAgainstCategory(
    { size: data.size },
    product.category
  )
  if (!categoryCheck.ok) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: categoryCheck.message,
        fieldErrors: categoryCheck.fieldErrors,
      },
    }
  }

  // Cek duplikat SKU & kombinasi (produk, ukuran, warna)
  const dupError = await checkDuplicateVariantFields(supabase, {
    productId: data.product_id,
    sku: data.sku,
    size: data.size,
    colorName: data.color_name,
  })
  if (dupError) return dupError

  const { data: created, error } = await supabase
    .from('product_variants')
    .insert({
      product_id: data.product_id,
      sku: data.sku,
      size: data.size,
      color_name: data.color_name,
      color_hex: data.color_hex,
      color_hex_2: data.color_hex_2,
      price: data.price,
      compare_at_price: data.compare_at_price,
      stock_quantity: data.stock_quantity,
      is_active: data.is_active,
    })
    .select('id')
    .single()

  if (error) {
    const uniqueErr = mapVariantUniqueError(error)
    if (uniqueErr) return uniqueErr
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return {
    ok: true,
    data: {
      id: created.id,
      productId: product.id,
      productSlug: product.slug,
    },
  }
}

export async function updateVariantRecord(
  id: string,
  data: UpdateVariantValidData
): Promise<
  ActionResult<{ id: string; productId: string; productSlug: string }>
> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('product_variants')
    .select('id, product_id')
    .eq('id', id)
    .maybeSingle()

  if (fetchError || !existing) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Varian tidak ditemukan.',
      },
    }
  }

  const product = await loadProductWithCategory(supabase, existing.product_id)
  if (!product) {
    return {
      ok: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  // Validasi aturan ukuran terhadap kategori produk
  const categoryCheck = validateVariantAgainstCategory(
    { size: data.size },
    product.category
  )
  if (!categoryCheck.ok) {
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: categoryCheck.message,
        fieldErrors: categoryCheck.fieldErrors,
      },
    }
  }

  // Cek duplikat SKU & kombinasi (produk, ukuran, warna)
  const dupError = await checkDuplicateVariantFields(supabase, {
    productId: existing.product_id,
    sku: data.sku,
    size: data.size,
    colorName: data.color_name,
    excludeVariantId: id,
  })
  if (dupError) return dupError

  // Update TANPA menyentuh stock_quantity (§11.7 GRANT & P8-05b)
  const { data: updated, error } = await supabase
    .from('product_variants')
    .update({
      sku: data.sku,
      size: data.size,
      color_name: data.color_name,
      color_hex: data.color_hex,
      color_hex_2: data.color_hex_2,
      price: data.price,
      compare_at_price: data.compare_at_price,
      is_active: data.is_active,
    })
    .eq('id', id)
    .select('id')
    .maybeSingle()

  if (error) {
    const uniqueErr = mapVariantUniqueError(error)
    if (uniqueErr) return uniqueErr
    const mapped = mapDbError(error)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!updated) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Varian tidak ditemukan.',
      },
    }
  }

  return {
    ok: true,
    data: {
      id: updated.id,
      productId: product.id,
      productSlug: product.slug,
    },
  }
}

export async function setVariantActiveStatus(
  id: string,
  isActive: boolean
): Promise<
  ActionResult<{ id: string; productId: string; productSlug?: string }>
> {
  const supabase = await createClient()

  const { data: updated, error } = await supabase
    .from('product_variants')
    .update({ is_active: isActive })
    .eq('id', id)
    .select('id, product_id, product:products(slug)')
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
        message: 'Varian tidak ditemukan.',
      },
    }
  }

  const prodObj = Array.isArray(updated.product)
    ? updated.product[0]
    : updated.product

  return {
    ok: true,
    data: {
      id: updated.id,
      productId: updated.product_id,
      productSlug: prodObj?.slug,
    },
  }
}

export async function deleteVariantRecord(
  id: string
): Promise<ActionResult<{ productId: string; productSlug?: string }>> {
  const supabase = await createClient()

  const { data: variant, error: fetchError } = await supabase
    .from('product_variants')
    .select('id, product_id, product:products(slug)')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    const mapped = mapDbError(fetchError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!variant) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Varian tidak ditemukan.',
      },
    }
  }

  // Cek apakah varian pernah dipesan di order_items (D-15)
  const { count, error: countError } = await supabase
    .from('order_items')
    .select('id', { count: 'exact', head: true })
    .eq('variant_id', id)

  if (countError) {
    const mapped = mapDbError(countError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if ((count ?? 0) > 0) {
    return {
      ok: false,
      error: {
        code: 'VARIANT_HAS_ORDERS',
        message: VARIANT_HAS_ORDERS_MESSAGE,
      },
    }
  }

  const { error: deleteError } = await supabase
    .from('product_variants')
    .delete()
    .eq('id', id)

  if (deleteError) {
    const mapped = mapDbError(deleteError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  const prodObj = Array.isArray(variant.product)
    ? variant.product[0]
    : variant.product

  return {
    ok: true,
    data: {
      productId: variant.product_id,
      productSlug: prodObj?.slug,
    },
  }
}
