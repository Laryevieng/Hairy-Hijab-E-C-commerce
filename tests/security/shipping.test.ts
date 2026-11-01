import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import {
  NO_TEST_DATA,
  cleanupTestData,
  countTestData,
  createCategory,
  createOrder,
  createProduct,
  createVariant,
  newRunPrefix,
  orderArgs,
  serviceClient,
  shippingAddress,
} from './helpers'

// `server-only` hanya boleh di-resolve dengan kondisi react-server; tes ini berjalan di Node biasa.
vi.mock('server-only', () => ({}))

const { getShippingQuote } = await import('@/services/shipping.service')

// P6-03: getShippingQuote terhadap data dev, dengan aturan yang sama seperti create_order.

const service = serviceClient()
const prefix = newRunPrefix()
const ACTIVE_PROVINCE = `${prefix}-aktif`
const INACTIVE_PROVINCE = `${prefix}-nonaktif`
const ACTIVE_COST = 13579
const INACTIVE_COST = 1

let defaultRate: { cost: number; label: string; estimated_days: string | null }

beforeAll(async () => {
  const { data, error } = await service
    .from('shipping_rates')
    .select('cost, label, estimated_days')
    .eq('province', '*')
    .eq('is_active', true)
    .single()
  if (error || !data) throw new Error('Tarif default "*" tidak ditemukan (migration reference_data).')
  defaultRate = data

  const { error: insertError } = await service.from('shipping_rates').insert([
    // Insert massal PostgREST mengisi kolom yang absen dengan null, jadi semua baris memuat kolom yang sama.
    { province: ACTIVE_PROVINCE, label: 'Tarif uji', cost: ACTIVE_COST, estimated_days: '1 hari', is_active: true },
    { province: INACTIVE_PROVINCE, label: 'Tarif uji nonaktif', cost: INACTIVE_COST, estimated_days: null, is_active: false },
  ])
  if (insertError) throw new Error(`insert shipping_rates: ${insertError.message}`)
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
  expect(await countTestData(service, prefix)).toEqual(NO_TEST_DATA)
})

describe('getShippingQuote (Supabase dev)', () => {
  it('provinsi tanpa baris khusus memakai tarif "*"', async () => {
    expect(await getShippingQuote(`${prefix}-tanpa-tarif`)).toEqual({
      cost: defaultRate.cost,
      label: defaultRate.label,
      estimatedDays: defaultRate.estimated_days,
    })
  })

  it('provinsi dengan baris aktif memakai tarifnya sendiri (tanpa beda huruf besar)', async () => {
    expect(await getShippingQuote(ACTIVE_PROVINCE.toUpperCase())).toEqual({
      cost: ACTIVE_COST,
      label: 'Tarif uji',
      estimatedDays: '1 hari',
    })
  })

  it('baris nonaktif diabaikan dan jatuh ke tarif "*"', async () => {
    const quote = await getShippingQuote(INACTIVE_PROVINCE)
    expect(quote?.cost).toBe(defaultRate.cost)
    expect(quote?.cost).not.toBe(INACTIVE_COST)
  })

  it('ongkir pratinjau sama dengan shipping_cost yang dihitung create_order', async () => {
    const categoryId = await createCategory(service, prefix, 'cat')
    const productId = await createProduct(service, { prefix, suffix: 'prod', categoryId })

    for (const [suffix, province] of [['v-aktif', ACTIVE_PROVINCE], ['v-nonaktif', INACTIVE_PROVINCE]] as const) {
      const variantId = await createVariant(service, { prefix, suffix, productId, price: 10000, stock: 5 })
      const order = await createOrder(
        service,
        orderArgs({ prefix, address: shippingAddress(province), items: [{ variant_id: variantId, quantity: 1 }] }),
      )
      const { data } = await service.from('orders').select('shipping_cost').eq('id', order.order_id).single()
      expect(data?.shipping_cost).toBe((await getShippingQuote(province))?.cost)
    }
  })
})
