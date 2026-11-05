import type { Metadata } from 'next'
import Link from 'next/link'
import { ShoppingBag, ChevronRight, Package } from 'lucide-react'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/guards'
import { formatRupiah, formatDateTimeID } from '@/lib/utils/format'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'
import { EmptyState } from '@/components/common/empty-state'
import { Pagination } from '@/components/product/pagination'
import { Button } from '@/components/ui/button'

export const metadata: Metadata = {
  title: 'Pesanan Saya | Hairy Hijab',
  description: 'Riwayat pesanan dan status pengiriman akun Hairy Hijab Anda.',
  robots: {
    index: false,
    follow: false,
  },
}

interface OrdersPageProps {
  searchParams: Promise<{ page?: string }>
}

const PAGE_SIZE = 10

export default async function AccountOrdersPage({ searchParams }: OrdersPageProps) {
  const user = await requireUser()
  const { page: pageParam } = await searchParams

  const page = Math.max(1, parseInt(pageParam || '1', 10) || 1)
  const from = (page - 1) * PAGE_SIZE
  const to = from + PAGE_SIZE - 1

  const supabase = await createClient()

  // Query orders milik user_id via klien sesi ber-RLS (§11.7)
  const { data: orders, count } = await supabase
    .from('orders')
    .select(
      'id, order_number, created_at, status, payment_status, grand_total, subtotal, shipping_cost, order_items(id, product_name_snapshot, quantity, unit_price, line_total, color_snapshot, size_snapshot)',
      { count: 'exact' }
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(from, to)

  const orderList = orders ?? []
  const totalCount = count ?? 0

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-sand pb-4">
        <div>
          <h2 className="font-heading text-3xl text-espresso">Pesanan Saya</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Riwayat belanja dan pemantauan status pesanan Anda.
          </p>
        </div>
        {totalCount > 0 && (
          <span className="text-xs font-medium text-espresso/70 bg-sand/40 px-3 py-1 rounded-full self-start sm:self-auto">
            Total {totalCount} pesanan
          </span>
        )}
      </div>

      {orderList.length === 0 ? (
        <EmptyState
          title="Belum Ada Pesanan"
          description="Anda belum pernah melakukan pemesanan produk di Hairy Hijab."
          icon={<ShoppingBag className="size-7" />}
          actionLabel="Mulai Belanja"
          actionHref="/products"
        />
      ) : (
        <div className="space-y-4">
          <div className="divide-y divide-sand rounded-xl border border-sand bg-white/70 shadow-xs">
            {orderList.map((order) => {
              const items = order.order_items ?? []
              const totalItemsCount = items.reduce((acc, it) => acc + (it.quantity || 0), 0)

              return (
                <article
                  key={order.id}
                  className="p-5 sm:p-6 transition-colors hover:bg-sand/10 space-y-4"
                  aria-labelledby={`order-title-${order.order_number}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-sand/40 pb-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2.5">
                        <Link
                          id={`order-title-${order.order_number}`}
                          href={`/orders/${order.order_number}`}
                          className="font-mono text-base font-bold text-espresso hover:underline"
                        >
                          {order.order_number}
                        </Link>
                        <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Dipesan pada {formatDateTimeID(order.created_at)}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-xs text-muted-foreground block">Total Tagihan</span>
                      <span className="font-mono text-base font-extrabold text-espresso">
                        {formatRupiah(order.grand_total)}
                      </span>
                    </div>
                  </div>

                  {/* Ringkasan Item Pesanan */}
                  <div className="space-y-1.5 text-xs text-espresso/80">
                    <div className="flex items-center gap-1.5 font-medium text-espresso/90">
                      <Package className="size-3.5 text-espresso/60" />
                      <span>{totalItemsCount} produk dipesan:</span>
                    </div>
                    <ul className="pl-5 list-disc space-y-0.5 text-muted-foreground">
                      {items.slice(0, 3).map((it) => (
                        <li key={it.id}>
                          <span className="text-espresso font-medium">{it.product_name_snapshot}</span>
                          {it.color_snapshot && ` • ${it.color_snapshot}`}
                          {it.size_snapshot && ` • ${it.size_snapshot}`}
                          <span className="text-espresso/70 ml-1">× {it.quantity}</span>
                        </li>
                      ))}
                      {items.length > 3 && (
                        <li className="list-none text-espresso/60 italic pt-0.5">
                          + {items.length - 3} produk lainnya...
                        </li>
                      )}
                    </ul>
                  </div>

                  <div className="pt-2 flex justify-end">
                    <Button asChild variant="outline" size="sm" className="gap-1.5 text-xs">
                      <Link href={`/orders/${order.order_number}`}>
                        Lihat Rincian Pesanan
                        <ChevronRight className="size-3.5" />
                      </Link>
                    </Button>
                  </div>
                </article>
              )
            })}
          </div>

          <Pagination
            page={page}
            pageSize={PAGE_SIZE}
            count={totalCount}
            pathname="/account/orders"
            searchParams=""
            ariaLabel="Navigasi halaman pesanan akun"
          />
        </div>
      )}
    </div>
  )
}
