/**
 * Daftar 38 provinsi Indonesia (terkini per Oktober 2026).
 *
 * Sumber resmi:
 * - Kemendagri RI, Permendagri No. 72 Tahun 2019 tentang Perubahan atas
 *   Peraturan Menteri Dalam Negeri No. 137 Tahun 2017 tentang Kode dan Data
 *   Wilayah Administrasi Pemerintahan.
 * - BPS (Badan Pusat Statistik), Kode Wilayah 2024.
 * - UU No. 29/2024: Papua Tengah, Papua Pegunungan, Papua Selatan, dan
 *   Papua Barat Daya resmi sebagai provinsi baru (pemekaran Papua).
 *
 * Urutan: alfabetis menurut nama provinsi.
 */
export const PROVINCES = [
  'Aceh',
  'Bali',
  'Banten',
  'Bengkulu',
  'Daerah Istimewa Yogyakarta',
  'DKI Jakarta',
  'Gorontalo',
  'Jambi',
  'Jawa Barat',
  'Jawa Tengah',
  'Jawa Timur',
  'Kalimantan Barat',
  'Kalimantan Selatan',
  'Kalimantan Tengah',
  'Kalimantan Timur',
  'Kalimantan Utara',
  'Kepulauan Bangka Belitung',
  'Kepulauan Riau',
  'Lampung',
  'Maluku',
  'Maluku Utara',
  'Nusa Tenggara Barat',
  'Nusa Tenggara Timur',
  'Papua',
  'Papua Barat',
  'Papua Barat Daya',
  'Papua Pegunungan',
  'Papua Selatan',
  'Papua Tengah',
  'Riau',
  'Sulawesi Barat',
  'Sulawesi Selatan',
  'Sulawesi Tengah',
  'Sulawesi Tenggara',
  'Sulawesi Utara',
  'Sumatera Barat',
  'Sumatera Selatan',
  'Sumatera Utara',
] as const

export type Province = (typeof PROVINCES)[number]
