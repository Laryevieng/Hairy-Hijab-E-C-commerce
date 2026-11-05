export type AllowedImageMime = 'image/jpeg' | 'image/png' | 'image/webp'
export type AllowedImageExt = 'jpg' | 'png' | 'webp'

/** Batas ukuran file bukti transfer: maksimal 4 MB (§14.1, P7-01) */
export const MAX_PROOF_FILE_SIZE = 4 * 1024 * 1024

export const MIME_TO_EXT: Record<AllowedImageMime, AllowedImageExt> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
}

/**
 * Mendeteksi tipe MIME gambar berdasarkan magic bytes (file signature),
 * BUKAN berdasarkan ekstensi atau klaim header HTTP.
 * Mendukung JPEG, PNG, dan WebP.
 */
export function detectImageMime(bytes: Uint8Array | ArrayBuffer | Buffer): AllowedImageMime | null {
  const buf = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)

  if (buf.length < 12) {
    return null
  }

  // 1. JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return 'image/jpeg'
  }

  // 2. PNG: 89 50 4E 47 0D 0A 1A 0A
  if (
    buf[0] === 0x89 &&
    buf[1] === 0x50 &&
    buf[2] === 0x4e &&
    buf[3] === 0x47 &&
    buf[4] === 0x0d &&
    buf[5] === 0x0a &&
    buf[6] === 0x1a &&
    buf[7] === 0x0a
  ) {
    return 'image/png'
  }

  // 3. WebP: RIFF (bytes 0..3) dan WEBP (bytes 8..11)
  if (
    buf[0] === 0x52 && // 'R'
    buf[1] === 0x49 && // 'I'
    buf[2] === 0x46 && // 'F'
    buf[3] === 0x46 && // 'F'
    buf[8] === 0x57 && // 'W'
    buf[9] === 0x45 && // 'E'
    buf[10] === 0x42 && // 'B'
    buf[11] === 0x50 // 'P'
  ) {
    return 'image/webp'
  }

  return null
}

export function isValidImageSignature(bytes: Uint8Array | ArrayBuffer | Buffer): boolean {
  return detectImageMime(bytes) !== null
}
