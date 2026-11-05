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
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
} from '@/actions/admin-catalog.actions'
import AdminProductsPage from '@/app/admin/products/page'

describe('admin-catalog.actions — Products (P8-04)', () => {
  const validProductId = 'b0000000-0000-4000-8000-000000000001'
  const validCategoryId = 'a0000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-1', email: 'owner@hairyhijab.com' },
      role: 'admin',
    })
  })

  it('enforces requireAdmin() on all product actions and AdminProductsPage', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('NEXT_NOT_FOUND'))

    await expect(
      createProduct({
        name: 'Produk Uji',
        slug: 'produk-uji',
        category_id: validCategoryId,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      updateProduct(validProductId, {
        name: 'Produk Uji',
        slug: 'produk-uji',
        category_id: validCategoryId,
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(toggleProductActive(validProductId, false)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    await expect(deleteProduct(validProductId)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    await expect(
      AdminProductsPage({ searchParams: Promise.resolve({}) })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('rejects creating a product without category_id', async () => {
    const res = await createProduct({
      name: 'Produk Tanpa Kategori',
      slug: 'produk-tanpa-kategori',
      category_id: '',
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('VALIDATION')
      expect(res.error.fieldErrors?.category_id).toBeDefined()
    }
  })

  it('returns DUPLICATE_SLUG and suggests -2 suffix when slug already exists', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'categories') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: validCategoryId },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: 'existing-prod', slug: 'bergo-daily' },
                  error: null,
                }),
              }),
              ilike: vi.fn().mockResolvedValue({
                data: [{ id: 'existing-prod', slug: 'bergo-daily' }],
                error: null,
              }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await createProduct({
      name: 'Bergo Daily',
      slug: 'bergo-daily',
      category_id: validCategoryId,
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('DUPLICATE_SLUG')
      expect(res.error.message).toContain('bergo-daily-2')
      expect(res.error.fieldErrors?.suggestedSlug?.[0]).toBe('bergo-daily-2')
    }
  })

  it('creates product and revalidates catalog and edit routes', async () => {
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'categories') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: { id: validCategoryId },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: null,
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: { id: validProductId, slug: 'bergo-daily-baru' },
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await createProduct({
      name: 'Bergo Daily Baru',
      slug: 'bergo-daily-baru',
      category_id: validCategoryId,
      description: 'Lembut dan adem',
      specs: [{ key: 'Dimensi', value: '110 x 110 cm' }],
    })

    expect(res).toEqual({
      ok: true,
      data: { id: validProductId, slug: 'bergo-daily-baru' },
    })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/products')
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/products/bergo-daily-baru'
    )
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      `/admin/products/${validProductId}/edit`
    )
  })

  it('prevents hard delete when product has been ordered (D-15)', async () => {
    const mockDelete = vi.fn()
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-laris',
                    variants: [{ id: 'var-1' }],
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
              in: vi.fn().mockResolvedValue({ count: 2, error: null }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await deleteProduct(validProductId)

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('PRODUCT_HAS_ORDERS')
      expect(res.error.message).toContain('sudah pernah dipesan')
    }
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('allows hard delete when product has never been ordered', async () => {
    const mockEqDelete = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-belum-dipesan',
                    variants: [{ id: 'var-2' }],
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
              in: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await deleteProduct(validProductId)

    expect(res.ok).toBe(true)
    expect(mockEqDelete).toHaveBeenCalledWith('id', validProductId)
    expect(mockRevalidatePath).toHaveBeenCalledWith(
      '/products/bergo-belum-dipesan'
    )
  })
})
