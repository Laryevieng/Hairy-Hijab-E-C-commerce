import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { getCartSnapshot } from '@/actions/cart.actions'
import { quoteShipping } from '@/actions/checkout.actions'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import type { CartViewLine } from '@/lib/cart/compute-cart-view'
import { useCartStore } from '@/stores/cart.store'
import type { ActionResult } from '@/types/action'

const replaceMock = vi.fn()
const pushMock = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    replace: replaceMock,
    push: pushMock,
  }),
}))

vi.mock('@/actions/cart.actions', () => ({
  getCartSnapshot: vi.fn(),
}))

vi.mock('@/actions/checkout.actions', () => ({
  quoteShipping: vi.fn(),
  placeOrder: vi.fn(),
}))

vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}))

const okId = '11111111-1111-4111-8111-111111111111'
const outOfStockId = '22222222-2222-4222-8222-222222222222'

function mockSnapshotLine(overrides: Partial<CartViewLine>): CartViewLine {
  return {
    variantId: okId,
    quantity: 1,
    productName: 'Pashmina Silk',
    productSlug: 'pashmina-silk',
    imagePath: null,
    imageAlt: null,
    size: null,
    colorName: 'Mocca',
    price: 75000,
    compareAtPrice: null,
    stockQuantity: 10,
    status: 'ok',
    ...overrides,
  }
}

