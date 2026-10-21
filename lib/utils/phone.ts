/**
 * Utilitas nomor telepon Indonesia.
 *
 * Aturan normalisasi (§14.3):
 * - Hapus karakter non-digit.
 * - Awalan "0" → "62".
 * - Awalan "+62" → "62".
 * - Valid jika diawali "628" dan panjang 10–14 digit (termasuk "62").
 *
 * Tautan WhatsApp: https://wa.me/<nomor>?text=<pesan>
 */

/**
 * Normalisasi nomor telepon Indonesia ke format internasional tanpa "+".
 * Mengembalikan string digit (misal "6281234567890") atau `null` jika tidak valid.
 *
 * Contoh input yang diterima:
 * - "0812-3456-7890" → "6281234567890"
 * - "+62 812 3456 7890" → "6281234567890"
 * - "812-3456-7890" → "6281234567890"
 * - "081234567890" → "6281234567890"
 */
export function normalizePhoneID(phone: string): string | null {
  // Hapus semua karakter non-digit
  let digits = phone.replace(/\D/g, '')

  // Hapus awalan "+" yang sudah hilang oleh replace di atas,
  // tapi tangani kasus awalan "62" vs "0" vs langsung "8..."
  if (digits.startsWith('62')) {
    // sudah format internasional (dari "+62..." atau "62...")
  } else if (digits.startsWith('0')) {
    digits = '62' + digits.slice(1)
  } else if (digits.startsWith('8')) {
    digits = '62' + digits
  } else {
    return null
  }

  // Validasi: harus diawali "628" dan panjang 10–14 digit
  if (!digits.startsWith('628')) return null
  if (digits.length < 10 || digits.length > 14) return null

  return digits
}

/**
 * Bangun tautan WhatsApp `https://wa.me/<nomor>?text=<pesan>`.
 * Nomor dinormalisasi terlebih dahulu; kembalikan `null` jika nomor tidak valid.
 */
export function buildWhatsAppLink(
  phone: string,
  message?: string
): string | null {
  const normalized = normalizePhoneID(phone)
  if (!normalized) return null

  const url = new URL(`https://wa.me/${normalized}`)
  if (message) {
    url.searchParams.set('text', message)
  }
  return url.toString()
}
