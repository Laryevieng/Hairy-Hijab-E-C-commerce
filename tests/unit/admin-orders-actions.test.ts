import { describe, expect, it, vi, beforeEach } from 'vitest'

// Mock dependencies
const mockRequireStaff = vi.fn()
const mockCreateClient = vi.fn()
const mockRevalidatePath = vi.fn()

vi.mock('@/lib/auth/guards', () => ({
  requireStaff: () => mockRequireStaff(),
}))

vi.mock('@/lib/supabase/server', () => ({
  createClient: () => mockCreateClient(),
}))

vi.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import {
  verifyPayment,
  rejectPayment,
  markShipped,
  completeOrder,
  cancelOrder,
  markRefunded,
  getProofSignedUrl,
} from '@/actions/admin-orders.actions'

describe('admin-orders.actions (P7-03)', () => {
  const validUuid = 'a0000000-0000-4000-8000-000000000001'
  let mockRpc: ReturnType<typeof vi.fn>
  let mockCreateSignedUrl: ReturnType<typeof vi.fn>

  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireStaff.mockResolvedValue({
      user: { id: 'staff-1', email: 'staff@hairyhijab.com' },
      role: 'staff',
    })
    mockRpc = vi.fn().mockResolvedValue({ error: null })
    mockCreateSignedUrl = vi.fn().mockResolvedValue({
      data: { signedUrl: 'https://example.com/signed-url' },
      error: null,
    })
    mockCreateClient.mockResolvedValue({
      rpc: mockRpc,
      storage: {
        from: vi.fn().mockReturnValue({
          createSignedUrl: mockCreateSignedUrl,
        }),
      },
    })
  })

  it('verifyPayment: memvalidasi UUID dan memanggil RPC verify_payment lewat klien sesi', async () => {
    const res = await verifyPayment(validUuid)
    expect(res.ok).toBe(true)
    expect(mockRequireStaff).toHaveBeenCalledTimes(1)
    expect(mockRpc).toHaveBeenCalledWith('verify_payment', { p_order_id: validUuid })
    expect(mockRevalidatePath).toHaveBeenCalledWith('/admin/orders')
  })

  it('verifyPayment: menolak jika ID bukan UUID', async () => {
    const res = await verifyPayment('invalid-id')
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('VALIDATION')
    }
    expect(mockRpc).not.toHaveBeenCalled()
  })

  it('rejectPayment: memanggil RPC reject_payment dengan catatan penolakan', async () => {
    const res = await rejectPayment({
      orderId: validUuid,
      note: 'Nominal kurang Rp 5.000',
    })
    expect(res.ok).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('reject_payment', {
      p_order_id: validUuid,
      p_note: 'Nominal kurang Rp 5.000',
    })
  })

  it('markShipped: memanggil RPC mark_order_shipped dengan data pengiriman', async () => {
    const res = await markShipped({
      orderId: validUuid,
      courier: 'JNE',
      service: 'YES',
      trackingNumber: 'JNE1234567890',
    })
    expect(res.ok).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('mark_order_shipped', {
      p_order_id: validUuid,
      p_courier: 'JNE',
      p_service: 'YES',
      p_tracking_number: 'JNE1234567890',
    })
  })

  it('completeOrder: memanggil RPC complete_order', async () => {
    const res = await completeOrder(validUuid)
    expect(res.ok).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('complete_order', { p_order_id: validUuid })
  })

  it('cancelOrder: memanggil RPC cancel_order dengan alasan pembatalan', async () => {
    const res = await cancelOrder({
      orderId: validUuid,
      reason: 'Dibatalkan oleh staf karena stok rusak',
    })
    expect(res.ok).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('cancel_order', {
      p_order_id: validUuid,
      p_reason: 'Dibatalkan oleh staf karena stok rusak',
    })
  })

  it('markRefunded: memanggil RPC mark_refunded dengan catatan pengembalian dana', async () => {
    const res = await markRefunded({
      orderId: validUuid,
      note: 'Dana telah ditransfer kembali ke rekening pelanggan',
    })
    expect(res.ok).toBe(true)
    expect(mockRpc).toHaveBeenCalledWith('mark_refunded', {
      p_order_id: validUuid,
      p_note: 'Dana telah ditransfer kembali ke rekening pelanggan',
    })
  })

  it('getProofSignedUrl: membuat signed URL 60 detik melalui storage client sesi', async () => {
    const res = await getProofSignedUrl('a0000000-0000-4000-8000-000000000001/bukti.jpg')
    expect(res.ok).toBe(true)
    if (res.ok) {
      expect(res.data.signedUrl).toBe('https://example.com/signed-url')
    }
    expect(mockCreateSignedUrl).toHaveBeenCalledWith(
      'a0000000-0000-4000-8000-000000000001/bukti.jpg',
      60
    )
  })

  it('memetakan error dari database via mapDbError', async () => {
    mockRpc.mockResolvedValueOnce({
      error: { message: 'INVALID_TRANSITION', details: '', code: 'P0001' },
    })

    const res = await verifyPayment(validUuid)
    expect(res.ok).toBe(false)
    if (!res.ok) {
      expect(res.error.code).toBe('INVALID_TRANSITION')
      expect(res.error.message).toBe('Status pesanan tidak dapat diubah seperti itu.')
    }
  })
})
