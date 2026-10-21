import { z } from 'zod'

/**
 * Variabel publik — bisa diakses di klien dan server.
 * Divalidasi eksplisit per properti `process.env.NEXT_PUBLIC_*` agar kompatibel
 * dengan static replacement bundler Next.js.
 */
const publicSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().default('http://localhost:3000'),
  NEXT_PUBLIC_SUPABASE_URL: z.url(),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z.string().min(1),
})

/**
 * Variabel server — hanya diakses di kode server.
 * Divalidasi secara lazy saat `serverEnv()` dipanggil di server.
 */
const serverSchema = z.object({
  SUPABASE_SECRET_KEY: z.string().min(1),
})

let _publicEnv: z.infer<typeof publicSchema> | null = null

export function getPublicEnv(): z.infer<typeof publicSchema> {
  if (_publicEnv) return _publicEnv

  const result = publicSchema.safeParse({
    NEXT_PUBLIC_SITE_URL:
      process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY:
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  })
  if (!result.success) {
    throw new Error(
      `Invalid public environment variables:\n${JSON.stringify(result.error.issues, null, 2)}`
    )
  }
  _publicEnv = result.data
  return _publicEnv
}

export const publicEnv: z.infer<typeof publicSchema> = {
  get NEXT_PUBLIC_SITE_URL() {
    return getPublicEnv().NEXT_PUBLIC_SITE_URL
  },
  get NEXT_PUBLIC_SUPABASE_URL() {
    return getPublicEnv().NEXT_PUBLIC_SUPABASE_URL
  },
  get NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY() {
    return getPublicEnv().NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  },
}

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
