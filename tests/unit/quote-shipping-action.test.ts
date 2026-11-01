import { beforeEach, describe, expect, it, vi } from 'vitest'

const { getShippingQuote } = vi.hoisted(() => ({ getShippingQuote: vi.fn() }))
vi.mock('@/services/shipping.service', () => ({ getShippingQuote }))

import { quoteShipping } from '@/actions/checkout.actions'

describe('quoteShipping', () => {
  beforeEach(() => {
    getShippingQuote.mockReset()
  })

  it('rejects a province outside config/regions without querying', async () => {
    const result = await quoteShipping('Narnia')
    expect(result).toMatchObject({ ok: false, error: { code: 'VALIDATION' } })
    expect(getShippingQuote).not.toHaveBeenCalled()
  })

  it('returns the quote for a valid province', async () => {
    getShippingQuote.mockResolvedValueOnce({ cost: 20000, label: 'Tarif flat', estimatedDays: '2–5 hari kerja' })
    expect(await quoteShipping('Bali')).toEqual({
      ok: true,
      data: { cost: 20000, label: 'Tarif flat', estimatedDays: '2–5 hari kerja' },
    })
    expect(getShippingQuote).toHaveBeenCalledWith('Bali')
  })

  it('maps a missing rate to SHIPPING_UNAVAILABLE', async () => {
    getShippingQuote.mockResolvedValueOnce(null)
    expect(await quoteShipping('Bali')).toEqual({
      ok: false,
      error: { code: 'SHIPPING_UNAVAILABLE', message: 'Pengiriman ke wilayah ini belum tersedia. Hubungi kami.' },
    })
  })

  it('hides technical errors behind a friendly message', async () => {
    getShippingQuote.mockRejectedValueOnce(new Error('connection refused'))
    const result = await quoteShipping('Bali')
    expect(result).toMatchObject({ ok: false, error: { code: 'UNKNOWN' } })
    expect(JSON.stringify(result)).not.toContain('connection refused')
  })
})
