import { z } from 'zod'

export const orderIdSchema = z
  .string({ error: 'ID pesanan wajib diisi.' })
  .uuid({ error: 'Format ID pesanan tidak valid.' })

export const rejectPaymentSchema = z.object({
  orderId: orderIdSchema,
  note: z
    .string({ error: 'Catatan penolakan wajib diisi.' })
    .trim()
    .min(1, { error: 'Catatan penolakan wajib diisi.' })
    .max(500, { error: 'Catatan penolakan maksimal 500 karakter.' }),
})

export const markShippedSchema = z.object({
  orderId: orderIdSchema,
  courier: z
    .string({ error: 'Nama kurir / ekspedisi wajib diisi.' })
    .trim()
    .min(1, { error: 'Nama kurir wajib diisi.' })
    .max(50, { error: 'Nama kurir maksimal 50 karakter.' }),
  service: z
    .string()
    .trim()
    .max(50, { error: 'Nama layanan maksimal 50 karakter.' })
    .optional()
    .transform((val) => val || undefined),
  trackingNumber: z
    .string()
    .trim()
    .max(100, { error: 'Nomor resi maksimal 100 karakter.' })
    .optional()
    .transform((val) => val || undefined),
})

export const cancelOrderSchema = z.object({
  orderId: orderIdSchema,
  reason: z
    .string({ error: 'Alasan pembatalan wajib diisi.' })
    .trim()
    .min(1, { error: 'Alasan pembatalan wajib diisi.' })
    .max(200, { error: 'Alasan pembatalan maksimal 200 karakter.' }),
})

export const markRefundedSchema = z.object({
  orderId: orderIdSchema,
  note: z
    .string()
    .trim()
    .max(500, { error: 'Catatan pengembalian dana maksimal 500 karakter.' })
    .optional()
    .transform((val) => val || undefined),
})

export const proofPathSchema = z
  .string({ error: 'Path bukti transfer wajib diisi.' })
  .trim()
  .min(1, { error: 'Path bukti transfer wajib diisi.' })
  .refine(
    (p) => !p.includes('..') && !p.startsWith('/') && !p.includes('\\'),
    { error: 'Path bukti transfer tidak valid.' }
  )

export type RejectPaymentInput = z.infer<typeof rejectPaymentSchema>
export type MarkShippedInput = z.infer<typeof markShippedSchema>
export type CancelOrderInput = z.infer<typeof cancelOrderSchema>
export type MarkRefundedInput = z.infer<typeof markRefundedSchema>
