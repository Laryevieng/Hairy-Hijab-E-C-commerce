import { z } from 'zod'

export const categoryIdSchema = z
  .string({ error: 'ID kategori wajib diisi.' })
  .uuid({ error: 'Format ID kategori tidak valid.' })

const sizeOptionsPreprocess = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .default([])
  .transform((val) => {
    const rawList = Array.isArray(val) ? val : val.split(',')
    const cleaned: string[] = []
    for (const item of rawList) {
      const trimmed = item.trim()
      if (trimmed && !cleaned.includes(trimmed)) {
        cleaned.push(trimmed)
      }
    }
    return cleaned
  })
  .refine((arr) => arr.length <= 20, {
    error: 'Maksimal 20 pilihan ukuran.',
  })
  .refine((arr) => arr.every((opt) => opt.length <= 20), {
    error: 'Setiap pilihan ukuran maksimal 20 karakter.',
  })

export const categorySchema = z
  .object({
    name: z
      .string({ error: 'Nama kategori wajib diisi.' })
      .trim()
      .min(2, { error: 'Nama kategori minimal 2 karakter.' })
      .max(80, { error: 'Nama kategori maksimal 80 karakter.' }),
    slug: z
      .string({ error: 'Slug kategori wajib diisi.' })
      .trim()
      .toLowerCase()
      .min(2, { error: 'Slug kategori minimal 2 karakter.' })
      .max(100, { error: 'Slug kategori maksimal 100 karakter.' })
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, {
        error:
          'Slug hanya boleh berisi huruf kecil, angka, dan tanda hubung (tanpa spasi atau tanda hubung di awal/akhir).',
      }),
    description: z
      .string()
      .trim()
      .max(500, { error: 'Deskripsi maksimal 500 karakter.' })
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    image_path: z
      .string()
      .trim()
      .max(255, { error: 'Path gambar maksimal 255 karakter.' })
      .nullable()
      .optional()
      .transform((val) => (val && val.length > 0 ? val : null)),
    requires_size: z.boolean().optional().default(false),
    size_options: sizeOptionsPreprocess,
    is_active: z.boolean().optional().default(true),
    sort_order: z.coerce
      .number({ error: 'Urutan tampil harus berupa angka.' })
      .int({ error: 'Urutan tampil harus berupa bilangan bulat.' })
      .min(0, { error: 'Urutan tampil minimal 0.' })
      .max(9999, { error: 'Urutan tampil maksimal 9999.' })
      .optional()
      .default(0),
  })
  .superRefine((data, ctx) => {
    if (data.requires_size && data.size_options.length === 0) {
      ctx.addIssue({
        code: 'custom',
        path: ['size_options'],
        message: 'Pilihan ukuran wajib diisi jika kategori mewajibkan ukuran.',
      })
    }
  })
  .transform((data) => ({
    ...data,
    size_options: data.requires_size ? data.size_options : [],
  }))

export const updateCategorySchema = z.object({
  id: categoryIdSchema,
  data: categorySchema,
})

export const toggleCategoryActiveSchema = z.object({
  id: categoryIdSchema,
  is_active: z.boolean({ error: 'Status aktif wajib berupa boolean.' }),
})

export type CategoryInput = z.input<typeof categorySchema>
export type CategoryValidData = z.output<typeof categorySchema>
