import { describe, it, expect } from 'vitest'
import {
  productSchema,
  productFormSchema,
  parseAdminProductsSearchParams,
} from '@/lib/validations/product'
import { suggestNextSlug } from '@/lib/utils/slug'

describe('productSchema & productFormSchema (P8-04)', () => {
  const validCategoryId = 'a0000000-0000-4000-8000-000000000001'

  it('rejects product without category_id', () => {
    const parsedEmpty = productSchema.safeParse({
      name: 'Bergo Karet Daily',
      slug: 'bergo-karet-daily',
      category_id: '',
    })
    expect(parsedEmpty.success).toBe(false)

    const parsedMissing = productSchema.safeParse({
      name: 'Bergo Karet Daily',
      slug: 'bergo-karet-daily',
    })
    expect(parsedMissing.success).toBe(false)
  })

  it('accepts valid product and transforms key-value spec entries to Record<string, string>', () => {
    const parsed = productSchema.safeParse({
      name: '  Pashmina Bandana Jersey  ',
      slug: 'pashmina-bandana-jersey',
      category_id: validCategoryId,
      description: '  Nyaman dipakai seharian  ',
      material: '  Jersey Premium  ',
      care_instructions: '',
      specs: [
        { key: 'Dimensi', value: '175 x 75 cm' },
        { key: 'Finishing', value: 'Jahit Tepi Rapi' },
        { key: '  ', value: '  ' }, // empty row ignored
      ],
      is_active: true,
      is_featured: true,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: 'Pashmina Bandana Jersey',
        slug: 'pashmina-bandana-jersey',
        category_id: validCategoryId,
        description: 'Nyaman dipakai seharian',
        material: 'Jersey Premium',
        care_instructions: null,
        specs: {
          Dimensi: '175 x 75 cm',
          Finishing: 'Jahit Tepi Rapi',
        },
        is_active: true,
        is_featured: true,
      })
    }
  })

  it('rejects duplicate spec keys or incomplete key-value pairs', () => {
    const dupSpecs = productFormSchema.safeParse({
      name: 'Bergo Bandana',
      slug: 'bergo-bandana',
      category_id: validCategoryId,
      description: '',
      material: '',
      care_instructions: '',
      specs: [
        { key: 'Dimensi', value: '110 x 110 cm' },
        { key: 'dimensi', value: '120 x 120 cm' },
      ],
      is_active: true,
      is_featured: false,
    })
    expect(dupSpecs.success).toBe(false)

    const missingValue = productFormSchema.safeParse({
      name: 'Bergo Bandana',
      slug: 'bergo-bandana',
      category_id: validCategoryId,
      description: '',
      material: '',
      care_instructions: '',
      specs: [{ key: 'Dimensi', value: '' }],
      is_active: true,
      is_featured: false,
    })
    expect(missingValue.success).toBe(false)
  })

  it('suggests -2 suffix on slug collision and increments when -2 is taken', () => {
    expect(suggestNextSlug('bergo-karet', ['bergo-karet'])).toBe(
      'bergo-karet-2'
    )
    expect(
      suggestNextSlug('bergo-karet', ['bergo-karet', 'bergo-karet-2'])
    ).toBe('bergo-karet-3')
    expect(
      suggestNextSlug('bergo-karet-2', [
        'bergo-karet',
        'bergo-karet-2',
        'bergo-karet-3',
      ])
    ).toBe('bergo-karet-4')
  })

  it('parses admin products search params safely', () => {
    const parsed = parseAdminProductsSearchParams({
      page: '3',
      q: '  bergo  ',
      category: validCategoryId,
      status: 'inactive',
    })
    expect(parsed).toEqual({
      page: 3,
      q: 'bergo',
      category: validCategoryId,
      status: 'inactive',
    })

    const fallback = parseAdminProductsSearchParams({
      page: '-5',
      category: 'bukan-uuid',
      status: 'invalid',
    })
    expect(fallback).toEqual({
      page: 1,
      q: '',
      category: undefined,
      status: 'all',
    })
  })
})
