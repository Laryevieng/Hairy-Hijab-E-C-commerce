import 'server-only'

import { createClient } from '@/lib/supabase/server'
import { mapDbError } from '@/lib/errors'
import {
  MAX_IMAGES_PER_PRODUCT,
  type CreateProductImageValidData,
  type UpdateProductImageValidData,
} from '@/lib/validations/product-image'
import type { ActionResult } from '@/types/action'

export const PRODUCT_IMAGES_BUCKET = 'product-images'

async function removeStorageObjectSilently(
  supabase: Awaited<ReturnType<typeof createClient>>,
  storagePath: string
) {
  try {
    await supabase.storage.from(PRODUCT_IMAGES_BUCKET).remove([storagePath])
  } catch {
    // Abaikan kegagalan cleanup sekunder
  }
}

export async function createProductImageRecord(
  data: CreateProductImageValidData
): Promise<
  ActionResult<{ id: string; productId: string; productSlug: string }>
> {
  const supabase = await createClient()

  // 1. Pastikan produk ada dan hitung jumlah gambar saat ini
  const [productRes, imagesRes] = await Promise.all([
    supabase
      .from('products')
      .select('id, slug, name')
      .eq('id', data.product_id)
      .maybeSingle(),
    supabase
      .from('product_images')
      .select('id, sort_order')
      .eq('product_id', data.product_id)
      .order('sort_order', { ascending: true }),
  ])

  if (productRes.error || !productRes.data) {
    await removeStorageObjectSilently(supabase, data.storage_path)
    return {
      ok: false,
      error: {
        code: 'PRODUCT_NOT_FOUND',
        message: 'Produk tidak ditemukan.',
      },
    }
  }

  const existingImages = imagesRes.data ?? []
  if (existingImages.length >= MAX_IMAGES_PER_PRODUCT) {
    await removeStorageObjectSilently(supabase, data.storage_path)
    return {
      ok: false,
      error: {
        code: 'MAX_IMAGES_EXCEEDED',
        message: `Maksimal ${MAX_IMAGES_PER_PRODUCT} gambar per produk.`,
      },
    }
  }

  // 2. Jika variant_id diisi, pastikan varian milik produk ini
  if (data.variant_id) {
    const { data: variantRow, error: varError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', data.variant_id)
      .eq('product_id', data.product_id)
      .maybeSingle()

    if (varError || !variantRow) {
      await removeStorageObjectSilently(supabase, data.storage_path)
      return {
        ok: false,
        error: {
          code: 'VARIANT_NOT_FOUND',
          message: 'Varian tidak ditemukan pada produk ini.',
        },
      }
    }
  }

  const maxSortOrder = existingImages.reduce(
    (max, img) => (img.sort_order > max ? img.sort_order : max),
    -1
  )
  const sortOrder =
    data.sort_order !== undefined ? data.sort_order : maxSortOrder + 1

  // 3. Simpan baris product_images
  const { data: created, error: insertError } = await supabase
    .from('product_images')
    .insert({
      product_id: data.product_id,
      storage_path: data.storage_path,
      alt_text: data.alt_text,
      sort_order: sortOrder,
      variant_id: data.variant_id,
    })
    .select('id')
    .single()

  if (insertError || !created) {
    // Rollback objek storage agar tidak ada objek yatim (P8-06)
    await removeStorageObjectSilently(supabase, data.storage_path)
    const mapped = mapDbError(insertError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  return {
    ok: true,
    data: {
      id: created.id,
      productId: productRes.data.id,
      productSlug: productRes.data.slug,
    },
  }
}

export async function updateProductImageRecord(
  data: UpdateProductImageValidData
): Promise<
  ActionResult<{ id: string; productId: string; productSlug?: string }>
> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('product_images')
    .select('id, product_id, product:products(slug)')
    .eq('id', data.id)
    .maybeSingle()

  if (fetchError || !existing) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Gambar produk tidak ditemukan.',
      },
    }
  }

  if (data.variant_id) {
    const { data: variantRow, error: varError } = await supabase
      .from('product_variants')
      .select('id')
      .eq('id', data.variant_id)
      .eq('product_id', existing.product_id)
      .maybeSingle()

    if (varError || !variantRow) {
      return {
        ok: false,
        error: {
          code: 'VARIANT_NOT_FOUND',
          message: 'Varian tidak ditemukan pada produk ini.',
        },
      }
    }
  }

  const { error: updateError } = await supabase
    .from('product_images')
    .update({
      alt_text: data.alt_text,
      variant_id: data.variant_id,
    })
    .eq('id', data.id)

  if (updateError) {
    const mapped = mapDbError(updateError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  const prodObj = Array.isArray(existing.product)
    ? existing.product[0]
    : existing.product

  return {
    ok: true,
    data: {
      id: existing.id,
      productId: existing.product_id,
      productSlug: prodObj?.slug,
    },
  }
}

export async function moveProductImageOrderRecord(
  id: string,
  direction: 'up' | 'down'
): Promise<ActionResult<{ productId: string; productSlug?: string }>> {
  const supabase = await createClient()

  const { data: targetImage, error: targetErr } = await supabase
    .from('product_images')
    .select('id, product_id, product:products(slug)')
    .eq('id', id)
    .maybeSingle()

  if (targetErr || !targetImage) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Gambar produk tidak ditemukan.',
      },
    }
  }

  const { data: siblingImages, error: siblingsErr } = await supabase
    .from('product_images')
    .select('id, sort_order, created_at')
    .eq('product_id', targetImage.product_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })
    .order('id', { ascending: true })

  if (siblingsErr || !siblingImages) {
    const mapped = mapDbError(siblingsErr)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  const ordered = [...siblingImages]
  const currentIndex = ordered.findIndex((img) => img.id === id)
  if (currentIndex === -1) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Gambar produk tidak ditemukan.',
      },
    }
  }

  const swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1
  const prodObj = Array.isArray(targetImage.product)
    ? targetImage.product[0]
    : targetImage.product

  if (swapIndex < 0 || swapIndex >= ordered.length) {
    return {
      ok: true,
      data: {
        productId: targetImage.product_id,
        productSlug: prodObj?.slug,
      },
    }
  }

  // Tukar posisi dan normalisasi sort_order 0..N-1
  const temp = ordered[currentIndex]
  ordered[currentIndex] = ordered[swapIndex]
  ordered[swapIndex] = temp

  for (let i = 0; i < ordered.length; i += 1) {
    const item = ordered[i]
    if (item.sort_order !== i) {
      const { error: updErr } = await supabase
        .from('product_images')
        .update({ sort_order: i })
        .eq('id', item.id)

      if (updErr) {
        const mapped = mapDbError(updErr)
        return {
          ok: false,
          error: { code: mapped.code, message: mapped.message },
        }
      }
    }
  }

  return {
    ok: true,
    data: {
      productId: targetImage.product_id,
      productSlug: prodObj?.slug,
    },
  }
}

