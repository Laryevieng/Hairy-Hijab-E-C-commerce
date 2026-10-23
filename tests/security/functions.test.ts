import { randomUUID } from 'node:crypto'
import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  NO_TEST_DATA,
  callCreateOrder,
  cleanupTestData,
  countTestData,
  createCategory,
  createOrder,
  createProduct,
  createTestUsers,
  createVariant,
  getStock,
  newRunPrefix,
  orderArgs,
  serviceClient,
  shippingAddress,
  type TestUser,
} from './helpers'

// Fungsi bisnis §11.5 dan baris service role matriks §11.10 (P2-12c).

const service = serviceClient()
const prefix = newRunPrefix()
const ORDER_NUMBER = /^HH-\d{6}-[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{5}$/
const PRICE = 50000

let staff: TestUser
let productId: string
let defaultShipping: number

async function newVariant(suffix: string, stock: number, isActive = true): Promise<string> {
  return createVariant(service, { prefix, suffix, productId, price: PRICE, stock, isActive })
}

async function countOrders(): Promise<number> {
  const { count, error } = await service
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .like('customer_name_snapshot', `${prefix}%`)
  if (error) throw new Error(error.message)
  return count ?? 0
}

async function movements(orderId: string, type: 'reserve' | 'release') {
  const { data, error } = await service
    .from('stock_movements')
    .select('variant_id, quantity_delta, stock_after')
    .eq('order_id', orderId)
    .eq('movement_type', type)
  if (error) throw new Error(error.message)
  return data
}

beforeAll(async () => {
  ;({ staff } = await createTestUsers(service, prefix, ['staff']))
  const categoryId = await createCategory(service, prefix, 'cat')
  productId = await createProduct(service, { prefix, suffix: 'prod', categoryId })

  const { data: rate, error } = await service
    .from('shipping_rates')
    .select('cost')
    .eq('province', '*')
    .eq('is_active', true)
    .single()
  if (error || !rate) throw new Error('Tarif default "*" tidak ditemukan (migration reference_data).')
  defaultShipping = rate.cost
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
  expect(await countTestData(service, prefix)).toEqual(NO_TEST_DATA)
})

describe('create_order: validasi', () => {
  let variantId: string
  let inactiveId: string

  beforeAll(async () => {
    variantId = await newVariant('v-validasi', 5)
    inactiveId = await newVariant('v-validasi-nonaktif', 5, false)
  })

  it.each([
    ['keranjang kosong', () => orderArgs({ prefix, items: [] }), 'EMPTY_CART'],
    [
      'lebih dari 30 baris',
      () => orderArgs({ prefix, items: Array.from({ length: 31 }, () => ({ variant_id: variantId, quantity: 1 })) }),
      'INVALID_ITEM',
    ],
    ['jumlah 0', () => orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 0 }] }), 'INVALID_ITEM'],
    ['jumlah 21', () => orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 21 }] }), 'INVALID_ITEM'],
    [
      'baris duplikat digabung melebihi 20',
      () =>
        orderArgs({
          prefix,
          items: [
            { variant_id: variantId, quantity: 15 },
            { variant_id: variantId, quantity: 6 },
          ],
        }),
      'INVALID_ITEM',
    ],
    [
      'alamat tanpa kota',
      () =>
        orderArgs({
          prefix,
          items: [{ variant_id: variantId, quantity: 1 }],
          address: { ...(shippingAddress() as Record<string, string>), city: '  ' },
        }),
      'INVALID_ADDRESS',
    ],
  ])('%s -> %s', async (_label, buildArgs, expected) => {
    const { result, error } = await callCreateOrder(service, buildArgs())
    expect(result).toBeNull()
    expect(error?.message).toBe(expected)
  })

  it('varian nonaktif atau tidak ada -> VARIANT_UNAVAILABLE', async () => {
    for (const id of [inactiveId, randomUUID()]) {
      const { error } = await callCreateOrder(service, orderArgs({ prefix, items: [{ variant_id: id, quantity: 1 }] }))
      expect(error?.message).toBe(`VARIANT_UNAVAILABLE:${id}`)
    }
  })

  it('stok kurang -> INSUFFICIENT_STOCK', async () => {
    const { error } = await callCreateOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 6 }] }),
    )
    expect(error?.message).toBe(`INSUFFICIENT_STOCK:${variantId}`)
  })

  it('kegagalan tidak meninggalkan pesanan dan tidak mengubah stok (rollback)', async () => {
    expect(await countOrders()).toBe(0)
    expect(await getStock(service, variantId)).toBe(5)
  })
})

