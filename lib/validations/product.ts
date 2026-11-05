import { z } from 'zod'

export const productIdSchema = z
  .string({ error: 'ID produk wajib diisi.' })
  .uuid({ error: 'Format ID produk tidak valid.' })

export const productSpecEntrySchema = z.object({
  key: z
    .string({ error: 'Nama atribut spesifikasi wajib berupa teks.' })
    .trim()
    .max(60, { error: 'Nama atribut maksimal 60 karakter.' }),
  value: z
    .string({ error: 'Nilai spesifikasi wajib berupa teks.' })
    .trim()
    .max(200, { error: 'Nilai spesifikasi maksimal 200 karakter.' }),
})

export type ProductSpecEntry = z.infer<typeof productSpecEntrySchema>

function validateSpecEntries(
  entries: ProductSpecEntry[],
  ctx: z.RefinementCtx,
  fieldPrefix: string = 'specs'
) {
  if (entries.length > 20) {
    ctx.addIssue({
      code: 'custom',
      path: [fieldPrefix],
      message: 'Maksimal 20 baris spesifikasi produk.',
    })
    return
  }

  const seenKeys = new Set<string>()
  entries.forEach((entry, index) => {
    const key = entry.key.trim()
    const value = entry.value.trim()

    if (!key && !value) {
      return
    }
    if (!key && value) {
      ctx.addIssue({
        code: 'custom',
        path: [fieldPrefix, index, 'key'],
        message: 'Nama atribut wajib diisi jika nilai diisi.',
      })
      return
    }
    if (key && !value) {
      ctx.addIssue({
        code: 'custom',
        path: [fieldPrefix, index, 'value'],
        message: 'Nilai spesifikasi wajib diisi.',
      })
      return
    }

    const lowerKey = key.toLowerCase()
    if (seenKeys.has(lowerKey)) {
      ctx.addIssue({
        code: 'custom',
        path: [fieldPrefix, index, 'key'],
        message: `Atribut "${key}" sudah ada (tidak boleh duplikat).`,
      })
      return
    }
    seenKeys.add(lowerKey)
  })
}

const rawSpecsSchema = z
  .union([
    z.array(productSpecEntrySchema),
    z.record(
      z.string().trim().min(1).max(60),
      z.union([z.string(), z.number(), z.boolean()])
    ),
  ])
  .optional()
  .default({})

/**
 * Skema form tambah/ubah produk di klien (React Hook Form + Zod).
 */
export const productFormSchema = z
  .object({
    name: z
      .string({ error: 'Nama produk wajib diisi.' })
      .trim()
      .min(2, { error: 'Nama produk minimal 2 karakter.' })
      .max(120, { error: 'Nama produk maksimal 120 karakter.' }),
    slug: z
      .string({ error: 'Slug produk wajib diisi.' })
      .trim()
      .toLowerCase()
      .min(2, { error: 'Slug produk minimal 2 karakter.' })
      .max(140, { error: 'Slug produk maksimal 140 karakter.' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        error:
          'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (tanpa spasi atau tanda hubung di awal/akhir).',
      }),
    category_id: z
      .string({ error: 'Kategori produk wajib dipilih.' })
      .trim()
      .uuid({ error: 'Kategori produk wajib dipilih.' }),
    description: z
      .string()
      .trim()
      .max(2000, { error: 'Deskripsi maksimal 2000 karakter.' }),
    material: z
      .string()
      .trim()
      .max(200, { error: 'Informasi bahan maksimal 200 karakter.' }),
    care_instructions: z
      .string()
      .trim()
      .max(1000, { error: 'Panduan perawatan maksimal 1000 karakter.' }),
    specs: z.array(productSpecEntrySchema),
    is_active: z.boolean(),
    is_featured: z.boolean(),
  })
  .superRefine((data, ctx) => {
    validateSpecEntries(data.specs, ctx, 'specs')
  })

export type ProductFormValues = z.infer<typeof productFormSchema>

/**
 * Skema validasi server untuk membuat / memperbarui produk (P8-04).
 * Menerima `specs` baik berupa array `{ key, value }[]` dari form maupun `Record<string, string>`.
 */
