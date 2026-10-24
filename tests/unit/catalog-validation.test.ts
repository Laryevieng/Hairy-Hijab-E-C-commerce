import { describe, expect, it } from 'vitest'
import { parseCatalogSearchParams } from '@/lib/validations/catalog'

describe('parseCatalogSearchParams', () => {
  it('uses defaults and trims query and category', () => {
    expect(parseCatalogSearchParams(new URLSearchParams('q=%20hijab%20&category=%20bergo%20'))).toMatchObject({
      success: true,
      data: { page: 1, sort: 'newest', q: 'hijab', category: 'bergo', size: [], color: [] },
    })
  })

  it('parses repeated array filters and inclusive price range', () => {
    expect(
      parseCatalogSearchParams(
        new URLSearchParams('page=2&sort=price_asc&size=S&size=M&color=Hitam&min=10000&max=50000'),
      ),
    ).toMatchObject({
      success: true,
      data: { page: 2, sort: 'price_asc', size: ['S', 'M'], color: ['Hitam'], min: 10000, max: 50000 },
    })
  })

  it.each(['0', '-1', '1.5', 'not-a-number'])('rejects invalid page %s', (page) => {
    expect(parseCatalogSearchParams(new URLSearchParams(`page=${page}`)).success).toBe(false)
  })

  it('rejects unsupported sorting and inverted price bounds', () => {
    expect(parseCatalogSearchParams({ sort: 'random' }).success).toBe(false)
    expect(parseCatalogSearchParams({ min: '50', max: '10' }).success).toBe(false)
  })

  it('trims q and rejects more than 80 characters', () => {
    expect(parseCatalogSearchParams({ q: '  %_\\  ' })).toMatchObject({ success: true, data: { q: '%_\\' } })
    expect(parseCatalogSearchParams({ q: 'x'.repeat(81) }).success).toBe(false)
  })
})
