/**
 * Tipe domain entitas publik dan katalog Hairy Hijab (§15 P1-04).
 */

export interface ProductColorOption {
  name: string
  hex: string
  hex2?: string // Opsional untuk produk Two Tone (§6.1 #7)
}

export interface ProductListItem {
  id: string
  name: string
  slug: string
  categoryName: string
  categorySlug: string
  price: number // Integer rupiah
  compareAtPrice?: number | null // Integer rupiah, null bila tidak ada harga coret
  primaryImageUrl: string
  secondaryImageUrl?: string | null
  totalStock: number // Jumlah stok dari seluruh varian aktif
  isFeatured?: boolean
  colors?: ProductColorOption[]
}

export interface CategoryListItem {
  id: string
  name: string
  slug: string
  description?: string
  imagePath?: string | null
  productCount?: number
}
