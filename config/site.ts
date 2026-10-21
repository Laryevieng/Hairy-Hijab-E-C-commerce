/** Konfigurasi situs — informasi statis yang dipakai di metadata dan UI. */
export const siteConfig = {
  name: 'Hairy Hijab',
  description:
    'Hairy Hijab — toko hijab online dengan koleksi terlengkap dan harga terjangkau.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'id-ID',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
} as const
