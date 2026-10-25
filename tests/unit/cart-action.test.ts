import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const query = {
  select: vi.fn(),
  in: vi.fn(),
  eq: vi.fn(),
}
for (const method of Object.values(query)) method.mockReturnValue(query)
query.eq.mockReturnValue(query)
const from = vi.fn(() => query)
const createPublicClient = vi.fn(() => ({ from }))
vi.mock('@/lib/supabase/public', () => ({ createPublicClient: () => createPublicClient() }))

import { getCartSnapshot } from '@/actions/cart.actions'

const variantId = '11111111-1111-4111-8111-111111111111'

describe('getCartSnapshot', () => {
  beforeEach(() => vi.clearAllMocks())

  it('validates line count, UUID, and quantity bounds before querying', async () => {
    expect(await getCartSnapshot([{ variantId: 'bad', quantity: 1 }])).toMatchObject({ ok: false })
    expect(await getCartSnapshot([{ variantId, quantity: 21 }])).toMatchObject({ ok: false })
    expect(await getCartSnapshot(Array.from({ length: 31 }, () => ({ variantId, quantity: 1 })))).toMatchObject({ ok: false })
    expect(createPublicClient).not.toHaveBeenCalled()
  })

  it('returns empty snapshot without a database query', async () => {
    expect(await getCartSnapshot([])).toEqual({ ok: true, data: [] })
    expect(createPublicClient).not.toHaveBeenCalled()
  })

  it('queries active rows only and computes status with database values', async () => {
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({
      data: [{
        id: variantId, size: 'M', color_name: 'Hitam', price: 75000,
        compare_at_price: null, stock_quantity: 1,
        product: { name: 'Produk DB', slug: 'produk-db', images: [] },
      }],
      error: null,
    })
    const result = await getCartSnapshot([{ variantId, quantity: 2 }])
    expect(query.eq).toHaveBeenCalledWith('is_active', true)
    expect(query.eq).toHaveBeenCalledWith('product.is_active', true)
    expect(result).toMatchObject({ ok: true, data: [{ productName: 'Produk DB', price: 75000, status: 'insufficient' }] })
  })

  it('maps a variant hidden by RLS to unavailable', async () => {
    query.eq.mockReturnValueOnce(query).mockResolvedValueOnce({ data: [], error: null })
    expect(await getCartSnapshot([{ variantId, quantity: 1 }])).toMatchObject({ ok: true, data: [{ status: 'unavailable' }] })
  })
})