export async function deleteProductImageRecord(
  id: string
): Promise<
  ActionResult<{
    productId: string
    productSlug?: string
    deletedStoragePath: string
  }>
> {
  const supabase = await createClient()

  const { data: existing, error: fetchError } = await supabase
    .from('product_images')
    .select('id, product_id, storage_path, product:products(slug)')
    .eq('id', id)
    .maybeSingle()

  if (fetchError) {
    const mapped = mapDbError(fetchError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  if (!existing) {
    return {
      ok: false,
      error: {
        code: 'NOT_FOUND',
        message: 'Gambar produk tidak ditemukan.',
      },
    }
  }

  // 1. Hapus objek dari bucket storage product-images terlebih dahulu
  const { error: storageError } = await supabase.storage
    .from(PRODUCT_IMAGES_BUCKET)
    .remove([existing.storage_path])

  if (storageError) {
    return {
      ok: false,
      error: {
        code: 'STORAGE_DELETE_FAILED',
        message: 'Gagal menghapus file gambar dari penyimpanan.',
      },
    }
  }

  // 2. Hapus baris dari tabel product_images
  const { error: deleteError } = await supabase
    .from('product_images')
    .delete()
    .eq('id', id)

  if (deleteError) {
    const mapped = mapDbError(deleteError)
    return { ok: false, error: { code: mapped.code, message: mapped.message } }
  }

  // 3. Rapikan kembali urutan sort_order gambar yang tersisa
  const { data: remaining } = await supabase
    .from('product_images')
    .select('id, sort_order')
    .eq('product_id', existing.product_id)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (remaining && remaining.length > 0) {
    for (let i = 0; i < remaining.length; i += 1) {
      if (remaining[i].sort_order !== i) {
        await supabase
          .from('product_images')
          .update({ sort_order: i })
          .eq('id', remaining[i].id)
      }
    }
  }

  const prodObj = Array.isArray(existing.product)
    ? existing.product[0]
    : existing.product

  return {
    ok: true,
    data: {
      productId: existing.product_id,
      productSlug: prodObj?.slug,
      deletedStoragePath: existing.storage_path,
    },
  }
}
