import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { placeOrder } from '@/actions/checkout.actions'
import { getCurrentUser } from '@/lib/auth/guards'
import { createAdminClient } from '@/lib/supabase/admin'
import type { CheckoutData } from '@/lib/validations/checkout'
import { createOrderFromCheckout } from '@/services/orders.service'

vi.mock('@/lib/auth/guards', () => ({
  getCurrentUser: vi.fn(),
}))

vi.mock('@/lib/supabase/admin', () => ({
  createAdminClient: vi.fn(),
}))

const IDEMPOTENCY_KEY = '9b2e7c41-0d3a-4f6b-8e15-7a4c2d9f0b63'
const VARIANT_ID = '3f0c2a6e-6b1d-4c8e-9a51-2d7f4b8e1c90'

function sampleCheckoutData(): CheckoutData {
  return {
    idempotencyKey: IDEMPOTENCY_KEY,
    customer: {
      name: 'Aisyah Putri',
      phone: '628123456789',
      email: 'aisyah@example.com',
    },
    address: {
      province: 'Jawa Barat',
      city: 'Bandung',
      district: 'Coblong',
      postalCode: '40132',
      addressDetail: 'Jl. Dago No. 123, RT 01/RW 02',
    },
    items: [{ variantId: VARIANT_ID, quantity: 2 }],
    notes: 'Tolong jangan dibanting.',
  }
}

describe('orders.service: createOrderFromCheckout (P6-05)', () => {
  it('menolak pesanan bila store_settings.bank_accounts kosong (§14.1)', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: { bank_accounts: [] },
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn(),
    } as unknown as Parameters<typeof createOrderFromCheckout>[0]

    const result = await createOrderFromCheckout(mockClient, sampleCheckoutData(), null)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('PAYMENT_UNAVAILABLE')
      expect(result.error.message).toBe('Metode pembayaran belum tersedia. Hubungi kami.')
    }
    expect(mockClient.rpc).not.toHaveBeenCalled()
  })

  it('mengirim argumen RPC yang benar ke fungsi create_order', async () => {
    const rpcMock = vi.fn().mockResolvedValue({
      data: {
        order_id: 'ord-uuid-1',
        order_number: 'HH-261104-ABCDE',
        public_token: 'token-secret-123',
        replayed: false,
      },
      error: null,
    })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                bank_accounts: [{ bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' }],
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: rpcMock,
    } as unknown as Parameters<typeof createOrderFromCheckout>[0]

    const result = await createOrderFromCheckout(mockClient, sampleCheckoutData(), 'user-uuid-123')

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.orderNumber).toBe('HH-261104-ABCDE')
      expect(result.data.orderId).toBe('ord-uuid-1')
      expect(result.data.publicToken).toBe('token-secret-123')
      expect(result.data.replayed).toBe(false)
    }

    expect(rpcMock).toHaveBeenCalledWith('create_order', {
      p_idempotency_key: IDEMPOTENCY_KEY,
      p_user_id: 'user-uuid-123',
      p_customer_name: 'Aisyah Putri',
      p_customer_phone: '628123456789',
      p_customer_email: 'aisyah@example.com',
      p_shipping_address: {
        recipient_name: 'Aisyah Putri',
        phone: '628123456789',
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Coblong',
        postal_code: '40132',
        address_detail: 'Jl. Dago No. 123, RT 01/RW 02',
      },
      p_items: [{ variant_id: VARIANT_ID, quantity: 2 }],
      p_notes: 'Tolong jangan dibanting.',
    })
  })

  it('mencoba ulang SEKALI bila terjadi SQLSTATE 23505 pada create_order', async () => {
    const rpcMock = vi
      .fn()
      // Panggilan 1: race condition 23505 pada idempotency_key
      .mockResolvedValueOnce({
        data: null,
        error: { code: '23505', message: 'duplicate key value violates unique constraint "orders_idempotency_key_key"' },
      })
      // Panggilan 2 (retry): menemukan pesanan yang sudah ada (replayed true)
      .mockResolvedValueOnce({
        data: {
          order_id: 'ord-uuid-1',
          order_number: 'HH-261104-ABCDE',
          public_token: 'token-secret-123',
          replayed: true,
        },
        error: null,
      })

    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                bank_accounts: [{ bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' }],
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: rpcMock,
    } as unknown as Parameters<typeof createOrderFromCheckout>[0]

    const result = await createOrderFromCheckout(mockClient, sampleCheckoutData(), null)

    expect(rpcMock).toHaveBeenCalledTimes(2)
    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.orderNumber).toBe('HH-261104-ABCDE')
      expect(result.data.replayed).toBe(true)
    }
  })

  it('memetakan error INSUFFICIENT_STOCK dari database ke pesan ramah pengguna', async () => {
    const mockClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                bank_accounts: [{ bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' }],
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({
        data: null,
        error: { message: `INSUFFICIENT_STOCK:${VARIANT_ID}` },
      }),
    } as unknown as Parameters<typeof createOrderFromCheckout>[0]

    const result = await createOrderFromCheckout(mockClient, sampleCheckoutData(), null)

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('INSUFFICIENT_STOCK')
      expect(result.error.message).toBe('Stok salah satu produk tidak mencukupi. Kurangi jumlah atau pilih varian lain.')
    }
  })
})

