import { render, screen, act } from '@testing-library/react'
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { ExpiryCountdown } from '@/components/orders/expiry-countdown'
import { OrderTimeline } from '@/components/orders/order-timeline'

describe('OrderStatusBadge', () => {
  it('menampilkan badge Menunggu Pembayaran saat status pending dan payment_status unpaid', () => {
    render(<OrderStatusBadge status="pending" paymentStatus="unpaid" />)
    expect(screen.getByText('Menunggu Pembayaran')).toBeInTheDocument()
  })

  it('menampilkan badge Menunggu Verifikasi saat status pending dan payment_status proof_submitted', () => {
    render(<OrderStatusBadge status="pending" paymentStatus="proof_submitted" />)
    expect(screen.getByText('Menunggu Verifikasi Pembayaran')).toBeInTheDocument()
  })

  it('menampilkan badge Diproses saat status processing', () => {
    render(<OrderStatusBadge status="processing" paymentStatus="paid" />)
    expect(screen.getByText('Sedang Diproses')).toBeInTheDocument()
  })

  it('menampilkan badge Dikirim saat status shipped', () => {
    render(<OrderStatusBadge status="shipped" paymentStatus="paid" />)
    expect(screen.getByText('Sedang Dikirim')).toBeInTheDocument()
  })

  it('menampilkan badge Selesai saat status completed', () => {
    render(<OrderStatusBadge status="completed" paymentStatus="paid" />)
    expect(screen.getByText('Selesai')).toBeInTheDocument()
  })

  it('menampilkan badge Dibatalkan saat status cancelled', () => {
    render(<OrderStatusBadge status="cancelled" paymentStatus="unpaid" />)
    expect(screen.getByText('Dibatalkan')).toBeInTheDocument()
  })

  it('menampilkan badge Kedaluwarsa saat status expired', () => {
    render(<OrderStatusBadge status="expired" paymentStatus="unpaid" />)
    expect(screen.getByText('Kedaluwarsa')).toBeInTheDocument()
  })
})

describe('ExpiryCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('menghitung mundur sisa jam, menit, dan detik', () => {
    // 2 jam 30 menit 15 detik ke depan
    const target = new Date(Date.now() + (2 * 3600 + 30 * 60 + 15) * 1000).toISOString()
    render(<ExpiryCountdown expiresAt={target} />)

    expect(screen.getByRole('timer')).toBeInTheDocument()
    expect(screen.getByText(/2 jam 30 menit 15 detik/)).toBeInTheDocument()

    // Maju 5 detik
    act(() => {
      vi.advanceTimersByTime(5000)
    })
    expect(screen.getByText(/2 jam 30 menit 10 detik/)).toBeInTheDocument()
  })

  it('menampilkan alert kedaluwarsa saat waktu target telah lewat', () => {
    const past = new Date(Date.now() - 1000).toISOString()
    render(<ExpiryCountdown expiresAt={past} />)

    expect(screen.getByRole('alert')).toBeInTheDocument()
    expect(screen.getByText(/Batas waktu pembayaran telah berakhir/)).toBeInTheDocument()
  })
})

describe('OrderTimeline', () => {
  it('merender alur tahapan pesanan normal dengan tanggal pembuatan', () => {
    render(
      <OrderTimeline
        status="pending"
        paymentStatus="unpaid"
        createdAt="2026-11-04T10:00:00Z"
        paidAt={null}
        shippedAt={null}
        cancelReason={null}
        statusHistory={[]}
      />
    )

    expect(screen.getByText('Pesanan Dibuat')).toBeInTheDocument()
    expect(screen.getByText('Pembayaran')).toBeInTheDocument()
    expect(screen.getByText('Pesanan Diproses')).toBeInTheDocument()
    expect(screen.getByText('Sedang Dikirim')).toBeInTheDocument()
    expect(screen.getByText('Pesanan Selesai')).toBeInTheDocument()
  })

  it('menampilkan alert pembatalan dengan alasan bila status cancelled', () => {
    render(
      <OrderTimeline
        status="cancelled"
        paymentStatus="unpaid"
        createdAt="2026-11-04T10:00:00Z"
        paidAt={null}
        shippedAt={null}
        cancelReason="Stok gudang rusak"
        statusHistory={[]}
      />
    )

    expect(screen.getByText('Pesanan Dibatalkan')).toBeInTheDocument()
    expect(screen.getByText(/Alasan: Stok gudang rusak/)).toBeInTheDocument()
  })

  it('menampilkan alert kedaluwarsa bila status expired', () => {
    render(
      <OrderTimeline
        status="expired"
        paymentStatus="unpaid"
        createdAt="2026-11-04T10:00:00Z"
        paidAt={null}
        shippedAt={null}
        cancelReason={null}
        statusHistory={[]}
      />
    )

    expect(screen.getByText('Pesanan Kedaluwarsa')).toBeInTheDocument()
  })
})
