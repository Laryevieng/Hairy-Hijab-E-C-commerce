import { z } from 'zod'
import { productIdSchema } from './product'
import { variantIdSchema } from './variant'

export const MAX_IMAGES_PER_PRODUCT = 8
export const MAX_PRODUCT_IMAGE_SIZE = 2 * 1024 * 1024 // 2 MB (§11.8, P8-06a)

export const productImageIdSchema = z
  .string({ error: 'ID gambar produk wajib diisi.' })
  .uuid({ error: 'Format ID gambar produk tidak valid.' })

/**
 * Menormalisasi path penyimpanan gambar produk agar selalu berformat
 * `<product_id>/<filename>.<ext>` di dalam bucket `product-images`.
 */
export function normalizeProductImagePath(rawPath: string): string {
  const trimmed = rawPath.trim()
  if (trimmed.startsWith('product-images/')) {
    return trimmed.slice('product-images/'.length)
  }
  return trimmed
}

const STORAGE_PATH_REGEX =
  /^[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}\/[a-zA-Z0-9._-]+\.(?:jpg|jpeg|png|webp)$/

export const productImageStoragePathSchema = z
  .string({ error: 'Path penyimpanan gambar wajib diisi.' })
  .trim()
  .min(1, { error: 'Path penyimpanan gambar wajib diisi.' })
  .max(255, { error: 'Path penyimpanan gambar terlalu panjang.' })
  .transform(normalizeProductImagePath)
  .refine(
    (p) => !p.includes('..') && !p.startsWith('/') && !p.includes('\\'),
    { error: 'Path penyimpanan gambar tidak valid.' }
  )
  .refine((p) => STORAGE_PATH_REGEX.test(p), {
    error:
      'Format path gambar harus <product_id>/<uuid>.<jpg|png|webp>.',
  })

export const altTextSchema = z
  .string({ error: 'Teks alternatif (alt text) wajib diisi.' })
  .trim()
  .min(1, { error: 'Teks alternatif (alt text) wajib diisi.' })
  .max(200, { error: 'Teks alternatif maksimal 200 karakter.' })

const optionalVariantIdSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null
    return val
  },
  variantIdSchema.nullable().optional().transform((val) => val ?? null)
)

const optionalSortOrderSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return undefined
    if (typeof val === 'string') return Number(val)
    return val
  },
  z
    .number({ error: 'Urutan gambar harus berupa angka.' })
    .int({ error: 'Urutan gambar harus berupa bilangan bulat.' })
    .min(0, { error: 'Urutan gambar minimal 0.' })
    .max(999, { error: 'Urutan gambar maksimal 999.' })
    .optional()
)

export const createProductImageSchema = z
  .object({
    product_id: productIdSchema,
    storage_path: productImageStoragePathSchema,
    alt_text: altTextSchema,
    sort_order: optionalSortOrderSchema,
    variant_id: optionalVariantIdSchema,
  })
  .superRefine((data, ctx) => {
    const prefix = `${data.product_id.toLowerCase()}/`
    if (!data.storage_path.toLowerCase().startsWith(prefix)) {
      ctx.addIssue({
        code: 'custom',
        path: ['storage_path'],
        message: 'Path penyimpanan gambar harus berada pada folder ID produk.',
      })
    }
  })

export const updateProductImageSchema = z.object({
  id: productImageIdSchema,
  alt_text: altTextSchema,
  variant_id: optionalVariantIdSchema,
})

export const reorderProductImageSchema = z.object({
  id: productImageIdSchema,
  direction: z.enum(['up', 'down'], {
    error: 'Arah pemindahan urutan harus "up" atau "down".',
  }),
})

export type CreateProductImageInput = z.input<typeof createProductImageSchema>
export type CreateProductImageValidData = z.output<
  typeof createProductImageSchema
>
export type UpdateProductImageInput = z.input<typeof updateProductImageSchema>
export type UpdateProductImageValidData = z.output<
  typeof updateProductImageSchema
>
export type ReorderProductImageInput = z.input<typeof reorderProductImageSchema>
