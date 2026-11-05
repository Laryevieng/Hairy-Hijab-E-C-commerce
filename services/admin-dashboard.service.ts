import 'server-only'

import { createClient } from '@/lib/supabase/server'

export interface DashboardSummary {
  waitingVerification: number
  needsShipping: number
  waitingPayment: number
  lowStock: number
  lowStockThreshold: number
  revenue7Days: number
  revenue30Days: number
}

export interface RevenueOrder {
  grand_total: number
  paid_at: string | null
}

/**
 * Fungsi murni untuk menghitung omzet 7 dan 30 hari dari daftar pesanan terbayar.
 * Mengabaikan pesanan tanpa paid_at.
 */
export function calculateRevenueFromOrders(
  orders: RevenueOrder[],
  referenceDate: Date = new Date()
): { revenue7Days: number; revenue30Days: number } {
  const sevenDaysAgo = new Date(referenceDate.getTime() - 7 * 24 * 60 * 60 * 1000)
  const thirtyDaysAgo = new Date(referenceDate.getTime() - 30 * 24 * 60 * 60 * 1000)

  let revenue7Days = 0
  let revenue30Days = 0

  for (const order of orders) {
    if (!order.paid_at) continue
    const paidAtDate = new Date(order.paid_at)
    const amount = typeof order.grand_total === 'number' && !isNaN(order.grand_total)
      ? Math.round(order.grand_total)
      : 0

    if (paidAtDate >= thirtyDaysAgo) {
      revenue30Days += amount
      if (paidAtDate >= sevenDaysAgo) {
        revenue7Days += amount
      }
    }
  }

  return { revenue7Days, revenue30Days }
}

/**
 * Mengambil ringkasan metrik dashboard admin.
 * Memanfaatkan klien sesi dengan RLS (policy is_staff()).
 */
export async function getAdminDashboardSummary(): Promise<DashboardSummary> {
  const supabase = await createClient()

  // 1. Pesanan menunggu verifikasi bukti pembayaran (proof_submitted)
  const waitingVerificationPromise = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('payment_status', 'proof_submitted')

  // 2. Pesanan perlu dikirim (processing)
  const needsShippingPromise = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'processing')

  // 3. Pesanan menunggu pembayaran (pending + unpaid)
  const waitingPaymentPromise = supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')
    .eq('payment_status', 'unpaid')

  // 4. Ambang batas stok menipis dari pengaturan toko
  const storeSettingsPromise = supabase
    .from('store_settings')
    .select('low_stock_threshold')
    .limit(1)
    .maybeSingle()

  // 5. Pesanan terbayar dalam 30 hari terakhir untuk kalkulasi omzet (tidak termasuk cancelled)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const paidOrdersPromise = supabase
    .from('orders')
    .select('grand_total, paid_at')
    .eq('payment_status', 'paid')
    .neq('status', 'cancelled')
    .not('paid_at', 'is', null)
    .gte('paid_at', thirtyDaysAgo.toISOString())

  const [
    waitingVerificationRes,
    needsShippingRes,
    waitingPaymentRes,
    storeSettingsRes,
    paidOrdersRes,
  ] = await Promise.all([
    waitingVerificationPromise,
    needsShippingPromise,
    waitingPaymentPromise,
    storeSettingsPromise,
    paidOrdersPromise,
  ])

  const lowStockThreshold = storeSettingsRes.data?.low_stock_threshold ?? 5

  // 6. Varian aktif dengan stok menipis (stock_quantity <= low_stock_threshold)
  const lowStockRes = await supabase
    .from('product_variants')
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)
    .lte('stock_quantity', lowStockThreshold)

  const { revenue7Days, revenue30Days } = calculateRevenueFromOrders(
    paidOrdersRes.data ?? []
  )

  return {
    waitingVerification: waitingVerificationRes.count ?? 0,
    needsShipping: needsShippingRes.count ?? 0,
    waitingPayment: waitingPaymentRes.count ?? 0,
    lowStock: lowStockRes.count ?? 0,
    lowStockThreshold,
    revenue7Days,
    revenue30Days,
  }
}
