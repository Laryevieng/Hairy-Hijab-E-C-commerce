import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ProductsTable } from '@/components/admin/products/products-table'
import { ProductForm } from '@/components/admin/products/product-form'
import type { AdminProductListItem } from '@/services/admin/products.service'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const mockPush = vi.fn()
const mockRefresh = vi.fn()
const mockCreateProduct = vi.fn()
const mockUpdateProduct = vi.fn()
const mockToggleProductActive = vi.fn()
const mockDeleteProduct = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}))

vi.mock('@/actions/admin-catalog.actions', () => ({
  createProduct: (...args: unknown[]) => mockCreateProduct(...args),
  updateProduct: (...args: unknown[]) => mockUpdateProduct(...args),
  toggleProductActive: (...args: unknown[]) => mockToggleProductActive(...args),
  deleteProduct: (...args: unknown[]) => mockDeleteProduct(...args),
}))

const sampleCategories = [
  {
    id: 'a0000000-0000-4000-8000-000000000001',
    name: 'Bergo Non Karet',
    is_active: true,
  },
  {
    id: 'a0000000-0000-4000-8000-000000000002',
    name: 'Paris Jadul',
    is_active: true,
  },
]

const sampleProducts: AdminProductListItem[] = [
  {
    id: 'b0000000-0000-4000-8000-000000000001',
    name: 'Bergo Daily Laris',
    slug: 'bergo-daily-laris',
    category_id: sampleCategories[0].id,
    category_name: 'Bergo Non Karet',
    category_slug: 'bergo-non-karet',
    is_active: true,
    is_featured: true,
    variant_count: 2,
    active_variant_count: 2,
    total_stock: 15,
    has_orders: true,
    created_at: '2026-10-25T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z',
  },
  {
    id: 'b0000000-0000-4000-8000-000000000002',
    name: 'Paris Jadul Baru',
    slug: 'paris-jadul-baru',
    category_id: sampleCategories[1].id,
    category_name: 'Paris Jadul',
    category_slug: 'paris-jadul',
    is_active: false,
    is_featured: false,
    variant_count: 0,
    active_variant_count: 0,
    total_stock: 0,
    has_orders: false,
    created_at: '2026-10-25T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z',
  },
]

describe('ProductsTable & ProductForm UI (P8-04)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('disables delete button with D-15 explanation for ordered products and enables it for unordered products', () => {
    render(
      <ProductsTable
        products={sampleProducts}
        count={2}
        page={1}
        pageSize={20}
        filters={{ page: 1, q: '', category: undefined, status: 'all' }}
        categories={sampleCategories}
      />
    )

    expect(screen.getByText('Bergo Daily Laris')).toBeInTheDocument()
    expect(screen.getByText('Paris Jadul Baru')).toBeInTheDocument()
    expect(
      screen.getByText('Pernah dipesan (tidak dapat dihapus)')
    ).toBeInTheDocument()

    const deleteOrderedBtn = screen.getByRole('button', {
      name: /hapus produk bergo daily laris/i,
    })
    const deleteUnorderedBtn = screen.getByRole('button', {
      name: /hapus produk paris jadul baru/i,
    })

    expect(deleteOrderedBtn).toBeDisabled()
    expect(deleteUnorderedBtn).not.toBeDisabled()
  })

  it('auto-generates slug from name, shows -2 suggestion on collision, and redirects to edit page after creation', async () => {
    mockCreateProduct
      .mockResolvedValueOnce({
        ok: false,
        error: {
          code: 'DUPLICATE_SLUG',
          message:
            'Slug "bergo-daily" sudah digunakan. Disarankan menggunakan "bergo-daily-2".',
          fieldErrors: {
            slug: ['Slug sudah digunakan.'],
            suggestedSlug: ['bergo-daily-2'],
          },
        },
      })
      .mockResolvedValueOnce({
        ok: true,
        data: {
          id: 'b0000000-0000-4000-8000-000000000099',
          slug: 'bergo-daily-2',
        },
      })

    render(<ProductForm mode="create" categories={sampleCategories} />)

    const nameInput = screen.getByLabelText(/nama produk/i)
    const slugInput = screen.getByLabelText(/slug url/i)
    const categorySelect = screen.getByLabelText(/kategori/i)

    fireEvent.change(nameInput, { target: { value: 'Bergo Daily' } })
    expect(slugInput).toHaveValue('bergo-daily')

    fireEvent.change(categorySelect, {
      target: { value: sampleCategories[0].id },
    })

    const submitBtn = screen.getByRole('button', {
      name: /simpan & lanjut ke varian/i,
    })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledTimes(1)
      expect(
        screen.getByRole('button', { name: /gunakan “bergo-daily-2”/i })
      ).toBeInTheDocument()
    })

    // Klik tombol saran slug -2 lalu submit ulang
    fireEvent.click(
      screen.getByRole('button', { name: /gunakan “bergo-daily-2”/i })
    )
    expect(slugInput).toHaveValue('bergo-daily-2')

    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockCreateProduct).toHaveBeenCalledTimes(2)
      expect(mockPush).toHaveBeenCalledWith(
        '/admin/products/b0000000-0000-4000-8000-000000000099/edit'
      )
    })
  })
})