describe('CheckoutForm (P6-04)', () => {
  beforeEach(() => {
    replaceMock.mockReset()
    pushMock.mockReset()
    useCartStore.getState().clear()
    localStorage.clear()
    vi.mocked(getCartSnapshot).mockReset()
    vi.mocked(quoteShipping).mockReset()

    // Default snapshot tiruan
    vi.mocked(getCartSnapshot).mockImplementation(async (input) => {
      const lines = input as { variantId: string; quantity: number }[]
      return {
        ok: true,
        data: lines.map((l) => {
          if (l.variantId === outOfStockId) {
            return mockSnapshotLine({
              variantId: l.variantId,
              quantity: l.quantity,
              productName: 'Hijab Habis',
              stockQuantity: 0,
              status: 'out_of_stock',
            })
          }
          return mockSnapshotLine({
            variantId: l.variantId,
            quantity: l.quantity,
            price: 75000,
            status: 'ok',
          })
        }),
      }
    })

    // Default quoteShipping tiruan
    vi.mocked(quoteShipping).mockImplementation(async (province) => {
      if (province === 'Jawa Barat') {
        return {
          ok: true,
          data: { cost: 10000, label: 'Reguler', estimatedDays: '1-2 hari' },
        }
      }
      if (province === 'DKI Jakarta') {
        return {
          ok: true,
          data: { cost: 12000, label: 'Reguler', estimatedDays: '1-3 hari' },
        }
      }
      return {
        ok: false,
        error: { code: 'SHIPPING_UNAVAILABLE', message: 'Pengiriman ke wilayah ini belum tersedia.' },
      }
    })
  })

  afterEach(() => {
    useCartStore.getState().clear()
  })

  it('mengarahkan ke /cart jika keranjang kosong setelah hidrasi', async () => {
    render(<CheckoutForm />)
    await waitFor(() => {
      expect(replaceMock).toHaveBeenCalledWith('/cart')
    })
  })

  it('mengisi awal formulir untuk pengguna login dengan data profil dan alamat utama', async () => {
    useCartStore.getState().add(okId, 2)

    render(
      <CheckoutForm
        initialData={{
          customer: {
            name: 'Aisyah Putri',
            phone: '081234567890',
            email: 'aisyah@example.com',
          },
          address: {
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Coblong',
            postalCode: '40132',
            addressDetail: 'Jl. Dago No. 123',
          },
          notes: 'Tolong jangan dibanting',
        }}
      />
    )

    // Form inputs terisi
    expect(await screen.findByDisplayValue('Aisyah Putri')).toBeInTheDocument()
    expect(screen.getByDisplayValue('081234567890')).toBeInTheDocument()
    expect(screen.getByDisplayValue('aisyah@example.com')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jawa Barat')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Bandung')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Coblong')).toBeInTheDocument()
    expect(screen.getByDisplayValue('40132')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Jl. Dago No. 123')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Tolong jangan dibanting')).toBeInTheDocument()

    // Ongkir terpicu otomatis karena provinsi Jawa Barat sudah terpilih
    await waitFor(() => {
      expect(quoteShipping).toHaveBeenCalledWith('Jawa Barat')
    })
    expect(await screen.findByText('Rp 10.000')).toBeInTheDocument()
    expect(screen.getByText(/Reguler \(1-2 hari\)/)).toBeInTheDocument()

    // Subtotal 2 x 75.000 = 150.000, Total = 150.000 + 10.000 = 160.000
    expect(screen.getAllByText('Rp 150.000').length).toBeGreaterThan(0)
    expect(screen.getByText('Rp 160.000')).toBeInTheDocument()
  })

  it('memvalidasi input wajib dan menampilkan pesan error dengan atribut aksesibilitas', async () => {
    useCartStore.getState().add(okId, 1)
    const onSubmitOrder = vi.fn()

    render(<CheckoutForm onSubmitOrder={onSubmitOrder} />)

    // Tunggu snapshot termuat
    await screen.findByRole('heading', { name: 'Informasi Pembeli' })

    // Klik Buat Pesanan dengan formulir kosong
    const submitBtn = screen.getByRole('button', { name: 'Buat Pesanan' })
    fireEvent.click(submitBtn)

    // Pesan error validasi muncul di bawah field
    expect(await screen.findByText('Nama minimal 2 karakter.')).toBeInTheDocument()
    expect(screen.getByText('Nomor telepon wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Pilih provinsi yang tersedia.')).toBeInTheDocument()
    expect(screen.getByText('Kota/kabupaten wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Kecamatan wajib diisi.')).toBeInTheDocument()
    expect(screen.getByText('Kode pos harus terdiri dari 5 angka.')).toBeInTheDocument()
    expect(screen.getByText('Alamat lengkap minimal 10 karakter.')).toBeInTheDocument()

    // Field memiliki aria-invalid="true"
    const nameInput = screen.getByPlaceholderText('Contoh: Aisyah Putri')
    expect(nameInput).toHaveAttribute('aria-invalid', 'true')

    // Submit order tidak pernah dipanggil
    expect(onSubmitOrder).not.toHaveBeenCalled()
  })

  it('menghitung ongkir saat provinsi dipilih dan memperbarui total dengan calculateTotals', async () => {
    useCartStore.getState().add(okId, 1)

    render(<CheckoutForm />)

    await screen.findByRole('heading', { name: 'Informasi Pembeli' })
    const provinceSelect = screen.getByRole('combobox', { name: 'Provinsi' })

    // Pilih Jawa Barat (10.000)
    fireEvent.change(provinceSelect, { target: { value: 'Jawa Barat' } })
    await waitFor(() => expect(quoteShipping).toHaveBeenCalledWith('Jawa Barat'))
    expect(await screen.findByText('Rp 10.000')).toBeInTheDocument()
    // Subtotal 75.000 + 10.000 = 85.000
    expect(screen.getByText('Rp 85.000')).toBeInTheDocument()

    // Ganti ke DKI Jakarta (12.000)
    fireEvent.change(provinceSelect, { target: { value: 'DKI Jakarta' } })
    await waitFor(() => expect(quoteShipping).toHaveBeenCalledWith('DKI Jakarta'))
    expect(await screen.findByText('Rp 12.000')).toBeInTheDocument()
    // Subtotal 75.000 + 12.000 = 87.000
    expect(screen.getByText('Rp 87.000')).toBeInTheDocument()

    // Catatan konfirmasi final ada
    expect(
      screen.getByText(/Total akhir, ketersediaan stok, dan ongkos kirim dikonfirmasi ulang/i)
    ).toBeInTheDocument()
  })

  it('menolak checkout bila ada item yang out_of_stock di keranjang', async () => {
    useCartStore.getState().add(okId, 1)
    useCartStore.getState().add(outOfStockId, 1)

    render(
      <CheckoutForm
        initialData={{
          customer: { name: 'Aisyah Putri', phone: '081234567890' },
          address: {
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Coblong',
            postalCode: '40132',
            addressDetail: 'Jl. Dago No. 123',
          },
        }}
      />
    )

    // Peringatan keranjang bermasalah muncul
    expect(await screen.findByText('Ada masalah pada keranjang belanja Anda')).toBeInTheDocument()
    expect(screen.getByText(/Stok habis. Hapus produk ini untuk melanjutkan/)).toBeInTheDocument()

    // Tombol submit dinonaktifkan
    const submitBtn = screen.getByRole('button', { name: 'Buat Pesanan' })
    expect(submitBtn).toBeDisabled()
    expect(submitBtn).toHaveAccessibleDescription(/produk bermasalah/i)
  })

  it('mencegah klik ganda saat memproses pesanan dan menonaktifkan tombol submit', async () => {
    useCartStore.getState().add(okId, 1)

    let resolveOrderPromise!: (value: ActionResult<{ orderNumber: string }>) => void
    const orderPromise = new Promise<ActionResult<{ orderNumber: string }>>((resolve) => {
      resolveOrderPromise = resolve
    })
    const onSubmitOrder = vi.fn().mockImplementation(() => orderPromise)

    render(
      <CheckoutForm
        initialData={{
          customer: { name: 'Aisyah Putri', phone: '081234567890' },
          address: {
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Coblong',
            postalCode: '40132',
            addressDetail: 'Jl. Dago No. 123 panjang sekali',
          },
        }}
        onSubmitOrder={onSubmitOrder}
      />
    )

    // Tunggu tarif ongkir siap
    await screen.findByText('Rp 10.000')

    const submitBtn = screen.getByRole('button', { name: 'Buat Pesanan' })
    expect(submitBtn).not.toBeDisabled()

    // Klik pertama
    fireEvent.click(submitBtn)

    // Segera masuk ke status memproses
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Memproses Pesanan…/i })).toBeDisabled()
    })

    // Klik kedua saat masih memproses tidak boleh memicu onSubmitOrder tambahan
    fireEvent.click(screen.getByRole('button', { name: /Memproses Pesanan…/i }))
    expect(onSubmitOrder).toHaveBeenCalledTimes(1)

    // Selesaikan order
    resolveOrderPromise({ ok: true, data: { orderNumber: 'ORD-12345' } })
    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/orders/ORD-12345')
    })
  })

  it('menampilkan server fieldErrors saat server mengembalikan error validasi', async () => {
    useCartStore.getState().add(okId, 1)

    const onSubmitOrder = vi.fn().mockResolvedValue({
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Data tidak valid dari server.',
        fieldErrors: {
          'customer.phone': ['Nomor telepon terblokir.'],
          'address.postalCode': ['Kode pos tidak sesuai wilayah.'],
        },
      },
    })

    render(
      <CheckoutForm
        initialData={{
          customer: { name: 'Aisyah Putri', phone: '081234567890' },
          address: {
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Coblong',
            postalCode: '40132',
            addressDetail: 'Jl. Dago No. 123 panjang sekali',
          },
        }}
        onSubmitOrder={onSubmitOrder}
      />
    )

    await screen.findByText('Rp 10.000')

    fireEvent.click(screen.getByRole('button', { name: 'Buat Pesanan' }))

    // Error banner atas dan error field dari server
    expect(await screen.findByText('Data tidak valid dari server.')).toBeInTheDocument()
    expect(screen.getByText('Nomor telepon terblokir.')).toBeInTheDocument()
    expect(screen.getByText('Kode pos tidak sesuai wilayah.')).toBeInTheDocument()
  })

  it('menonaktifkan tombol submit bila tarif ongkir tidak tersedia untuk provinsi yang dipilih', async () => {
    useCartStore.getState().add(okId, 1)

    render(<CheckoutForm />)

    await screen.findByRole('heading', { name: 'Informasi Pembeli' })
    const provinceSelect = screen.getByRole('combobox', { name: 'Provinsi' })

    // Pilih provinsi yang quoteShipping-nya return SHIPPING_UNAVAILABLE (misal: Papua Pegunungan)
    fireEvent.change(provinceSelect, { target: { value: 'Papua Pegunungan' } })
    await waitFor(() => expect(quoteShipping).toHaveBeenCalledWith('Papua Pegunungan'))

    expect(await screen.findByText('Pengiriman ke wilayah ini belum tersedia.')).toBeInTheDocument()
    const submitBtn = screen.getByRole('button', { name: 'Buat Pesanan' })
    expect(submitBtn).toBeDisabled()
    expect(submitBtn).toHaveAccessibleDescription('Pengiriman ke wilayah ini belum tersedia.')
  })

  it('memakai ulang idempotencyKey yang sama pada percobaan ulang setelah kegagalan, dan membuat kunci baru saat isi keranjang berubah', async () => {
    useCartStore.getState().add(okId, 1)
    const calls: unknown[] = []

    const onSubmitOrder = vi.fn().mockImplementation(async (payload) => {
      calls.push(payload)
      return {
        ok: false as const,
        error: { code: 'NETWORK_ERROR', message: 'Koneksi terputus. Silakan coba lagi.' },
      }
    })

    render(
      <CheckoutForm
        initialData={{
          customer: { name: 'Aisyah Putri', phone: '081234567890' },
          address: {
            province: 'Jawa Barat',
            city: 'Bandung',
            district: 'Coblong',
            postalCode: '40132',
            addressDetail: 'Jl. Dago No. 123 panjang sekali',
          },
        }}
        onSubmitOrder={onSubmitOrder}
      />
    )

    await screen.findByText('Rp 10.000')

    // Submit percobaan 1 (gagal)
    fireEvent.click(screen.getByRole('button', { name: 'Buat Pesanan' }))
    await screen.findByText('Koneksi terputus. Silakan coba lagi.')
    expect(calls).toHaveLength(1)
    const key1 = (calls[0] as { idempotencyKey: string }).idempotencyKey
    expect(key1).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)

    // Submit percobaan 2 (retry tanpa mengubah keranjang) -> harus memakai key yang persis sama
    fireEvent.click(screen.getByRole('button', { name: 'Buat Pesanan' }))
    await waitFor(() => expect(calls).toHaveLength(2))
    const key2 = (calls[1] as { idempotencyKey: string }).idempotencyKey
    expect(key2).toBe(key1)

    // Ubah isi keranjang (tambah quantity)
    useCartStore.getState().setQuantity(okId, 3)
    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Buat Pesanan' })).not.toBeDisabled()
    })

    // Submit percobaan 3 setelah isi keranjang berubah -> harus membuat key baru yang berbeda
    fireEvent.click(screen.getByRole('button', { name: 'Buat Pesanan' }))
    await waitFor(() => expect(calls).toHaveLength(3))
    const key3 = (calls[2] as { idempotencyKey: string }).idempotencyKey
    expect(key3).not.toBe(key1)
  })
})