describe('create_order: pesanan, snapshot harga, ongkir', () => {
  it('nomor unik, item digabung, alamat tersimpan, total dari database', async () => {
    const variantId = await newVariant('v-pesanan', 10)
    const address = shippingAddress()
    const order = await createOrder(
      service,
      orderArgs({
        prefix,
        address,
        items: [
          { variant_id: variantId, quantity: 1 },
          { variant_id: variantId, quantity: 2 },
        ],
      }),
    )
    expect(order.replayed).toBe(false)
    expect(order.order_number).toMatch(ORDER_NUMBER)
    expect(order.public_token).toMatch(/^[0-9a-f]{32}$/)

    const { data: row } = await service
      .from('orders')
      .select('status, payment_status, subtotal, shipping_cost, grand_total, shipping_address_snapshot, expires_at')
      .eq('id', order.order_id)
      .single()
    expect(row).toMatchObject({
      status: 'pending',
      payment_status: 'unpaid',
      subtotal: PRICE * 3,
      shipping_cost: defaultShipping,
      grand_total: PRICE * 3 + defaultShipping,
      shipping_address_snapshot: address,
    })
    expect(new Date(row!.expires_at).getTime()).toBeGreaterThan(Date.now())

    const { data: items } = await service
      .from('order_items')
      .select('variant_id, unit_price, quantity, line_total, sku_snapshot')
      .eq('order_id', order.order_id)
    expect(items).toEqual([
      { variant_id: variantId, unit_price: PRICE, quantity: 3, line_total: PRICE * 3, sku_snapshot: `${prefix}-v-pesanan` },
    ])

    expect(await getStock(service, variantId)).toBe(7)
    expect(await movements(order.order_id, 'reserve')).toEqual([
      { variant_id: variantId, quantity_delta: -3, stock_after: 7 },
    ])

    // Snapshot: perubahan harga dan nonaktif setelah dipesan tidak mengubah pesanan lama.
    await service.from('product_variants').update({ price: PRICE * 2, is_active: false }).eq('id', variantId)
    const { data: after } = await service
      .from('order_items')
      .select('unit_price, line_total')
      .eq('order_id', order.order_id)
      .single()
    expect(after).toEqual({ unit_price: PRICE, line_total: PRICE * 3 })

    const second = await createOrder(
      service,
      orderArgs({ prefix, items: [{ variant_id: await newVariant('v-pesanan-2', 1), quantity: 1 }] }),
    )
    expect(second.order_number).not.toBe(order.order_number)
  })

  it('ongkir memakai tarif provinsi (tanpa beda huruf besar) sebelum tarif default "*"', async () => {
    const province = `${prefix}-prov`
    const { error } = await service.from('shipping_rates').insert({ province, cost: 12345 })
    expect(error).toBeNull()

    const variantId = await newVariant('v-ongkir', 5)
    const order = await createOrder(
      service,
      orderArgs({
        prefix,
        address: shippingAddress(province.toUpperCase()),
        items: [{ variant_id: variantId, quantity: 1 }],
      }),
    )
    const { data } = await service
      .from('orders')
      .select('shipping_cost, grand_total')
      .eq('id', order.order_id)
      .single()
    expect(data).toEqual({ shipping_cost: 12345, grand_total: PRICE + 12345 })
  })
})

describe('create_order: idempotensi dan konkurensi (service role)', () => {
  it('idempotency_key sama dua kali -> satu pesanan, replayed = true pada panggilan kedua', async () => {
    const variantId = await newVariant('v-idem', 5)
    const args = orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 2 }] })

    const first = await createOrder(service, args)
    const second = await createOrder(service, args)
    expect(first.replayed).toBe(false)
    expect(second).toEqual({ ...first, replayed: true })

    const { count } = await service
      .from('orders')
      .select('id', { count: 'exact', head: true })
      .eq('idempotency_key', args.p_idempotency_key)
    expect(count).toBe(1)
    expect(await getStock(service, variantId)).toBe(3)
  })

  it('stok 1, dua panggilan serentak -> tepat satu berhasil, satu INSUFFICIENT_STOCK', async () => {
    const variantId = await newVariant('v-serentak', 1)
    const items = [{ variant_id: variantId, quantity: 1 }]
    const results = await Promise.all([
      callCreateOrder(service, orderArgs({ prefix, items })),
      callCreateOrder(service, orderArgs({ prefix, items })),
    ])

    const succeeded = results.filter((r) => r.result && !r.error)
    const rejected = results.filter((r) => r.error)
    expect(succeeded).toHaveLength(1)
    expect(rejected.map((r) => r.error?.message)).toEqual([`INSUFFICIENT_STOCK:${variantId}`])
    expect(await getStock(service, variantId)).toBe(0)
  })
})

