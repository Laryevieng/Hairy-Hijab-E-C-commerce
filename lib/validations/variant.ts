import { z } from 'zod'
import { productIdSchema } from './product'

export const variantIdSchema = z
  .string({ error: 'ID varian wajib diisi.' })
  .uuid({ error: 'Format ID varian tidak valid.' })

const HEX_COLOR_REGEX = /^#[0-9A-Fa-f]{6}$/

export const optionalHexColorSchema = z.preprocess(
  (val) => {
    if (typeof val !== 'string') return null
    const trimmed = val.trim()
    return trimmed.length > 0 ? trimmed.toUpperCase() : null
  },
  z
    .string()
    .regex(HEX_COLOR_REGEX, {
      error: 'Format kode warna harus #RRGGBB (contoh: #3B3028).',
    })
    .nullable()
    .optional()
    .transform((val) => val ?? null)
)

const priceFieldSchema = z.preprocess(
  (val) => {
    if (typeof val === 'string' && val.trim() !== '') return Number(val)
    return val
  },
  z
    .number({ error: 'Harga jual wajib berupa angka.' })
    .int({ error: 'Harga jual harus berupa bilangan bulat rupiah.' })
    .min(0, { error: 'Harga jual tidak boleh negatif.' })
    .max(100_000_000, { error: 'Harga jual terlalu besar.' })
)

const compareAtPriceFieldSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return null
    if (typeof val === 'string') {
      const trimmed = val.trim()
      return trimmed === '' ? null : Number(trimmed)
    }
    return val
  },
  z
    .number({ error: 'Harga coret harus berupa angka.' })
    .int({ error: 'Harga coret harus berupa bilangan bulat rupiah.' })
    .min(0, { error: 'Harga coret tidak boleh negatif.' })
    .max(100_000_000, { error: 'Harga coret terlalu besar.' })
    .nullable()
    .optional()
    .transform((val) => val ?? null)
)

const initialStockFieldSchema = z.preprocess(
  (val) => {
    if (val === '' || val === null || val === undefined) return 0
    if (typeof val === 'string') {
      const trimmed = val.trim()
      return trimmed === '' ? 0 : Number(trimmed)
    }
    return val
  },
  z
    .number({ error: 'Stok awal harus berupa angka.' })
    .int({ error: 'Stok awal harus berupa bilangan bulat.' })
    .min(0, { error: 'Stok awal tidak boleh negatif.' })
    .max(1_000_000, { error: 'Stok awal terlalu besar.' })
    .default(0)
)

const baseVariantObjectSchema = z.object({
  sku: z
    .string({ error: 'SKU varian wajib diisi.' })
    .trim()
    .min(2, { error: 'SKU minimal 2 karakter.' })
    .max(60, { error: 'SKU maksimal 60 karakter.' }),
  size: z
    .string()
    .trim()
    .max(40, { error: 'Ukuran maksimal 40 karakter.' })
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  color_name: z
    .string()
    .trim()
    .max(60, { error: 'Nama warna maksimal 60 karakter.' })
    .nullable()
    .optional()
    .transform((val) => (val && val.length > 0 ? val : null)),
  color_hex: optionalHexColorSchema,
  color_hex_2: optionalHexColorSchema,
  price: priceFieldSchema,
  compare_at_price: compareAtPriceFieldSchema,
  is_active: z.boolean().optional().default(true),
})

function refineVariantBase(
  data: {
    size: string | null
    color_name: string | null
    price: number
    compare_at_price: number | null
  },
  ctx: z.RefinementCtx
) {
  if (!data.size && !data.color_name) {
    ctx.addIssue({
      code: 'custom',
      path: ['color_name'],
      message: 'Minimal salah satu dari ukuran atau nama warna wajib diisi.',
    })
  }

  if (data.compare_at_price !== null && data.compare_at_price <= data.price) {
    ctx.addIssue({
      code: 'custom',
      path: ['compare_at_price'],
      message: 'Harga coret harus lebih besar dari harga jual.',
    })
  }
}

/**
 * Skema pembuatan varian baru (mencakup `product_id` dan `stock_quantity` awal).
 */
export const createVariantSchema = baseVariantObjectSchema
  .extend({
    product_id: productIdSchema,
    stock_quantity: initialStockFieldSchema,
  })
  .superRefine(refineVariantBase)

/**
 * Skema perubahan varian (TANPA `stock_quantity`; stok hanya diubah lewat adjust_stock di P8-07).
 */
export const updateVariantDataSchema =
  baseVariantObjectSchema.superRefine(refineVariantBase)

export const toggleVariantActiveSchema = z.object({
  id: variantIdSchema,
  is_active: z.boolean({ error: 'Status aktif wajib berupa boolean.' }),
})

export type CreateVariantInput = z.input<typeof createVariantSchema>
export type CreateVariantValidData = z.output<typeof createVariantSchema>
export type UpdateVariantInput = z.input<typeof updateVariantDataSchema>
export type UpdateVariantValidData = z.output<typeof updateVariantDataSchema>

export interface CategorySizeConstraint {
  requires_size: boolean
  size_options: string[]
}

/**
 * Memvalidasi aturan ukuran varian terhadap konfigurasi kategori produk (§6.1, §6.2, P8-05).
 */
export function validateVariantAgainstCategory(
  variant: { size: string | null },
  category: CategorySizeConstraint
):
  | { ok: true }
  | { ok: false; message: string; fieldErrors: Record<string, string[]> } {
  if (!category.requires_size) {
    return { ok: true }
  }

  if (!variant.size) {
    const msg = 'Ukuran wajib dipilih untuk produk pada kategori ini.'
    return {
      ok: false,
      message: msg,
      fieldErrors: { size: [msg] },
    }
  }

  if (
    category.size_options.length > 0 &&
    !category.size_options.includes(variant.size)
  ) {
    const msg = `Ukuran harus dipilih dari opsi kategori: ${category.size_options.join(', ')}.`
    return {
      ok: false,
      message: msg,
      fieldErrors: { size: [msg] },
    }
  }

  return { ok: true }
}
