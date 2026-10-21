/**
 * Label bahasa Indonesia untuk status pesanan dan status pembayaran.
 * Enum values sesuai §9.3 dan §9.4.
 */

/** Status pesanan (orders.status) — §9.3 */
export const ORDER_STATUS_LABELS = {
  pending: 'Menunggu Pembayaran',
  processing: 'Sedang Diproses',
  shipped: 'Dikirim',
  completed: 'Selesai',
  cancelled: 'Dibatalkan',
  expired: 'Kedaluwarsa',
} as const

export type OrderStatus = keyof typeof ORDER_STATUS_LABELS

/** Status pembayaran (orders.payment_status) — §9.4 */
export const PAYMENT_STATUS_LABELS = {
  unpaid: 'Belum Dibayar',
  proof_submitted: 'Bukti Dikirim',
  paid: 'Sudah Dibayar',
  refunded: 'Dikembalikan',
} as const

export type PaymentStatus = keyof typeof PAYMENT_STATUS_LABELS
