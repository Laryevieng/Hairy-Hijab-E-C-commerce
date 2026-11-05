import type { Metadata } from 'next'
import { requireAdmin } from '@/lib/auth/guards'
import { listAdminCategories } from '@/services/admin/categories.service'
import { ProductForm } from '@/components/admin/products/product-form'

export const metadata: Metadata = {
  title: 'Tambah Produk Baru | Admin Hairy Hijab',
  robots: {
    index: false,
    follow: false,
  },
}

export const instant = false

export default async function AdminNewProductPage() {
  await requireAdmin()

  const categories = await listAdminCategories()

  return (
    <ProductForm
      mode="create"
      categories={categories.map((c) => ({
        id: c.id,
        name: c.name,
        is_active: c.is_active,
      }))}
    />
  )
}
