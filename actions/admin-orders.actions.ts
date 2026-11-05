'use server'

import { revalidatePath } from 'next/cache'
import { requireStaff } from '@/lib/auth/guards'
import { mapDbError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'
import type { z } from 'zod'
import {
  orderIdSchema,
  rejectPaymentSchema,
  markShippedSchema,
  cancelOrderSchema,
  markRefundedSchema,
  proofPathSchema,
} from '@/lib/validations/admin-orders'
import type { ActionResult } from '@/types/action'

type Failure = Extract<ActionResult, { ok: false }>

function validationFailure(error: z.ZodError): Failure {
  const errors: Record<string, string[]> = {}
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? 'form')
    if (!errors[field]) errors[field] = []
    errors[field].push(issue.message)
  }
  const firstMsg = error.issues[0]?.message ?? 'Periksa kembali data yang diisi.'
  return {
    ok: false,
    error: {
      code: 'VALIDATION',
      message: firstMsg,
      fieldErrors: errors,
    },
  }
}

function dbFailure(error: { code?: string; message: string; details?: unknown }): Failure {
  const mapped = mapDbError(error)
  return {
    ok: false,
    error: {
      code: mapped.code,
      message: mapped.message,
    },
  }
}

/**
 * 1. Verifikasi Pembayaran (P7-03): pending (proof_submitted) -> processing (paid).
 * Memanggil RPC verify_payment lewat klien sesi agar auth.uid() adalah staf.
 */
export async function verifyPayment(orderId: unknown): Promise<ActionResult> {
  await requireStaff()
  const parsed = orderIdSchema.safeParse(orderId)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('verify_payment', {
    p_order_id: parsed.data,
  })

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 2. Tolak Bukti Pembayaran (P7-03): pending (proof_submitted) -> pending (unpaid).
 * Memanggil RPC reject_payment lewat klien sesi dengan catatan penolakan staf.
 */
export async function rejectPayment(
  orderIdOrInput: unknown,
  noteArg?: unknown
): Promise<ActionResult> {
  await requireStaff()
  const payload =
    typeof orderIdOrInput === 'object' && orderIdOrInput !== null
      ? orderIdOrInput
      : { orderId: orderIdOrInput, note: noteArg }

  const parsed = rejectPaymentSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('reject_payment', {
    p_order_id: parsed.data.orderId,
    p_note: parsed.data.note,
  })

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 3. Kirim Pesanan (P7-03): processing -> shipped.
 * Memanggil RPC mark_order_shipped lewat klien sesi dan mencatat kurir serta nomor resi.
 */
export async function markShipped(input: unknown): Promise<ActionResult> {
  await requireStaff()
  const parsed = markShippedSchema.safeParse(input)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const rpcArgs: {
    p_order_id: string
    p_courier: string
    p_service?: string
    p_tracking_number?: string
  } = {
    p_order_id: parsed.data.orderId,
    p_courier: parsed.data.courier,
  }
  if (parsed.data.service) rpcArgs.p_service = parsed.data.service
  if (parsed.data.trackingNumber) rpcArgs.p_tracking_number = parsed.data.trackingNumber

  const { error } = await supabase.rpc('mark_order_shipped', rpcArgs)

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 4. Selesaikan Pesanan (P7-03): shipped -> completed.
 * Memanggil RPC complete_order lewat klien sesi.
 */
export async function completeOrder(orderId: unknown): Promise<ActionResult> {
  await requireStaff()
  const parsed = orderIdSchema.safeParse(orderId)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('complete_order', {
    p_order_id: parsed.data,
  })

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 5. Batalkan Pesanan (P7-03): pending/processing -> cancelled.
 * Memanggil RPC cancel_order lewat klien sesi dan melepaskan reservasi stok.
 */
export async function cancelOrder(
  orderIdOrInput: unknown,
  reasonArg?: unknown
): Promise<ActionResult> {
  await requireStaff()
  const payload =
    typeof orderIdOrInput === 'object' && orderIdOrInput !== null
      ? orderIdOrInput
      : { orderId: orderIdOrInput, reason: reasonArg }

  const parsed = cancelOrderSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const { error } = await supabase.rpc('cancel_order', {
    p_order_id: parsed.data.orderId,
    p_reason: parsed.data.reason,
  })

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 6. Catat Pengembalian Dana (P7-03): cancelled (paid) -> cancelled (refunded).
 * Memanggil RPC mark_refunded lewat klien sesi.
 */
export async function markRefunded(
  orderIdOrInput: unknown,
  noteArg?: unknown
): Promise<ActionResult> {
  await requireStaff()
  const payload =
    typeof orderIdOrInput === 'object' && orderIdOrInput !== null
      ? orderIdOrInput
      : { orderId: orderIdOrInput, note: noteArg }

  const parsed = markRefundedSchema.safeParse(payload)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const rpcArgs: { p_order_id: string; p_note?: string } = {
    p_order_id: parsed.data.orderId,
  }
  if (parsed.data.note) rpcArgs.p_note = parsed.data.note

  const { error } = await supabase.rpc('mark_refunded', rpcArgs)

  if (error) return dbFailure(error)

  revalidatePath('/admin/orders')
  revalidatePath('/account/orders')
  return { ok: true, data: undefined }
}

/**
 * 7. Ambil Signed URL Bukti Transfer (P7-03): masa berlaku 60 detik.
 * Dibuat melalui klien sesi untuk mematuhi policy RLS storage staf.
 */
export async function getProofSignedUrl(
  proofPath: unknown
): Promise<ActionResult<{ signedUrl: string }>> {
  await requireStaff()
  const parsed = proofPathSchema.safeParse(proofPath)
  if (!parsed.success) {
    return validationFailure(parsed.error)
  }

  const supabase = await createClient()
  const { data, error } = await supabase.storage
    .from('payment-proofs')
    .createSignedUrl(parsed.data, 60)

  if (error || !data?.signedUrl) {
    return {
      ok: false,
      error: {
        code: 'STORAGE_ERROR',
        message: 'Gagal membuat signed URL bukti transfer.',
      },
    }
  }

  return {
    ok: true,
    data: {
      signedUrl: data.signedUrl,
    },
  }
}
