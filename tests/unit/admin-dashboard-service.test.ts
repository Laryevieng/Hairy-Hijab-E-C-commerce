import { describe, it, expect, vi, beforeEach } from 'vitest'

const mockCreateClient = vi.fn()

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('server-only', () => ({}))

import { getAdminDashboardSummary } from '@/services/admin-dashboard.service'

describe('getAdminDashboardSummary Service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('aggregates metrics correctly from Supabase queries', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string; head?: boolean }) => {
            if (opts?.count === 'exact') {
              // Count queries
              return {
                eq: vi.fn((col: string, val: string) => {
                  if (col === 'payment_status' && val === 'proof_submitted') {
                    return Promise.resolve({ count: 7, data: null, error: null })
                  }
                  if (col === 'status' && val === 'processing') {
                    return Promise.resolve({ count: 4, data: null, error: null })
                  }
                  if (col === 'status' && val === 'pending') {
                    return {
                      eq: vi.fn((c2: string, v2: string) => {
                        if (c2 === 'payment_status' && v2 === 'unpaid') {
                          return Promise.resolve({ count: 3, data: null, error: null })
                        }
                        return Promise.resolve({ count: 0, data: null, error: null })
                      }),
                    }
                  }
                  return Promise.resolve({ count: 0, data: null, error: null })
                }),
              }
            }
            // Revenue query: select('grand_total, paid_at')
            return {
              eq: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              gte: vi.fn().mockResolvedValue({
                data: [
                  { grand_total: 100000, paid_at: new Date().toISOString() },
                  { grand_total: 250000, paid_at: new Date(Date.now() - 10 * 86400000).toISOString() },
                ],
                error: null,
              }),
            }
          }),
        }
      }

      if (table === 'store_settings') {
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({
                data: { low_stock_threshold: 8 },
                error: null,
              }),
            }),
          }),
        }
      }

      if (table === 'product_variants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({
                count: 6,
                data: null,
                error: null,
              }),
            }),
          }),
        }
      }

      return {}
    })

    mockCreateClient.mockResolvedValue({ from: mockFrom })

    const summary = await getAdminDashboardSummary()

    expect(summary.waitingVerification).toBe(7)
    expect(summary.needsShipping).toBe(4)
    expect(summary.waitingPayment).toBe(3)
    expect(summary.lowStockThreshold).toBe(8)
    expect(summary.lowStock).toBe(6)
    expect(summary.revenue7Days).toBe(100000)
    expect(summary.revenue30Days).toBe(350000)
  })

  it('uses default lowStockThreshold = 5 if store_settings has no record', async () => {
    const mockFrom = vi.fn((table: string) => {
      if (table === 'orders') {
        return {
          select: vi.fn((_cols: string, opts?: { count?: string }) => {
            if (opts?.count === 'exact') {
              return {
                eq: vi.fn().mockReturnValue({
                  eq: vi.fn().mockResolvedValue({ count: 0, data: null, error: null }),
                  then: (fn: (res: unknown) => unknown) => fn({ count: 0, data: null, error: null }),
                }),
              }
            }
            return {
              eq: vi.fn().mockReturnThis(),
              neq: vi.fn().mockReturnThis(),
              not: vi.fn().mockReturnThis(),
              gte: vi.fn().mockResolvedValue({ data: [], error: null }),
            }
          }),
        }
      }

      if (table === 'store_settings') {
        return {
          select: vi.fn().mockReturnValue({
            limit: vi.fn().mockReturnValue({
              maybeSingle: vi.fn().mockResolvedValue({ data: null, error: null }),
            }),
          }),
        }
      }

      if (table === 'product_variants') {
        return {
          select: vi.fn().mockReturnValue({
            eq: vi.fn().mockReturnValue({
              lte: vi.fn().mockResolvedValue({ count: 0, data: null, error: null }),
            }),
          }),
        }
      }

      return {}
    })

    mockCreateClient.mockResolvedValue({ from: mockFrom })

    const summary = await getAdminDashboardSummary()
    expect(summary.lowStockThreshold).toBe(5)
  })
})
