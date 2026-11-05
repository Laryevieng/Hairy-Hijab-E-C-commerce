import 'server-only'

import { createPublicClient } from '@/lib/supabase/public'

/**
 * Mengambil nomor WhatsApp kontak resmi toko dari tabel `store_settings`.
 * Mengembalikan `null` jika belum diatur atau kosong.
 */
export async function getStoreContactWhatsApp(): Promise<string | null> {
  const { data, error } = await createPublicClient()
    .from('store_settings')
    .select('contact_whatsapp')
    .eq('id', 1)
    .maybeSingle()

  if (error || !data?.contact_whatsapp) {
    return null
  }

  const trimmed = data.contact_whatsapp.trim()
  return trimmed || null
}
