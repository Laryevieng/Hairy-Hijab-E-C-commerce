import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  cleanupTestData,
  createCategory,
  createOrder,
  createProduct,
  createVariant,
  newRunPrefix,
  orderArgs,
  serviceClient,
} from './helpers'
import { MAX_PROOF_FILE_SIZE } from '@/lib/utils/file-signature'

// Mock `server-only` dan `next/cache` agar aman dijalankan di runner Node Vitest
vi.mock('server-only', () => ({}))
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
  revalidateTag: vi.fn(),
}))

const { submitPaymentProof } = await import('@/actions/payment.actions')

const service = serviceClient()
const prefix = newRunPrefix()

let variantId: string
const uploadedPathsToClean: string[] = []

// Buffer JPEG valid: diawali FF D8 FF
function makeValidJpegBuffer(size = 100): Buffer {
  const buf = Buffer.alloc(size)
  buf[0] = 0xff
  buf[1] = 0xd8
  buf[2] = 0xff
  buf[3] = 0xe0
  buf.write('JFIF', 6, 'ascii')
  return buf
}

// Buat File browser/Node untuk FormData
function makeJpegFile(fileName = 'bukti.jpg', size = 500): File {
  const buf = makeValidJpegBuffer(size)
  return new File([new Uint8Array(buf)], fileName, { type: 'image/jpeg' })
}

beforeAll(async () => {
  const categoryId = await createCategory(service, prefix, 'pay-cat')
  const productId = await createProduct(service, { prefix, suffix: 'pay-prod', categoryId })
  variantId = await createVariant(service, { prefix, suffix: 'v-pay', productId, price: 50000, stock: 20 })
})

afterAll(async () => {
  // Bersihkan bukti file yang sempat terunggah di storage
  if (uploadedPathsToClean.length > 0) {
    await service.storage.from('payment-proofs').remove(uploadedPathsToClean)
  }
  await cleanupTestData(service, prefix)
})

