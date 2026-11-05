import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  NO_TEST_DATA,
  cleanupTestData,
  countTestData,
  createCategory,
  createProduct,
  createVariant,
  getStock,
  newRunPrefix,
  serviceClient,
} from './helpers'
import type { CheckoutData } from '@/lib/validations/checkout'

// `server-only` hanya boleh di-resolve dengan kondisi react-server; tes ini berjalan di Node biasa.
vi.mock('server-only', () => ({}))

const { createOrderFromCheckout } = await import('@/services/orders.service')
const { getOrderForViewer } = await import('@/services/orders.public.service')

const service = serviceClient()
const prefix = newRunPrefix()

let productId: string
let defaultShippingCost: number

function makeCheckoutInput(opts: {
  variantId: string
  quantity: number
  province?: CheckoutData['address']['province'] | (string & {})
  idempotencyKey?: string
  extraFields?: Record<string, unknown>
}): CheckoutData {
  return {
    customer: {
      name: `${prefix} Pelanggan Checkout`,
      phone: '081234567890',
      email: `${prefix}@example.com`,
    },
    address: {
      province: (opts.province ?? 'Jawa Barat') as CheckoutData['address']['province'],
      city: 'Bandung',
      district: 'Coblong',
      postalCode: '40132',
      addressDetail: 'Jl. RLS Checkout No. 10',
    },
    items: [
      {
        variantId: opts.variantId,
        quantity: opts.quantity,
        ...(opts.extraFields ?? {}),
      },
    ],
    idempotencyKey: opts.idempotencyKey ?? randomUUID(),
    notes: undefined,
  }
}

beforeAll(async () => {
  const categoryId = await createCategory(service, prefix, 'checkout-cat')
  productId = await createProduct(service, { prefix, suffix: 'checkout-prod', categoryId })

  const { data: defaultRate, error } = await service
    .from('shipping_rates')
    .select('cost')
    .eq('province', '*')
    .eq('is_active', true)
    .single()

  if (error || !defaultRate) {
    throw new Error('Tarif default "*" tidak ditemukan di shipping_rates.')
  }
  defaultShippingCost = defaultRate.cost
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
  expect(await countTestData(service, prefix)).toEqual(NO_TEST_DATA)
})

describe('P6-08 / S3: Field harga ekstra pada input diabaikan dan total tetap dari database', () => {
  it('input dengan harga/total palsu tidak mempengaruhi total pesanan maupun harga item di database', async () => {
    const REAL_PRICE = 65000
    const QUANTITY = 2
    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-s3-price',
      productId,
      price: REAL_PRICE,
      stock: 10,
    })

    // Input mengirim field palsu (price: 100, line_total: 200, grand_total: 500)
    const manipulatedInput = {
      ...makeCheckoutInput({
        variantId,
        quantity: QUANTITY,
        province: '*',
        extraFields: {
          price: 100,
          line_total: 200,
          unit_price: 100,
        },
      }),
      grand_total: 500,
      subtotal: 200,
      shipping_cost: 0,
    } as unknown as CheckoutData

    const res = await createOrderFromCheckout(service, manipulatedInput)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const { data: orderRow } = await service
      .from('orders')
      .select('subtotal, shipping_cost, grand_total, discount_amount')
      .eq('id', res.data.orderId)
      .single()

    const expectedSubtotal = REAL_PRICE * QUANTITY // 130.000
    const expectedGrandTotal = expectedSubtotal + defaultShippingCost

    // Harga dan total mutlak berasal dari database, bukan dari manipulasi input
    expect(orderRow?.subtotal).toBe(expectedSubtotal)
    expect(orderRow?.shipping_cost).toBe(defaultShippingCost)
    expect(orderRow?.grand_total).toBe(expectedGrandTotal)

    const { data: itemRows } = await service
      .from('order_items')
      .select('unit_price, line_total, quantity')
      .eq('order_id', res.data.orderId)

    expect(itemRows).toHaveLength(1)
    expect(itemRows?.[0].unit_price).toBe(REAL_PRICE)
    expect(itemRows?.[0].line_total).toBe(expectedSubtotal)
    expect(itemRows?.[0].quantity).toBe(QUANTITY)
  })
})

describe('P6-08 / S6: Snapshot pesanan lama utuh setelah harga produk diubah atau dinonaktifkan', () => {
  it('harga varian diubah dan produk dinonaktifkan, pesanan lama tetap menampilkan snapshot semula', async () => {
    const INITIAL_PRICE = 45000
    const S6_PROD_ID = await createProduct(service, {
      prefix,
      suffix: 's6-prod',
      categoryId: (await service.from('categories').select('id').like('slug', `${prefix}%`).single()).data!.id,
    })

    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-s6-snap',
      productId: S6_PROD_ID,
      price: INITIAL_PRICE,
      stock: 5,
    })

    const input = makeCheckoutInput({ variantId, quantity: 1, province: '*' })
    const res = await createOrderFromCheckout(service, input)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    // 1. Verifikasi snapshot pesanan tersimpan sesuai harga awal
    const viewerBefore = await getOrderForViewer({ orderNumber: res.data.orderNumber, token: res.data.publicToken }, service)
    expect(viewerBefore).not.toBeNull()
    expect(viewerBefore?.subtotal).toBe(INITIAL_PRICE)
    expect(viewerBefore?.items[0].unitPrice).toBe(INITIAL_PRICE)

    // 2. Ubah harga varian di DB secara drastis menjadi 150.000
    const { error: variantUpdateErr } = await service
      .from('product_variants')
      .update({ price: 150000 })
      .eq('id', variantId)
    expect(variantUpdateErr).toBeNull()

    // 3. Nonaktifkan produk di DB
    const { error: prodUpdateErr } = await service
      .from('products')
      .update({ is_active: false })
      .eq('id', S6_PROD_ID)
    expect(prodUpdateErr).toBeNull()

    // 4. Periksa kembali pesanan via getOrderForViewer dan database
    const viewerAfter = await getOrderForViewer({ orderNumber: res.data.orderNumber, token: res.data.publicToken }, service)
    expect(viewerAfter).not.toBeNull()

    // Nilai tidak boleh berubah mengikuti harga varian yang baru atau status nonaktif
    expect(viewerAfter?.subtotal).toBe(INITIAL_PRICE)
    expect(viewerAfter?.grandTotal).toBe(INITIAL_PRICE + defaultShippingCost)
    expect(viewerAfter?.items[0].unitPrice).toBe(INITIAL_PRICE)
    expect(viewerAfter?.items[0].lineTotal).toBe(INITIAL_PRICE)
  })
})

