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
  createCategoryRecord,
  updateCategoryRecord,
  setCategoryActiveStatus,
  deleteCategoryRecord,
} from '@/services/admin/categories.service'
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
