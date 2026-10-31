import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CartView } from '@/components/cart/cart-view'
import { getCartSnapshot } from '@/actions/cart.actions'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'
import { useCartStore } from '@/stores/cart.store'

vi.mock('@/actions/cart.actions', () => ({ getCartSnapshot: vi.fn() }))
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const okId = '11111111-1111-4111-8111-111111111111'
const lowId = '22222222-2222-4222-8222-222222222222'
const goneId = '33333333-3333-4333-8333-333333333333'

function line(overrides: Partial<CartViewLine>): CartViewLine {
  return {
    variantId: okId, quantity: 1, productName: 'Pashmina Silk', productSlug: 'pashmina-silk', imagePath: null, imageAlt: null,
    size: null, colorName: 'Mocca', price: 75000, compareAtPrice: null, stockQuantity: 10, status: 'ok', ...overrides,
  }
}

/** Snapshot tiruan: harga tetap dari "server", status dihitung dari jumlah yang dikirim. */
function mockServer(stock: Record<string, number>) {
  vi.mocked(getCartSnapshot).mockImplementation(async (input) => {
    const lines = input as { variantId: string; quantity: number }[]
    return {
      ok: true as const,
      data: lines.map(({ variantId, quantity }) => {
        if (!(variantId in stock)) return line({ variantId, quantity, productName: 'Produk tidak tersedia', productSlug: '', colorName: null, price: 0, stockQuantity: 0, status: 'unavailable' })
        const available = stock[variantId]
        return line({ variantId, quantity, stockQuantity: available, status: available <= 0 ? 'out_of_stock' : quantity > available ? 'insufficient' : 'ok' })
      }),
    }
  })
}

afterEach(() => {
  useCartStore.getState().clear()
  localStorage.clear()
  vi.mocked(getCartSnapshot).mockReset()
})

describe('CartView (P5-03c)', () => {
  it('mengubah jumlah, memperbarui subtotal, dan menyimpan ke localStorage', async () => {
    useCartStore.getState().add(okId, 1)
    mockServer({ [okId]: 10 })
    render(<CartView />)
    const group = await screen.findByRole('group', { name: 'Jumlah Pashmina Silk, Mocca' })
    fireEvent.click(within(group).getByRole('button', { name: 'Tambah jumlah Pashmina Silk, Mocca' }))
    await waitFor(() => expect(screen.getByText('Subtotal (2 item)')).toBeInTheDocument())
    expect(screen.getAllByText('Rp 150.000').length).toBeGreaterThan(0)
    expect(JSON.parse(localStorage.getItem('hairy-cart-v1') ?? '{}').state.lines).toEqual([{ variantId: okId, quantity: 2 }])
    await waitFor(() => expect(screen.getByRole('link', { name: 'Lanjut ke Checkout' })).toHaveAttribute('href', '/checkout'))
  })

  it('menandai baris bermasalah dan menonaktifkan checkout', async () => {
    useCartStore.getState().add(okId, 1)
    useCartStore.getState().add(lowId, 5)
    useCartStore.getState().add(goneId, 1)
    mockServer({ [okId]: 10, [lowId]: 3 })
    render(<CartView />)
    expect(await screen.findByText('Stok tersisa 3. Kurangi jumlah untuk melanjutkan.')).toBeInTheDocument()
    expect(screen.getByText('Produk tidak lagi tersedia. Hapus dari keranjang untuk melanjutkan.')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Lanjut ke Checkout' })).not.toBeInTheDocument()
    const checkout = screen.getByRole('button', { name: 'Lanjut ke Checkout' })
    expect(checkout).toBeDisabled()
    expect(checkout).toHaveAccessibleDescription('2 produk perlu diperbaiki sebelum checkout.')
    expect(screen.getByText('Subtotal (1 item)')).toBeInTheDocument()
  })

  it('menghapus baris dan mengumumkan hasilnya', async () => {
    useCartStore.getState().add(okId, 1)
    useCartStore.getState().add(goneId, 1)
    mockServer({ [okId]: 10 })
    render(<CartView />)
    fireEvent.click(await screen.findByRole('button', { name: 'Hapus Produk tidak tersedia dari keranjang' }))
    expect(useCartStore.getState().lines).toEqual([{ variantId: okId, quantity: 1 }])
    expect(screen.getAllByRole('status').some((node) => node.textContent === 'Produk tidak tersedia dihapus dari keranjang.')).toBe(true)
    await waitFor(() => expect(screen.getByRole('link', { name: 'Lanjut ke Checkout' })).toBeInTheDocument())
  })

  it('menampilkan ErrorState dengan tombol coba lagi bila snapshot gagal', async () => {
    useCartStore.getState().add(okId, 1)
    vi.mocked(getCartSnapshot).mockResolvedValue({ ok: false, error: 'Data keranjang tidak dapat dimuat.' })
    render(<CartView />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Data keranjang tidak dapat dimuat.')
    mockServer({ [okId]: 10 })
    fireEvent.click(screen.getByRole('button', { name: 'Coba Lagi' }))
    expect(await screen.findByText('Pashmina Silk')).toBeInTheDocument()
  })
})
