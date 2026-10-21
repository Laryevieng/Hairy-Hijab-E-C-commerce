import type { ProductListItem } from "@/types/domain"

/**
 * Data produk tiruan (mock) sementara untuk pengembangan UI awal (Fase 1).
 * Akan digantikan oleh catalog.service dari Supabase di Fase 4 (§15 P4-04).
 */
export const MOCK_PRODUCTS: ProductListItem[] = [
  {
    id: "prod-1",
    name: "Bergo Non Karet Daily Soft",
    slug: "bergo-non-karet-daily-soft",
    categoryName: "Bergo Non Karet",
    categorySlug: "bergo-non-karet",
    price: 65000,
    compareAtPrice: 85000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 24,
    isFeatured: true,
    colors: [
      { name: "Ivory", hex: "#F7F3EE" },
      { name: "Espresso", hex: "#3B3028" },
      { name: "Taupe", hex: "#A18A78" },
    ],
  },
  {
    id: "prod-2",
    name: "Bergo Karet Active Flex",
    slug: "bergo-karet-active-flex",
    categoryName: "Bergo Karet",
    categorySlug: "bergo-karet",
    price: 75000,
    compareAtPrice: 95000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 4, // Stok menipis
    isFeatured: true,
    colors: [
      { name: "Sand", hex: "#D9C7B4" },
      { name: "Espresso", hex: "#3B3028" },
    ],
  },
  {
    id: "prod-3",
    name: "Pashmina Kaos Rayon Flow",
    slug: "pashmina-kaos-rayon-flow",
    categoryName: "Pashmina Kaos Rayon",
    categorySlug: "pashmina-kaos-rayon",
    price: 89000,
    compareAtPrice: null, // Harga normal tanpa diskon
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 35,
    isFeatured: true,
    colors: [
      { name: "Taupe", hex: "#A18A78" },
      { name: "Gold", hex: "#B69A62" },
      { name: "Espresso", hex: "#3B3028" },
    ],
  },
  {
    id: "prod-4",
    name: "Pashmina Viscose Editorial Silk",
    slug: "pashmina-viscose-editorial-silk",
    categoryName: "Pashmina Viscose",
    categorySlug: "pashmina-viscose",
    price: 119000,
    compareAtPrice: 149000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 0, // Sold out
    isFeatured: false,
    colors: [
      { name: "Ivory", hex: "#F7F3EE" },
      { name: "Espresso", hex: "#3B3028" },
    ],
  },
  {
    id: "prod-5",
    name: "Pashmina Bandana Seamless 2-in-1",
    slug: "pashmina-bandana-seamless-2in1",
    categoryName: "Pashmina Bandana",
    categorySlug: "pashmina-bandana",
    price: 99000,
    compareAtPrice: 125000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 18,
    isFeatured: false,
    colors: [
      { name: "Sand", hex: "#D9C7B4" },
      { name: "Taupe", hex: "#A18A78" },
    ],
  },
  {
    id: "prod-6",
    name: "Bergo Bandana Minimalist",
    slug: "bergo-bandana-minimalist",
    categoryName: "Bergo Bandana",
    categorySlug: "bergo-bandana",
    price: 79000,
    compareAtPrice: null,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 12,
    isFeatured: false,
    colors: [
      { name: "Espresso", hex: "#3B3028" },
      { name: "Ivory", hex: "#F7F3EE" },
    ],
  },
  {
    id: "prod-7",
    name: "Bergo Bandana Two Tone Duo Tone",
    slug: "bergo-bandana-two-tone-duo",
    categoryName: "Bergo Bandana Two Tone",
    categorySlug: "bergo-bandana-two-tone",
    price: 85000,
    compareAtPrice: 110000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 2, // Stok menipis
    isFeatured: true,
    colors: [
      { name: "Sand / Espresso", hex: "#D9C7B4", hex2: "#3B3028" },
      { name: "Taupe / Ivory", hex: "#A18A78", hex2: "#F7F3EE" },
    ],
  },
  {
    id: "prod-8",
    name: "Paris Jadul Signature Square",
    slug: "paris-jadul-signature-square",
    categoryName: "Paris Jadul",
    categorySlug: "paris-jadul",
    price: 45000,
    compareAtPrice: 55000,
    primaryImageUrl: "/images/placeholders/product-placeholder.svg",
    totalStock: 50,
    isFeatured: true,
    colors: [
      { name: "Ivory", hex: "#F7F3EE" },
      { name: "Sand", hex: "#D9C7B4" },
      { name: "Taupe", hex: "#A18A78" },
      { name: "Espresso", hex: "#3B3028" },
    ],
  },
]
