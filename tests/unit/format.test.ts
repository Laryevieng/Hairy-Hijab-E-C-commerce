import { describe, expect, it } from 'vitest'
import { formatDateID, formatDateTimeID, formatRupiah } from '@/lib/utils/format'

describe('formatRupiah', () => {
  it('memformat integer rupiah standar dengan titik ribuan (125000 -> Rp 125.000)', () => {
    expect(formatRupiah(125000)).toBe('Rp 125.000')
  })

  it('memformat nilai 0 dan jutaan', () => {
    expect(formatRupiah(0)).toBe('Rp 0')
    expect(formatRupiah(1500000)).toBe('Rp 1.500.000')
  })

  it('memformat nilai negatif dengan tanda minus di depan Rp', () => {
    expect(formatRupiah(-25000)).toBe('-Rp 25.000')
  })
})

describe('formatDateID & formatDateTimeID', () => {
  it('memformat tanggal UTC ke zona waktu Asia/Jakarta (WIB, UTC+7)', () => {
    // 2026-10-20 18:30 UTC = 2026-10-21 01:30 WIB
    const utcDate = '2026-10-20T18:30:00.000Z'
    expect(formatDateID(utcDate)).toContain('21')
    expect(formatDateID(utcDate)).toContain('2026')
    expect(formatDateTimeID(utcDate)).toContain('01.30')
  })

  it('menerima objek Date secara langsung', () => {
    const d = new Date('2026-10-20T05:00:00.000Z')
    expect(formatDateID(d)).toContain('20')
    expect(formatDateID(d)).toContain('2026')
  })
})
