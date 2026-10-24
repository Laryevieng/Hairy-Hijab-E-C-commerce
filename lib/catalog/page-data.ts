import 'server-only'

import { catalogSearchParamsSchema, type CatalogSearchParams } from '@/lib/validations/catalog'

export type PageSearchParams = Record<string, string | string[] | undefined>

export function parsePageSearchParams(
  searchParams: PageSearchParams,
  fallback: Partial<CatalogSearchParams> = {},
): CatalogSearchParams {
  const parsed = catalogSearchParamsSchema.safeParse(searchParams)
  return parsed.success
    ? parsed.data
    : catalogSearchParamsSchema.parse(fallback)
}

export function toURLSearchParams(searchParams: PageSearchParams) {
  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(searchParams)) {
    for (const item of Array.isArray(value) ? value : value === undefined ? [] : [value]) {
      params.append(key, item)
    }
  }
  return params
}
