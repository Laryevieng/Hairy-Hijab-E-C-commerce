import { describe, expect, it } from 'vitest'
import { paymentProofSchema } from '@/lib/validations/payment'

describe('paymentProofSchema (P7-01a)', () => {
  const validPayload = {
    orderId: 'a0000000-0000-4000-8000-000000000001',
    token: 'abcdef1234567890abcdef1234567890',
    bankName: 'BCA',
    senderName: 'Siti Fulanah',
    customerNote: 'Transfer via m-BCA jam 10.30 WIB',
  }

  it('menerima input pembayaran yang valid', () => {
    const result = paymentProofSchema.safeParse(validPayload)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.bankName).toBe('BCA')
      expect(result.data.senderName).toBe('Siti Fulanah')
      expect(result.data.customerNote).toBe('Transfer via m-BCA jam 10.30 WIB')
    }
  })

  it('menerima input tanpa catatan opsional dan tanpa token', () => {
    const withoutNote = {
      orderId: 'a0000000-0000-4000-8000-000000000001',
      bankName: 'Mandiri',
      senderName: 'Ahmad',
    }
    const result = paymentProofSchema.safeParse(withoutNote)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.customerNote).toBeUndefined()
      expect(result.data.token).toBeUndefined()
    }
  })

  it('menolak orderId non-UUID', () => {
    const result = paymentProofSchema.safeParse({
      ...validPayload,
      orderId: 'bukan-uuid',
    })
    expect(result.success).toBe(false)
  })

  it('menolak nama bank kosong atau melebihi 50 karakter', () => {
    const emptyBank = paymentProofSchema.safeParse({
      ...validPayload,
      bankName: '   ',
    })
    expect(emptyBank.success).toBe(false)

    const tooLongBank = paymentProofSchema.safeParse({
      ...validPayload,
      bankName: 'A'.repeat(51),
    })
    expect(tooLongBank.success).toBe(false)
  })

  it('menolak nama pengirim kosong atau melebihi 80 karakter', () => {
    const emptySender = paymentProofSchema.safeParse({
      ...validPayload,
      senderName: '',
    })
    expect(emptySender.success).toBe(false)

    const tooLongSender = paymentProofSchema.safeParse({
      ...validPayload,
      senderName: 'B'.repeat(81),
    })
    expect(tooLongSender.success).toBe(false)
  })

  it('menolak catatan melebihi 200 karakter', () => {
    const tooLongNote = paymentProofSchema.safeParse({
      ...validPayload,
      customerNote: 'C'.repeat(201),
    })
    expect(tooLongNote.success).toBe(false)
  })
})
