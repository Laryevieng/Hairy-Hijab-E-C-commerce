import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  NO_TEST_DATA,
  anonClient,
  cleanupTestData,
  countTestData,
  createCategory,
  createProduct,
  createTestUsers,
  createVariant,
  getVariant,
  newRunPrefix,
  serviceClient,
  type TestUser,
} from './helpers'

// Pengujian keamanan database untuk P8-05 (Varian Produk):
// 1. Membuktikan klien (anon, pelanggan, staf, maupun admin) TIDAK DAPAT meng-update kolom `stock_quantity` langsung (GRANT kolom §11.7).
// 2. Membuktikan admin dapat membuat varian dengan stok awal > 0 dan trigger `trg_variants_initial_stock` mencatat ke `stock_movements`.
// 3. Membuktikan constraint `uq_variant_combo` (UNIQUE NULLS NOT DISTINCT) menolak kombinasi (product_id, size, color_name) kembar.

const service = serviceClient()
const anon = anonClient()
const prefix = newRunPrefix()
const PG_DENIED = '42501'
const PG_UNIQUE = '23505'

let users: Record<'customerA' | 'staff' | 'admin', TestUser>
let productId: string
let variantId: string

beforeAll(async () => {
  users = await createTestUsers(service, prefix, [
    'customerA',
    'staff',
    'admin',
  ])

  const categoryId = await createCategory(service, prefix, 'cat-var')
  productId = await createProduct(service, {
    prefix,
    suffix: 'prod-var',
    categoryId,
  })
  variantId = await createVariant(service, {
    prefix,
    suffix: 'var-utama',
    productId,
    price: 45000,
    stock: 10,
  })
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
  expect(await countTestData(service, prefix)).toEqual(NO_TEST_DATA)
})

describe('P8-05 Keamanan Varian Produk & Proteksi Kolom Stok', () => {
  it('klien anon, pelanggan, staf, dan BAHKAN admin ditolak (42501) saat mencoba update stock_quantity langsung', async () => {
    const before = await getVariant(service, variantId)
    expect(before.stock_quantity).toBe(10)

    const attempts = await Promise.all([
      anon
        .from('product_variants')
        .update({ stock_quantity: 999 })
        .eq('id', variantId),
      users.customerA.client
        .from('product_variants')
        .update({ stock_quantity: 999 })
        .eq('id', variantId),
      users.staff.client
        .from('product_variants')
        .update({ stock_quantity: 999 })
        .eq('id', variantId),
      users.admin.client
        .from('product_variants')
        .update({ stock_quantity: 999 })
        .eq('id', variantId),
    ])

    for (const res of attempts) {
      expect(res.error?.code).toBe(PG_DENIED)
    }

    const after = await getVariant(service, variantId)
    expect(after.stock_quantity).toBe(10)
  })

  it('admin dapat meng-update kolom varian yang diizinkan (harga, harga coret, warna, ukuran, status) tanpa mengubah stok', async () => {
    const { data, error } = await users.admin.client
      .from('product_variants')
      .update({
        price: 48000,
        compare_at_price: 58000,
        color_hex: '#3B3028',
        color_hex_2: '#D9C7B4',
      })
      .eq('id', variantId)
      .select('id, price, compare_at_price, color_hex, color_hex_2, stock_quantity')
      .single()

    expect(error).toBeNull()
    expect(data).toMatchObject({
      id: variantId,
      price: 48000,
      compare_at_price: 58000,
      color_hex: '#3B3028',
      color_hex_2: '#D9C7B4',
      stock_quantity: 10,
    })
  })

  it('admin dapat membuat varian baru dengan stok awal > 0 dan trigger mencatat stock_movements initial', async () => {
    const sku = `${prefix}-sku-init`
    const { data: created, error } = await users.admin.client
      .from('product_variants')
      .insert({
        product_id: productId,
        sku,
        size: 'M',
        color_name: 'Olive',
        color_hex: '#556B2F',
        price: 50000,
        stock_quantity: 7,
      })
      .select('id, stock_quantity')
      .single()

    expect(error).toBeNull()
    expect(created?.stock_quantity).toBe(7)

    const { data: movements } = await service
      .from('stock_movements')
      .select('movement_type, quantity_delta, stock_after, actor_id')
      .eq('variant_id', created!.id)

    expect(movements).toEqual([
      {
        movement_type: 'initial',
        quantity_delta: 7,
        stock_after: 7,
        actor_id: users.admin.id,
      },
    ])
  })

  it('constraint uq_variant_combo menolak kombinasi (product_id, size, color_name) duplikat termasuk saat size NULL', async () => {
    const db = users.admin.client

    // 1. Duplikat dengan size = 'M' dan color_name = 'Olive' yang baru dibuat di atas
    const dupWithSize = await db.from('product_variants').insert({
      product_id: productId,
      sku: `${prefix}-sku-dup-1`,
      size: 'M',
      color_name: 'Olive',
      price: 50000,
    })
    expect(dupWithSize.error?.code).toBe(PG_UNIQUE)

    // 2. Duplikat dengan size = NULL dan color_name = 'Latte' (NULLS NOT DISTINCT)
    const firstNullSize = await db
      .from('product_variants')
      .insert({
        product_id: productId,
        sku: `${prefix}-sku-null-1`,
        size: null,
        color_name: 'Latte',
        price: 42000,
      })
      .select('id')
      .single()
    expect(firstNullSize.error).toBeNull()

    const secondNullSize = await db.from('product_variants').insert({
      product_id: productId,
      sku: `${prefix}-sku-null-2`,
      size: null,
      color_name: 'Latte',
      price: 42000,
    })
    expect(secondNullSize.error?.code).toBe(PG_UNIQUE)
  })
})
