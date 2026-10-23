import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  NO_TEST_DATA,
  PROOF_BUCKET,
  anonClient,
  cleanupTestData,
  countTestData,
  createCategory,
  createOrder,
  createProduct,
  createTestUsers,
  createVariant,
  getVariant,
  newRunPrefix,
  orderArgs,
  serviceClient,
  type TestUser,
} from './helpers'

// Matriks §11.10 untuk anon, pelanggan, staf, dan admin (P2-12b).
// Baris service role ada di functions.test.ts (P2-12c).

const service = serviceClient()
const anon = anonClient()
const prefix = newRunPrefix()
const PG_DENIED = '42501'

let users: Record<'customerA' | 'customerB' | 'staff' | 'admin', TestUser>
let activeVariantId: string
let inactiveProductId: string
let inactiveProductVariantId: string
let inactiveVariantId: string
let orderA: string
let orderB: string
const proofPath = `${prefix}/bukti-a.png`

beforeAll(async () => {
  users = await createTestUsers(service, prefix, ['customerA', 'customerB', 'staff', 'admin'])

  const categoryId = await createCategory(service, prefix, 'cat')
  const activeProductId = await createProduct(service, { prefix, suffix: 'p-aktif', categoryId })
  activeVariantId = await createVariant(service, {
    prefix, suffix: 'v-aktif', productId: activeProductId, price: 50000, stock: 10,
  })
  inactiveVariantId = await createVariant(service, {
    prefix, suffix: 'v-nonaktif', productId: activeProductId, price: 50000, stock: 10, isActive: false,
  })
  inactiveProductId = await createProduct(service, {
    prefix, suffix: 'p-nonaktif', categoryId, isActive: false,
  })
  inactiveProductVariantId = await createVariant(service, {
    prefix, suffix: 'v-produk-nonaktif', productId: inactiveProductId, price: 50000, stock: 10,
  })

  const items = [{ variant_id: activeVariantId, quantity: 1 }]
  orderA = (await createOrder(service, orderArgs({ prefix, items, userId: users.customerA.id }))).order_id
  orderB = (await createOrder(service, orderArgs({ prefix, items, userId: users.customerB.id }))).order_id

  const { error: proofError } = await service.rpc('submit_payment_proof', {
    p_order_id: orderA,
    p_proof_path: proofPath,
    p_bank_name: 'Bank Uji',
    p_sender_name: 'Pengirim Uji',
    p_note: '',
  })
  if (proofError) throw new Error(`submit_payment_proof: ${proofError.message}`)

  const { error: uploadError } = await service.storage
    .from(PROOF_BUCKET)
    .upload(proofPath, new Uint8Array([137, 80, 78, 71]), { contentType: 'image/png' })
  if (uploadError) throw new Error(`upload bukti: ${uploadError.message}`)
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
  expect(await countTestData(service, prefix)).toEqual(NO_TEST_DATA)
})

describe('anon', () => {
  it('select produk/varian nonaktif -> 0 baris', async () => {
    const products = await anon.from('products').select('id').eq('id', inactiveProductId)
    expect(products.error).toBeNull()
    expect(products.data).toEqual([])

    const variants = await anon
      .from('product_variants')
      .select('id')
      .in('id', [inactiveVariantId, inactiveProductVariantId])
    expect(variants.error).toBeNull()
    expect(variants.data).toEqual([])

    // Kontrol positif: varian aktif tetap terlihat.
    const visible = await anon.from('product_variants').select('id').eq('id', activeVariantId)
    expect(visible.data).toHaveLength(1)
  })

  it.each(['orders', 'profiles', 'payments', 'stock_movements'] as const)(
    'select dari %s -> 42501',
    async (table) => {
      const { error } = await anon.from(table).select('id').limit(1)
      expect(error?.code).toBe(PG_DENIED)
    },
  )

  it('insert/update/delete di products -> 42501', async () => {
    const categoryId = await createCategory(service, prefix, 'cat-anon')
    const insert = await anon
      .from('products')
      .insert({ category_id: categoryId, name: `${prefix}-anon`, slug: `${prefix}-anon` })
    expect(insert.error?.code).toBe(PG_DENIED)

    const update = await anon.from('products').update({ name: 'diretas' }).eq('id', inactiveProductId)
    expect(update.error?.code).toBe(PG_DENIED)

    const remove = await anon.from('products').delete().eq('id', inactiveProductId)
    expect(remove.error?.code).toBe(PG_DENIED)
  })

  it('rpc create_order dan verify_payment -> 42501', async () => {
    const create = await anon.rpc(
      'create_order',
      orderArgs({ prefix, items: [{ variant_id: activeVariantId, quantity: 1 }] }),
    )
    expect(create.error?.code).toBe(PG_DENIED)

    const verify = await anon.rpc('verify_payment', { p_order_id: orderA })
    expect(verify.error?.code).toBe(PG_DENIED)
  })
})

