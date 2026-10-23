export const DEFAULT_NEXT_PATH = '/account'

// Origin buatan untuk mem-parse path relatif; hanya dipakai untuk membandingkan origin.
const PARSE_BASE = 'http://hairy.invalid'
const MAX_LENGTH = 2048

function hasUnsafeCharacter(value: string): boolean {
  for (let i = 0; i < value.length; i++) {
    const code = value.charCodeAt(i)
    // Backslash dibaca browser sebagai "/", karakter kontrol dibuang parser URL:
    // keduanya bisa mengubah "/\evil.com" atau "/\t/evil.com" menjadi "//evil.com".
    if (code === 0x5c || code < 0x20 || code === 0x7f) return true
  }
  return false
}

/**
 * Mengembalikan `value` bila berupa path relatif di situs ini (diawali "/" dan bukan "//");
 * selain itu `fallback`. Mencegah open redirect lewat parameter `next`.
 */
export function safeNextPath(value: unknown, fallback: string = DEFAULT_NEXT_PATH): string {
  if (typeof value !== 'string' || value.length === 0 || value.length > MAX_LENGTH) return fallback
  if (!value.startsWith('/') || value.startsWith('//')) return fallback
  if (hasUnsafeCharacter(value)) return fallback

  try {
    const url = new URL(value, PARSE_BASE)
    if (url.origin !== PARSE_BASE) return fallback
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return fallback
  }
}
