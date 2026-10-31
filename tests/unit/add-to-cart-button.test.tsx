import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { AddToCartButton } from '@/components/product/add-to-cart-button'
import { useCartStore } from '@/stores/cart.store'

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

const variantId = '11111111-1111-4111-8111-111111111111'

afterEach(() => {
  useCartStore.getState().clear()
  localStorage.clear()
})

describe('AddToCartButton (P5-03a)', () => {
  it('menambah varian ke store dan mengumumkan status untuk pembaca layar', async () => {
    render(<AddToCartButton variantId={variantId} productName="Pashmina" variantLabel="Mocca" stockQuantity={5} />)
    const button = screen.getByRole('button', { name: /Tambah ke Keranjang/ })
    await waitFor(() => expect(button).toBeEnabled())
    fireEvent.click(button)
    fireEvent.click(button)
    expect(useCartStore.getState().lines).toEqual([{ variantId, quantity: 2 }])
    expect(screen.getByRole('status')).toHaveTextContent('Pashmina (Mocca) ditambahkan ke keranjang.')
  })

  it('menampilkan Sold Out dan alasan yang terbaca bila stok 0', async () => {
    render(<AddToCartButton variantId={variantId} productName="Pashmina" variantLabel="Mocca" stockQuantity={0} />)
    const button = screen.getByRole('button', { name: /Sold Out/ })
    await waitFor(() => expect(button).toHaveAccessibleDescription('Varian ini sedang habis (Sold Out).'))
    expect(button).toBeDisabled()
  })

  it('nonaktif sampai varian dipilih', async () => {
    render(<AddToCartButton variantId={null} productName="Pashmina" variantLabel="" stockQuantity={5} />)
    const button = screen.getByRole('button', { name: /Tambah ke Keranjang/ })
    await waitFor(() => expect(button).toHaveAccessibleDescription('Pilih varian terlebih dahulu.'))
    expect(button).toBeDisabled()
  })

  it('nonaktif bila jumlah di keranjang sudah mencapai stok', async () => {
    useCartStore.getState().add(variantId, 2)
    render(<AddToCartButton variantId={variantId} productName="Pashmina" variantLabel="Mocca" stockQuantity={2} />)
    const button = screen.getByRole('button', { name: /Tambah ke Keranjang/ })
    await waitFor(() => expect(button).toHaveAccessibleDescription(/batas 2/))
    expect(button).toBeDisabled()
  })
})
