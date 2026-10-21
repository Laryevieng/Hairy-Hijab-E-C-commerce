/**
 * Data kategori sementara untuk pengembangan UI awal (Fase 1).
 * Sesuai spesifikasi §6.1 Delapan Kategori Hairy Hijab.
 * Akan digantikan oleh service katalog dari database di P4-04 (§15).
 */

export interface MockCategory {
  id: string
  name: string
  slug: string
  description: string
  requiresSize: boolean
  sizeOptions: string[]
  isActive: boolean
  sortOrder: number
}

export const MOCK_CATEGORIES: MockCategory[] = [
  {
    id: 'cat-1',
    name: 'Bergo Non Karet',
    slug: 'bergo-non-karet',
    description: 'Koleksi bergo non karet harian praktis, nyaman, dan sejuk.',
    requiresSize: true,
    sizeOptions: ['S', 'M'],
    isActive: true,
    sortOrder: 1,
  },
  {
    id: 'cat-2',
    name: 'Bergo Karet',
    slug: 'bergo-karet',
    description: 'Bergo dengan karet fleksibel pas di kepala tanpa menekan.',
    requiresSize: true,
    sizeOptions: ['S', 'M'],
    isActive: true,
    sortOrder: 2,
  },
  {
    id: 'cat-3',
    name: 'Pashmina Kaos Rayon',
    slug: 'pashmina-kaos-rayon',
    description: 'Pashmina kaos rayon sejuk, jatuh sempurna, dan mudah dibentuk.',
    requiresSize: false,
    sizeOptions: [],
    isActive: true,
    sortOrder: 3,
  },
  {
    id: 'cat-4',
    name: 'Pashmina Viscose',
    slug: 'pashmina-viscose',
    description: 'Pashmina bahan viscose lembut dengan drape mewah dan elegan.',
    requiresSize: false,
    sizeOptions: [],
    isActive: true,
    sortOrder: 4,
  },
  {
    id: 'cat-5',
    name: 'Pashmina Bandana',
    slug: 'pashmina-bandana',
    description: 'Inovasi pashmina menyatu dengan inner bandana praktis.',
    requiresSize: false,
    sizeOptions: [],
    isActive: true,
    sortOrder: 5,
  },
  {
    id: 'cat-6',
    name: 'Bergo Bandana',
    slug: 'bergo-bandana',
    description: 'Bergo model bandana rapi di dahi tanpa khawatir bergeser.',
    requiresSize: true,
    sizeOptions: ['S', 'M'],
    isActive: true,
    sortOrder: 6,
  },
  {
    id: 'cat-7',
    name: 'Bergo Bandana Two Tone',
    slug: 'bergo-bandana-two-tone',
    description: 'Kombinasi dua warna anggun pada model bergo bandana favorit.',
    requiresSize: true,
    sizeOptions: ['S', 'M'],
    isActive: true,
    sortOrder: 7,
  },
  {
    id: 'cat-8',
    name: 'Paris Jadul',
    slug: 'paris-jadul',
    description: 'Hijab segi empat paris klasik legendaris yang tegak paripurna.',
    requiresSize: false,
    sizeOptions: [],
    isActive: true,
    sortOrder: 8,
  },
]
