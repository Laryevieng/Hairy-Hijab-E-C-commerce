/**
 * Utilitas format tampilan.
 * Uang selalu integer rupiah (§10.3). Format hanya di lapisan tampilan.
 * Waktu: simpan UTC, tampilkan zona Asia/Jakarta (§10.3).
 */

const numberFormatter = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
})

/** Format integer rupiah → "Rp 125.000" (D-04, §12.1) */
export function formatRupiah(amount: number): string {
  const truncated = Math.trunc(amount)
  if (truncated < 0) {
    return `-Rp ${numberFormatter.format(Math.abs(truncated))}`
  }
  return `Rp ${numberFormatter.format(truncated)}`
}

const dateFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'Asia/Jakarta',
})

const dateTimeFormatter = new Intl.DateTimeFormat('id-ID', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  timeZone: 'Asia/Jakarta',
})

/** Format tanggal ke "20 Okt 2026" (zona Asia/Jakarta, §12.1). */
export function formatDateID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateFormatter.format(d)
}

/** Format tanggal + waktu ke "20 Okt 2026, 15.30" (zona Asia/Jakarta). */
export function formatDateTimeID(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date
  return dateTimeFormatter.format(d)
}
