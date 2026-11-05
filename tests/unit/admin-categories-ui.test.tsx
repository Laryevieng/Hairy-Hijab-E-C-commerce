import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CategoriesManager } from '@/components/admin/categories/categories-manager'
import type { AdminCategoryItem } from '@/services/admin/categories.service'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const mockCreateCategory = vi.fn()
const mockUpdateCategory = vi.fn()
const mockToggleCategoryActive = vi.fn()
const mockDeleteCategory = vi.fn()
const mockRefresh = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

vi.mock('@/actions/admin-catalog.actions', () => ({
  createCategory: (...args: unknown[]) => mockCreateCategory(...args),
  updateCategory: (...args: unknown[]) => mockUpdateCategory(...args),
  toggleCategoryActive: (...args: unknown[]) => mockToggleCategoryActive(...args),
  deleteCategory: (...args: unknown[]) => mockDeleteCategory(...args),
}))

const sampleCategories: AdminCategoryItem[] = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Bergo Non Karet',
    slug: 'bergo-non-karet',
    description: 'Bergo nyaman tanpa karet',
    image_path: null,
    requires_size: true,
    size_options: ['S', 'M'],
    is_active: true,
    sort_order: 1,
    product_count: 2,
    created_at: '2026-10-22T00:00:00Z',
    updated_at: '2026-10-22T00:00:00Z',
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Paris Jadul',
    slug: 'paris-jadul',
    description: null,
    image_path: null,
    requires_size: false,
    size_options: [],
    is_active: false,
    sort_order: 8,
    product_count: 0,
    created_at: '2026-10-22T00:00:00Z',
    updated_at: '2026-10-22T00:00:00Z',
  },
]

describe('CategoriesManager UI (P8-03)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders categories list and disables delete button for categories with products', () => {
    render(<CategoriesManager categories={sampleCategories} />)

    expect(screen.getByText('Bergo Non Karet')).toBeInTheDocument()
    expect(screen.getByText('/bergo-non-karet')).toBeInTheDocument()
    expect(screen.getByText('2 produk')).toBeInTheDocument()

    expect(screen.getByText('Paris Jadul')).toBeInTheDocument()
    expect(screen.getByText('0 produk')).toBeInTheDocument()

    const deleteBergoBtn = screen.getByRole('button', {
      name: /hapus kategori bergo non karet/i,
    })
    const deleteParisBtn = screen.getByRole('button', {
      name: /hapus kategori paris jadul/i,
    })

    expect(deleteBergoBtn).toBeDisabled()
    expect(deleteParisBtn).not.toBeDisabled()
  })

  it('opens create dialog, auto-fills slug from name, and shows friendly duplicate slug error', async () => {
    mockCreateCategory.mockResolvedValue({
      ok: false,
      error: {
        code: 'DUPLICATE_SLUG',
        message: 'Slug kategori sudah digunakan. Silakan gunakan slug lain.',
        fieldErrors: {
          slug: ['Slug kategori sudah digunakan. Silakan gunakan slug lain.'],
        },
      },
    })

    render(<CategoriesManager categories={sampleCategories} />)

    fireEvent.click(screen.getByRole('button', { name: /tambah kategori/i }))

    const nameInput = screen.getByLabelText(/nama kategori/i)
    const slugInput = screen.getByLabelText(/slug url/i)

    fireEvent.change(nameInput, { target: { value: 'Bergo Non Karet' } })
    expect(slugInput).toHaveValue('bergo-non-karet')

    const submitButtons = screen.getAllByRole('button', {
      name: /tambah kategori/i,
    })
    fireEvent.click(submitButtons[submitButtons.length - 1])

    await waitFor(() => {
      expect(mockCreateCategory).toHaveBeenCalledTimes(1)
      expect(
        screen.getAllByText(
          'Slug kategori sudah digunakan. Silakan gunakan slug lain.'
        ).length
      ).toBeGreaterThan(0)
    })
  })
})
