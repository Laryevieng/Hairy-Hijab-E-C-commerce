import { describe, it, expect } from 'vitest'
import {
  createVariantSchema,
  updateVariantDataSchema,
  validateVariantAgainstCategory,
} from '@/lib/validations/variant'

describe('variant validation schemas (P8-05)', () => {
  const validProductId = 'b0000000-0000-4000-8000-000000000001'

  it('validates createVariantSchema with integer price, compare_at_price > price, hex colors, and initial stock', () => {
    const parsed = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: '  HH-BBTT-S-HTMLAT  ',
      size: 'S',
      color_name: 'Hitam - Latte',
      color_hex: '#171717',
      color_hex_2: '#d9c7b4',
      price: '55000',
      compare_at_price: '65000',
      stock_quantity: '12',
      is_active: true,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data).toEqual({
        product_id: validProductId,
        sku: 'HH-BBTT-S-HTMLAT',
        size: 'S',
        color_name: 'Hitam - Latte',
        color_hex: '#171717',
        color_hex_2: '#D9C7B4',
        price: 55000,
        compare_at_price: 65000,
        stock_quantity: 12,
        is_active: true,
      })
    }
  })

  it('rejects when both size and color_name are empty', () => {
    const parsed = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-EMPTY-01',
      size: '   ',
      color_name: '',
      price: 45000,
    })

    expect(parsed.success).toBe(false)
    if (!parsed.success) {
      expect(
        parsed.error.issues.some((i) => i.path.includes('color_name'))
      ).toBe(true)
    }
  })

  it('rejects compare_at_price <= price or non-integer price', () => {
    const eqCompare = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-PRICE-01',
      color_name: 'Hitam',
      price: 50000,
      compare_at_price: 50000,
    })
    expect(eqCompare.success).toBe(false)

    const lowerCompare = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-PRICE-02',
      color_name: 'Hitam',
      price: 50000,
      compare_at_price: 40000,
    })
    expect(lowerCompare.success).toBe(false)

    const floatPrice = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-PRICE-03',
      color_name: 'Hitam',
      price: 45000.5,
    })
    expect(floatPrice.success).toBe(false)
  })

  it('rejects invalid color_hex or color_hex_2 formats', () => {
    const badHex = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-HEX-01',
      color_name: 'Hitam',
      color_hex: '171717', // missing #
      price: 45000,
    })
    expect(badHex.success).toBe(false)

    const badHex2 = createVariantSchema.safeParse({
      product_id: validProductId,
      sku: 'HH-HEX-02',
      color_name: 'Hitam - Putih',
      color_hex: '#171717',
      color_hex_2: '#GGG999',
      price: 45000,
    })
    expect(badHex2.success).toBe(false)
  })

  it('strips stock_quantity from updateVariantDataSchema so stock cannot be updated via variant edit', () => {
    const parsed = updateVariantDataSchema.safeParse({
      sku: 'HH-UPD-01',
      size: 'M',
      color_name: 'Navy',
      price: 48000,
      stock_quantity: 999,
    })

    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect('stock_quantity' in parsed.data).toBe(false)
    }
  })

  it('enforces requires_size and size_options via validateVariantAgainstCategory', () => {
    const bergoCategory = {
      requires_size: true,
      size_options: ['S', 'M'],
    }

    expect(
      validateVariantAgainstCategory({ size: null }, bergoCategory).ok
    ).toBe(false)

    const invalidOption = validateVariantAgainstCategory(
      { size: 'XL' },
      bergoCategory
    )
    expect(invalidOption.ok).toBe(false)
    if (!invalidOption.ok) {
      expect(invalidOption.message).toContain('S, M')
    }

    expect(
      validateVariantAgainstCategory({ size: 'S' }, bergoCategory).ok
    ).toBe(true)

    const pashminaCategory = {
      requires_size: false,
      size_options: [],
    }
    expect(
      validateVariantAgainstCategory({ size: null }, pashminaCategory).ok
    ).toBe(true)
    expect(
      validateVariantAgainstCategory({ size: '175x75 cm' }, pashminaCategory).ok
    ).toBe(true)
  })
})
