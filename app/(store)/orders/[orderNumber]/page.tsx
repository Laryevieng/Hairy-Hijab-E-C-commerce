import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { ChevronRight } from 'lucide-react'
import { getOrderForViewer } from '@/services/orders.public.service'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { OrderTimeline } from '@/components/orders/order-timeline'
import { PaymentInstructions } from '@/components/orders/payment-instructions'
import { ProofUploaderPlaceholder } from '@/components/orders/proof-uploader-placeholder'
import { OrderItemsList } from '@/components/orders/order-items-list'
import { formatDateTimeID } from '@/lib/utils/format'

interface PageProps {
  params: Promise<{ orderNumber: string }>
  searchParams: Promise<{ token?: string }>
}

export async function generateMetadata({ params }: { params: Promise<{ orderNumber: string }> }): Promise<Metadata> {
  const { orderNumber } = await params
  return {
    title: `Pesanan ${orderNumber} | Hairy Hijab`,
    description: `Status dan rincian pesanan ${orderNumber} Hairy Hijab.`,
    robots: {
      index: false,
      follow: false,
    },
    referrer: 'no-referrer',
  }
}

export default async function OrderDetailPage({ params, searchParams }: PageProps) {
  const { orderNumber } = await params
  const { token } = await searchParams

  const order = await getOrderForViewer({ orderNumber, token })

  if (!order) {
    notFound()
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Breadcrumb sederhana */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-stone-500">
        <Link href="/" className="hover:text-stone-900 transition-colors">
          Beranda
        </Link>
        <ChevronRight className="size-3 text-stone-400" />
        {order.isViewerOwner ? (
          <>
            <Link href="/account" className="hover:text-stone-900 transition-colors">
              Akun Saya
            </Link>
            <ChevronRight className="size-3 text-stone-400" />
          </>
        ) : null}
        <span className="font-semibold text-stone-900">Pesanan {order.orderNumber}</span>
      </nav>

      {/* Header Pesanan */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-stone-200 pb-6">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-stone-950 font-mono">
              {order.orderNumber}
            </h1>
            <OrderStatusBadge status={order.status} paymentStatus={order.paymentStatus} />
          </div>
          <p className="text-xs sm:text-sm text-stone-500">
            Dibuat pada {formatDateTimeID(order.createdAt)} • Atas nama{' '}
            <span className="font-medium text-stone-700">{order.customer.name}</span>
          </p>
        </div>

        {/* TODO(P7-02): Tombol WhatsApp akan ditambahkan di sini pada Prompt 34 / P7-02 */}
      </div>

      {/* Grid Konten: Kiri (Instruksi, Bukti, Timeline) & Kanan (Rincian Produk, Alamat, Total) */}
      <div className="grid gap-8 lg:grid-cols-[1fr_24rem] lg:items-start">
        <div className="space-y-6">
          {/* Instruksi Pembayaran */}
          <PaymentInstructions
            grandTotal={order.grandTotal}
            bankAccounts={order.bankAccounts}
            status={order.status}
            paymentStatus={order.paymentStatus}
            expiresAt={order.expiresAt}
          />

          {/* Area Unggah Bukti Transfer */}
          <ProofUploaderPlaceholder
            orderId={order.id}
            orderNumber={order.orderNumber}
            status={order.status}
            paymentStatus={order.paymentStatus}
            latestPayment={order.latestPayment}
          />

          {/* Timeline Status Pesanan */}
          <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs">
            <OrderTimeline
              status={order.status}
              paymentStatus={order.paymentStatus}
              createdAt={order.createdAt}
              paidAt={order.paidAt}
              shippedAt={order.shippedAt}
              cancelReason={order.cancelReason}
              statusHistory={order.statusHistory}
            />
          </div>
        </div>

        {/* Kolom Kanan: Rincian Produk, Biaya, Resi, dan Alamat */}
        <aside aria-label="Rincian Pesanan">
          <OrderItemsList order={order} />
        </aside>
      </div>
    </div>
  )
}
