import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/guards'
import { listAdminCategories } from '@/services/admin/categories.service'
import { CategoriesManager } from '@/components/admin/categories/categories-manager'

export const metadata: Metadata = {
  title: 'Kategori Produk | Admin Hairy Hijab',
  robots: {
    index: false,
    follow: false,
  },
}

export const instant = false

export default async function AdminCategoriesPage() {
  // Setiap halaman yang khusus admin wajib memanggil requireAdmin() sendiri (§15 P8-01 & P8-03)
  await requireAdmin()

  const categories = await listAdminCategories()

  return <CategoriesManager categories={categories} />
}
