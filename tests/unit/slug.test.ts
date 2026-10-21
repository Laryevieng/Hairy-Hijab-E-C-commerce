import { describe, expect, it } from 'vitest'
import { slugify } from '@/lib/utils/slug'

describe('slugify', () => {
  it('mengubah teks ke huruf kecil dan mengganti spasi dengan tanda hubung', () => {
    expect(slugify('Bergo Bandana Two Tone')).toBe('bergo-bandana-two-tone')
  })

  it('menghapus diakritik/aksen karakter Unicode', () => {
    expect(slugify('Crème Brûlée Édition')).toBe('creme-brulee-edition')
  })

  it('mengganti karakter non-alfanumerik berurutan menjadi satu tanda hubung dan memangkas ujungnya', () => {
    expect(slugify('  --Pashmina & Viscose (Premium)!!-- ')).toBe(
      'pashmina-viscose-premium'
    )
  })

  it('mengembalikan string kosong bila tidak ada karakter alfanumerik', () => {
    expect(slugify('---!!!---')).toBe('')
  })
})
