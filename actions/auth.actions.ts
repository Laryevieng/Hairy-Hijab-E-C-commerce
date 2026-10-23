'use server'

import type { AuthError } from '@supabase/supabase-js'
import { redirect } from 'next/navigation'
import { z } from 'zod'
import { DEFAULT_NEXT_PATH, safeNextPath } from '@/lib/auth/next-path'
import { publicEnv } from '@/lib/env'
import { createClient } from '@/lib/supabase/server'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth'
import type { ActionResult } from '@/types/action'

type Failure = Extract<ActionResult, { ok: false }>

const RESET_PASSWORD_PATH = '/reset-password'

// Sama untuk email terdaftar maupun tidak, agar keberadaan akun tidak terungkap.
const RESET_REQUESTED_MESSAGE =
  'Jika email tersebut terdaftar, kami telah mengirim tautan untuk mengatur ulang kata sandi. Periksa kotak masuk dan folder spam.'

function validationFailure(error: z.ZodError): Failure {
  const flat: Record<string, string[] | undefined> = z.flattenError(error).fieldErrors
  const fieldErrors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(flat)) {
    if (messages && messages.length > 0) fieldErrors[field] = messages
  }
  return { ok: false, error: { code: 'VALIDATION', message: 'Periksa kembali data yang diisi.', fieldErrors } }
}

function authFailure(error: AuthError): Failure {
  switch (error.code) {
    case 'invalid_credentials':
      return { ok: false, error: { code: 'INVALID_CREDENTIALS', message: 'Email atau kata sandi salah.' } }
    case 'email_not_confirmed':
      return {
        ok: false,
        error: { code: 'EMAIL_NOT_CONFIRMED', message: 'Email belum dikonfirmasi. Buka tautan konfirmasi di email Anda.' },
      }
    case 'user_already_exists':
    case 'email_exists':
      return { ok: false, error: { code: 'EMAIL_EXISTS', message: 'Email sudah terdaftar. Silakan masuk.' } }
    case 'weak_password': {
      const message = 'Kata sandi terlalu lemah. Gunakan kombinasi huruf dan angka yang lebih kuat.'
      return { ok: false, error: { code: 'WEAK_PASSWORD', message, fieldErrors: { password: [message] } } }
    }
    case 'same_password': {
      const message = 'Kata sandi baru harus berbeda dari kata sandi lama.'
      return { ok: false, error: { code: 'SAME_PASSWORD', message, fieldErrors: { password: [message] } } }
    }
    case 'over_email_send_rate_limit':
    case 'over_request_rate_limit':
      return { ok: false, error: { code: 'RATE_LIMITED', message: 'Terlalu banyak percobaan. Coba lagi beberapa saat lagi.' } }
    default:
      // Hanya kode error yang dicatat; tanpa email atau data pribadi (§10.3).
      console.error('[auth] error tak terduga:', error.code ?? error.status)
      return { ok: false, error: { code: 'UNKNOWN', message: 'Terjadi kesalahan. Coba lagi.' } }
  }
}

function callbackUrl(next: string): string {
  const url = new URL('/auth/callback', publicEnv.NEXT_PUBLIC_SITE_URL)
  url.searchParams.set('next', next)
  return url.toString()
}

export async function signUp(input: unknown): Promise<ActionResult<{ needsConfirmation: true }>> {
  const parsed = registerSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error)

  const supabase = await createClient()
  const { data, error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { full_name: parsed.data.fullName },
      emailRedirectTo: callbackUrl(DEFAULT_NEXT_PATH),
    },
  })
  if (error) return authFailure(error)

  // Sesi langsung ada hanya bila konfirmasi email dimatikan di project.
  if (data.session) redirect(DEFAULT_NEXT_PATH)
  return { ok: true, data: { needsConfirmation: true } }
}

export async function signIn(input: unknown, next?: unknown): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword(parsed.data)
  if (error) return authFailure(error)

  redirect(safeNextPath(next))
}

export async function signOut(): Promise<void> {
  const supabase = await createClient()
  // "local" hanya mengakhiri sesi di perangkat ini.
  await supabase.auth.signOut({ scope: 'local' })
  redirect('/')
}

export async function requestPasswordReset(input: unknown): Promise<ActionResult<{ message: string }>> {
  const parsed = forgotPasswordSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error)

  const supabase = await createClient()
  const { error } = await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: callbackUrl(RESET_PASSWORD_PATH),
  })
  if (error) console.error('[auth] requestPasswordReset:', error.code ?? error.status)

  return { ok: true, data: { message: RESET_REQUESTED_MESSAGE } }
}

export async function updatePassword(input: unknown): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error)

  const supabase = await createClient()
  const { data } = await supabase.auth.getClaims()
  if (!data?.claims) {
    return {
      ok: false,
      error: { code: 'SESSION_EXPIRED', message: 'Tautan atur ulang sudah kedaluwarsa. Minta tautan baru.' },
    }
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password })
  if (error) return authFailure(error)

  redirect(DEFAULT_NEXT_PATH)
}
