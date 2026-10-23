import { z } from 'zod'

// Batas atas mengikuti bcrypt di Supabase Auth (72 byte); minimum dari §15 P3-03.
const PASSWORD_MIN = 8
const PASSWORD_MAX = 72

const email = z
  .string({ error: 'Email wajib diisi.' })
  .trim()
  .toLowerCase()
  .min(1, { error: 'Email wajib diisi.' })
  .pipe(z.email({ error: 'Format email tidak valid.' }))

const newPassword = z
  .string({ error: 'Kata sandi wajib diisi.' })
  .min(PASSWORD_MIN, { error: `Kata sandi minimal ${PASSWORD_MIN} karakter.` })
  .max(PASSWORD_MAX, { error: `Kata sandi maksimal ${PASSWORD_MAX} karakter.` })

export const registerSchema = z.object({
  fullName: z
    .string({ error: 'Nama wajib diisi.' })
    .trim()
    .min(2, { error: 'Nama minimal 2 karakter.' })
    .max(100, { error: 'Nama maksimal 100 karakter.' }),
  email,
  password: newPassword,
})

export const loginSchema = z.object({
  email,
  // Panjang tidak diperiksa saat masuk agar akun lama dengan aturan berbeda tetap bisa login.
  password: z.string({ error: 'Kata sandi wajib diisi.' }).min(1, { error: 'Kata sandi wajib diisi.' }),
})

export const forgotPasswordSchema = z.object({ email })

export const resetPasswordSchema = z
  .object({
    password: newPassword,
    confirmPassword: z.string({ error: 'Ulangi kata sandi.' }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    error: 'Kata sandi tidak sama.',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.input<typeof registerSchema>
export type LoginInput = z.input<typeof loginSchema>
export type ForgotPasswordInput = z.input<typeof forgotPasswordSchema>
export type ResetPasswordInput = z.input<typeof resetPasswordSchema>
