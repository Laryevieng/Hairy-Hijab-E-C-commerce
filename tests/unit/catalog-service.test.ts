import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const chain = {
  select: vi.fn(),
  eq: vi.fn(),
  overlaps: vi.fn(),
  gte: vi.fn(),
  lte: vi.fn(),
  ilike: vi.fn(),
  order: vi.fn(),
  range: vi.fn(),
  limit: vi.fn(),
  maybeSingle: vi.fn(),
}

for (const method of Object.values(chain)) method.mockReturnValue(chain)

const from = vi.fn(() => chain)
vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => ({ from }),
}))

import { searchProducts } from '@/services/catalog.service'

describe('catalog service query behavior', () => {
  it('escapes ILIKE wildcards and paginates by the fixed page size', async () => {
    chain.range.mockResolvedValueOnce({ data: [], error: null, count: 0 })

    await searchProducts({
      page: 2,
      sort: 'newest',
      category: undefined,
      size: [],
      color: [],
      min: undefined,
      max: undefined,
      q: ['100%_', '\\'].join(''),
    })

    expect(chain.ilike).toHaveBeenCalledWith('name', '%100\\%\\_\\\\%')
    expect(chain.range).toHaveBeenCalledWith(24, 47)
  })

  it('applies range overlap filters and price overlap semantics', async () => {
    chain.range.mockResolvedValueOnce({ data: [], error: null, count: 0 })
    await searchProducts({
      page: 1,
      sort: 'price_asc',
      category: 'bergo',
      size: ['S'],
      color: ['Hitam'],
      min: 100,
      max: 500,
    })

    expect(chain.eq).toHaveBeenCalledWith('category_slug', 'bergo')
    expect(chain.overlaps).toHaveBeenCalledWith('sizes', ['S'])
    expect(chain.overlaps).toHaveBeenCalledWith('colors', ['Hitam'])
    expect(chain.gte).toHaveBeenCalledWith('max_price', 100)
    expect(chain.lte).toHaveBeenCalledWith('min_price', 500)
    expect(chain.order).toHaveBeenCalledWith('min_price', { ascending: true })
  })
})
