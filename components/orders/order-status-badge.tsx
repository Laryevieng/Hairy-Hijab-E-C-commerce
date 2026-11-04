import type { OrderStatus, PaymentStatus } from '@/services/orders.public.service'
import { Badge } from '@/components/ui/badge'

interface OrderStatusBadgeProps {
  status: OrderStatus
  paymentStatus: PaymentStatus
  className?: string
}

export function OrderStatusBadge({ status, paymentStatus, className }: OrderStatusBadgeProps) {
  if (status === 'cancelled') {
    return (
      <Badge variant="destructive" className={className}>
        Dibatalkan
      </Badge>
    )
  }

  if (status === 'expired') {
    return (
      <Badge variant="secondary" className={`bg-stone-200 text-stone-800 ${className ?? ''}`}>
        Kedaluwarsa
      </Badge>
    )
  }

  if (status === 'completed') {
    return (
      <Badge variant="default" className={`bg-emerald-700 text-white hover:bg-emerald-800 ${className ?? ''}`}>
        Selesai
      </Badge>
    )
  }

  if (status === 'shipped') {
    return (
      <Badge variant="default" className={`bg-indigo-700 text-white hover:bg-indigo-800 ${className ?? ''}`}>
        Sedang Dikirim
      </Badge>
    )
  }

  if (status === 'processing') {
    return (
      <Badge variant="default" className={`bg-blue-700 text-white hover:bg-blue-800 ${className ?? ''}`}>
        Sedang Diproses
      </Badge>
    )
  }

  // status === 'pending'
  if (paymentStatus === 'proof_submitted') {
    return (
      <Badge variant="secondary" className={`bg-sky-100 text-sky-900 border-sky-300 ${className ?? ''}`}>
        Menunggu Verifikasi Pembayaran
      </Badge>
    )
  }

  if (paymentStatus === 'paid') {
    return (
      <Badge variant="default" className={`bg-emerald-700 text-white hover:bg-emerald-800 ${className ?? ''}`}>
        Pembayaran Terverifikasi
      </Badge>
    )
  }

  if (paymentStatus === 'refunded') {
    return (
      <Badge variant="secondary" className={`bg-stone-200 text-stone-800 ${className ?? ''}`}>
        Dana Dikembalikan
      </Badge>
    )
  }

  return (
    <Badge variant="secondary" className={`bg-amber-100 text-amber-900 border-amber-300 ${className ?? ''}`}>
      Menunggu Pembayaran
    </Badge>
  )
}
