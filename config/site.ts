/** Konfigurasi situs — informasi statis yang dipakai di metadata dan UI. */
export const siteConfig = {
  name: 'Hairy Hijab',
  description:
    'Hairy Hijab — toko hijab online dengan koleksi terlengkap dan harga terjangkau.',
  url: process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000',
  locale: 'id-ID',
  currency: 'IDR',
  timezone: 'Asia/Jakarta',
  contact: {
    phone: '081234567890', // TODO(owner): nomor telepon/WhatsApp resmi toko
    whatsappFormatted: '+62 812-3456-7890',
    email: 'halo@hairyhijab.com', // TODO(owner): alamat email resmi toko
    address: 'Jakarta, Indonesia', // TODO(owner): alamat operasional toko
    hours: 'Senin – Sabtu, 09.00 – 17.00 WIB',
  },
} as const
