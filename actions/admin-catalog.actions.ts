'use server'

import { revalidatePath } from 'next/cache'
import type { z } from 'zod'
import { requireAdmin } from '@/lib/auth/guards'
import {
  categoryIdSchema,
  categorySchema,
  toggleCategoryActiveSchema,
} from '@/lib/validations/category'
import {
  productIdSchema,
  productSchema,
  toggleProductActiveSchema,
} from '@/lib/validations/product'
import {
  variantIdSchema,
  createVariantSchema,
  updateVariantDataSchema,
  toggleVariantActiveSchema,
} from '@/lib/validations/variant'
import {
  createCategoryRecord,
  updateCategoryRecord,
  setCategoryActiveStatus,
  deleteCategoryRecord,
} from '@/services/admin/categories.service'
import {
  createProductRecord,
  updateProductRecord,
  setProductActiveStatus,
  deleteProductRecord,
} from '@/services/admin/products.service'
import {
  createVariantRecord,
  updateVariantRecord,
  setVariantActiveStatus,
  deleteVariantRecord,
} from '@/services/admin/variants.service'
import type { ActionResult } from '@/types/action'

type Failure = Extract<ActionResult<never>, { ok: false }>

function validationFailure(error: z.ZodError): Failure {
  const fieldErrors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    if (!fieldErrors[field]) fieldErrors[field] = []
    fieldErrors[field].push(issue.message)
  }
  const firstMsg = error.issues[0]?.message ?? 'Data tidak valid.'
  return {
    ok: false,
    error: {
      code: 'VALIDATION',
      message: firstMsg,
      fieldErrors,
    },
  }
}

function revalidateCatalogPaths(slug?: string) {
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/sale')
  revalidatePath('/search')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/products')
  if (slug) {
    revalidatePath(`/categories/${slug}`)
  }
}

function revalidateProductPaths(slug?: string, productId?: string) {
  revalidatePath('/', 'layout')
  revalidatePath('/')
  revalidatePath('/products')
  revalidatePath('/sale')
  revalidatePath('/search')
  revalidatePath('/admin')
  revalidatePath('/admin/products')
  revalidatePath('/admin/categories')
  revalidatePath('/admin/inventory')
  if (slug) {
    revalidatePath(`/products/${slug}`)
  }
  if (productId) {
    revalidatePath(`/admin/products/${productId}/edit`)
  }
}

/**
 * Tambah kategori baru (P8-03).
 * Urutan wajib: requireAdmin() -> validasi Zod -> service (klien sesi + RLS) -> revalidatePath.
 */
export async function createCategory(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  const parsed = categorySchema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await createCategoryRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateCatalogPaths(result.data.slug)
  return { ok: true, data: { id: result.data.id } }
}

/**
 * Ubah kategori yang sudah ada (P8-03).
 * Mendukung pemanggilan updateCategory(id, data) maupun updateCategory({ id, ...data }).
 */
export async function updateCategory(
  idOrInput: unknown,
  inputArg?: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  let rawId: unknown = idOrInput
  let rawData: unknown = inputArg

  if (
    inputArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
  ) {
    const obj = idOrInput as Record<string, unknown>
    rawId = obj.id
    rawData = 'data' in obj && typeof obj.data === 'object' ? obj.data : obj
  }

  const idParsed = categoryIdSchema.safeParse(rawId)
  if (!idParsed.success) {
    return validationFailure(idParsed.error)
  }

  const dataParsed = categorySchema.safeParse(rawData)
  if (!dataParsed.success) {
    return validationFailure(dataParsed.error)
  }

  const result = await updateCategoryRecord(idParsed.data, dataParsed.data)
  if (!result.ok) {
    return result
  }

  revalidateCatalogPaths(result.data.slug)
  return { ok: true, data: { id: result.data.id } }
}

/**
 * Aktifkan / nonaktifkan kategori (P8-03).
 */
export async function toggleCategoryActive(
  idOrInput: unknown,
  isActiveArg?: unknown
): Promise<ActionResult> {
  await requireAdmin()

  const payload =
    isActiveArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
      ? {
          id: (idOrInput as Record<string, unknown>).id,
          is_active:
            (idOrInput as Record<string, unknown>).is_active ??
            (idOrInput as Record<string, unknown>).isActive,
        }
      : { id: idOrInput, is_active: isActiveArg }

  const parsed = toggleCategoryActiveSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await setCategoryActiveStatus(
    parsed.data.id,
    parsed.data.is_active
  )
  if (!result.ok) {
    return result
  }

  revalidateCatalogPaths(result.data.slug)
  return { ok: true, data: undefined }
}

/**
 * Hapus kategori (P8-03).
 * Hanya diizinkan bila kategori belum memiliki produk.
 */
export async function deleteCategory(id: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = categoryIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await deleteCategoryRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateCatalogPaths()
  return { ok: true, data: undefined }
}

/**
 * Tambah produk baru (P8-04).
 * Urutan wajib: requireAdmin() -> validasi Zod -> service (klien sesi + RLS) -> revalidatePath.
 */
export async function createProduct(
  input: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin()

  const parsed = productSchema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await createProductRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.slug, result.data.id)
  return { ok: true, data: result.data }
}

