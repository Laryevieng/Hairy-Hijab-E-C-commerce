import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

import AccountOrdersPage from '@/app/account/orders/page'
import { requireUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

vi.mock('@/lib/auth/guards', () => ({
  requireUser: vi.fn(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn(),
}))

const MOCK_USER = {
  id: 'usr-111-222',
  email: 'customer@example.com',
}

function mockSupabaseOrders(orders: Array<Record<string, unknown>> | null, count = 0) {
  const queryBuilder = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockResolvedValue({
      data: orders,
      count,
      error: null,
    }),
  }

  const client = {
    from: vi.fn((table: string) => {
      if (table === 'orders') return queryBuilder
      throw new Error(`Unexpected table: ${table}`)
    }),
  }

  return { client, queryBuilder }
}

describe('AccountOrdersPage (P6-07)', () => {
  beforeEach(() => {
    vi.mocked(requireUser).mockReset()
    vi.mocked(createClient).mockReset()
  })

  it('menampilkan EmptyState jika pengguna belum memiliki pesanan', async () => {
    vi.mocked(requireUser).mockResolvedValue(MOCK_USER as unknown as Awaited<ReturnType<typeof requireUser>>)
    const { client } = mockSupabaseOrders([], 0)
    vi.mocked(createClient).mockResolvedValue(client as unknown as Awaited<ReturnType<typeof createClient>>)

    const PageComponent = await AccountOrdersPage({ searchParams: Promise.resolve({}) })
    render(PageComponent)

    expect(screen.getByText('Pesanan Saya')).toBeInTheDocument()
    expect(screen.getByText('Belum Ada Pesanan')).toBeInTheDocument()
    expect(screen.getByText('Anda belum pernah melakukan pemesanan produk di Hairy Hijab.')).toBeInTheDocument()
    const shopLink = screen.getByRole('link', { name: 'Mulai Belanja' })
    expect(shopLink).toHaveAttribute('href', '/products')
  })

  it('menampilkan daftar pesanan dengan nomor, status badge, total, dan tautan rincian', async () => {
    vi.mocked(requireUser).mockResolvedValue(MOCK_USER as unknown as Awaited<ReturnType<typeof requireUser>>)
    const mockOrder = {
      id: 'ord-123',
      order_number: 'HH-261104-TEST1',
      created_at: '2026-11-04T12:00:00Z',
      status: 'pending',
      payment_status: 'unpaid',
      grand_total: 75000,
      subtotal: 55000,
      shipping_cost: 20000,
      order_items: [
        {
          id: 'item-1',
          product_name_snapshot: 'Pashmina Silk',
          quantity: 1,
          unit_price: 55000,
          line_total: 55000,
          color_snapshot: 'Mocca',
          size_snapshot: null,
        },
      ],
    }

    const { client, queryBuilder } = mockSupabaseOrders([mockOrder], 1)
    vi.mocked(createClient).mockResolvedValue(client as unknown as Awaited<ReturnType<typeof createClient>>)

    const PageComponent = await AccountOrdersPage({ searchParams: Promise.resolve({ page: '1' }) })
    render(PageComponent)

    expect(screen.getByText('HH-261104-TEST1')).toBeInTheDocument()
    expect(screen.getByText('Menunggu Pembayaran')).toBeInTheDocument()
    expect(screen.getByText('Rp 75.000')).toBeInTheDocument()
    expect(screen.getByText('Pashmina Silk')).toBeInTheDocument()
    expect(screen.getByText('Total 1 pesanan')).toBeInTheDocument()

    // Verifikasi tautan ke rincian pesanan
    const detailLink = screen.getByRole('link', { name: /Lihat Rincian Pesanan/i })
    expect(detailLink).toHaveAttribute('href', '/orders/HH-261104-TEST1')

    // Verifikasi query memfilter berdasarkan user_id milik sendiri
    expect(queryBuilder.eq).toHaveBeenCalledWith('user_id', MOCK_USER.id)
  })

  it('menampilkan paginasi bila total pesanan melebihi 10', async () => {
    vi.mocked(requireUser).mockResolvedValue(MOCK_USER as unknown as Awaited<ReturnType<typeof requireUser>>)
    const mockOrders = Array.from({ length: 10 }, (_, i) => ({
      id: `ord-${i}`,
      order_number: `HH-261104-PAG${i}`,
      created_at: '2026-11-04T12:00:00Z',
      status: 'completed',
      payment_status: 'paid',
      grand_total: 100000,
      subtotal: 80000,
      shipping_cost: 20000,
      order_items: [],
    }))

    const { client, queryBuilder } = mockSupabaseOrders(mockOrders, 25)
    vi.mocked(createClient).mockResolvedValue(client as unknown as Awaited<ReturnType<typeof createClient>>)

    const PageComponent = await AccountOrdersPage({ searchParams: Promise.resolve({ page: '2' }) })
    render(PageComponent)

    expect(screen.getByText('Total 25 pesanan')).toBeInTheDocument()
    expect(screen.getByText(/Halaman 2 dari 3/i)).toBeInTheDocument()

    // Range untuk halaman 2: from 10 to 19
    expect(queryBuilder.range).toHaveBeenCalledWith(10, 19)
  })
})
