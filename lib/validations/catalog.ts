import { z } from 'zod'

const text = z.preprocess(
  (value) => (typeof value === 'string' ? value.trim() : value),
  z.string().optional(),
)

const stringList = z.preprocess(
  (value) => {
    if (value === undefined) return []
    return Array.isArray(value) ? value : [value]
  },
  z.array(z.string().trim().min(1)).default([]),
)

const positiveInteger = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().int().positive(),
)

const nonNegativeInteger = z.preprocess(
  (value) => (typeof value === 'string' && value.trim() !== '' ? Number(value) : value),
  z.number().int().nonnegative(),
)

export const catalogSearchParamsSchema = z
  .object({
    page: positiveInteger.optional().default(1),
    sort: z.enum(['newest', 'price_asc', 'price_desc']).optional().default('newest'),
    category: text,
    size: stringList,
    color: stringList,
    min: nonNegativeInteger.optional(),
    max: nonNegativeInteger.optional(),
    q: z.preprocess(
      (value) => (typeof value === 'string' ? value.trim() : value),
      z.string().max(80).optional(),
    ),
  })
  .refine((params) => params.min === undefined || params.max === undefined || params.min <= params.max, {
    path: ['max'],
    message: 'Harga maksimum harus lebih besar atau sama dengan harga minimum.',
  })

export type CatalogSearchParams = z.infer<typeof catalogSearchParamsSchema>

export function parseCatalogSearchParams(input: unknown) {
  if (input instanceof URLSearchParams) {
    return catalogSearchParamsSchema.safeParse({
      page: input.get('page') ?? undefined,
      sort: input.get('sort') ?? undefined,
      category: input.get('category') ?? undefined,
      size: input.getAll('size'),
      color: input.getAll('color'),
      min: input.get('min') ?? undefined,
      max: input.get('max') ?? undefined,
      q: input.get('q') ?? undefined,
    })
  }

  return catalogSearchParamsSchema.safeParse(input)
}
