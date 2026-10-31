import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { CartSheet } from '@/components/cart/cart-sheet'
import { getCartSnapshot } from '@/actions/cart.actions'
import { useCartStore } from '@/stores/cart.store'

vi.mock('@/actions/cart.actions', () => ({ getCartSnapshot: vi.fn() }))

const variantId = '11111111-1111-4111-8111-111111111111'

afterEach(() => {
  useCartStore.getState().clear()
  localStorage.clear()
  vi.mocked(getCartSnapshot).mockReset()
})

describe('CartSheet (P5-03b)', () => {
  it('menampilkan badge jumlah dari store setelah hidrasi', async () => {
    useCartStore.getState().add(variantId, 3)
    render(<CartSheet />)
    expect(await screen.findByRole('button', { name: 'Keranjang belanja (3 item)' })).toHaveTextContent('3')
  })

  it('membuka sheet dengan harga dari snapshot server dan tautan ke /cart', async () => {
    useCartStore.getState().add(variantId, 2)
    vi.mocked(getCartSnapshot).mockResolvedValue({
      ok: true,
      data: [{
        variantId, quantity: 2, productName: 'Pashmina Silk', productSlug: 'pashmina-silk', imagePath: null, imageAlt: null,
        size: null, colorName: 'Mocca', price: 75000, compareAtPrice: null, stockQuantity: 10, status: 'ok',
      }],
    })
    render(<CartSheet />)
    fireEvent.click(await screen.findByRole('button', { name: 'Keranjang belanja (2 item)' }))
    const dialog = await screen.findByRole('dialog', { name: 'Keranjang' })
    await waitFor(() => expect(within(dialog).getByText('Pashmina Silk')).toBeInTheDocument())
    expect(within(dialog).getByText('Rp 150.000')).toBeInTheDocument()
    expect(within(dialog).getByRole('link', { name: 'Lihat Keranjang' })).toHaveAttribute('href', '/cart')
    expect(getCartSnapshot).toHaveBeenCalledWith([{ variantId, quantity: 2 }])
  })

  it('menampilkan keadaan kosong tanpa memanggil server', async () => {
    render(<CartSheet />)
    fireEvent.click(screen.getByRole('button', { name: 'Keranjang belanja (0 item)' }))
    const dialog = await screen.findByRole('dialog', { name: 'Keranjang' })
    expect(within(dialog).getByRole('link', { name: 'Mulai Belanja' })).toHaveAttribute('href', '/products')
    expect(getCartSnapshot).not.toHaveBeenCalled()
  })
})
