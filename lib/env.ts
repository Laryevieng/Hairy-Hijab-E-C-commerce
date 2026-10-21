import { z } from 'zod'

/**
 * Variabel publik — bisa diakses di klien dan server.
 * Divalidasi saat modul pertama kali dimuat.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

/**
 * Variabel server — hanya diakses di kode server.
 * Divalidasi secara lazy saat `serverEnv()` dipanggil pertama kali.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
})

// --- Public env: validated eagerly at import time ---

function validatePublicEnv() {
  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  if (!result.success) {
    throw new Error(
      `❌ Invalid public environment variables:\n${JSON.stringify(result.error.issues, null, 2)}`
    )
  }
  return result.data
}

export const publicEnv = validatePublicEnv()

// --- Server env: validated lazily on first access ---

let _serverEnv: z.infer<typeof serverSchema> | null = null

export function serverEnv() {
  if (_serverEnv) return _serverEnv

  if (typeof window !== 'undefined') {
    throw new Error(
      '❌ serverEnv() dipanggil di klien. Variabel server hanya tersedia di server.'
    )
  }

  const result = serverSchema.safeParse({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
  })
  if (!result.success) {
    throw new Error(
      `❌ Invalid server environment variables:\n${JSON.stringify(result.error.issues, null, 2)}`
    )
  }
  _serverEnv = result.data
  return _serverEnv
}
