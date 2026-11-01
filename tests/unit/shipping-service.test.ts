import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))

const eq = vi.fn()
const select = vi.fn(() => ({ eq }))
const from = vi.fn(() => ({ select }))
vi.mock('@/lib/supabase/public', () => ({
  createPublicClient: () => ({ from }),
}))

import { getShippingQuote } from '@/services/shipping.service'

const DEFAULT_ROW = { province: '*', label: 'Tarif flat', cost: 20000, estimated_days: '2–5 hari kerja' }
const JABAR_ROW = { province: 'Jawa Barat', label: 'Tarif Jawa Barat', cost: 12000, estimated_days: '1–2 hari kerja' }

function rows(data: unknown[] | null, error: unknown = null) {
  eq.mockResolvedValueOnce({ data, error })
}

describe('getShippingQuote', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('reads only active rates from shipping_rates', async () => {
    rows([DEFAULT_ROW])
    await getShippingQuote('Bali')
    expect(from).toHaveBeenCalledWith('shipping_rates')
    expect(eq).toHaveBeenCalledWith('is_active', true)
  })

  it('prefers the matching province over the default row, ignoring case and spaces', async () => {
    rows([DEFAULT_ROW, JABAR_ROW])
    expect(await getShippingQuote('  jawa BARAT ')).toEqual({
      cost: 12000, label: 'Tarif Jawa Barat', estimatedDays: '1–2 hari kerja',
    })
  })

  it('falls back to the "*" row when the province has no rate', async () => {
    rows([JABAR_ROW, DEFAULT_ROW])
    expect(await getShippingQuote('Bali')).toEqual({ cost: 20000, label: 'Tarif flat', estimatedDays: '2–5 hari kerja' })
  })

  it('returns null when neither a province rate nor a default exists', async () => {
    rows([JABAR_ROW])
    expect(await getShippingQuote('Bali')).toBeNull()
  })

  it('does not treat the literal "*" input as a province match', async () => {
    rows([JABAR_ROW])
    expect(await getShippingQuote('*')).toBeNull()
  })

  it('returns null for an empty province without querying', async () => {
    expect(await getShippingQuote('   ')).toBeNull()
    expect(from).not.toHaveBeenCalled()
  })

  it('throws a generic error when the query fails', async () => {
    rows(null, { message: 'boom' })
    await expect(getShippingQuote('Bali')).rejects.toThrow('Tarif ongkir tidak dapat dimuat.')
  })
})