describe('expire_unpaid_orders (service role)', () => {
  it('pesanan lewat tempo -> expired, stok kembali, stock_released_at terisi, panggilan kedua tidak menggandakan', async () => {
    const variantId = await newVariant('v-expire', 4)
    const order = await createOrder(service, orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 3 }] }))
    expect(await getStock(service, variantId)).toBe(1)

    const { error: backdateError } = await service
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq('id', order.order_id)
    expect(backdateError).toBeNull()

    // Jumlah bisa memuat pesanan lain di DB dev; yang diuji adalah keadaan pesanan uji.
    const first = await service.rpc('expire_unpaid_orders')
    expect(first.error).toBeNull()

    const { data: row } = await service
      .from('orders')
      .select('status, stock_released_at')
      .eq('id', order.order_id)
      .single()
    expect(row?.status).toBe('expired')
    expect(row?.stock_released_at).not.toBeNull()
    expect(await getStock(service, variantId)).toBe(4)

    const second = await service.rpc('expire_unpaid_orders')
    expect(second.error).toBeNull()
    expect(await getStock(service, variantId)).toBe(4)
    expect(await movements(order.order_id, 'release')).toEqual([
      { variant_id: variantId, quantity_delta: 3, stock_after: 4 },
    ])
  })

  it('pesanan belum lewat tempo tidak disentuh', async () => {
    const variantId = await newVariant('v-belum-expire', 2)
    const order = await createOrder(service, orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] }))

    expect((await service.rpc('expire_unpaid_orders')).error).toBeNull()

    const { data: row } = await service
      .from('orders')
      .select('status, stock_released_at')
      .eq('id', order.order_id)
      .single()
    expect(row).toEqual({ status: 'pending', stock_released_at: null })
    expect(await getStock(service, variantId)).toBe(1)
  })
})

describe('cancel_order (staf)', () => {
  it('stok kembali tepat sekali; pembatalan ulang ditolak INVALID_TRANSITION', async () => {
    const variantId = await newVariant('v-cancel', 5)
    const order = await createOrder(service, orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 2 }] }))
    expect(await getStock(service, variantId)).toBe(3)

    const first = await staff.client.rpc('cancel_order', { p_order_id: order.order_id, p_reason: 'Uji batal' })
    expect(first.error).toBeNull()

    const { data: row } = await service
      .from('orders')
      .select('status, cancel_reason, stock_released_at')
      .eq('id', order.order_id)
      .single()
    expect(row).toMatchObject({ status: 'cancelled', cancel_reason: 'Uji batal' })
    expect(row?.stock_released_at).not.toBeNull()
    expect(await getStock(service, variantId)).toBe(5)

    const second = await staff.client.rpc('cancel_order', { p_order_id: order.order_id, p_reason: 'Uji batal' })
    expect(second.error?.message).toBe('INVALID_TRANSITION')
    expect(await getStock(service, variantId)).toBe(5)
    expect(await movements(order.order_id, 'release')).toHaveLength(1)
  })

  it('pesanan kedaluwarsa tidak bisa dibatalkan dan stok tidak dilepas dua kali', async () => {
    const variantId = await newVariant('v-cancel-expired', 3)
    const order = await createOrder(service, orderArgs({ prefix, items: [{ variant_id: variantId, quantity: 1 }] }))
    await service
      .from('orders')
      .update({ expires_at: new Date(Date.now() - 60_000).toISOString() })
      .eq('id', order.order_id)
    expect((await service.rpc('expire_unpaid_orders')).error).toBeNull()
    expect(await getStock(service, variantId)).toBe(3)

    const { error } = await staff.client.rpc('cancel_order', { p_order_id: order.order_id, p_reason: 'Uji' })
    expect(error?.message).toBe('INVALID_TRANSITION')
    expect(await getStock(service, variantId)).toBe(3)
    expect(await movements(order.order_id, 'release')).toHaveLength(1)
  })

  it('pesanan tidak ada -> ORDER_NOT_FOUND', async () => {
    const { error } = await staff.client.rpc('cancel_order', { p_order_id: randomUUID(), p_reason: 'Uji' })
    expect(error?.message).toBe('ORDER_NOT_FOUND')
  })
})

describe('audit_tables_without_rls (service role)', () => {
  it('mengembalikan daftar kosong', async () => {
    const { data, error } = await service.rpc('audit_tables_without_rls')
    expect(error).toBeNull()
    expect(data).toEqual([])
  })
})