export const productSchema = z
  .object({
    name: z
      .string({ error: 'Nama produk wajib diisi.' })
      .trim()
      .min(2, { error: 'Nama produk minimal 2 karakter.' })
      .max(120, { error: 'Nama produk maksimal 120 karakter.' }),
    slug: z
      .string({ error: 'Slug produk wajib diisi.' })
      .trim()
      .toLowerCase()
      .min(2, { error: 'Slug produk minimal 2 karakter.' })
      .max(140, { error: 'Slug produk maksimal 140 karakter.' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        error:
          'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (tanpa spasi atau tanda hubung di awal/akhir).',
      }),
    category_id: z
      .string({ error: 'Kategori produk wajib dipilih.' })
      .trim()
      .uuid({ error: 'Kategori produk wajib dipilih.' }),
    description: z
      .string()
      .trim()
      .max(2000, { error: 'Deskripsi maksimal 2000 karakter.' })
      .nullable()
      .optional()
      .transform((val) => val ?? ''),
    material: z
      .string()
      .trim()
      .max(200, { error: 'Informasi bahan maksimal 200 karakter.' })
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    care_instructions: z
      .string()
      .trim()
      .max(1000, { error: 'Panduan perawatan maksimal 1000 karakter.' })
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    specs: rawSpecsSchema,
    is_active: z.boolean().optional().default(true),
    is_featured: z.boolean().optional().default(false),
  })
  .superRefine((data, ctx) => {
    if (Array.isArray(data.specs)) {
      validateSpecEntries(data.specs, ctx, 'specs')
    } else {
      const entries: ProductSpecEntry[] = Object.entries(data.specs).map(
        ([k, v]) => ({
          key: k.trim(),
          value: String(v ?? '').trim(),
        })
      )
      validateSpecEntries(entries, ctx, 'specs')
    }
  })
  .transform((data) => {
    const normalizedSpecs: Record<string, string> = {}
    if (Array.isArray(data.specs)) {
      for (const item of data.specs) {
        const k = item.key.trim()
        const v = item.value.trim()
        if (k && v) {
          normalizedSpecs[k] = v
        }
      }
    } else {
      for (const [rawKey, rawVal] of Object.entries(data.specs)) {
        const k = rawKey.trim()
        const v = String(rawVal ?? '').trim()
        if (k && v) {
          normalizedSpecs[k] = v
        }
      }
    }

    return {
      name: data.name,
      slug: data.slug,
      category_id: data.category_id,
      description: data.description,
      material: data.material,
      care_instructions: data.care_instructions,
      specs: normalizedSpecs,
      is_active: data.is_active,
      is_featured: data.is_featured,
    }
  })

export const toggleProductActiveSchema = z.object({
  id: productIdSchema,
  is_active: z.boolean({ error: 'Status aktif wajib berupa boolean.' }),
})

export const adminProductsSearchParamsSchema = z.object({
  page: z.preprocess(
    (val) => {
      if (typeof val === 'string' && val.trim() !== '') {
        const n = Number(val)
        return Number.isInteger(n) && n >= 1 ? n : 1
      }
      if (typeof val === 'number' && Number.isInteger(val) && val >= 1) {
        return val
      }
      return 1
    },
    z.number().int().positive().default(1)
  ),
  q: z.preprocess(
    (val) => (typeof val === 'string' ? val.trim().slice(0, 80) : ''),
    z.string().max(80).default('')
  ),
  category: z.preprocess(
    (val) => {
      if (typeof val !== 'string') return undefined
      const trimmed = val.trim()
      return z.string().uuid().safeParse(trimmed).success ? trimmed : undefined
    },
    z.string().uuid().optional()
  ),
  status: z.preprocess(
    (val) =>
      val === 'active' || val === 'inactive' || val === 'all' ? val : 'all',
    z.enum(['all', 'active', 'inactive']).default('all')
  ),
})

export type ProductInput = z.input<typeof productSchema>
export type ProductValidData = z.output<typeof productSchema>
export type AdminProductsSearchParams = z.infer<
  typeof adminProductsSearchParamsSchema
>

export function parseAdminProductsSearchParams(
  raw: Record<string, string | string[] | undefined>
): AdminProductsSearchParams {
  const first = (v: string | string[] | undefined) =>
    Array.isArray(v) ? v[0] : v
  const parsed = adminProductsSearchParamsSchema.safeParse({
    page: first(raw.page),
    q: first(raw.q),
    category: first(raw.category),
    status: first(raw.status),
  })
  if (parsed.success) return parsed.data
  return { page: 1, q: '', category: undefined, status: 'all' }
}