describe('checkout.actions: placeOrder (P6-05)', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
    vi.mocked(createAdminClient).mockReset()
  })

  it('memvalidasi input dengan Zod dan mengembalikan fieldErrors jika formulir tidak valid', async () => {
    const result = await placeOrder({
      idempotencyKey: 'bukan-uuid',
      customer: { name: 'A', phone: '123' },
      address: { province: 'Provinsi Fiktif' },
      items: [],
    })

    expect(result.ok).toBe(false)
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION')
      expect(result.error.fieldErrors).toBeDefined()
      expect(result.error.fieldErrors?.['customer.name']).toBeDefined()
      expect(result.error.fieldErrors?.['customer.phone']).toBeDefined()
      expect(result.error.fieldErrors?.['items']).toBeDefined()
    }
  })

  it('tamu (belum login): publicToken dikembalikan pada hasil sukses', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)

    const mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                bank_accounts: [{ bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' }],
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({
        data: {
          order_id: 'ord-uuid-1',
          order_number: 'HH-261104-GUEST1',
          public_token: 'secret-token-guest',
          replayed: false,
        },
        error: null,
      }),
    } as unknown as ReturnType<typeof createAdminClient>

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient)

    const result = await placeOrder({
      idempotencyKey: IDEMPOTENCY_KEY,
      customer: { name: 'Siti Rahma', phone: '081234567890' },
      address: {
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Coblong',
        postalCode: '40132',
        addressDetail: 'Jl. Ir H Juanda No. 100',
      },
      items: [{ variantId: VARIANT_ID, quantity: 1 }],
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.orderNumber).toBe('HH-261104-GUEST1')
      expect(result.data.publicToken).toBe('secret-token-guest')
    }

    // Pastikan p_user_id dikirim null ke create_order
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({
        p_user_id: null,
      })
    )
  })

  it('pengguna login: publicToken TIDAK dikembalikan ke browser', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: 'user-logged-in-uuid', email: 'user@example.com' })

    const mockAdminClient = {
      from: vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          eq: vi.fn().mockReturnValue({
            maybeSingle: vi.fn().mockResolvedValue({
              data: {
                bank_accounts: [{ bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' }],
              },
              error: null,
            }),
          }),
        }),
      }),
      rpc: vi.fn().mockResolvedValue({
        data: {
          order_id: 'ord-uuid-2',
          order_number: 'HH-261104-USER1',
          public_token: 'secret-token-user',
          replayed: false,
        },
        error: null,
      }),
    } as unknown as ReturnType<typeof createAdminClient>

    vi.mocked(createAdminClient).mockReturnValue(mockAdminClient)

    const result = await placeOrder({
      idempotencyKey: IDEMPOTENCY_KEY,
      customer: { name: 'Member Setia', phone: '081234567890' },
      address: {
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Coblong',
        postalCode: '40132',
        addressDetail: 'Jl. Ir H Juanda No. 100',
      },
      items: [{ variantId: VARIANT_ID, quantity: 1 }],
    })

    expect(result.ok).toBe(true)
    if (result.ok) {
      expect(result.data.orderNumber).toBe('HH-261104-USER1')
      expect(result.data.publicToken).toBeUndefined()
    }

    // Pastikan p_user_id diambil dari sesi
    expect(mockAdminClient.rpc).toHaveBeenCalledWith(
      'create_order',
      expect.objectContaining({
        p_user_id: 'user-logged-in-uuid',
      })
    )
  })
})
