'use server'

import { DB_ERROR_MESSAGES, UNKNOWN_ERROR } from '@/lib/errors'
import { addressSchema } from '@/lib/validations/checkout'
import { getShippingQuote, type ShippingQuote } from '@/services/shipping.service'
import type { ActionResult } from '@/types/action'

/**
 * Pratinjau ongkir untuk UI checkout. Terbuka untuk tamu (D-06) karena hanya membaca tarif publik;
 * ongkir final tetap dihitung ulang oleh `create_order`.
 */
export async function quoteShipping(province: unknown): Promise<ActionResult<ShippingQuote>> {
  const parsed = addressSchema.shape.province.safeParse(province)
  if (!parsed.success) {
    return {
      ok: false,
      error: { code: 'VALIDATION', message: 'Pilih provinsi yang tersedia.', fieldErrors: { province: ['Pilih provinsi yang tersedia.'] } },
    }
  }

  try {
    const quote = await getShippingQuote(parsed.data)
    if (!quote) {
      return { ok: false, error: { code: 'SHIPPING_UNAVAILABLE', message: DB_ERROR_MESSAGES.SHIPPING_UNAVAILABLE } }
    }
    return { ok: true, data: quote }
  } catch {
    return { ok: false, error: { code: UNKNOWN_ERROR, message: 'Ongkir belum dapat dihitung. Coba lagi.' } }
  }
}
