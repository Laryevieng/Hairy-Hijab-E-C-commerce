/**
 * Slug: huruf kecil, hapus diakritik, non-alfanumerik → "-".
 * Digunakan untuk URL produk dan kategori.
 */

/**
 * Buat slug dari teks: huruf kecil, hapus diakritik (NFD + strip combining marks),
 * ganti non-alfanumerik dengan "-", trim dan collapse "-" berurutan.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // hapus combining diacritical marks
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // non-alfanumerik → "-"
    .replace(/^-+|-+$/g, '')        // trim "-" di awal/akhir
    .replace(/-{2,}/g, '-')         // collapse "-" berurutan
}

/**
 * Menyarankan slug alternatif dengan akhiran angka (mulai dari -2)
 * apabila slug yang diinginkan sudah terpakai (P8-04).
 */
export function suggestNextSlug(
  slug: string,
  existingSlugs: Iterable<string> = []
): string {
  const normalized = slugify(slug) || 'produk'
  const base = normalized.replace(/-\d+$/, '') || normalized
  const existingSet = new Set(
    Array.from(existingSlugs, (item) => item.trim().toLowerCase())
  )

  let counter = 2
  while (existingSet.has(`${base}-${counter}`)) {
    counter += 1
  }
  return `${base}-${counter}`
}
