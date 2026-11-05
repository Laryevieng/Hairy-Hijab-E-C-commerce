import { z } from 'zod'

/**
 * Batasan validasi bukti transfer manual (P7-01):
 * - bankName: 1-50 karakter
 * - senderName: 1-80 karakter
 * - customerNote: opsional, maksimal 200 karakter
 * - orderId: UUID valid
 * - token: opsional string token akses tamu
 */
export const paymentProofSchema = z.object({
  orderId: z
    .string({ error: 'ID pesanan wajib diisi.' })
    .uuid({ error: 'Format ID pesanan tidak valid.' }),
  token: z
    .string()
    .trim()
    .optional()
    .transform((val) => val || undefined),
  bankName: z
    .string({ error: 'Nama bank tujuan/rekening wajib diisi.' })
    .trim()
    .min(1, { error: 'Nama bank wajib diisi.' })
    .max(50, { error: 'Nama bank maksimal 50 karakter.' }),
  senderName: z
    .string({ error: 'Nama pemilik rekening / pengirim wajib diisi.' })
    .trim()
    .min(1, { error: 'Nama pengirim wajib diisi.' })
    .max(80, { error: 'Nama pengirim maksimal 80 karakter.' }),
  customerNote: z
    .string()
    .trim()
    .max(200, { error: 'Catatan maksimal 200 karakter.' })
    .optional()
    .transform((val) => val || undefined),
})

export type PaymentProofInput = z.infer<typeof paymentProofSchema>
