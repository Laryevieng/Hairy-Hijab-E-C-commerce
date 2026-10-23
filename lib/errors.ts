/** Kode error dari fungsi database dan pesan UI-nya (§9.6). */
export const DB_ERROR_MESSAGES = {
  EMPTY_CART: 'Keranjang kosong.',
  INVALID_ITEM: 'Ada item yang tidak valid. Muat ulang keranjang Anda.',
  VARIANT_UNAVAILABLE: 'Salah satu produk sudah tidak tersedia.',
  INSUFFICIENT_STOCK: 'Stok salah satu produk tidak mencukupi. Kurangi jumlah atau pilih varian lain.',
  INVALID_ADDRESS: 'Alamat pengiriman belum lengkap.',
  SHIPPING_UNAVAILABLE: 'Pengiriman ke wilayah ini belum tersedia. Hubungi kami.',
  FORBIDDEN: 'Anda tidak memiliki akses.',
  ORDER_NOT_FOUND: 'Pesanan tidak ditemukan.',
  INVALID_TRANSITION: 'Status pesanan tidak dapat diubah seperti itu.',
} as const

export type DbErrorCode = keyof typeof DB_ERROR_MESSAGES

/**
 * SQLSTATE 23505 pada `idempotency_key`: Server Action memanggil ulang sekali,
 * lalu menampilkan pesan ini bila masih gagal.
 */
export const IDEMPOTENCY_CONFLICT = 'IDEMPOTENCY_CONFLICT'
export const UNKNOWN_ERROR = 'UNKNOWN'

const RETRY_MESSAGE = 'Coba lagi.'
const UNKNOWN_MESSAGE = 'Terjadi kesalahan. Coba lagi.'
const UNIQUE_VIOLATION = '23505'

export type MappedError =
  | { code: DbErrorCode; message: string }
  | { code: typeof IDEMPOTENCY_CONFLICT | typeof UNKNOWN_ERROR; message: string }

interface DbErrorLike {
  message?: unknown
  code?: unknown
  details?: unknown
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

function isDbErrorCode(value: string): value is DbErrorCode {
  return Object.hasOwn(DB_ERROR_MESSAGES, value)
}

/**
 * Menerjemahkan error Supabase/PostgREST menjadi `{ code, message }` yang aman ditampilkan.
 * Pesan teknis (detail SQL, id varian) tidak pernah diteruskan ke pengguna.
 */
export function mapDbError(error: unknown): MappedError {
  const source: DbErrorLike = typeof error === 'object' && error !== null ? error : {}
  const message = asText(source.message)

  // Awalan sebelum ":" (mis. "INSUFFICIENT_STOCK:<variant_id>").
  const prefix = message.split(':', 1)[0].trim()
  if (isDbErrorCode(prefix)) {
    return { code: prefix, message: DB_ERROR_MESSAGES[prefix] }
  }

  if (asText(source.code) === UNIQUE_VIOLATION && `${message} ${asText(source.details)}`.includes('idempotency_key')) {
    return { code: IDEMPOTENCY_CONFLICT, message: RETRY_MESSAGE }
  }

  return { code: UNKNOWN_ERROR, message: UNKNOWN_MESSAGE }
}
