/**
 * Utilitas format tampilan.
 * Uang selalu integer rupiah (§10.3). Format hanya di lapisan tampilan.
 * Waktu: simpan UTC, tampilkan zona Asia/Jakarta (§10.3).
 */

const rupiahFormatter = new Intl.NumberFormat('id-ID', {
  style: 'currency',
  currency: 'IDR',
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Format integer rupiah → "Rp 125.000" */
export function formatRupiah(amount: number): string {
  return rupiahFormatter.format(amount)
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'long',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

/** Format tanggal ke "21 Oktober 2026" (zona Asia/Jakarta). */
export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatter.format(d)
}

/** Format tanggal + waktu ke "21 Oktober 2026 15.30" (zona Asia/Jakarta). */
export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateTimeFormatter.format(d)
}
