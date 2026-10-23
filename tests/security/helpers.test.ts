import { afterAll, beforeAll, describe, expect, it } from 'vitest'
import {
  NO_TEST_DATA,
  PROOF_BUCKET,
  cleanupTestData,
  countTestData,
  createCategory,
  createOrder,
  createProduct,
  createTestUsers,
  createVariant,
  newRunPrefix,
  orderArgs,
  serviceClient,
  type TestUser,
} from './helpers'

const service = serviceClient()
const prefix = newRunPrefix()
let users: Record<'customerA' | 'staff' | 'admin', TestUser>

beforeAll(async () => {
  users = await createTestUsers(service, prefix, ['customerA', 'staff', 'admin'])
})

afterAll(async () => {
  await cleanupTestData(service, prefix)
})

describe('helper tes keamanan (P2-12a)', () => {
  it('klien terautentikasi login sebagai pengguna uji yang benar', async () => {
    for (const user of Object.values(users)) {
      const { data, error } = await user.client.auth.getUser()
      expect(error).toBeNull()
      expect(data.user?.id).toBe(user.id)
      expect(user.email.startsWith(prefix)).toBe(true)
    }
  })

  it('staff_roles diberikan lewat service dan terbaca oleh is_staff/is_admin', async () => {
    const check = async (user: TestUser) => {
      const [staff, admin] = await Promise.all([
        user.client.rpc('is_staff'),
        user.client.rpc('is_admin'),
      ])
      return { staff: staff.data, admin: admin.data }
    }
    expect(await check(users.customerA)).toEqual({ staff: false, admin: false })
    expect(await check(users.staff)).toEqual({ staff: true, admin: false })
    expect(await check(users.admin)).toEqual({ staff: true, admin: true })
  })

  it('pembersihan menghapus semua data berprefiks dan tidak menyisakan apa pun', async () => {
    const tempPrefix = `${prefix}-tmp`
    await createTestUsers(service, tempPrefix, ['customerB'])
    const categoryId = await createCategory(service, tempPrefix, 'cat')
    const productId = await createProduct(service, { prefix: tempPrefix, suffix: 'prod', categoryId })
    const variantId = await createVariant(service, {
      prefix: tempPrefix,
      suffix: 'var',
      productId,
      price: 10000,
      stock: 5,
    })
    await createOrder(service, orderArgs({ prefix: tempPrefix, items: [{ variant_id: variantId, quantity: 1 }] }))
    const { error: rateError } = await service
      .from('shipping_rates')
      .insert({ province: `${tempPrefix}-prov`, cost: 1000 })
    expect(rateError).toBeNull()
    const { error: uploadError } = await service.storage
      .from(PROOF_BUCKET)
      .upload(`${tempPrefix}/bukti.png`, new Uint8Array([137, 80, 78, 71]), { contentType: 'image/png' })
    expect(uploadError).toBeNull()

    const before = await countTestData(service, tempPrefix)
    expect(before).toEqual({
      orders: 1,
      categories: 1,
      products: 1,
      variants: 1,
      shippingRates: 1,
      proofs: 1,
      users: 1,
    })

    await cleanupTestData(service, tempPrefix)
    expect(await countTestData(service, tempPrefix)).toEqual(NO_TEST_DATA)
  })
})