/**
 * Ubah produk yang sudah ada (P8-04).
 * Mendukung pemanggilan updateProduct(id, data) maupun updateProduct({ id, ...data }).
 */
export async function updateProduct(
  idOrInput: unknown,
  inputArg?: unknown
): Promise<ActionResult<{ id: string; slug: string }>> {
  await requireAdmin()

  let rawId: unknown = idOrInput
  let rawData: unknown = inputArg

  if (
    inputArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
  ) {
    const obj = idOrInput as Record<string, unknown>
    rawId = obj.id
    rawData = 'data' in obj && typeof obj.data === 'object' ? obj.data : obj
  }

  const idParsed = productIdSchema.safeParse(rawId)
  if (!idParsed.success) {
    return validationFailure(idParsed.error)
  }

  const dataParsed = productSchema.safeParse(rawData)
  if (!dataParsed.success) {
    return validationFailure(dataParsed.error)
  }

  const result = await updateProductRecord(idParsed.data, dataParsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.slug, result.data.id)
  return { ok: true, data: result.data }
}

/**
 * Aktifkan / nonaktifkan produk (P8-04).
 */
export async function toggleProductActive(
  idOrInput: unknown,
  isActiveArg?: unknown
): Promise<ActionResult> {
  await requireAdmin()

  const payload =
    isActiveArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
      ? {
          id: (idOrInput as Record<string, unknown>).id,
          is_active:
            (idOrInput as Record<string, unknown>).is_active ??
            (idOrInput as Record<string, unknown>).isActive,
        }
      : { id: idOrInput, is_active: isActiveArg }

  const parsed = toggleProductActiveSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await setProductActiveStatus(
    parsed.data.id,
    parsed.data.is_active
  )
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.slug, result.data.id)
  return { ok: true, data: undefined }
}

/**
 * Hapus keras produk (P8-04).
 * Hanya diizinkan bila produk belum pernah dipesan (D-15).
 */
export async function deleteProduct(id: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = productIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await deleteProductRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.slug, parsed.data)
  return { ok: true, data: undefined }
}

/**
 * Tambah varian produk baru (P8-05).
 * Urutan wajib: requireAdmin() -> validasi Zod -> service (validasi kategori + klien sesi RLS) -> revalidatePath.
 */
export async function createVariant(
  input: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  const normalizedInput =
    typeof input === 'object' && input !== null
      ? {
          ...(input as Record<string, unknown>),
          stock_quantity:
            (input as Record<string, unknown>).stock_quantity ??
            (input as Record<string, unknown>).initial_stock ??
            0,
        }
      : input

  const parsed = createVariantSchema.safeParse(normalizedInput)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await createVariantRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.productSlug, result.data.productId)
  return { ok: true, data: { id: result.data.id } }
}

/**
 * Ubah varian produk yang sudah ada (P8-05).
 * Stok TIDAK dapat diubah lewat aksi ini (hanya lewat adjust_stock di P8-07).
 */
export async function updateVariant(
  idOrInput: unknown,
  inputArg?: unknown
): Promise<ActionResult<{ id: string }>> {
  await requireAdmin()

  let rawId: unknown = idOrInput
  let rawData: unknown = inputArg

  if (
    inputArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
  ) {
    const obj = idOrInput as Record<string, unknown>
    rawId = obj.id
    rawData = 'data' in obj && typeof obj.data === 'object' ? obj.data : obj
  }

  const idParsed = variantIdSchema.safeParse(rawId)
  if (!idParsed.success) {
    return validationFailure(idParsed.error)
  }

  const dataParsed = updateVariantDataSchema.safeParse(rawData)
  if (!dataParsed.success) {
    return validationFailure(dataParsed.error)
  }

  const result = await updateVariantRecord(idParsed.data, dataParsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.productSlug, result.data.productId)
  return { ok: true, data: { id: result.data.id } }
}

/**
 * Aktifkan / nonaktifkan varian produk (P8-05).
 */
export async function toggleVariantActive(
  idOrInput: unknown,
  isActiveArg?: unknown
): Promise<ActionResult> {
  await requireAdmin()

  const payload =
    isActiveArg === undefined &&
    typeof idOrInput === 'object' &&
    idOrInput !== null
      ? {
          id: (idOrInput as Record<string, unknown>).id,
          is_active:
            (idOrInput as Record<string, unknown>).is_active ??
            (idOrInput as Record<string, unknown>).isActive,
        }
      : { id: idOrInput, is_active: isActiveArg }

  const parsed = toggleVariantActiveSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await setVariantActiveStatus(
    parsed.data.id,
    parsed.data.is_active
  )
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.productSlug, result.data.productId)
  return { ok: true, data: undefined }
}

/**
 * Hapus keras varian produk (P8-05).
 * Hanya diizinkan bila varian belum pernah dipesan (D-15).
 */
export async function deleteVariant(id: unknown): Promise<ActionResult> {
  await requireAdmin()

  const parsed = variantIdSchema.safeParse(id)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const result = await deleteVariantRecord(parsed.data)
  if (!result.ok) {
    return result
  }

  revalidateProductPaths(result.data.productSlug, result.data.productId)
  return { ok: true, data: undefined }
}
