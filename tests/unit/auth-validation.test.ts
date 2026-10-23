import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
} from '@/lib/validations/auth'

function fieldErrors(result: { success: boolean; error?: z.ZodError }): Record<string, string[] | undefined> {
  return result.error ? z.flattenError(result.error).fieldErrors : {}
}

describe('registerSchema', () => {
  const valid = { fullName: 'Siti Aminah', email: 'siti@example.com', password: 'rahasia123' }

  it('menerima data valid dan menormalkan email', () => {
    const result = registerSchema.safeParse({ ...valid, email: '  Siti@Example.COM ', fullName: '  Siti  ' })
    expect(result.success).toBe(true)
    expect(result.data).toEqual({ ...valid, fullName: 'Siti' })
  })

  it('kata sandi kurang dari 8 karakter ditolak', () => {
    const result = registerSchema.safeParse({ ...valid, password: '1234567' })
    expect(fieldErrors(result).password).toEqual(['Kata sandi minimal 8 karakter.'])
  })

  it('kata sandi lebih dari 72 karakter ditolak', () => {
    const result = registerSchema.safeParse({ ...valid, password: 'a'.repeat(73) })
    expect(fieldErrors(result).password).toEqual(['Kata sandi maksimal 72 karakter.'])
  })

  it('nama kosong dan email tidak valid ditolak dengan pesan per field', () => {
    const result = registerSchema.safeParse({ ...valid, fullName: '   ', email: 'bukan-email' })
    expect(fieldErrors(result)).toMatchObject({
      fullName: ['Nama minimal 2 karakter.'],
      email: ['Format email tidak valid.'],
    })
  })

  it('field hilang ditolak', () => {
    const result = registerSchema.safeParse({})
    expect(Object.keys(fieldErrors(result)).sort()).toEqual(['email', 'fullName', 'password'])
  })
})

describe('loginSchema', () => {
  it('menerima kata sandi berapa pun panjangnya selama tidak kosong', () => {
    expect(loginSchema.safeParse({ email: 'a@b.co', password: 'x' }).success).toBe(true)
  })

  it('email kosong dan kata sandi kosong ditolak', () => {
    const result = loginSchema.safeParse({ email: '', password: '' })
    expect(fieldErrors(result)).toMatchObject({
      email: ['Email wajib diisi.'],
      password: ['Kata sandi wajib diisi.'],
    })
  })
})

describe('forgotPasswordSchema', () => {
  it('hanya membutuhkan email valid', () => {
    expect(forgotPasswordSchema.safeParse({ email: 'a@b.co' }).success).toBe(true)
    expect(forgotPasswordSchema.safeParse({ email: 'a@' }).success).toBe(false)
  })
})

describe('resetPasswordSchema', () => {
  it('menerima dua kata sandi yang sama', () => {
    expect(resetPasswordSchema.safeParse({ password: 'rahasia123', confirmPassword: 'rahasia123' }).success).toBe(true)
  })

  it('kata sandi berbeda ditolak pada confirmPassword', () => {
    const result = resetPasswordSchema.safeParse({ password: 'rahasia123', confirmPassword: 'rahasia124' })
    expect(fieldErrors(result).confirmPassword).toEqual(['Kata sandi tidak sama.'])
  })

  it('kata sandi baru kurang dari 8 karakter ditolak', () => {
    const result = resetPasswordSchema.safeParse({ password: 'pendek', confirmPassword: 'pendek' })
    expect(fieldErrors(result).password).toEqual(['Kata sandi minimal 8 karakter.'])
  })
})
