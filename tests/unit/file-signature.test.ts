import { describe, expect, it } from 'vitest'
import {
  detectImageMime,
  isValidImageSignature,
  MIME_TO_EXT,
  MAX_PROOF_FILE_SIZE,
} from '@/lib/utils/file-signature'

describe('file-signature (P7-01a)', () => {
  it('konfigurasi batas ukuran adalah 4 MB', () => {
    expect(MAX_PROOF_FILE_SIZE).toBe(4 * 1024 * 1024)
    expect(MIME_TO_EXT['image/jpeg']).toBe('jpg')
    expect(MIME_TO_EXT['image/png']).toBe('png')
    expect(MIME_TO_EXT['image/webp']).toBe('webp')
  })

  it('mengenali magic bytes JPEG (FF D8 FF)', () => {
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01])
    expect(detectImageMime(jpegHeader)).toBe('image/jpeg')
    expect(isValidImageSignature(jpegHeader)).toBe(true)
  })

  it('mengenali magic bytes PNG (89 50 4E 47 0D 0A 1A 0A)', () => {
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0x00, 0x00, 0x00, 0x0d])
    expect(detectImageMime(pngHeader)).toBe('image/png')
    expect(isValidImageSignature(pngHeader)).toBe(true)
  })

  it('mengenali magic bytes WebP (RIFF....WEBP)', () => {
    // RIFF (4 bytes), file size (4 bytes), WEBP (4 bytes)
    const webpHeader = new Uint8Array([
      0x52, 0x49, 0x46, 0x46, // 'RIFF'
      0x24, 0x00, 0x00, 0x00, // file length dummy
      0x57, 0x45, 0x42, 0x50, // 'WEBP'
      0x56, 0x50, 0x38, 0x20, // 'VP8 '
    ])
    expect(detectImageMime(webpHeader)).toBe('image/webp')
    expect(isValidImageSignature(webpHeader)).toBe(true)
  })

  it('menolak file yang terlalu pendek (< 12 bytes)', () => {
    const shortHeader = new Uint8Array([0xff, 0xd8, 0xff])
    expect(detectImageMime(shortHeader)).toBeNull()
    expect(isValidImageSignature(shortHeader)).toBe(false)
  })

  it('menolak file teks atau file dengan ekstensi palsu', () => {
    // Teks biasa "Hello World! This is a test file pretending to be jpg"
    const textBuffer = Buffer.from('<?php echo "evil"; ?> some dummy text for test')
    expect(detectImageMime(textBuffer)).toBeNull()
    expect(isValidImageSignature(textBuffer)).toBe(false)

    // File PDF (%PDF-1.4)
    const pdfBuffer = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n')
    expect(detectImageMime(pdfBuffer)).toBeNull()
    expect(isValidImageSignature(pdfBuffer)).toBe(false)
  })
})
