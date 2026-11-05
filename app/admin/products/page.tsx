import type { Metadata } from 'next'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/guards'
import { listAdminCategories } from '@/services/admin/categories.service'
import { listAdminProducts } from '@/services/admin/products.service'
import { parseAdminProductsSearchParams } from '@/lib/validations/product'
import { Button } from '@/components/ui/button'
import { ProductsTable } from '@/components/admin/products/products-table'

export const metadata: Metadata = {
  title: 'Produk | Admin Hairy Hijab',
  robots: {
    index: false,
    follow: false,
  },
}

export const instant = false

type AdminProductsPageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>
}

export default async function AdminProductsPage({
  searchParams,
}: AdminProductsPageProps) {
  await requireAdmin()

  const rawParams = await searchParams
  const filters = parseAdminProductsSearchParams(rawParams)

  const [productsResult, categories] = await Promise.all([
    listAdminProducts(filters),
    listAdminCategories(),
  ])

  const categoryOptions = categories.map((c) => ({
    id: c.id,
    name: c.name,
  }))

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-espresso">
            Manajemen Produk
          </h1>
          <p className="text-sm text-espresso/70 mt-1">
            Kelola katalog produk hijab, spesifikasi, status tampil, serta varian dan foto ({productsResult.count} produk ditemukan).
          </p>
        </div>

        <Button
          asChild
          className="bg-espresso text-ivory hover:bg-espresso/90 gap-2 self-start sm:self-auto"
        >
          <Link href="/admin/products/new">
            <Plus className="h-4 w-4" />
            <span>Tambah Produk</span>
          </Link>
        </Button>
      </div>

      {/* Tabel & Filter Produk */}
      <ProductsTable
        products={productsResult.data}
        count={productsResult.count}
        page={productsResult.page}
        pageSize={productsResult.pageSize}
        filters={filters}
        categories={categoryOptions}
      />
    </div>
  )
}
