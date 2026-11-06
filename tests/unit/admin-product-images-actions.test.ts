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
  createProductImage,
  updateProductImage,
  moveProductImageOrder,
  deleteProductImage,
} from '@/actions/admin-catalog.actions'

describe('admin-catalog.actions — Product Images (P8-06)', () => {
  const validProductId = 'b0000000-0000-4000-8000-000000000001'
  const validImageId1 = 'd0000000-0000-4000-8000-000000000001'
  const validImageId2 = 'd0000000-0000-4000-8000-000000000002'
  const storagePath = `${validProductId}/11111111-2222-4333-8444-555555555555.jpg`

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-1', email: 'owner@hairyhijab.com' },
      role: 'admin',
    })
  })

  it('rejects non-admin callers across all product image actions', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('NEXT_NOT_FOUND'))

    await expect(
      createProductImage({
        product_id: validProductId,
        storage_path: storagePath,
        alt_text: 'Produk Uji',
      })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      updateProductImage(validImageId1, 'Alt Baru')
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      moveProductImageOrder(validImageId1, 'up')
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(deleteProductImage(validImageId1)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )
  })

  it('rejects when product already has 8 images and removes the uploaded object from storage (no orphan)', async () => {
    const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockStorageRemove,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-karet',
                    name: 'Bergo Karet',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'product_images') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: Array.from({ length: 8 }, (_, idx) => ({
                    id: `img-${idx}`,
                    sort_order: idx,
                  })),
                  error: null,
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await createProductImage({
      product_id: validProductId,
      storage_path: storagePath,
      alt_text: 'Bergo Karet',
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('MAX_IMAGES_EXCEEDED')
    }
    expect(mockStorageRemove).toHaveBeenCalledWith([storagePath])
  })

  it('removes uploaded storage object if DB insert fails (no orphan)', async () => {
    const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockStorageRemove,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                maybeSingle: vi.fn().mockResolvedValue({
                  data: {
                    id: validProductId,
                    slug: 'bergo-karet',
                    name: 'Bergo Karet',
                  },
                  error: null,
                }),
              }),
            }),
          }
        }
        if (table === 'product_images') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockReturnValue({
                order: vi.fn().mockResolvedValue({
                  data: [],
                  error: null,
                }),
              }),
            }),
            insert: vi.fn().mockReturnValue({
              select: vi.fn().mockReturnValue({
                single: vi.fn().mockResolvedValue({
                  data: null,
                  error: { code: '42501', message: 'FORBIDDEN' },
                }),
              }),
            }),
          }
        }
        return {}
      }),
    })

    const res = await createProductImage({
      product_id: validProductId,
      storage_path: storagePath,
      alt_text: 'Bergo Karet',
    })

    expect(res.ok).toBe(false)
    expect(mockStorageRemove).toHaveBeenCalledWith([storagePath])
  })

  it('reorders images and persists new sort_order values', async () => {
    const updatedOrders: Array<{ id: string; sort_order: number }> = []

    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'product_images') {
          return {
            select: vi.fn((cols: string) => {
              if (cols.includes('product:products')) {
                return {
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: validImageId2,
                        product_id: validProductId,
                        product: { slug: 'bergo-karet' },
                      },
                      error: null,
                    }),
                  }),
                }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockReturnValue({
                      order: vi.fn().mockResolvedValue({
                        data: [
                          {
                            id: validImageId1,
                            sort_order: 0,
                            created_at: '2026-10-25T00:00:00Z',
                          },
                          {
                            id: validImageId2,
                            sort_order: 1,
                            created_at: '2026-10-25T00:01:00Z',
                          },
                        ],
                        error: null,
                      }),
                    }),
                  }),
                }),
              }
            }),
            update: vi.fn((payload: { sort_order: number }) => ({
              eq: vi.fn((_col: string, rowId: string) => {
                updatedOrders.push({ id: rowId, sort_order: payload.sort_order })
                return Promise.resolve({ error: null })
              }),
            })),
          }
        }
        return {}
      }),
    })

    const res = await moveProductImageOrder(validImageId2, 'up')
    expect(res.ok).toBe(true)
    expect(updatedOrders).toEqual([
      { id: validImageId2, sort_order: 0 },
      { id: validImageId1, sort_order: 1 },
    ])
    expect(mockRevalidatePath).toHaveBeenCalledWith('/products/bergo-karet')
  })

  it('deletes both the storage object in product-images AND the database row on deleteProductImage', async () => {
    const mockStorageRemove = vi.fn().mockResolvedValue({ error: null })
    const mockDbDeleteEq = vi.fn().mockResolvedValue({ error: null })

    mockCreateClient.mockResolvedValue({
      storage: {
        from: vi.fn().mockReturnValue({
          remove: mockStorageRemove,
        }),
      },
      from: vi.fn((table: string) => {
        if (table === 'product_images') {
          return {
            select: vi.fn((cols: string) => {
              if (cols.includes('storage_path')) {
                return {
                  eq: vi.fn().mockReturnValue({
                    maybeSingle: vi.fn().mockResolvedValue({
                      data: {
                        id: validImageId1,
                        product_id: validProductId,
                        storage_path: storagePath,
                        product: { slug: 'bergo-karet' },
                      },
                      error: null,
                    }),
                  }),
                }
              }
              return {
                eq: vi.fn().mockReturnValue({
                  order: vi.fn().mockReturnValue({
                    order: vi.fn().mockResolvedValue({
                      data: [],
                      error: null,
                    }),
                  }),
                }),
              }
            }),
            delete: vi.fn().mockReturnValue({
              eq: mockDbDeleteEq,
            }),
          }
        }
        return {}
      }),
    })

    const res = await deleteProductImage(validImageId1)
    expect(res.ok).toBe(true)
    expect(mockStorageRemove).toHaveBeenCalledWith([storagePath])
    expect(mockDbDeleteEq).toHaveBeenCalledWith('id', validImageId1)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/products/bergo-karet')
  })
})
