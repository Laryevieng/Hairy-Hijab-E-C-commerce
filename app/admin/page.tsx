import Link from 'next/link'
import {
  FileText,
  Truck,
  Clock,
  AlertTriangle,
  TrendingUp,
  Wallet,
  ArrowRight,
} from 'lucide-react'
import { requireStaff } from '@/lib/auth/guards'
import { getAdminDashboardSummary } from '@/services/admin-dashboard.service'
import { formatRupiah } from '@/lib/utils/format'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils/cn'

export const instant = false

export default async function AdminDashboardPage() {
  const { user, role } = await requireStaff()
  const summary = await getAdminDashboardSummary()

  const metricCards = [
    {
      title: 'Menunggu Verifikasi',
      value: summary.waitingVerification,
      formattedValue: String(summary.waitingVerification),
      unit: 'pesanan',
      description: 'Bukti transfer diunggah pelanggan',
      href: '/admin/orders?payment_status=proof_submitted',
      icon: FileText,
      badgeText: summary.waitingVerification > 0 ? 'Perlu tindakan' : undefined,
      badgeVariant: 'warning' as const,
      highlight: summary.waitingVerification > 0,
    },
    {
      title: 'Perlu Dikirim',
      value: summary.needsShipping,
      formattedValue: String(summary.needsShipping),
      unit: 'pesanan',
      description: 'Pesanan terbayar siap dikirim',
      href: '/admin/orders?status=processing',
      icon: Truck,
      badgeText: summary.needsShipping > 0 ? 'Siap kirim' : undefined,
      badgeVariant: 'default' as const,
      highlight: summary.needsShipping > 0,
    },
    {
      title: 'Menunggu Pembayaran',
      value: summary.waitingPayment,
      formattedValue: String(summary.waitingPayment),
      unit: 'pesanan',
      description: 'Pesanan belum bayar (pending & unpaid)',
      href: '/admin/orders?status=pending&payment_status=unpaid',
      icon: Clock,
      badgeText: undefined,
      badgeVariant: 'secondary' as const,
      highlight: false,
    },
    {
      title: 'Stok Menipis',
      value: summary.lowStock,
      formattedValue: String(summary.lowStock),
      unit: 'varian',
      description: `Varian aktif stok ≤ ${summary.lowStockThreshold}`,
      href: '/admin/inventory?filter=low_stock',
      icon: AlertTriangle,
      badgeText: summary.lowStock > 0 ? 'Perlu restock' : undefined,
      badgeVariant: 'destructive' as const,
      highlight: summary.lowStock > 0,
    },
    {
      title: 'Omzet 7 Hari',
      value: summary.revenue7Days,
      formattedValue: formatRupiah(summary.revenue7Days),
      unit: '',
      description: 'Total pesanan terbayar 7 hari terakhir',
      href: '/admin/orders',
      icon: TrendingUp,
      badgeText: undefined,
      badgeVariant: 'secondary' as const,
      highlight: false,
    },
    {
      title: 'Omzet 30 Hari',
      value: summary.revenue30Days,
      formattedValue: formatRupiah(summary.revenue30Days),
      unit: '',
      description: 'Total pesanan terbayar 30 hari terakhir',
      href: '/admin/orders',
      icon: Wallet,
      badgeText: undefined,
      badgeVariant: 'secondary' as const,
      highlight: false,
    },
  ]

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-espresso">
            Dashboard Operasional
          </h1>
          <p className="text-sm text-espresso/70 mt-1">
            Selamat datang, <span className="font-semibold text-espresso">{user.email ?? 'Staf'}</span>
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Badge
            variant={role === 'admin' ? 'default' : 'secondary'}
            className="capitalize text-xs px-3 py-1"
          >
            Akses: {role === 'admin' ? 'Administrator' : 'Staf Operasional'}
          </Badge>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <section aria-labelledby="metrics-heading">
        <h2 id="metrics-heading" className="sr-only">
          Ringkasan Metrik Toko
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {metricCards.map((card, idx) => {
            const Icon = card.icon
            return (
              <Link
                key={idx}
                href={card.href}
                className={cn(
                  'group relative block rounded-lg border bg-ivory p-6 shadow-xs transition-all hover:shadow-md hover:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep',
                  card.highlight
                    ? 'border-sand/90 bg-sand/10'
                    : 'border-sand'
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-medium text-espresso/80 truncate">
                    {card.title}
                  </span>
                  <div
                    className={cn(
                      'flex h-9 w-9 items-center justify-center rounded-lg transition-colors',
                      card.highlight
                        ? 'bg-espresso text-ivory'
                        : 'bg-sand/30 text-espresso group-hover:bg-espresso group-hover:text-ivory'
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </div>
                </div>

                <div className="mt-4 flex items-baseline gap-2">
                  <span className="text-2xl md:text-3xl font-bold tracking-tight text-espresso font-serif">
                    {card.formattedValue}
                  </span>
                  {card.unit && (
                    <span className="text-xs text-taupe font-sans font-medium">
                      {card.unit}
                    </span>
                  )}
                </div>

                <div className="mt-2 flex items-center justify-between text-xs text-espresso/70">
                  <p className="truncate pr-2">{card.description}</p>
                  <ArrowRight className="h-3.5 w-3.5 shrink-0 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all text-gold-deep" />
                </div>

                {card.badgeText && (
                  <div className="mt-3 pt-3 border-t border-sand/50">
                    <span className="inline-flex items-center text-[11px] font-semibold text-gold-deep">
                      • {card.badgeText}
                    </span>
                  </div>
                )}
              </Link>
            )
          })}
        </div>
      </section>

      {/* Quick Action Shortcuts */}
      <section
        aria-labelledby="quick-actions-heading"
        className="rounded-lg border border-sand bg-sand/15 p-6"
      >
        <h2 id="quick-actions-heading" className="text-base font-serif font-bold text-espresso">
          Pintasan Cepat
        </h2>
        <p className="text-xs text-espresso/70 mt-0.5">
          Akses cepat ke modul manajemen harian toko
        </p>

        <div className="mt-4 flex flex-wrap gap-2.5">
          <Link
            href="/admin/orders?payment_status=proof_submitted"
            className="inline-flex items-center gap-1.5 rounded-md border border-sand bg-ivory px-3.5 py-2 text-xs font-semibold text-espresso hover:bg-sand/30 hover:border-espresso transition-colors"
          >
            <FileText className="h-3.5 w-3.5 text-gold-deep" />
            <span>Periksa Bukti Transfer</span>
          </Link>

          <Link
            href="/admin/orders?status=processing"
            className="inline-flex items-center gap-1.5 rounded-md border border-sand bg-ivory px-3.5 py-2 text-xs font-semibold text-espresso hover:bg-sand/30 hover:border-espresso transition-colors"
          >
            <Truck className="h-3.5 w-3.5 text-gold-deep" />
            <span>Kelola Pengiriman</span>
          </Link>

          <Link
            href="/admin/inventory"
            className="inline-flex items-center gap-1.5 rounded-md border border-sand bg-ivory px-3.5 py-2 text-xs font-semibold text-espresso hover:bg-sand/30 hover:border-espresso transition-colors"
          >
            <AlertTriangle className="h-3.5 w-3.5 text-gold-deep" />
            <span>Cek Stok Inventori</span>
          </Link>
        </div>
      </section>
    </div>
  )
}
