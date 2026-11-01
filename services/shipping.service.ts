import 'server-only'

import { createPublicClient } from '@/lib/supabase/public'

export const DEFAULT_SHIPPING_PROVINCE = '*'

export interface ShippingQuote {
  cost: number
  label: string
  estimatedDays: string | null
}

/**
 * Tarif ongkir untuk satu provinsi dengan aturan yang sama seperti `create_order`:
 * baris aktif yang provinsinya cocok (tanpa beda huruf besar, setelah trim) lebih dulu,
 * lalu baris default `*`. `null` bila tidak ada tarif aktif (→ SHIPPING_UNAVAILABLE).
 */
export async function getShippingQuote(province: string): Promise<ShippingQuote | null> {
  const wanted = province.trim().toLowerCase()
  if (!wanted) return null

  // Tabel kecil (≤ 1 baris per provinsi); dicocokkan di sini agar sama persis dengan lower() di SQL
  // tanpa perlu meng-escape wildcard ILIKE.
  const { data, error } = await createPublicClient()
    .from('shipping_rates')
    .select('province, label, cost, estimated_days')
    .eq('is_active', true)
  if (error) throw new Error('Tarif ongkir tidak dapat dimuat.')

  const rate =
    data.find((row) => row.province !== DEFAULT_SHIPPING_PROVINCE && row.province.toLowerCase() === wanted) ??
    data.find((row) => row.province === DEFAULT_SHIPPING_PROVINCE)
  if (!rate) return null

  return { cost: rate.cost, label: rate.label, estimatedDays: rate.estimated_days }
}
