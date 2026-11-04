import 'server-only'

import type { SupabaseClient } from '@supabase/supabase-js'
import { mapDbError } from '@/lib/errors'
import type { CheckoutData } from '@/lib/validations/checkout'
import type { ActionResult } from '@/types/action'
import type { Database, Json } from '@/types/database.types'

export interface CreatedOrder {
  orderId: string
  orderNumber: string
  publicToken: string
  replayed: boolean
}

/**
 * Service pembuatan pesanan dari proses checkout.
 * Mematuhi §10.5: menerima klien Supabase sebagai argumen (dibuat di action dengan admin client)
 * agar file service tidak mengimpor lib/supabase/admin secara langsung.
 */
export async function createOrderFromCheckout(
  client: SupabaseClient<Database>,
  input: CheckoutData,
  userId?: string | null
): Promise<ActionResult<CreatedOrder>> {
  // 1. Periksa store_settings.bank_accounts tidak kosong (§14.1)
  const { data: settings, error: settingsError } = await client
    .from('store_settings')
    .select('bank_accounts')
    .eq('id', 1)
    .maybeSingle()

  if (settingsError) {
    return {
      ok: false,
      error: {
        code: 'UNKNOWN',
        message: 'Pengaturan toko tidak dapat dimuat. Coba lagi.',
      },
    }
  }

  const bankAccounts = settings?.bank_accounts
  if (!Array.isArray(bankAccounts) || bankAccounts.length === 0) {
    return {
      ok: false,
      error: {
        code: 'PAYMENT_UNAVAILABLE',
        message: 'Metode pembayaran belum tersedia. Hubungi kami.',
      },
    }
  }

  // 2. Susun parameter untuk fungsi create_order di PostgreSQL
  const rpcArgs = {
    p_idempotency_key: input.idempotencyKey,
    p_user_id: (userId ?? null) as unknown as string,
    p_customer_name: input.customer.name,
    p_customer_phone: input.customer.phone,
    p_customer_email: input.customer.email ?? '',
    p_shipping_address: {
      recipient_name: input.customer.name,
      phone: input.customer.phone,
      province: input.address.province,
      city: input.address.city,
      district: input.address.district,
      postal_code: input.address.postalCode,
      address_detail: input.address.addressDetail,
    } as Json,
    p_items: input.items.map((item) => ({
      variant_id: item.variantId,
      quantity: item.quantity,
    })) as Json,
    p_notes: input.notes ?? undefined,
  }

  try {
    let { data, error } = await client.rpc('create_order', rpcArgs)

    // 3. Coba ulang SEKALI bila SQLSTATE 23505 (race condition idempotency_key)
    if (
      error &&
      (error.code === '23505' ||
        `${error.message} ${error.details ?? ''}`.includes('23505') ||
        `${error.message} ${error.details ?? ''}`.includes('idempotency_key'))
    ) {
      const retry = await client.rpc('create_order', rpcArgs)
      data = retry.data
      error = retry.error
    }

    if (error) {
      const mapped = mapDbError(error)
      return {
        ok: false,
        error: {
          code: mapped.code,
          message: mapped.message,
        },
      }
    }

    const raw = data as Record<string, unknown> | null
    if (
      !raw ||
      typeof raw.order_number !== 'string' ||
      typeof raw.order_id !== 'string' ||
      typeof raw.public_token !== 'string'
    ) {
      return {
        ok: false,
        error: {
          code: 'UNKNOWN',
          message: 'Gagal membuat pesanan. Silakan coba lagi.',
        },
      }
    }

    return {
      ok: true,
      data: {
        orderId: raw.order_id,
        orderNumber: raw.order_number,
        publicToken: raw.public_token,
        replayed: Boolean(raw.replayed),
      },
    }
  } catch (err) {
    const mapped = mapDbError(err)
    return {
      ok: false,
      error: {
        code: mapped.code,
        message: mapped.message,
      },
    }
  }
}