describe('P6-08: Idempotensi pada createOrderFromCheckout', () => {
  it('pemanggilan berulang dengan idempotencyKey sama mengembalikan pesanan yang sama tanpa mengurangi stok lagi', async () => {
    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-idem-chk',
      productId,
      price: 50000,
      stock: 6,
    })

    const key = randomUUID()
    const input = makeCheckoutInput({ variantId, quantity: 2, idempotencyKey: key })

    const first = await createOrderFromCheckout(service, input)
    expect(first.ok).toBe(true)
    if (!first.ok) return
    expect(first.data.replayed).toBe(false)

    const stockAfterFirst = await getStock(service, variantId)
    expect(stockAfterFirst).toBe(4) // 6 - 2 = 4

    const second = await createOrderFromCheckout(service, input)
    expect(second.ok).toBe(true)
    if (!second.ok) return
    expect(second.data.replayed).toBe(true)
    expect(second.data.orderNumber).toBe(first.data.orderNumber)
    expect(second.data.orderId).toBe(first.data.orderId)

    // Stok tidak boleh berkurang untuk kedua kalinya
    const stockAfterSecond = await getStock(service, variantId)
    expect(stockAfterSecond).toBe(4)

    // Hanya ada 1 pesanan di database dengan idempotency_key ini
    const { count } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('idempotency_key', key)
    expect(count).toBe(1)
  })
})

describe('P6-08: Stok kurang ditolak (INSUFFICIENT_STOCK)', () => {
  it('memesan melebihi stok yang tersedia menghasilkan error INSUFFICIENT_STOCK dan stok tetap utuh', async () => {
    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-out-stock',
      productId,
      price: 50000,
      stock: 2,
    })

    const input = makeCheckoutInput({ variantId, quantity: 5 })
    const res = await createOrderFromCheckout(service, input)

    expect(res.ok).toBe(false)
    if (res.ok) return
    expect(res.error.code).toBe('INSUFFICIENT_STOCK')

    // Stok di DB tetap 2
    expect(await getStock(service, variantId)).toBe(2)
  })
})

describe('P6-08: bank_accounts kosong ditolak (PAYMENT_UNAVAILABLE)', () => {
  it('jika store_settings.bank_accounts kosong, checkout ditolak dengan PAYMENT_UNAVAILABLE tanpa membuat pesanan', async () => {
    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-no-bank',
      productId,
      price: 50000,
      stock: 5,
    })

    // Ambil akun bank asli
    const { data: originalSettings } = await service
      .from('store_settings')
      .select('bank_accounts')
      .eq('id', 1)
      .single()

    const originalBankAccounts = originalSettings?.bank_accounts

    try {
      // Setel bank_accounts menjadi kosong []
      await service
        .from('store_settings')
        .update({ bank_accounts: [] })
        .eq('id', 1)

      const input = makeCheckoutInput({ variantId, quantity: 1 })
      const res = await createOrderFromCheckout(service, input)

      expect(res.ok).toBe(false)
      if (res.ok) return
      expect(res.error.code).toBe('PAYMENT_UNAVAILABLE')
      expect(res.error.message).toBe('Metode pembayaran belum tersedia. Hubungi kami.')

      // Stok tidak berkurang
      expect(await getStock(service, variantId)).toBe(5)
    } finally {
      // Kembalikan akun bank seperti semula
      await service
        .from('store_settings')
        .update({ bank_accounts: originalBankAccounts })
        .eq('id', 1)
    }
  })
})

describe('P6-08: Pengiriman memakai tarif default "*"', () => {
  it('provinsi yang tidak memiliki tarif khusus otomatis memakai tarif flat default "*"', async () => {
    const variantId = await createVariant(service, {
      prefix,
      suffix: 'v-def-shipping',
      productId,
      price: 50000,
      stock: 5,
    })

    // Provinsi tanpa entri spesifik
    const UNKNOWN_PROVINCE = 'Papua Pegunungan'
    const input = makeCheckoutInput({
      variantId,
      quantity: 1,
      province: UNKNOWN_PROVINCE,
    })

    const res = await createOrderFromCheckout(service, input)
    expect(res.ok).toBe(true)
    if (!res.ok) return

    const { data: order } = await service
      .from('orders')
      .select('shipping_cost, grand_total, subtotal')
      .eq('id', res.data.orderId)
      .single()

    expect(order?.shipping_cost).toBe(defaultShippingCost)
    expect(order?.grand_total).toBe((order?.subtotal ?? 0) + defaultShippingCost)
  })
})
