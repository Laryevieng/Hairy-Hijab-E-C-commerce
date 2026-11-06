import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockRequireAdmin = vi.fn()
const mockCreateClient = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/auth/guards', () => ({
  requireAdmin: () => mockRequireAdmin(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {
  createVariant,
  updateVariant,
  toggleVariantActive,
  deleteVariant,
} from '@/actions/admin-catalog.actions'

describe('admin-catalog.actions — Variants (P8-05)', () => {
  const validProductId = 'b0000000-0000-4000-8000-000000000001'
  const validVariantId = 'c0000000-0000-4000-8000-000000000001'
  const validCategoryId = 'a0000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-1', email: 'owner@hairyhijab.com' },
      role: 'admin',
    })
  })

  it('enforces requireAdmin() on all variant actions', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('NEXT_NOT_FOUND'))

    await expect(
      createVariant({
        product_id: validProductId,
        sku: 'SKU-01',
        color_name: 'Hitam',
        price: 45000,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      updateVariant(validVariantId, {
        sku: 'SKU-01',
        color_name: 'Hitam',
        price: 45000,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(toggleVariantActive(validVariantId, false)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    await expect(deleteVariant(validVariantId)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )
  })

  it('rejects variant when category requires_size = true and size is missing or not in size_options', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-non-karet',
                    category: {
                      id: validCategoryId,
                      requires_size: true,
                      size_options: ['S', 'M'],
                    },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const missingSize = await createVariant({
      product_id: validProductId,
      sku: 'HH-BNK-HITAM',
      size: null,
      color_name: 'Hitam',
      price: 45000,
    })
    expect(missingSize.ok).toBe(false)
    if (!missingSize.ok) {
      expect(missingSize.error.code).toBe('VALIDATION')
      expect(missingSize.error.fieldErrors?.size?.[0]).toContain(
        'Ukuran wajib dipilih'
      )
    }

    const wrongOption = await createVariant({
      product_id: validProductId,
      sku: 'HH-BNK-XL-HITAM',
      size: 'XL',
      color_name: 'Hitam',
      price: 45000,
    })
    expect(wrongOption.ok).toBe(false)
    if (!wrongOption.ok) {
      expect(wrongOption.error.code).toBe('VALIDATION')
      expect(wrongOption.error.fieldErrors?.size?.[0]).toContain('S, M')
    }
  })

  it('returns friendly DUPLICATE_VARIANT_COMBO message when (product, size, color) already exists', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-non-karet',
                    category: {
                      id: validCategoryId,
                      requires_size: true,
                      size_options: ['S', 'M'],
                    },
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'product_variants') {
          return {
            select: vi.fn((cols: string) => {
              if (cols === 'id') {
                // SKU check -> not duplicate
                return {
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: null,
                      error: null,
                    }),
                  }),
                }
              }
              // Combo check -> existing variant with S & Hitam
              return {
                eq: vi.fn().mockResolvedValue({
                  data: [{ id: 'var-existing', size: 'S', color_name: 'Hitam' }],
                  error: null,
                }),
              }
            }),
          }
        }
        return {}
      }),
    })

    const res = await createVariant({
      product_id: validProductId,
      sku: 'HH-BNK-S-HITAM-BARU',
      size: 'S',
      color_name: 'Hitam',
      price: 45000,
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('DUPLICATE_VARIANT_COMBO')
      expect(res.error.message).toBe(
        'Kombinasi ukuran dan warna untuk produk ini sudah ada.'
      )
    }
  })

  it('prevents deleting a variant that has been ordered (D-15) and allows deleting unordered variant', async () => {
    const mockDelete = vi.fn()
    mockCreateClient.mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validVariantId,
                    product_id: validProductId,
                    product: { slug: 'bergo-non-karet' },
                  },
                  error: null,
                }),
              }),
            }),
            delete: mockDelete,
          }
        }
        if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 1, error: null }),
            }),
          }
        }
        return {}
      }),
    })

    const blocked = await deleteVariant(validVariantId)
    expect(blocked.ok).toBe(false)
    if (!blocked.ok) {
      expect(blocked.error.code).toBe('VARIANT_HAS_ORDERS')
      expect(blocked.error.message).toContain('sudah pernah dipesan')
    }
    expect(mockDelete).not.toHaveBeenCalled()

    // Unordered variant -> delete succeeds
    const mockEqDelete = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValueOnce({
      from: vi.fn((table: string) => {
        if (table === 'product_variants') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validVariantId,
                    product_id: validProductId,
                    product: { slug: 'bergo-non-karet' },
                  },
                  error: null,
                }),
              }),
            }),
            delete: vi.fn().mockReturnValue({
              eq: mockEqDelete,
            }),
          }
        }
        if (table === 'order_items') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }
        }
        return {}
      }),
    })

    const allowed = await deleteVariant(validVariantId)
    expect(allowed.ok).toBe(true)
    expect(mockEqDelete).toHaveBeenCalledWith('id', validVariantId)
  })
})
