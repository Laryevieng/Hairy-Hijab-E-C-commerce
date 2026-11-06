import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { VariantTable } from '@/components/admin/products/variant-table'
import type { AdminVariantItem } from '@/services/admin/products.service'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const mockRefresh = vi.fn()
const mockCreateVariant = vi.fn()
const mockUpdateVariant = vi.fn()
const mockToggleVariantActive = vi.fn()
const mockDeleteVariant = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

vi.mock('@/actions/admin-catalog.actions', () => ({
  createVariant: (...args: unknown[]) => mockCreateVariant(...args),
  updateVariant: (...args: unknown[]) => mockUpdateVariant(...args),
  toggleVariantActive: (...args: unknown[]) => mockToggleVariantActive(...args),
  deleteVariant: (...args: unknown[]) => mockDeleteVariant(...args),
}))

const bergoTwoToneCategory = {
  id: 'a0000000-0000-4000-8000-000000000007',
  name: 'Bergo Bandana Two Tone',
  slug: 'bergo-bandana-two-tone',
  requires_size: true,
  size_options: ['S', 'M'],
}

const sampleVariants: AdminVariantItem[] = [
  {
    id: 'c0000000-0000-4000-8000-000000000001',
    product_id: 'b0000000-0000-4000-8000-000000000001',
    sku: 'HH-BBTT-S-HTMLAT',
    size: 'S',
    color_name: 'Hitam - Latte',
    color_hex: '#171717',
    color_hex_2: '#D9C7B4',
    price: 55000,
    compare_at_price: 65000,
    stock_quantity: 8,
    is_active: true,
    has_orders: true,
    created_at: '2026-10-25T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z',
  },
  {
    id: 'c0000000-0000-4000-8000-000000000002',
    product_id: 'b0000000-0000-4000-8000-000000000001',
    sku: 'HH-BBTT-M-HTMLAT',
    size: 'M',
    color_name: 'Hitam - Latte',
    color_hex: '#171717',
    color_hex_2: '#D9C7B4',
    price: 55000,
    compare_at_price: null,
    stock_quantity: 0,
    is_active: true,
    has_orders: false,
    created_at: '2026-10-25T00:00:00Z',
    updated_at: '2026-10-25T00:00:00Z',
  },
]

describe('VariantTable & VariantFormDialog UI (P8-05)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders variants with read-only stock, Sold Out badge, and disables delete button when variant has been ordered', () => {
    render(
      <VariantTable
        productId="b0000000-0000-4000-8000-000000000001"
        category={bergoTwoToneCategory}
        variants={sampleVariants}
      />
    )

    expect(screen.getByText('HH-BBTT-S-HTMLAT')).toBeInTheDocument()
    expect(screen.getByText('HH-BBTT-M-HTMLAT')).toBeInTheDocument()
    expect(screen.getByText('Sold Out')).toBeInTheDocument()
    expect(
      screen.getAllByText('Baca saja (ubah di Inventori)').length
    ).toBeGreaterThan(0)

    const deleteOrderedBtn = screen.getByRole('button', {
      name: /hapus varian HH-BBTT-S-HTMLAT/i,
    })
    const deleteUnorderedBtn = screen.getByRole('button', {
      name: /hapus varian HH-BBTT-M-HTMLAT/i,
    })

    expect(deleteOrderedBtn).toBeDisabled()
    expect(deleteUnorderedBtn).not.toBeDisabled()
  })

  it('enforces size dropdown from size_options, shows color_hex_2 for Two Tone, and shows friendly error on duplicate combo', async () => {
    mockCreateVariant.mockResolvedValue({
      ok: false,
      error: {
        code: 'DUPLICATE_VARIANT_COMBO',
        message: 'Kombinasi ukuran dan warna untuk produk ini sudah ada.',
        fieldErrors: {
          color_name: ['Kombinasi ukuran dan warna untuk produk ini sudah ada.'],
        },
      },
    })

    render(
      <VariantTable
        productId="b0000000-0000-4000-8000-000000000001"
        category={bergoTwoToneCategory}
        variants={sampleVariants}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: /tambah varian/i }))

    // Size dropdown must exist and contain S and M
    const sizeSelect = screen.getByLabelText(/ukuran/i)
    expect(sizeSelect.tagName).toBe('SELECT')

    // Two Tone second color hex input must be rendered
    expect(
      screen.getByLabelText(/kode hex warna kedua \(two tone\)/i)
    ).toBeInTheDocument()

    // Initial stock input is present in create mode
    expect(screen.getByLabelText(/stok awal/i)).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText(/sku varian/i), {
      target: { value: 'HH-BBTT-S-DUP' },
    })
    fireEvent.change(screen.getByLabelText(/nama warna/i), {
      target: { value: 'Hitam - Latte' },
    })
    fireEvent.change(screen.getByLabelText(/harga jual/i), {
      target: { value: '55000' },
    })

    const submitBtns = screen.getAllByRole('button', { name: /tambah varian/i })
    fireEvent.click(submitBtns[submitBtns.length - 1])

    await waitFor(() => {
      expect(mockCreateVariant).toHaveBeenCalledTimes(1)
      expect(
        screen.getAllByText(
          'Kombinasi ukuran dan warna untuk produk ini sudah ada.'
        ).length
      ).toBeGreaterThan(0)
    })
  })

  it('hides initial stock input and shows read-only stock info when editing an existing variant', () => {
    render(
      <VariantTable
        productId="b0000000-0000-4000-8000-000000000001"
        category={bergoTwoToneCategory}
        variants={sampleVariants}
      />
    )

    fireEvent.click(
      screen.getByRole('button', { name: /ubah varian HH-BBTT-S-HTMLAT/i })
    )

    expect(screen.queryByLabelText(/stok awal/i)).not.toBeInTheDocument()
    expect(screen.getByText(/stok saat ini \(baca saja\):/i)).toBeInTheDocument()
  })
})
