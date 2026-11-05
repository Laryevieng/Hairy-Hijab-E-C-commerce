import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  cleanupTestData,
  createCategory,
  createOrder,
  createProduct,
  createTestUsers,
  createVariant,
  newRunPrefix,
  orderArgs,
  PROOF_BUCKET,
  serviceClient,
} from './helpers'

// Mock `server-only` dan `next/cache` agar aman di lingkungan runner Node
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const service = serviceClient()
const prefix = newRunPrefix()

let variantId: string
let users: Record<'customerA' | 'staff', { id: string; email: string; client: ReturnType<typeof serviceClient> }>
const uploadedPathsToClean: string[] = []

beforeAll(async () => {
  users = await createTestUsers(service, prefix, ['customerA', 'staff'])
  const categoryId = await createCategory(service, prefix, 'adm-cat')
  const productId = await createProduct(service, { prefix, suffix: 'adm-prod', categoryId })
  variantId = await createVariant(service, {
    prefix,
    suffix: 'adm-v',
    productId,
    price: 75000,
    stock: 25,
  })
})

afterAll(async () => {
  if (uploadedPathsToClean.length > 0) {
    await service.storage.from(PROOF_BUCKET).remove(uploadedPathsToClean)
  }
  await cleanupTestData(service, prefix)
})