describe('pelanggan A', () => {
  it('select pesanan pelanggan B -> 0 baris (pesanan sendiri tetap terlihat)', async () => {
    const other = await users.customerA.client.from('orders').select('id').eq('id', orderB)
    expect(other.error).toBeNull()
    expect(other.data).toEqual([])

    const own = await users.customerA.client.from('orders').select('id').eq('id', orderA)
    expect(own.data).toHaveLength(1)
  })

  it('insert/update di staff_roles -> ditolak', async () => {
    const client = users.customerA.client
    const insert = await client.from('staff_roles').insert({ user_id: users.customerA.id, role: 'admin' })
    expect(insert.error?.code).toBe(PG_DENIED)

    const update = await client.from('staff_roles').update({ role: 'admin' }).eq('user_id', users.staff.id)
    expect(update.error?.code).toBe(PG_DENIED)

    const { data: roles } = await service.from('staff_roles').select('user_id').eq('user_id', users.customerA.id)
    expect(roles).toEqual([])
  })

  it('update profiles milik B -> 0 baris terpengaruh', async () => {
    const { data, error } = await users.customerA.client
      .from('profiles')
      .update({ full_name: 'diretas' })
      .eq('id', users.customerB.id)
      .select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])

    const { data: profile } = await service
      .from('profiles')
      .select('full_name')
      .eq('id', users.customerB.id)
      .single()
    expect(profile?.full_name).toBe(`${prefix} customerB`)
  })

  it('update product_variants set stock_quantity -> ditolak (grant kolom)', async () => {
    const before = await getVariant(service, activeVariantId)
    const { error } = await users.customerA.client
      .from('product_variants')
      .update({ stock_quantity: 999 })
      .eq('id', activeVariantId)
    expect(error?.code).toBe(PG_DENIED)
    expect((await getVariant(service, activeVariantId)).stock_quantity).toBe(before.stock_quantity)
  })

  it('rpc verify_payment, cancel_order, adjust_stock -> FORBIDDEN', async () => {
    const client = users.customerA.client
    const calls = await Promise.all([
      client.rpc('verify_payment', { p_order_id: orderA }),
      client.rpc('cancel_order', { p_order_id: orderA, p_reason: 'uji' }),
      client.rpc('adjust_stock', { p_variant_id: activeVariantId, p_delta: 5, p_reason: 'uji' }),
    ])
    for (const { error } of calls) {
      expect(error?.message).toBe('FORBIDDEN')
    }
  })

  it('baca objek payment-proofs -> ditolak', async () => {
    const download = await users.customerA.client.storage.from(PROOF_BUCKET).download(proofPath)
    expect(download.data).toBeNull()
    expect(download.error).not.toBeNull()

    const signed = await users.customerA.client.storage.from(PROOF_BUCKET).createSignedUrl(proofPath, 60)
    expect(signed.data).toBeNull()
    expect(signed.error).not.toBeNull()
  })
})

describe('staf', () => {
  it('select semua pesanan -> berhasil (pesanan A dan B terlihat)', async () => {
    const { data, error } = await users.staff.client.from('orders').select('id').in('id', [orderA, orderB])
    expect(error).toBeNull()
    expect(data?.map((row) => row.id).sort()).toEqual([orderA, orderB].sort())
  })

  it('baca objek payment-proofs -> berhasil (kontrol positif untuk baris pelanggan)', async () => {
    const { data, error } = await users.staff.client.storage.from(PROOF_BUCKET).createSignedUrl(proofPath, 60)
    expect(error).toBeNull()
    expect(data?.signedUrl).toBeTruthy()
  })

  it('rpc verify_payment pada bukti terkirim -> berhasil', async () => {
    const { error } = await users.staff.client.rpc('verify_payment', { p_order_id: orderA })
    expect(error).toBeNull()

    const { data: order } = await service
      .from('orders')
      .select('status, payment_status, paid_at')
      .eq('id', orderA)
      .single()
    expect(order).toMatchObject({ status: 'processing', payment_status: 'paid' })
    expect(order?.paid_at).not.toBeNull()

    const { data: payment } = await service
      .from('payments')
      .select('status, reviewed_by')
      .eq('order_id', orderA)
      .single()
    expect(payment).toEqual({ status: 'verified', reviewed_by: users.staff.id })
  })

  it('update harga produk -> 0 baris terpengaruh', async () => {
    const before = await getVariant(service, activeVariantId)
    const { data, error } = await users.staff.client
      .from('product_variants')
      .update({ price: 1 })
      .eq('id', activeVariantId)
      .select('id')
    expect(error).toBeNull()
    expect(data).toEqual([])
    expect((await getVariant(service, activeVariantId)).price).toBe(before.price)
  })

  it('tulis kategori -> ditolak', async () => {
    const slug = `${prefix}-cat-staf`
    const { error } = await users.staff.client.from('categories').insert({ name: slug, slug })
    expect(error?.code).toBe(PG_DENIED)

    const { count } = await service
      .from('categories')
      .select('id', { count: 'exact', head: true })
      .eq('slug', slug)
    expect(count).toBe(0)
  })
})

