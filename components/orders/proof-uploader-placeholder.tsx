import { UploadCloud, CheckCircle2, AlertCircle } from 'lucide-react'
import type { OrderStatus, PaymentStatus, OrderViewPayment } from '@/services/orders.public.service'
import { formatDateTimeID } from '@/lib/utils/format'

interface ProofUploaderPlaceholderProps {
  orderId: string
  orderNumber: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  latestPayment: OrderViewPayment | null
}

export function ProofUploaderPlaceholder({
  status,
  paymentStatus,
  latestPayment,
}: ProofUploaderPlaceholderProps) {
  // Hanya tampil untuk pesanan pending/unpaid atau yang sudah submit bukti
  if (status !== 'pending') {
    return null
  }

  if (paymentStatus === 'paid') {
    return null
  }

  // Jika bukti sudah dikirim dan menunggu verifikasi
  if (paymentStatus === 'proof_submitted') {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/50 p-5">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 shrink-0 text-sky-700 mt-0.5" />
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-sky-950">Bukti Transfer Sedang Diverifikasi</h4>
            <p className="text-xs text-sky-800 leading-relaxed">
              Bukti transfer berhasil dikirim
              {latestPayment?.submittedAt ? ` pada ${formatDateTimeID(latestPayment.submittedAt)}` : ''}.
              Staf kami sedang memverifikasi dana Anda. Silakan cek berkala status di halaman ini.
            </p>
          </div>
        </div>
      </div>
    )
  }

  // TODO(P7-01): Komponen ProofUploader interaktif (unggah bukti transfer, kompresi canvas, verifikasi signature)
  // diimplementasikan pada Prompt 33 / P7-01.
  return (
    <div className="rounded-xl border border-dashed border-stone-300 bg-stone-50/60 p-6 text-center space-y-3">
      {latestPayment?.reviewNote && (
        <div className="mb-3 rounded-lg border border-red-200 bg-red-50 p-3 text-left flex items-start gap-2.5">
          <AlertCircle className="size-4 shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs text-red-900">
            <span className="font-semibold">Bukti sebelumnya ditolak:</span> {latestPayment.reviewNote}
            <div className="mt-0.5 text-red-700">Silakan unggah ulang bukti transfer yang valid.</div>
          </div>
        </div>
      )}

      <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-stone-100 text-stone-600">
        <UploadCloud className="size-6" />
      </div>

      <div className="space-y-1">
        <h4 className="text-sm font-semibold text-stone-900">Unggah Bukti Transfer</h4>
        <p className="text-xs text-stone-500 max-w-md mx-auto leading-relaxed">
          Setelah menyelesaikan transfer bank, unggah foto bukti transfer (struk ATM / tangkapan layar m-Banking) di sini.
        </p>
      </div>

      <div className="inline-flex items-center gap-1.5 rounded-full bg-stone-200/70 px-3 py-1 text-xs text-stone-600 font-medium">
        <span>Formulir unggah bukti aktif pada tahap berikutnya (P7-01)</span>
      </div>
    </div>
  )
}
