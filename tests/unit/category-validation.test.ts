import { describe, it, expect } from 'vitest'
import {
  categorySchema,
  categoryIdSchema,
  toggleCategoryActiveSchema,
} from '@/lib/validations/category'

describe('categorySchema (P8-03)', () => {
  it('accepts valid category without requires_size and normalizes size_options to []', () => {
    const parsed = categorySchema.safeParse({
      name: '  Pashmina Viscose  ',
      slug: 'pashmina-viscose',
      description: '  Koleksi pashmina lembut  ',
      image_path: '',
      requires_size: false,
      size_options: 'S, M',
      is_active: true,
      sort_order: '4',
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        name: 'Pashmina Viscose',
        slug: 'pashmina-viscose',
        description: 'Koleksi pashmina lembut',
        image_path: null,
        requires_size: false,
        size_options: [],
        is_active: true,
        sort_order: 4,
      })
    }
  })

  it('accepts valid category with requires_size = true and comma-separated size_options', () => {
    const parsed = categorySchema.safeParse({
      name: 'Bergo Non Karet',
      slug: 'bergo-non-karet',
      requires_size: true,
      size_options: ' S , M , S , L ',
      is_active: true,
      sort_order: 1,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.requires_size).toBe(true)
      expect(parsed.data.size_options).toEqual(['S', 'M', 'L'])
    }
  })

  it('rejects requires_size = true when size_options is empty', () => {
    const parsed = categorySchema.safeParse({
      name: 'Bergo Karet',
      slug: 'bergo-karet',
      requires_size: true,
      size_options: '   ,  ',
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      const sizeIssue = parsed.error.issues.find(
        (i) => i.path[0] === 'size_options'
      )
      expect(sizeIssue?.message).toBe(
        'Pilihan ukuran wajib diisi jika kategori mewajibkan ukuran.'
      )
    }
  })

  it('rejects invalid slug formats', () => {
    const invalidSlugs = [
      'a',
      '-bergo',
      'bergo-',
      'bergo--karet',
      'bergo karet',
      'bergo_karet',
      'bergo/karet',
    ]

    for (const slug of invalidSlugs) {
      const parsed = categorySchema.safeParse({
        name: 'Kategori Uji',
        slug,
      })
      expect(parsed.success, `Expected slug "${slug}" to fail`).toBe(false)
    }
  })

  it('rejects name shorter than 2 characters or longer than 80 characters', () => {
    expect(
      categorySchema.safeParse({ name: 'A', slug: 'kategori-a' }).success
    ).toBe(false)

    expect(
      categorySchema.safeParse({
        name: 'A'.repeat(81),
        slug: 'kategori-panjang',
      }).success
    ).toBe(false)
  })

  it('rejects negative or non-integer sort_order', () => {
    expect(
      categorySchema.safeParse({
        name: 'Paris Jadul',
        slug: 'paris-jadul',
        sort_order: -1,
      }).success
    ).toBe(false)

    expect(
      categorySchema.safeParse({
        name: 'Paris Jadul',
        slug: 'paris-jadul',
        sort_order: 1.5,
      }).success
    ).toBe(false)
  })

  it('validates categoryIdSchema and toggleCategoryActiveSchema', () => {
    const validId = 'a0000000-0000-4000-8000-000000000001'
    expect(categoryIdSchema.safeParse(validId).success).toBe(true)
    expect(categoryIdSchema.safeParse('bukan-uuid').success).toBe(false)

    expect(
      toggleCategoryActiveSchema.safeParse({ id: validId, is_active: false })
        .success
    ).toBe(true)
  })
})