describe('admin', () => {
  it('CRUD katalog (kategori, produk, varian, gambar) -> berhasil', async () => {
    const db = users.admin.client
    const slug = `${prefix}-admin`

    const category = await db.from('categories').insert({ name: slug, slug }).select('id').single()
    expect(category.error).toBeNull()
    const categoryId = category.data!.id

    const product = await db
      .from('products')
      .insert({ category_id: categoryId, name: slug, slug })
      .select('id')
      .single()
    expect(product.error).toBeNull()
    const productId = product.data!.id

    const variant = await db
      .from('product_variants')
      .insert({ product_id: productId, sku: slug, color_name: slug, price: 40000 })
      .select('id')
      .single()
    expect(variant.error).toBeNull()
    const variantId = variant.data!.id

    const image = await db
      .from('product_images')
      .insert({ product_id: productId, storage_path: `${slug}/gambar.webp`, alt_text: 'awal' })
      .select('id')
      .single()
    expect(image.error).toBeNull()
    const imageId = image.data!.id

    const updates = await Promise.all([
      db.from('categories').update({ description: 'diubah' }).eq('id', categoryId).select('id'),
      db.from('products').update({ description: 'diubah' }).eq('id', productId).select('id'),
      db.from('product_variants').update({ price: 45000 }).eq('id', variantId).select('id'),
      db.from('product_images').update({ alt_text: 'diubah' }).eq('id', imageId).select('id'),
    ])
    for (const { data, error } of updates) {
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    }

    // Hapus dari anak ke induk.
    for (const [table, id] of [
      ['product_images', imageId],
      ['product_variants', variantId],
      ['products', productId],
      ['categories', categoryId],
    ] as const) {
      const { data, error } = await db.from(table).delete().eq('id', id).select('id')
      expect(error).toBeNull()
      expect(data).toHaveLength(1)
    }
  })

  it('CRUD tarif ongkir -> berhasil', async () => {
    const db = users.admin.client
    const province = `${prefix}-prov`

    const created = await db.from('shipping_rates').insert({ province, cost: 15000 }).select('id').single()
    expect(created.error).toBeNull()
    const rateId = created.data!.id

    const read = await db.from('shipping_rates').select('cost').eq('id', rateId).single()
    expect(read.data?.cost).toBe(15000)

    const updated = await db.from('shipping_rates').update({ cost: 18000 }).eq('id', rateId).select('id')
    expect(updated.error).toBeNull()
    expect(updated.data).toHaveLength(1)

    const removed = await db.from('shipping_rates').delete().eq('id', rateId).select('id')
    expect(removed.error).toBeNull()
    expect(removed.data).toHaveLength(1)
  })

  it('update pengaturan toko -> berhasil (nilai asli dipulihkan)', async () => {
    const db = users.admin.client
    const { data: original } = await service
      .from('store_settings')
      .select('low_stock_threshold')
      .eq('id', 1)
      .single()
    expect(original).not.toBeNull()
    const threshold = original!.low_stock_threshold

    try {
      const { data, error } = await db
        .from('store_settings')
        .update({ low_stock_threshold: threshold + 1 })
        .eq('id', 1)
        .select('low_stock_threshold')
      expect(error).toBeNull()
      expect(data).toEqual([{ low_stock_threshold: threshold + 1 }])
    } finally {
      await service.from('store_settings').update({ low_stock_threshold: threshold }).eq('id', 1)
    }
  })
})