describe('P7-03: Aksi Admin Pesanan & Gerbang Fase 7 (G3)', () => {
  describe('1. Otorisasi Non-Staf (FORBIDDEN)', () => {
    it('pelanggan ditolak saat memanggil fungsi manajemen pesanan', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      const client = users.customerA.client

      const calls = await Promise.all([
        client.rpc('verify_payment', { p_order_id: order.order_id }),
        client.rpc('reject_payment', { p_order_id: order.order_id, p_note: 'Bukan staf' }),
        client.rpc('mark_order_shipped', {
          p_order_id: order.order_id,
          p_courier: 'JNE',
          p_service: 'REG',
          p_tracking_number: '123',
        }),
        client.rpc('complete_order', { p_order_id: order.order_id }),
        client.rpc('cancel_order', { p_order_id: order.order_id, p_reason: 'Bukan staf' }),
        client.rpc('mark_refunded', { p_order_id: order.order_id, p_note: 'Bukan staf' }),
      ])

      for (const { error } of calls) {
        expect(error).not.toBeNull()
        expect(error?.message).toBe('FORBIDDEN')
      }
    })

    it('pelanggan ditolak saat meminta signed URL bukti transfer di payment-proofs', async () => {
      const dummyPath = `${prefix}-dummy/file.jpg`
      const { data, error } = await users.customerA.client.storage
        .from(PROOF_BUCKET)
        .createSignedUrl(dummyPath, 60)

      expect(data).toBeNull()
      expect(error).not.toBeNull()
    })
  })

  describe('2. Alur Transisi Lengkap oleh Staf (Happy Path)', () => {
    it('staf: verify_payment -> mark_order_shipped -> complete_order', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      // Simulasikan pengunggahan bukti
      const proofPath = `${order.order_id}/proof.jpg`
      const proofBuffer = Buffer.from('FAKE_JPG_CONTENT')
      await service.storage.from(PROOF_BUCKET).upload(proofPath, proofBuffer, { contentType: 'image/jpeg' })
      uploadedPathsToClean.push(proofPath)

      // Submit bukti transfer
      const { error: submitErr } = await service.rpc('submit_payment_proof', {
        p_order_id: order.order_id,
        p_proof_path: proofPath,
        p_bank_name: 'BCA',
        p_sender_name: 'Pembeli Sah',
        p_note: 'Lunas',
      })
      expect(submitErr).toBeNull()

      // Staf memverifikasi pembayaran
      const { error: verifyErr } = await users.staff.client.rpc('verify_payment', {
        p_order_id: order.order_id,
      })
      expect(verifyErr).toBeNull()

      const { data: verifiedOrder } = await service
        .from('orders')
        .select('status, payment_status, paid_at')
        .eq('id', order.order_id)
        .single()

      expect(verifiedOrder?.status).toBe('processing')
      expect(verifiedOrder?.payment_status).toBe('paid')
      expect(verifiedOrder?.paid_at).not.toBeNull()

      // Staf mengirim pesanan
      const { error: shipErr } = await users.staff.client.rpc('mark_order_shipped', {
        p_order_id: order.order_id,
        p_courier: 'JNE',
        p_service: 'REG',
        p_tracking_number: 'JNE-99887766',
      })
      expect(shipErr).toBeNull()

      const { data: shippedOrder } = await service
        .from('orders')
        .select('status, shipped_at')
        .eq('id', order.order_id)
        .single()
      expect(shippedOrder?.status).toBe('shipped')
      expect(shippedOrder?.shipped_at).not.toBeNull()

      const { data: shipmentRow } = await service
        .from('shipments')
        .select('*')
        .eq('order_id', order.order_id)
        .single()
      expect(shipmentRow?.courier).toBe('JNE')
      expect(shipmentRow?.tracking_number).toBe('JNE-99887766')
      expect(shipmentRow?.status).toBe('shipped')

      // Staf menyelesaikan pesanan
      const { error: completeErr } = await users.staff.client.rpc('complete_order', {
        p_order_id: order.order_id,
      })
      expect(completeErr).toBeNull()

      const { data: completedOrder } = await service
        .from('orders')
        .select('status')
        .eq('id', order.order_id)
        .single()
      expect(completedOrder?.status).toBe('completed')

      const { data: deliveredShipment } = await service
        .from('shipments')
        .select('status, delivered_at')
        .eq('order_id', order.order_id)
        .single()
      expect(deliveredShipment?.status).toBe('delivered')
      expect(deliveredShipment?.delivered_at).not.toBeNull()
    })
  })

  describe('3. Penolakan Bukti Pembayaran oleh Staf (reject_payment)', () => {
    it('staf menolak bukti: status kembali unpaid, review_note tercatat, expires_at diperpanjang', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      const proofPath = `${order.order_id}/proof-reject.jpg`
      await service.storage.from(PROOF_BUCKET).upload(proofPath, Buffer.from('TEST'), { contentType: 'image/jpeg' })
      uploadedPathsToClean.push(proofPath)

      await service.rpc('submit_payment_proof', {
        p_order_id: order.order_id,
        p_proof_path: proofPath,
        p_bank_name: 'BCA',
        p_sender_name: 'Pengirim Salah',
        p_note: '',
      })

      // Staf menolak bukti pembayaran
      const { error: rejectErr } = await users.staff.client.rpc('reject_payment', {
        p_order_id: order.order_id,
        p_note: 'Foto buram dan nominal tidak terlihat jelas.',
      })
      expect(rejectErr).toBeNull()

      const { data: orderAfterReject } = await service
        .from('orders')
        .select('status, payment_status, expires_at')
        .eq('id', order.order_id)
        .single()

      expect(orderAfterReject?.status).toBe('pending')
      expect(orderAfterReject?.payment_status).toBe('unpaid')
      // expires_at harus di masa depan
      expect(new Date(orderAfterReject?.expires_at ?? 0).getTime()).toBeGreaterThan(Date.now())

      const { data: paymentRow } = await service
        .from('payments')
        .select('status, review_note, reviewed_by, reviewed_at')
        .eq('order_id', order.order_id)
        .order('submitted_at', { ascending: false })
        .limit(1)
        .single()

      expect(paymentRow?.status).toBe('rejected')
      expect(paymentRow?.review_note).toBe('Foto buram dan nominal tidak terlihat jelas.')
      expect(paymentRow?.reviewed_by).toBe(users.staff.id)
      expect(paymentRow?.reviewed_at).not.toBeNull()
    })
  })

  describe('4. Pembatalan Pesanan oleh Staf (cancel_order)', () => {
    it('staf membatalkan pesanan pending dan melepaskan reservasi stok', async () => {
      const beforeStock = (
        await service.from('product_variants').select('stock_quantity').eq('id', variantId).single()
      ).data?.stock_quantity ?? 0

      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 2 }] })
      )

      // Stok berkurang 2 saat pesanan dibuat
      const currentStock = (
        await service.from('product_variants').select('stock_quantity').eq('id', variantId).single()
      ).data?.stock_quantity ?? 0
      expect(currentStock).toBe(beforeStock - 2)

      // Staf membatalkan pesanan
      const { error: cancelErr } = await users.staff.client.rpc('cancel_order', {
        p_order_id: order.order_id,
        p_reason: 'Permintaan pembatalan dari pembeli',
      })
      expect(cancelErr).toBeNull()

      const { data: cancelledOrder } = await service
        .from('orders')
        .select('status, cancel_reason')
        .eq('id', order.order_id)
        .single()
      expect(cancelledOrder?.status).toBe('cancelled')
      expect(cancelledOrder?.cancel_reason).toBe('Permintaan pembatalan dari pembeli')

      // Stok kembali utuh ke nilai awal
      const restoredStock = (
        await service.from('product_variants').select('stock_quantity').eq('id', variantId).single()
      ).data?.stock_quantity ?? 0
      expect(restoredStock).toBe(beforeStock)
    })
  })

  describe('5. Pengembalian Dana oleh Staf (mark_refunded)', () => {
    it('staf menandai pesanan cancelled (paid) menjadi cancelled (refunded)', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      // Verifikasi pesanan menjadi paid & processing
      const proofPath = `${order.order_id}/proof-refund.jpg`
      await service.storage.from(PROOF_BUCKET).upload(proofPath, Buffer.from('TEST'), { contentType: 'image/jpeg' })
      uploadedPathsToClean.push(proofPath)

      await service.rpc('submit_payment_proof', {
        p_order_id: order.order_id,
        p_proof_path: proofPath,
        p_bank_name: 'BCA',
        p_sender_name: 'Pembeli',
        p_note: '',
      })
      await users.staff.client.rpc('verify_payment', { p_order_id: order.order_id })

      // Batalkan pesanan processing yang sudah dibayar
      await users.staff.client.rpc('cancel_order', {
        p_order_id: order.order_id,
        p_reason: 'Stok cacat produksi',
      })

      // Staf menandai pengembalian dana selesai
      const { error: refundErr } = await users.staff.client.rpc('mark_refunded', {
        p_order_id: order.order_id,
        p_note: 'Dana telah ditransfer kembali via BCA ref: 554433',
      })
      expect(refundErr).toBeNull()

      const { data: refundedOrder } = await service
        .from('orders')
        .select('status, payment_status')
        .eq('id', order.order_id)
        .single()
      expect(refundedOrder?.status).toBe('cancelled')
      expect(refundedOrder?.payment_status).toBe('refunded')
    })
  })

  describe('6. Transisi Tidak Sah Ditolak (INVALID_TRANSITION)', () => {
    it('staf menolak transisi status yang melompat atau tidak valid', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      // 1. verify_payment pada order unpaid (belum submit proof)
      const { error: e1 } = await users.staff.client.rpc('verify_payment', {
        p_order_id: order.order_id,
      })
      expect(e1?.message).toBe('INVALID_TRANSITION')

      // 2. mark_order_shipped pada order pending
      const { error: e2 } = await users.staff.client.rpc('mark_order_shipped', {
        p_order_id: order.order_id,
        p_courier: 'JNE',
        p_service: 'REG',
        p_tracking_number: '123',
      })
      expect(e2?.message).toBe('INVALID_TRANSITION')

      // 3. complete_order pada order pending
      const { error: e3 } = await users.staff.client.rpc('complete_order', {
        p_order_id: order.order_id,
      })
      expect(e3?.message).toBe('INVALID_TRANSITION')

      // 4. mark_refunded pada order pending / unpaid
      const { error: e4 } = await users.staff.client.rpc('mark_refunded', {
        p_order_id: order.order_id,
        p_note: 'Belum batal',
      })
      expect(e4?.message).toBe('INVALID_TRANSITION')
    })
  })

  describe('7. Signed URL Bukti Transfer oleh Staf', () => {
    it('staf dapat membuat signed URL berumur 60 detik untuk melihat bukti pembayaran', async () => {
      const order = await createOrder(
        service,
        orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
      )

      const proofPath = `${order.order_id}/proof-view.jpg`
      await service.storage.from(PROOF_BUCKET).upload(proofPath, Buffer.from('GAMBAR_BUKTI_VALID'), {
        contentType: 'image/jpeg',
      })
      uploadedPathsToClean.push(proofPath)

      // Staf membuat signed URL 60 detik
      const { data, error } = await users.staff.client.storage
        .from(PROOF_BUCKET)
        .createSignedUrl(proofPath, 60)

      expect(error).toBeNull()
      expect(data?.signedUrl).toBeTruthy()
      expect(data?.signedUrl).toContain('token=')
    })
  })
})
