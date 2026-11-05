'use server'

import { randomUUID } from 'node:crypto'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth/guards'
import { mapDbError } from '@/lib/errors'
import { createAdminClient } from '@/lib/supabase/admin'
import {
  detectImageMime,
  MAX_PROOF_FILE_SIZE,
  MIME_TO_EXT,
} from '@/lib/utils/file-signature'
import { paymentProofSchema } from '@/lib/validations/payment'
import { verifyViewerToken } from '@/services/orders.public.service'
import type { ActionResult } from '@/types/action'

export interface SubmitPaymentProofResult {
  orderId: string
  orderNumber: string
}

/**
 * Server Action: submitPaymentProof (P7-01c)
 * 
 * 1. Memvalidasi metadata pembayaran via Zod (bank, sender, note).
 * 2. Memvalidasi file bukti: wajib ada, ukuran <= 4 MB, dan tipe dicek via magic bytes (file signature),
 *    BUKAN dari ekstensi atau header MIME klien.
 * 3. Otorisasi penampil: mengizinkan pemilik pesanan (user_id sesi) atau tamu dengan public_token yang cocok.
 * 4. Memverifikasi status pesanan masih 'pending'/'unpaid' dan belum kedaluwarsa.
 * 5. Mengunggah file ke bucket privat `payment-proofs` dengan konvensi path `<order_id>/<uuid>.<ext>` tanpa upsert.
 * 6. Memanggil RPC `submit_payment_proof`.
 * 7. Bila RPC gagal, HAPUS objek yang sudah terunggah agar tidak meninggalkan objek yatim di Storage.
 */
export async function submitPaymentProof(
  formData: FormData
): Promise<ActionResult<SubmitPaymentProofResult>> {
  // 1. Ekstraksi form data
  const orderId = formData.get('orderId')
  const token = formData.get('token')
  const bankName = formData.get('bankName')
  const senderName = formData.get('senderName')
  const customerNote = formData.get('customerNote')
  const file = formData.get('file')

  // 2. Validasi skema metadata
  const parsed = paymentProofSchema.safeParse({
    orderId,
    token: typeof token === 'string' ? token : undefined,
    bankName,
    senderName,
    customerNote: typeof customerNote === 'string' ? customerNote : undefined,
  })

  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {}
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? 'form')
      if (!fieldErrors[key]) fieldErrors[key] = []
      fieldErrors[key].push(issue.message)
    }
    const firstMessage = parsed.error.issues[0]?.message ?? 'Data pengunggahan bukti tidak valid.'
    return {
      ok: false,
      error: {
        code: 'VALIDATION',
        message: firstMessage,
        fieldErrors,
      },
    }
  }

  const {
    orderId: validOrderId,
    token: validToken,
    bankName: validBank,
    senderName: validSender,
    customerNote: validNote,
  } = parsed.data

  // 3. Validasi file bukti transfer
  if (!file || !(file instanceof File) || file.size === 0) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE',
        message: 'File bukti transfer wajib diunggah.',
        fieldErrors: { file: ['File bukti transfer wajib diunggah.'] },
      },
    }
  }

  if (file.size > MAX_PROOF_FILE_SIZE) {
    return {
      ok: false,
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'Ukuran file bukti transfer maksimal 4 MB.',
        fieldErrors: { file: ['Ukuran file bukti transfer maksimal 4 MB.'] },
      },
    }
  }

  let buffer: Buffer
  try {
    buffer = Buffer.from(await file.arrayBuffer())
  } catch {
    return {
      ok: false,
      error: {
        code: 'FILE_READ_ERROR',
        message: 'Gagal membaca file bukti transfer. Coba lagi.',
      },
    }
  }

  // Deteksi tipe MIME dari magic bytes signature (bukan ekstensi)
  const detectedMime = detectImageMime(buffer)
  if (!detectedMime) {
    return {
      ok: false,
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Format file tidak didukung. Unggah bukti transfer dalam format JPG, PNG, atau WebP.',
        fieldErrors: { file: ['Format file harus berupa gambar JPEG, PNG, atau WebP yang valid.'] },
      },
    }
  }

  const ext = MIME_TO_EXT[detectedMime]

  // 4. Otorisasi pemilik atau token via admin client (§10.5)
  const adminClient = createAdminClient()

  let user: { id: string } | null = null
  try {
    user = await getCurrentUser()
  } catch {
    user = null
  }

  const { data: order, error: orderFetchErr } = await adminClient
    .from('orders')
    .select('id, order_number, user_id, public_token, status, payment_status, expires_at')
    .eq('id', validOrderId)
    .maybeSingle()

  if (orderFetchErr || !order) {
    return {
      ok: false,
      error: {
        code: 'ORDER_NOT_FOUND',
        message: 'Pesanan tidak ditemukan.',
      },
    }
  }

  const isOwner = Boolean(user && order.user_id && user.id === order.user_id)
  const isTokenValid = Boolean(validToken && order.public_token && verifyViewerToken(validToken, order.public_token))

  if (!isOwner && !isTokenValid) {
    return {
      ok: false,
      error: {
        code: 'FORBIDDEN',
        message: 'Anda tidak memiliki izin untuk mengunggah bukti pada pesanan ini.',
      },
    }
  }

  // 5. Cek status dan kedaluwarsa pesanan
  if (order.status !== 'pending' || order.payment_status !== 'unpaid') {
    return {
      ok: false,
      error: {
        code: 'INVALID_TRANSITION',
        message: 'Status pesanan tidak memungkinkan pengunggahan bukti pembayaran.',
      },
    }
  }

  const isExpired = new Date(order.expires_at).getTime() < Date.now()
  if (isExpired) {
    return {
      ok: false,
      error: {
        code: 'ORDER_EXPIRED',
        message: 'Batas waktu pembayaran pesanan telah habis.',
      },
    }
  }

  // 6. Unggah file ke bucket privat `payment-proofs`
  // Konvensi path: `payment-proofs/<order_id>/<uuid>.<ext>`
  const fileKey = `${order.id}/${randomUUID()}.${ext}`
  const { error: uploadError } = await adminClient.storage
    .from('payment-proofs')
    .upload(fileKey, buffer, {
      contentType: detectedMime,
      upsert: false,
    })

  if (uploadError) {
    return {
      ok: false,
      error: {
        code: 'UPLOAD_FAILED',
        message: 'Gagal mengunggah file bukti transfer ke penyimpanan. Coba lagi.',
      },
    }
  }

  // 7. Panggil RPC submit_payment_proof
  const { error: rpcError } = await adminClient.rpc('submit_payment_proof', {
    p_order_id: order.id,
    p_proof_path: fileKey,
    p_bank_name: validBank,
    p_sender_name: validSender,
    p_note: validNote ?? '',
  })

  // 8. Jika RPC gagal, HAPUS objek yang terunggah agar tidak ada file yatim (§15 P7-01c)
  if (rpcError) {
    await adminClient.storage.from('payment-proofs').remove([fileKey])
    const mapped = mapDbError(rpcError)
    return {
      ok: false,
      error: {
        code: mapped.code,
        message: mapped.message,
      },
    }
  }

  // 9. Revalidate rute terkait
  revalidatePath(`/orders/${order.order_number}`)
  revalidatePath('/account/orders')

  return {
    ok: true,
    data: {
      orderId: order.id,
      orderNumber: order.order_number,
    },
  }
}
