import { describe, expect, it } from 'vitest'
import { DB_ERROR_MESSAGES, IDEMPOTENCY_CONFLICT, UNKNOWN_ERROR, mapDbError } from '@/lib/errors'

describe('mapDbError (§9.6)', () => {
  it.each([
    ['EMPTY_CART', 'Keranjang kosong.'],
    ['INVALID_ITEM', 'Ada item yang tidak valid. Muat ulang keranjang Anda.'],
    ['VARIANT_UNAVAILABLE', 'Salah satu produk sudah tidak tersedia.'],
    ['INSUFFICIENT_STOCK', 'Stok salah satu produk tidak mencukupi. Kurangi jumlah atau pilih varian lain.'],
    ['INVALID_ADDRESS', 'Alamat pengiriman belum lengkap.'],
    ['SHIPPING_UNAVAILABLE', 'Pengiriman ke wilayah ini belum tersedia. Hubungi kami.'],
    ['FORBIDDEN', 'Anda tidak memiliki akses.'],
    ['ORDER_NOT_FOUND', 'Pesanan tidak ditemukan.'],
    ['INVALID_TRANSITION', 'Status pesanan tidak dapat diubah seperti itu.'],
  ])('%s -> pesan UI', (code, message) => {
    expect(mapDbError({ message: code, code: 'P0001' })).toEqual({ code, message })
  })

  it('mencakup semua kode di tabel §9.6', () => {
    expect(Object.keys(DB_ERROR_MESSAGES)).toHaveLength(9)
  })

  it('memakai awalan sebelum ":" dan tidak membocorkan detail teknis', () => {
    const variantId = '6f1c2b8e-0000-4000-8000-000000000000'
    const result = mapDbError({ message: `INSUFFICIENT_STOCK:${variantId}`, code: 'P0001' })
    expect(result.code).toBe('INSUFFICIENT_STOCK')
    expect(result.message).not.toContain(variantId)
    expect(mapDbError({ message: `VARIANT_UNAVAILABLE:${variantId}` }).code).toBe('VARIANT_UNAVAILABLE')
  })

  it('SQLSTATE 23505 pada idempotency_key -> IDEMPOTENCY_CONFLICT "Coba lagi."', () => {
    const viaMessage = mapDbError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "orders_idempotency_key_key"',
    })
    const viaDetails = mapDbError({
      code: '23505',
      message: 'duplicate key value violates unique constraint',
      details: 'Key (idempotency_key)=(abc) already exists.',
    })
    expect(viaMessage).toEqual({ code: IDEMPOTENCY_CONFLICT, message: 'Coba lagi.' })
    expect(viaDetails).toEqual(viaMessage)
  })

  it('23505 pada kolom lain bukan konflik idempotensi', () => {
    const result = mapDbError({
      code: '23505',
      message: 'duplicate key value violates unique constraint "products_slug_key"',
    })
    expect(result.code).toBe(UNKNOWN_ERROR)
  })

  it.each([
    ['pesan teknis tak dikenal', { message: 'permission denied for table orders', code: '42501' }],
    ['kode mirip tapi bukan awalan', { message: 'xFORBIDDEN' }],
    ['objek kosong', {}],
    ['null', null],
    ['string', 'FORBIDDEN'],
    ['Error biasa', new Error('boom')],
  ])('%s -> UNKNOWN dengan pesan umum', (_label, input) => {
    expect(mapDbError(input)).toEqual({ code: UNKNOWN_ERROR, message: 'Terjadi kesalahan. Coba lagi.' })
  })
})
