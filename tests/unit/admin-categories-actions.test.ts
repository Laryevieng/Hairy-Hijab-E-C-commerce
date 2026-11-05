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
  createCategory,
  updateCategory,
  toggleCategoryActive,
  deleteCategory,
} from '@/actions/admin-catalog.actions'
import AdminCategoriesPage from '@/app/admin/categories/page'

describe('admin-catalog.actions & AdminCategoriesPage (P8-03)', () => {
  const validId = 'a0000000-0000-4000-8000-000000000001'

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireAdmin.mockResolvedValue({
      user: { id: 'admin-1', email: 'owner@hairyhijab.com' },
      role: 'admin',
    })
  })

  it('rejects non-admin users across all category actions and page', async () => {
    mockRequireAdmin.mockRejectedValue(new Error('NEXT_NOT_FOUND'))

    await expect(
      createCategory({ name: 'Bergo Baru', slug: 'bergo-baru' })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(
      updateCategory(validId, { name: 'Bergo Baru', slug: 'bergo-baru' })
    ).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(toggleCategoryActive(validId, false)).rejects.toThrow(
      'NEXT_NOT_FOUND'
    )

    await expect(deleteCategory(validId)).rejects.toThrow('NEXT_NOT_FOUND')

    await expect(AdminCategoriesPage()).rejects.toThrow('NEXT_NOT_FOUND')
  })

  it('creates a category and revalidates store layout and category routes', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: { id: validId, slug: 'bergo-premium' },
      error: null,
    })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })

    const res = await createCategory({
      name: 'Bergo Premium',
      slug: 'bergo-premium',
      requires_size: true,
      size_options: ['S', 'M'],
      is_active: true,
      sort_order: 9,
    })

    expect(res).toEqual({ ok: true, data: { id: validId } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/categories')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/categories/bergo-premium')
  })

  it('returns friendly DUPLICATE_SLUG message when slug already exists (23505)', async () => {
    const mockSingle = vi.fn().mockResolvedValue({
      data: null,
      error: {
        code: '23505',
        message: 'duplicate key value violates unique constraint "categories_slug_key"',
      },
    })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        insert: vi.fn().mockReturnValue({
          select: vi.fn().mockReturnValue({
            single: mockSingle,
          }),
        }),
      }),
    })

    const res = await createCategory({
      name: 'Bergo Karet',
      slug: 'bergo-karet',
      requires_size: false,
    })

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('DUPLICATE_SLUG')
      expect(res.error.message).toBe(
        'Slug kategori sudah digunakan. Silakan gunakan slug lain.'
      )
      expect(res.error.fieldErrors?.slug?.[0]).toContain('Slug kategori sudah digunakan')
    }
  })

  it('updates a category and revalidates store and category paths', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: validId, slug: 'pashmina-rayon' },
      error: null,
    })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      }),
    })

    const res = await updateCategory(validId, {
      name: 'Pashmina Rayon Baru',
      slug: 'pashmina-rayon',
      requires_size: false,
      is_active: true,
      sort_order: 3,
    })

    expect(res).toEqual({ ok: true, data: { id: validId } })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/categories/pashmina-rayon')
  })

  it('toggles category active status and revalidates paths', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({
      data: { id: validId, slug: 'paris-jadul' },
      error: null,
    })
    mockCreateClient.mockResolvedValue({
      from: vi.fn().mockReturnValue({
        update: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            select: vi.fn().mockReturnValue({
              maybeSingle: mockMaybeSingle,
            }),
          }),
        }),
      }),
    })

    const res = await toggleCategoryActive(validId, false)

    expect(res.ok).toBe(true)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/categories/paris-jadul')
  })

  it('prevents deleting a category that already has products', async () => {
    const mockDelete = vi.fn()
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 3, error: null }),
            }),
          }
        }
        return { delete: mockDelete }
      }),
    })

    const res = await deleteCategory(validId)

    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('CATEGORY_HAS_PRODUCTS')
      expect(res.error.message).toContain('masih memiliki produk')
    }
    expect(mockDelete).not.toHaveBeenCalled()
  })

  it('deletes a category when it has 0 products', async () => {
    const mockEqDelete = vi.fn().mockResolvedValue({ error: null })
    mockCreateClient.mockResolvedValue({
      from: vi.fn((table: string) => {
        if (table === 'products') {
          return {
            select: vi.fn().mockReturnValue({
              eq: vi.fn().mockResolvedValue({ count: 0, error: null }),
            }),
          }
        }
        if (table === 'categories') {
          return {
            delete: vi.fn().mockReturnValue({
              eq: mockEqDelete,
            }),
          }
        }
        return {}
      }),
    })

    const res = await deleteCategory(validId)

    expect(res.ok).toBe(true)
    expect(mockEqDelete).toHaveBeenCalledWith('id', validId)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/', 'layout')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/categories')
  })
})
