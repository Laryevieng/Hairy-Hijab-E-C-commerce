import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import { getCurrentUser } from '@/lib/auth/guards'
import {
  getOrderForViewer,
  verifyViewerToken,
  type OrderView,
} from '@/services/orders.public.service'

vi.mock('@/lib/auth/guards', () => ({
  getCurrentUser: vi.fn(),
}))

const ORDER_ID = '9b2e7c41-0d3a-4f6b-8e15-7a4c2d9f0b63'
const ORDER_NUMBER = 'HH-261104-ABCDE'
const VALID_TOKEN = 'secret-public-token-32-chars-long'
const USER_OWNER_ID = 'user-owner-123'
const OTHER_USER_ID = 'user-other-456'

function createMockClient(opts: {
  order?: Record<string, unknown> | null
  items?: Record<string, unknown>[]
  history?: Record<string, unknown>[]
  shipment?: Record<string, unknown> | null
  payment?: Record<string, unknown> | null
  settings?: Record<string, unknown> | null
}) {
  const {
    order = {
      id: ORDER_ID,
      order_number: ORDER_NUMBER,
      user_id: USER_OWNER_ID,
      public_token: VALID_TOKEN,
      status: 'pending',
      payment_status: 'unpaid',
      created_at: '2026-11-04T10:00:00Z',
      expires_at: '2026-11-05T10:00:00Z',
      paid_at: null,
      shipped_at: null,
      cancel_reason: null,
      subtotal: 50000,
      shipping_cost: 20000,
      discount_amount: 0,
      grand_total: 70000,
      notes: 'Harap dikemas rapi.',
      customer_name_snapshot: 'Aisyah Putri',
      customer_phone_snapshot: '628123456789',
      customer_email_snapshot: 'aisyah@example.com',
      shipping_address_snapshot: {
        recipient_name: 'Aisyah Putri',
        phone: '628123456789',
        province: 'Jawa Barat',
        city: 'Bandung',
        district: 'Coblong',
        postal_code: '40132',
        address_detail: 'Jl. Dago No. 123',
      },
    },
    items = [
      {
        id: 'item-1',
        variant_id: 'var-1',
        product_name_snapshot: 'Bergo Non Karet',
        sku: 'BNK-S-BLK',
        size_snapshot: 'S',
        color_snapshot: 'Hitam',
        unit_price: 50000,
        quantity: 1,
        line_total: 50000,
      },
    ],
    history = [
      {
        id: 'hist-1',
        from_status: null,
        to_status: 'pending',
        from_payment_status: null,
        to_payment_status: 'unpaid',
        created_at: '2026-11-04T10:00:00Z',
      },
    ],
    shipment = null,
    payment = null,
    settings = {
      bank_accounts: [
        { bank: 'BCA', account_number: '1234567890', account_name: 'Hairy Hijab' },
      ],
      contact_whatsapp: '6281234567890',
    },
  } = opts

  return {
    from: vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: order, error: null }),
            }),
          }),
        }
      }
      if (table === 'order_items') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: items, error: null }),
            }),
          }),
        }
      }
      if (table === 'order_status_history') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockResolvedValue({ data: history, error: null }),
            }),
          }),
        }
      }
      if (table === 'shipments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: shipment, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'payments') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              order: vi.fn().mockReturnValue({
                limit: vi.fn().mockReturnValue({
                  maybeSingle: vi.fn().mockResolvedValue({ data: payment, error: null }),
                }),
              }),
            }),
          }),
        }
      }
      if (table === 'store_settings') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: settings, error: null }),
            }),
          }),
        }
      }
      throw new Error(`Unexpected table: ${table}`)
    }),
  } as unknown as Parameters<typeof getOrderForViewer>[1]
}

describe('verifyViewerToken (timing-safe comparison)', () => {
  it('mengembalikan true bila kedua token sama persis', () => {
    expect(verifyViewerToken('secret123', 'secret123')).toBe(true)
  })

  it('mengembalikan false bila token berbeda dengan panjang sama', () => {
    expect(verifyViewerToken('secret123', 'secret999')).toBe(false)
  })

  it('mengembalikan false bila token berbeda panjang', () => {
    expect(verifyViewerToken('short', 'longer-token')).toBe(false)
  })

  it('mengembalikan false bila salah satu token null atau undefined', () => {
    expect(verifyViewerToken(undefined, 'secret')).toBe(false)
    expect(verifyViewerToken('secret', undefined)).toBe(false)
    expect(verifyViewerToken(null, 'secret')).toBe(false)
    expect(verifyViewerToken('', '')).toBe(false)
  })
})

