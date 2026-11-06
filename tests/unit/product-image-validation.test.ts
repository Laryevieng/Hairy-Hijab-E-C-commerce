import { describe, it, expect } from 'vitest'
import {
  createProductImageSchema,
  updateProductImageSchema,
  reorderProductImageSchema,
  normalizeProductImagePath,
} from '@/lib/validations/product-image'

describe('product-image validation schemas (P8-06)', () => {
  const validProductId = 'b0000000-0000-4000-8000-000000000001'
  const validImageId = 'd0000000-0000-4000-8000-000000000001'
  const validVariantId = 'c0000000-0000-4000-8000-000000000001'

  it('normalizes optional product-images/ prefix and validates createProductImageSchema', () => {
    expect(
      normalizeProductImagePath(
        `product-images/${validProductId}/foto-utama.webp`
      )
    ).toBe(`${validProductId}/foto-utama.webp`)

    const parsed = createProductImageSchema.safeParse({
      product_id: validProductId,
      storage_path: `product-images/${validProductId}/a1b2c3d4.jpg`,
      alt_text: '  Bergo Karet Hitam Tampak Depan  ',
      sort_order: '0',
      variant_id: validVariantId,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        product_id: validProductId,
        storage_path: `${validProductId}/a1b2c3d4.jpg`,
        alt_text: 'Bergo Karet Hitam Tampak Depan',
        sort_order: 0,
        variant_id: validVariantId,
      })
    }
  })

  it('rejects empty alt_text', () => {
    const parsed = createProductImageSchema.safeParse({
      product_id: validProductId,
      storage_path: `${validProductId}/foto.png`,
      alt_text: '   ',
    })
    expect(parsed.success).toBe(false)
  })

  it('rejects path traversal, invalid extensions, or mismatched product folder', () => {
    const otherProductId = 'b0000000-0000-4000-8000-000000000099'

    expect(
      createProductImageSchema.safeParse({
        product_id: validProductId,
        storage_path: `${otherProductId}/foto.jpg`,
        alt_text: 'Bergo',
      }).success
    ).toBe(false)

    expect(
      createProductImageSchema.safeParse({
        product_id: validProductId,
        storage_path: `${validProductId}/../rahasia.jpg`,
        alt_text: 'Bergo',
      }).success
    ).toBe(false)

    expect(
      createProductImageSchema.safeParse({
        product_id: validProductId,
        storage_path: `${validProductId}/script.svg`,
        alt_text: 'Bergo',
      }).success
    ).toBe(false)
  })

  it('validates updateProductImageSchema and reorderProductImageSchema', () => {
    expect(
      updateProductImageSchema.safeParse({
        id: validImageId,
        alt_text: 'Detail Jahitan Tepi',
        variant_id: '',
      }).success
    ).toBe(true)

    expect(
      reorderProductImageSchema.safeParse({
        id: validImageId,
        direction: 'up',
      }).success
    ).toBe(true)

    expect(
      reorderProductImageSchema.safeParse({
        id: validImageId,
        direction: 'left',
      }).success
    ).toBe(false)
  })
})
