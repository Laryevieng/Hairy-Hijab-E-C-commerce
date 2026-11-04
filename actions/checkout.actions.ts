'use server'

import { getCurrentUser } from '@/lib/auth/guards'
import { DB_ERROR_MESSAGES, UNKNOWN_ERROR } from '@/lib/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import { addressSchema, checkoutSchema } from '@/lib/validations/checkout'
import { createOrderFromCheckout } from '@/services/orders.service'
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

/**
 * Aksi Server `placeOrder` (P6-05):
 * 1. Menentukan user_id dari sesi via getCurrentUser() (tidak pernah dari input untuk mencegah peniruan).
 * 2. Memvalidasi payload checkout via checkoutSchema Zod.
 * 3. Membuka admin client (diizinkan pada whitelist §10.5) dan mendelegasikan ke orders.service.ts.
 * 4. publicToken HANYA dikembalikan untuk tamu (D-06); pengguna login melihat pesanan lewat sesi akun.
 * Dilarang mencatat PII atau token di log.
 */
export async function placeOrder(
  input: unknown
): Promise<ActionResult<{ orderNumber: string; publicToken?: string }>> {
  let user: { id: string } | null = null
  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }

  const parsed = checkoutSchema.safeParse(input)
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const path = issue.path.join('.')
      if (!fieldErrors[path]) {
        fieldErrors[path] = []
      }
      fieldErrors[path].push(issue.message)
    }
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: 'Data pesanan tidak valid. Periksa kembali formulir.',
        fieldErrors,
      },
    }
  }

  try {
    const adminClient = createAdminClient()
    const result = await createOrderFromCheckout(adminClient, parsed.data, user?.id ?? null)

    if (!result.ok) {
      return result
    }

    return {
      ok: true,
      data: {
        orderNumber: result.data.orderNumber,
        ...(user ? {} : { publicToken: result.data.publicToken }),
      },
    }
  } catch {
    return {
      ok: false,
      error: {
        code: UNKNOWN_ERROR,
        message: 'Terjadi gangguan saat memproses pesanan. Silakan coba lagi.',
      },
    }
  }
}