describe('getOrderForViewer: otorisasi & proteksi akses (P6-06)', () => {
  beforeEach(() => {
    vi.mocked(getCurrentUser).mockReset()
  })

  it('PEMILIK (login dan id sesuai user_id pesanan): diizinkan akses meski tanpa token', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: USER_OWNER_ID, email: 'owner@example.com' })
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER }, mockClient)

    expect(order).not.toBeNull()
    expect(order?.orderNumber).toBe(ORDER_NUMBER)
    expect(order?.isViewerOwner).toBe(true)
  })

  it('TAMU DENGAN TOKEN BENAR: diizinkan akses', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER, token: VALID_TOKEN }, mockClient)

    expect(order).not.toBeNull()
    expect(order?.orderNumber).toBe(ORDER_NUMBER)
    expect(order?.isViewerOwner).toBe(false)
    expect(order?.publicToken).toBe(VALID_TOKEN)
  })

  it('TAMU DENGAN TOKEN SALAH: mengembalikan null (memicu notFound)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER, token: 'wrong-token' }, mockClient)

    expect(order).toBeNull()
  })

  it('TAMU TANPA TOKEN: mengembalikan null (tidak membocorkan pesanan)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER }, mockClient)

    expect(order).toBeNull()
  })

  it('BUKAN PEMILIK TANPA TOKEN: pengguna login lain ditolak (mengembalikan null)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: OTHER_USER_ID, email: 'other@example.com' })
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER }, mockClient)

    expect(order).toBeNull()
  })

  it('BUKAN PEMILIK DENGAN TOKEN SALAH: ditolak (mengembalikan null)', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: OTHER_USER_ID, email: 'other@example.com' })
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER, token: 'token-ngawur' }, mockClient)

    expect(order).toBeNull()
  })

  it('BUKAN PEMILIK NAMUN MEMILIKI TOKEN TAMU VALID: diizinkan lewat token tamu', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: OTHER_USER_ID, email: 'other@example.com' })
    const mockClient = createMockClient({})

    const order = await getOrderForViewer({ orderNumber: ORDER_NUMBER, token: VALID_TOKEN }, mockClient)

    expect(order).not.toBeNull()
    expect(order?.orderNumber).toBe(ORDER_NUMBER)
    expect(order?.isViewerOwner).toBe(false)
  })

  it('PESANAN TIDAK DITEMUKAN DI DB: mengembalikan null', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue(null)
    const mockClient = createMockClient({ order: null })

    const order = await getOrderForViewer({ orderNumber: 'HH-TIDAK-ADA', token: VALID_TOKEN }, mockClient)

    expect(order).toBeNull()
  })

  it('NOMOR PESANAN KOSONG: mengembalikan null tanpa query', async () => {
    const order = await getOrderForViewer({ orderNumber: '   ', token: VALID_TOKEN })
    expect(order).toBeNull()
  })

  it('DTO MEMUAT DATA LENGKAP: items, snapshot alamat, bank accounts, status', async () => {
    vi.mocked(getCurrentUser).mockResolvedValue({ id: USER_OWNER_ID, email: 'owner@example.com' })
    const mockClient = createMockClient({})

    const order = (await getOrderForViewer({ orderNumber: ORDER_NUMBER }, mockClient)) as OrderView

    expect(order).toBeDefined()
    expect(order.subtotal).toBe(50000)
    expect(order.shippingCost).toBe(20000)
    expect(order.grandTotal).toBe(70000)
    expect(order.items).toHaveLength(1)
    expect(order.items[0].productName).toBe('Bergo Non Karet')
    expect(order.shippingAddress.city).toBe('Bandung')
    expect(order.shippingAddress.province).toBe('Jawa Barat')
    expect(order.bankAccounts).toHaveLength(1)
    expect(order.bankAccounts[0].bank).toBe('BCA')
    expect(order.customer.name).toBe('Aisyah Putri')
  })
})
