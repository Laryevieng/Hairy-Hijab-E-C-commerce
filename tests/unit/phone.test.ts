import { describe, expect, it } from 'vitest'
import { buildWhatsAppLink, normalizePhoneID } from '@/lib/utils/phone'

describe('normalizePhoneID', () => {
  it('menormalisasi awalan 0 dengan tanda hubung (0812-3456-7890)', () => {
    expect(normalizePhoneID('0812-3456-7890')).toBe('6281234567890')
  })

  it('menormalisasi awalan +62 dengan spasi (+62 812 3456 7890)', () => {
    expect(normalizePhoneID('+62 812 3456 7890')).toBe('6281234567890')
  })

  it('menormalisasi awalan 8 tanpa 0 atau 62 (812-3456-7890)', () => {
    expect(normalizePhoneID('812-3456-7890')).toBe('6281234567890')
  })

  it('menerima panjang 10 hingga 14 digit yang diawali 628', () => {
    expect(normalizePhoneID('081234567')).toBe('6281234567') // 10 digit
    expect(normalizePhoneID('0812345678901')).toBe('62812345678901') // 14 digit
  })

  it('menolak nomor tidak valid (bukan 628, terlalu pendek, atau terlalu panjang)', () => {
    expect(normalizePhoneID('021-5551234')).toBeNull() // telepon rumah (6221...)
    expect(normalizePhoneID('08123456')).toBeNull() // 9 digit (< 10)
    expect(normalizePhoneID('08123456789012')).toBeNull() // 15 digit (> 14)
    expect(normalizePhoneID('1234567890')).toBeNull()
    expect(normalizePhoneID('abc')).toBeNull()
    expect(normalizePhoneID('')).toBeNull()
  })
})

describe('buildWhatsAppLink', () => {
  it('membangun tautan wa.me tanpa pesan', () => {
    expect(buildWhatsAppLink('0812-3456-7890')).toBe(
      'https://wa.me/6281234567890'
    )
  })

  it('membangun tautan wa.me dengan pesan ter-encode sesuai §14.3', () => {
    const message =
      'Halo Hairy Hijab, saya ingin konfirmasi pesanan HH-261020-AB3CD.'
    const link = buildWhatsAppLink('+62 812 3456 7890', message)
    expect(link).not.toBeNull()
    const url = new URL(link!)
    expect(url.origin).toBe('https://wa.me')
    expect(url.pathname).toBe('/6281234567890')
    expect(url.searchParams.get('text')).toBe(message)
  })

  it('mengembalikan null bila nomor telepon tidak valid', () => {
    expect(buildWhatsAppLink('021-123456', 'Halo')).toBeNull()
  })
})
