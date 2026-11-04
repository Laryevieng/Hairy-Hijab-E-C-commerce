import { CheckCircle2, Circle, Clock, XCircle, AlertTriangle } from 'lucide-react'
import type { OrderStatus, PaymentStatus, OrderViewHistory } from '@/services/orders.public.service'
import { formatDateTimeID } from '@/lib/utils/format'

interface OrderTimelineProps {
  status: OrderStatus
  paymentStatus: PaymentStatus
  createdAt: string
  paidAt: string | null
  shippedAt: string | null
  cancelReason: string | null
  statusHistory: OrderViewHistory[]
}

interface StepItem {
  id: string
  title: string
  description?: string
  date?: string | null
  isCompleted: boolean
  isCurrent: boolean
  isFailed?: boolean
}

export function OrderTimeline({
  status,
  paymentStatus,
  createdAt,
  paidAt,
  shippedAt,
  cancelReason,
  statusHistory,
}: OrderTimelineProps) {
  // Bila dibatalkan atau kedaluwarsa, tampilkan alert ringkas dan status
  if (status === 'cancelled') {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50/60 p-4">
        <div className="flex items-start gap-3">
          <XCircle className="mt-0.5 size-5 shrink-0 text-red-600" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-red-900">Pesanan Dibatalkan</h4>
            <p className="text-sm text-red-700">
              {cancelReason ? `Alasan: ${cancelReason}` : 'Pesanan ini telah dibatalkan oleh staf toko.'}
            </p>
            <p className="text-xs text-red-600/80">Dibuat pada: {formatDateTimeID(createdAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'expired') {
    return (
      <div className="rounded-lg border border-stone-200 bg-stone-50 p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-600" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-stone-900">Pesanan Kedaluwarsa</h4>
            <p className="text-sm text-stone-600">
              Batas waktu transfer telah lewat tanpa konfirmasi pembayaran. Stok produk yang dipesan telah dikembalikan ke katalog.
            </p>
            <p className="text-xs text-stone-500">Dibuat pada: {formatDateTimeID(createdAt)}</p>
          </div>
        </div>
      </div>
    )
  }

  // Cari timestamp dari statusHistory bila ada
  const paidHistoryDate = statusHistory.find((h) => h.toPaymentStatus === 'paid')?.createdAt ?? paidAt
  const processingHistoryDate = statusHistory.find((h) => h.toStatus === 'processing')?.createdAt
  const shippedHistoryDate = statusHistory.find((h) => h.toStatus === 'shipped')?.createdAt ?? shippedAt
  const completedHistoryDate = statusHistory.find((h) => h.toStatus === 'completed')?.createdAt

  // Tentukan state tiap step
  // 1. Pesanan Dibuat
  const step1: StepItem = {
    id: 'created',
    title: 'Pesanan Dibuat',
    description: 'Menunggu pembayaran transfer bank.',
    date: createdAt,
    isCompleted: true,
    isCurrent: status === 'pending' && paymentStatus === 'unpaid',
  }

  // 2. Pembayaran
  let paymentTitle = 'Pembayaran'
  let paymentDesc = 'Menunggu transfer dari pembeli.'

  if (paymentStatus === 'proof_submitted') {
    paymentTitle = 'Bukti Ditinjau'
    paymentDesc = 'Bukti transfer diunggah, menunggu verifikasi staf.'
  } else if (paymentStatus === 'paid') {
    paymentTitle = 'Pembayaran Diverifikasi'
    paymentDesc = 'Pembayaran telah diterima dan diverifikasi.'
  }

  const isPaymentDone = paymentStatus === 'paid'
  const step2: StepItem = {
    id: 'payment',
    title: paymentTitle,
    description: paymentDesc,
    date: paidHistoryDate,
    isCompleted: isPaymentDone,
    isCurrent: status === 'pending' && paymentStatus === 'proof_submitted',
  }

  // 3. Diproses
  const isProcessingDone = ['shipped', 'completed'].includes(status)
  const isProcessingCurrent = status === 'processing'
  const step3: StepItem = {
    id: 'processing',
    title: 'Pesanan Diproses',
    description: 'Barang sedang disiapkan dan dikemas.',
    date: processingHistoryDate,
    isCompleted: isProcessingDone,
    isCurrent: isProcessingCurrent,
  }

  // 4. Dikirim
  const isShippedDone = status === 'completed'
  const isShippedCurrent = status === 'shipped'
  const step4: StepItem = {
    id: 'shipped',
    title: 'Sedang Dikirim',
    description: 'Paket telah diserahkan ke jasa kurir.',
    date: shippedHistoryDate,
    isCompleted: isShippedDone,
    isCurrent: isShippedCurrent,
  }

  // 5. Selesai
  const isCompletedDone = status === 'completed'
  const step5: StepItem = {
    id: 'completed',
    title: 'Pesanan Selesai',
    description: 'Pesanan telah diterima oleh pembeli.',
    date: completedHistoryDate,
    isCompleted: isCompletedDone,
    isCurrent: isCompletedDone,
  }

  const steps = [step1, step2, step3, step4, step5]

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-semibold tracking-wide text-stone-900 uppercase">Status & Riwayat</h3>
      <ol className="relative border-l border-stone-200 ml-3 space-y-6">
        {steps.map((step) => {
          let Icon = Circle
          let dotClass = 'border-stone-300 bg-white text-stone-400'

          if (step.isCompleted) {
            Icon = CheckCircle2
            dotClass = 'border-emerald-600 bg-emerald-600 text-white'
          } else if (step.isCurrent) {
            Icon = Clock
            dotClass = 'border-amber-600 bg-amber-50 text-amber-600 ring-4 ring-amber-100'
          }

          return (
            <li key={step.id} className="ml-6">
              <span
                className={`absolute -left-3.5 flex size-7 items-center justify-center rounded-full border ${dotClass}`}
                aria-hidden="true"
              >
                <Icon className="size-4" />
              </span>
              <div className="flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1">
                <h4
                  className={`text-sm font-medium ${
                    step.isCurrent
                      ? 'font-semibold text-stone-900'
                      : step.isCompleted
                        ? 'text-stone-800'
                        : 'text-stone-400'
                  }`}
                >
                  {step.title}
                </h4>
                {step.date && (
                  <span className="text-xs text-stone-500">{formatDateTimeID(step.date)}</span>
                )}
              </div>
              {step.description && (
                <p className="mt-0.5 text-xs text-stone-500 leading-relaxed">{step.description}</p>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
