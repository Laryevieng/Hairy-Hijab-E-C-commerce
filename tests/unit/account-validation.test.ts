import { describe, expect, it } from 'vitest'
import { addressSchema, profileSchema } from '@/lib/validations/account'

describe('account validation', () => {
  it('normalizes an Indonesian phone number in the profile', () => {
    expect(profileSchema.parse({ fullName: '  Aisyah Putri ', phone: '0812-3456-7890' })).toEqual({
      fullName: 'Aisyah Putri', phone: '6281234567890',
    })
  })

  it('rejects invalid phone numbers and provinces', () => {
    expect(profileSchema.safeParse({ fullName: 'Aisyah', phone: '12345' }).success).toBe(false)
    expect(addressSchema.safeParse({
      label: '', recipientName: 'Aisyah', phone: '081234567890', province: 'Narnia',
      city: 'Bandung', district: 'Coblong', postalCode: '40132', addressDetail: 'Jalan Contoh 1', isDefault: false,
    }).success).toBe(false)
  })

  it('accepts a complete address and turns an empty label into null', () => {
    const result = addressSchema.parse({
      label: ' ', recipientName: 'Aisyah Putri', phone: '+62 812 3456 7890', province: 'Jawa Barat',
      city: 'Bandung', district: 'Coblong', postalCode: '40132', addressDetail: 'Jalan Contoh nomor 1', isDefault: true,
    })
    expect(result.label).toBeNull()
    expect(result.phone).toBe('6281234567890')
    expect(result.isDefault).toBe(true)
  })
})
