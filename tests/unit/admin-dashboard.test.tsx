import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  calculateRevenueFromOrders,
  type RevenueOrder,
} from '@/services/admin-dashboard.service'
import AdminDashboardPage from '@/app/admin/page'

// Mock server-only modules
vi.mock('server-only', () => ({}))

const mockRequireStaff = vi.fn()
const mockGetDashboardSummary = vi.fn()

vi.mock('@/lib/auth/guards', () => ({
  requireStaff: () => mockRequireStaff(),
}))

vi.mock('@/services/admin-dashboard.service', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/services/admin-dashboard.service')>()
  return {
    ...actual,
    getAdminDashboardSummary: () => mockGetDashboardSummary(),
  }
})

describe('calculateRevenueFromOrders (Pure Function)', () => {
  const refDate = new Date('2026-11-05T12:00:00Z')

  it('calculates 7-day and 30-day revenue correctly based on paid_at date', () => {
    const orders: RevenueOrder[] = [
      // 2 days ago (within 7 days & within 30 days)
      { grand_total: 150000, paid_at: '2026-11-03T10:00:00Z' },
      // 5 days ago (within 7 days & within 30 days)
      { grand_total: 200000, paid_at: '2026-10-31T10:00:00Z' },
      // 15 days ago (within 30 days, outside 7 days)
      { grand_total: 300000, paid_at: '2026-10-21T10:00:00Z' },
      // 40 days ago (outside 30 days)
      { grand_total: 500000, paid_at: '2026-09-20T10:00:00Z' },
      // Unpaid or null paid_at
      { grand_total: 999999, paid_at: null },
    ]

    const result = calculateRevenueFromOrders(orders, refDate)

    // 7 days: 150.000 + 200.000 = 350.000
    expect(result.revenue7Days).toBe(350000)
    // 30 days: 150.000 + 200.000 + 300.000 = 650.000
    expect(result.revenue30Days).toBe(650000)
  })

  it('returns 0 for empty order list', () => {
    const result = calculateRevenueFromOrders([], refDate)
    expect(result.revenue7Days).toBe(0)
    expect(result.revenue30Days).toBe(0)
  })
})

describe('AdminDashboardPage Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStaff.mockResolvedValue({
      user: { id: 'staff-1', email: 'owner@hairyhijab.com' },
      role: 'admin',
    })
    mockGetDashboardSummary.mockResolvedValue({
      waitingVerification: 3,
      needsShipping: 5,
      waitingPayment: 2,
      lowStock: 4,
      lowStockThreshold: 5,
      revenue7Days: 1250000,
      revenue30Days: 4500000,
    })
  })

  it('renders all 6 metric cards with correct values and filtered links', async () => {
    const PageComponent = await AdminDashboardPage()
    render(PageComponent)

    // Header & User Role
    expect(screen.getByText('Dashboard Operasional')).toBeInTheDocument()
    expect(screen.getByText('owner@hairyhijab.com')).toBeInTheDocument()
    expect(screen.getByText(/Administrator/i)).toBeInTheDocument()

    // 1. Menunggu Verifikasi
    expect(screen.getByText('Menunggu Verifikasi')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    const verificationLink = screen.getByRole('link', { name: /menunggu verifikasi/i })
    expect(verificationLink).toHaveAttribute(
      'href',
      '/admin/orders?payment_status=proof_submitted'
    )

    // 2. Perlu Dikirim
    expect(screen.getByText('Perlu Dikirim')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
    const shippingLink = screen.getByRole('link', { name: /perlu dikirim/i })
    expect(shippingLink).toHaveAttribute('href', '/admin/orders?status=processing')

    // 3. Menunggu Pembayaran
    expect(screen.getByText('Menunggu Pembayaran')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
    const paymentLink = screen.getByRole('link', { name: /menunggu pembayaran/i })
    expect(paymentLink).toHaveAttribute(
      'href',
      '/admin/orders?status=pending&payment_status=unpaid'
    )

    // 4. Stok Menipis
    expect(screen.getByText('Stok Menipis')).toBeInTheDocument()
    expect(screen.getByText('4')).toBeInTheDocument()
    const stockLink = screen.getByRole('link', { name: /stok menipis/i })
    expect(stockLink).toHaveAttribute('href', '/admin/inventory?filter=low_stock')

    // 5. Omzet 7 Hari (formatted Rupiah)
    expect(screen.getByText('Omzet 7 Hari')).toBeInTheDocument()
    expect(screen.getByText('Rp 1.250.000')).toBeInTheDocument()

    // 6. Omzet 30 Hari (formatted Rupiah)
    expect(screen.getByText('Omzet 30 Hari')).toBeInTheDocument()
    expect(screen.getByText('Rp 4.500.000')).toBeInTheDocument()

    // Quick action shortcuts
    expect(screen.getByText('Pintasan Cepat')).toBeInTheDocument()
    expect(screen.getByText('Periksa Bukti Transfer')).toBeInTheDocument()
    expect(screen.getByText('Kelola Pengiriman')).toBeInTheDocument()
    expect(screen.getByText('Cek Stok Inventori')).toBeInTheDocument()
  })

  it('renders staff role badge when user is a staff member', async () => {
    mockRequireStaff.mockResolvedValue({
      user: { id: 'staff-2', email: 'staff@hairyhijab.com' },
      role: 'staff',
    })

    const PageComponent = await AdminDashboardPage()
    render(PageComponent)

    expect(screen.getByText(/Staf Operasional/i)).toBeInTheDocument()
  })
})
