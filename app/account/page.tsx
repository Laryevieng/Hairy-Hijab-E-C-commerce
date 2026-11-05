import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/guards'
import { formatRupiah, formatDateTimeID } from '@/lib/utils/format'
import { OrderStatusBadge } from '@/components/orders/order-status-badge'

export const instant = false

export default async function AccountPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const [{ data: profile }, { data: addresses }, { data: recentOrders }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase.from('addresses').select('id, label, recipient_name, city, province, is_default').eq('user_id', user.id).order('is_default', { ascending: false }),
    supabase.from('orders').select('id, order_number, status, payment_status, grand_total, created_at').eq('user_id', user.id).order('created_at', { ascending: false }).limit(3),
  ])

  return (
    <div className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <section className="rounded-lg border border-sand bg-white/50 p-6">
          <h2 className="font-heading text-2xl">Profil</h2>
          <p className="mt-3">{profile?.full_name || 'Nama belum diisi'}</p>
          <p className="text-sm text-muted-foreground">{profile?.phone || 'Telepon belum diisi'}</p>
          <Link className="mt-5 inline-block text-sm underline" href="/account/profile">Kelola profil</Link>
        </section>
        <section className="rounded-lg border border-sand bg-white/50 p-6">
          <h2 className="font-heading text-2xl">Alamat tersimpan</h2>
          {addresses?.length ? <ul className="mt-3 space-y-2">{addresses.map((address) => (
            <li key={address.id} className="text-sm">{address.label || address.recipient_name} — {address.city}, {address.province}{address.is_default ? ' (utama)' : ''}</li>
          ))}</ul> : <p className="mt-3 text-sm text-muted-foreground">Belum ada alamat tersimpan.</p>}
          <Link className="mt-5 inline-block text-sm underline" href="/account/addresses">Kelola alamat</Link>
        </section>
      </div>

      <section className="rounded-lg border border-sand bg-white/50 p-6">
        <div className="flex items-center justify-between border-b border-sand pb-3">
          <h2 className="font-heading text-2xl">Pesanan terbaru</h2>
          <Link className="text-sm underline hover:text-espresso" href="/account/orders">
            Lihat semua pesanan
          </Link>
        </div>
        {recentOrders?.length ? (
          <div className="divide-y divide-sand/50">
            {recentOrders.map((order) => (
              <div key={order.id} className="flex flex-wrap items-center justify-between gap-3 py-3.5 first:pt-3 last:pb-0">
                <div className="space-y-0.5">
                  <Link href={`/orders/${order.order_number}`} className="font-mono text-sm font-bold hover:underline">
                    {order.order_number}
                  </Link>
                  <p className="text-xs text-muted-foreground">{formatDateTimeID(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} paymentStatus={order.payment_status} />
                  <span className="font-mono text-sm font-bold text-espresso">{formatRupiah(order.grand_total)}</span>
                  <Link href={`/orders/${order.order_number}`} className="text-xs underline text-espresso font-medium">
                    Rincian
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">Belum ada riwayat pesanan.</p>
        )}
      </section>
    </div>
  )
}
