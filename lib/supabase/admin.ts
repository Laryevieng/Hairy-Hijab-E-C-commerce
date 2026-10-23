import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { publicEnv, serverEnv } from '@/lib/env'
import type { Database } from '@/types/database.types'

/**
 * MELEWATI RLS. Hanya boleh diimpor oleh file pada daftar izin §10.5:
 * actions/checkout.actions.ts, actions/payment.actions.ts,
 * services/orders.public.service.ts, dan tests/**.
 */
export function createAdminClient() {
  return createClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv().SUPABASE_SECRET_KEY, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  })
}
