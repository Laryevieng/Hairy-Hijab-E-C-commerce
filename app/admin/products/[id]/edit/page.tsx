import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { requireAdmin } from '@/lib/auth/guards'
import { listAdminCategories } from '@/services/admin/categories.service'
import { getAdminProductById } from '@/services/admin/products.service'
import { productIdSchema } from '@/lib/validations/product'
import { ProductForm } from '@/components/admin/products/product-form'
import { VariantTable } from '@/components/admin/products/variant-table'
import { ImageUploader } from '@/components/admin/products/image-uploader'

export const metadata: Metadata = {
  title: 'Edit Produk | Admin Hairy Hijab',
  robots: {
    index: false,
    follow: false,
  },
}

export const instant = false

type AdminEditProductPageProps = {
  params: Promise<{ id: string }>
}

export default async function AdminEditProductPage({
  params,
}: AdminEditProductPageProps) {
  await requireAdmin()

  const { id } = await params
  const parsedId = productIdSchema.safeParse(id)
  if (!parsedId.success) {
    notFound()
  }

  const [product, categories] = await Promise.all([
    getAdminProductById(parsedId.data),
    listAdminCategories(),
  ])

  if (!product) {
    notFound()
  }

  const matchedCategory =
    product.category ??
    categories.find((c) => c.id === product.category_id) ?? {
      id: product.category_id,
      name: 'Kategori',
      slug: 'kategori',
      requires_size: false,
      size_options: [],
    }

  return (
    <div className="space-y-8">
      <ProductForm
        mode="edit"
        product={product}
        categories={categories.map((c) => ({
          id: c.id,
          name: c.name,
          is_active: c.is_active,
        }))}
      />

      {/* Seksi Varian Produk (P8-05) */}
      <VariantTable
        productId={product.id}
        category={{
          id: matchedCategory.id,
          name: matchedCategory.name,
          slug: matchedCategory.slug,
          requires_size: matchedCategory.requires_size,
          size_options: matchedCategory.size_options ?? [],
        }}
        variants={product.variants}
      />

      {/* Seksi Gambar Produk (P8-06) */}
      <ImageUploader
        productId={product.id}
        productName={product.name}
        images={product.images}
        variants={product.variants}
      />
    </div>
  )
}
