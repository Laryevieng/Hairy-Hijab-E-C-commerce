import { describe, expect, it } from 'vitest'
import {
  orderIdSchema,
  rejectPaymentSchema,
  markShippedSchema,
  cancelOrderSchema,
  markRefundedSchema,
  proofPathSchema,
} from '@/lib/validations/admin-orders'

describe('Admin Orders Validations (P7-03)', () => {
  const validUuid = 'a0000000-0000-4000-8000-000000000001'

  it('orderIdSchema: memvalidasi UUID', () => {
    expect(orderIdSchema.safeParse(validUuid).success).toBe(true)
    expect(orderIdSchema.safeParse('bukan-uuid').success).toBe(false)
    expect(orderIdSchema.safeParse('').success).toBe(false)
  })

  it('rejectPaymentSchema: menolak jika catatan kosong', () => {
    const valid = rejectPaymentSchema.safeParse({
      orderId: validUuid,
      note: 'Nominal transfer kurang Rp 10.000',
    })
    expect(valid.success).toBe(true)

    const empty = rejectPaymentSchema.safeParse({
      orderId: validUuid,
      note: '   ',
    })
    expect(empty.success).toBe(false)
  })

  it('markShippedSchema: mewajibkan nama kurir', () => {
    const valid = markShippedSchema.safeParse({
      orderId: validUuid,
      courier: 'JNE',
      service: 'REG',
      trackingNumber: 'JNE1234567890',
    })
    expect(valid.success).toBe(true)

    const noCourier = markShippedSchema.safeParse({
      orderId: validUuid,
      courier: '',
    })
    expect(noCourier.success).toBe(false)
  })

  it('cancelOrderSchema: mewajibkan alasan pembatalan', () => {
    const valid = cancelOrderSchema.safeParse({
      orderId: validUuid,
      reason: 'Permintaan pelanggan via WhatsApp',
    })
    expect(valid.success).toBe(true)

    const emptyReason = cancelOrderSchema.safeParse({
      orderId: validUuid,
      reason: '',
    })
    expect(emptyReason.success).toBe(false)
  })

  it('markRefundedSchema: catatan opsional', () => {
    const validWithoutNote = markRefundedSchema.safeParse({
      orderId: validUuid,
    })
    expect(validWithoutNote.success).toBe(true)

    const validWithNote = markRefundedSchema.safeParse({
      orderId: validUuid,
      note: 'Refund transfer BCA ref: 987654',
    })
    expect(validWithNote.success).toBe(true)
  })

  it('proofPathSchema: mencegah path traversal', () => {
    expect(proofPathSchema.safeParse('order-id/file.jpg').success).toBe(true)
    expect(proofPathSchema.safeParse('../etc/passwd').success).toBe(false)
    expect(proofPathSchema.safeParse('/absolute/path').success).toBe(false)
    expect(proofPathSchema.safeParse('order\\backslash').success).toBe(false)
  })
})