describe('P7-01: Unggah bukti transfer manual (actions/payment.actions.ts)', () => {
  it('1. Unggah valid -> proof_submitted, payment tercatat, file tersimpan di storage', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    const file = makeJpegFile('transfer-struk.jpg', 2048)
    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', order.public_token)
    formData.append('bankName', 'BCA')
    formData.append('senderName', `${prefix} Pengirim Asli`)
    formData.append('customerNote', 'Sudah ditransfer via m-banking')
    formData.append('file', file)

    const res = await submitPaymentProof(formData)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    expect(res.data.orderId).toBe(order.order_id)
    expect(res.data.orderNumber).toBe(order.order_number)

    // Verifikasi status order di DB
    const { data: orderRow } = await service
      .from('orders')
      .select('status, payment_status')
      .eq('id', order.order_id)
      .single()

    expect(orderRow?.status).toBe('pending')
    expect(orderRow?.payment_status).toBe('proof_submitted')

    // Verifikasi baris di tabel payments
    const { data: paymentRow } = await service
      .from('payments')
      .select('*')
      .eq('order_id', order.order_id)
      .single()

    expect(paymentRow).not.toBeNull()
    expect(paymentRow?.status).toBe('submitted')
    expect(paymentRow?.bank_name).toBe('BCA')
    expect(paymentRow?.sender_name).toBe(`${prefix} Pengirim Asli`)
    expect(paymentRow?.customer_note).toBe('Sudah ditransfer via m-banking')
    expect(paymentRow?.proof_path).toMatch(new RegExp(`^${order.order_id}/[a-f0-9-]+\\.jpg$`))

    if (paymentRow?.proof_path) {
      uploadedPathsToClean.push(paymentRow.proof_path)

      // Verifikasi file ada di bucket storage
      const [folder, fileName] = paymentRow.proof_path.split('/')
      const { data: files } = await service.storage.from('payment-proofs').list(folder)
      const found = files?.some((f) => f.name === fileName)
      expect(found).toBe(true)
    }
  })

  it('2. File non-gambar atau berekstensi palsu ditolak (INVALID_FILE_TYPE)', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    // File teks berpura-pura menjadi JPG
    const fakeContent = Buffer.from('INI_FILE_TEKS_PALSU_BUKAN_GAMBAR')
    const fakeFile = new File([new Uint8Array(fakeContent)], 'palsu.jpg', { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', order.public_token)
    formData.append('bankName', 'BCA')
    formData.append('senderName', 'Penipu')
    formData.append('file', fakeFile)

    const res = await submitPaymentProof(formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.error.code).toBe('INVALID_FILE_TYPE')

    // Verifikasi order tetap unpaid dan tidak ada pembayaran
    const { data: orderRow } = await service
      .from('orders')
      .select('payment_status')
      .eq('id', order.order_id)
      .single()
    expect(orderRow?.payment_status).toBe('unpaid')

    const { count } = await service
      .from('payments')
      .select('id', { count: 'exact', head: true })
      .eq('order_id', order.order_id)
    expect(count).toBe(0)
  })

  it('3. File melebihi batas ukuran 4 MB ditolak (FILE_TOO_LARGE)', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    // Buat file yang melebihi 4 MB
    const largeBuffer = makeValidJpegBuffer(MAX_PROOF_FILE_SIZE + 1024)
    const largeFile = new File([new Uint8Array(largeBuffer)], 'terlalu-besar.jpg', { type: 'image/jpeg' })

    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', order.public_token)
    formData.append('bankName', 'BCA')
    formData.append('senderName', 'Pengirim')
    formData.append('file', largeFile)

    const res = await submitPaymentProof(formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.error.code).toBe('FILE_TOO_LARGE')

    // Verifikasi order tetap unpaid
    const { data: orderRow } = await service
      .from('orders')
      .select('payment_status')
      .eq('id', order.order_id)
      .single()
    expect(orderRow?.payment_status).toBe('unpaid')
  })

  it('4. Pesanan kedaluwarsa ditolak (ORDER_EXPIRED)', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    // Setel expires_at ke masa lampau
    await service
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 3600_000).toISOString() })
      .eq('id', order.order_id)

    const file = makeJpegFile('bukti-expired.jpg')
    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', order.public_token)
    formData.append('bankName', 'BCA')
    formData.append('senderName', 'Pengirim')
    formData.append('file', file)

    const res = await submitPaymentProof(formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.error.code).toBe('ORDER_EXPIRED')
  })

  it('5. Tanpa token atau token salah ditolak (FORBIDDEN)', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    const file = makeJpegFile('bukti.jpg')
    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', 'token-palsu-salah-1234567890')
    formData.append('bankName', 'BCA')
    formData.append('senderName', 'Orang Asing')
    formData.append('file', file)

    const res = await submitPaymentProof(formData)
    expect(res.ok).toBe(false)
    if (res.ok) return

    expect(res.error.code).toBe('FORBIDDEN')

    // Verifikasi order tetap unpaid
    const { data: orderRow } = await service
      .from('orders')
      .select('payment_status')
      .eq('id', order.order_id)
      .single()
    expect(orderRow?.payment_status).toBe('unpaid')
  })

  it('6. Tidak ada objek yatim saat RPC gagal (file langsung dihapus dari storage)', async () => {
    const order = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] })
    )

    // Simulasikan kondisi di mana pesanan dibatalkan atau statusnya berubah
    // tepat sebelum RPC dieksekusi atau kita uji mekanisme rollback
    // Di sini kita ubah status order menjadi 'cancelled' via RPC cancel_order sehingga
    // submit_payment_proof di database pasti melempar INVALID_TRANSITION
    // Namun kita buat fungsi submitPaymentProof tetap mencoba proses
    // Untuk mengetes penghapusan file yatim:
    // 1. Ambil admin client
    // 2. Unggah file sementara manual untuk simulasi objek
    // 3. Kita verifikasi bahwa submitPaymentProof memanggil .storage.remove([fileKey]) bila RPC gagal
    // Lebih elegan: kita ubah expires_at di DB tepat setelah validasi, ATAU
    // buat RPC melempar exception:
    // Perhatikan di submit_payment_proof SQL:
    // `if v_order.status <> 'pending' or v_order.payment_status <> 'unpaid' ... raise exception 'INVALID_TRANSITION'`
    // Jika kita ubah order status di DB tepat sebelum RPC:
    // Mari kita cek: di submitPaymentProof:
    // query awal order -> status pending.
    // Tepat sebelum RPC, kita bisa menembak cancel_order di DB.
    // Atau yang lebih mudah dan deterministik:
    // Kita jalankan submitPaymentProof dengan mock adminClient.rpc yang mengembalikan error RPC!

    const file = makeJpegFile('yatim-test.jpg')
    const formData = new FormData()
    formData.append('orderId', order.order_id)
    formData.append('token', order.public_token)
    formData.append('bankName', 'BCA')
    formData.append('senderName', 'Uji Yatim')
    formData.append('file', file)

    const adminModule = await import('@/lib/supabase/admin')
    const originalCreateAdminClient = adminModule.createAdminClient

    let uploadedKey: string | null = null
    const spy = vi.spyOn(adminModule, 'createAdminClient').mockImplementation(() => {
      const client = originalCreateAdminClient()
      const originalFrom = client.storage.from.bind(client.storage)

      client.storage.from = ((bucketId: string) => {
        const bucketApi = originalFrom(bucketId)
        if (bucketId === 'payment-proofs') {
          const originalUpload = bucketApi.upload.bind(bucketApi)
          bucketApi.upload = (async (...args: Parameters<typeof originalUpload>) => {
            uploadedKey = args[0]
            return originalUpload(...args)
          }) as typeof bucketApi.upload
        }
        return bucketApi
      }) as unknown as typeof client.storage.from

      // Paksa RPC submit_payment_proof gagal
      const origRpc = client.rpc.bind(client)
      client.rpc = (async (fn: string, ...rpcArgs: [unknown?]) => {
        if (fn === 'submit_payment_proof') {
          return {
            data: null,
            error: {
              message: 'INVALID_TRANSITION',
              details: 'Simulasi kegagalan RPC',
              hint: '',
              code: 'P0001',
            },
          }
        }
        return (origRpc as unknown as (f: string, ...a: unknown[]) => unknown)(fn, ...rpcArgs)
      }) as unknown as typeof client.rpc

      return client
    })

    try {
      const res = await submitPaymentProof(formData)
      expect(res.ok).toBe(false)
      expect(uploadedKey).not.toBeNull()

      // Verifikasi bahwa file yang tadi sempat diunggah sekarang SUDAH DIHAPUS (tidak ada objek yatim)
      if (uploadedKey) {
        const [folder, fileName] = (uploadedKey as string).split('/')
        const { data: filesAfter } = await service.storage.from('payment-proofs').list(folder)
        const fileStillExists = filesAfter?.some((f) => f.name === fileName)
        expect(fileStillExists).toBe(false)
      }
    } finally {
      spy.mockRestore()
    }
  })
})
