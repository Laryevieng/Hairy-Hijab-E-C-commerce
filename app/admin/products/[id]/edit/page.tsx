import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { Layers, Image as ImageIcon } from 'lucide-react'
import { requireAdmin } from '@/lib/auth/guards'
import { listAdminCategories } from '@/services/admin/categories.service'
import { getAdminProductById } from '@/services/admin/products.service'
import { productIdSchema } from '@/lib/validations/product'
import { ProductForm } from '@/components/admin/products/product-form'

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

      {/* Seksi Varian Produk — akan diisi VariantTable pada P8-05 */}
      <section
        aria-labelledby="product-variants-heading"
        className="rounded-lg border border-sand bg-ivory p-6 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between gap-2 border-b border-sand pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand/30 text-espresso">
              <Layers className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="product-variants-heading"
                className="font-serif text-lg font-bold text-espresso"
              >
                Varian Produk ({product.variants.length})
              </h2>
              <p className="text-xs text-espresso/70">
                Kelola SKU, ukuran, warna, dan harga per varian produk.
              </p>
            </div>
          </div>
        </div>
        {/* TODO(P8-05): pasang komponen VariantTable di sini */}
        <p className="text-xs text-espresso/70">
          Produk ini saat ini memiliki <strong>{product.variants.length}</strong> varian terdaftar. Tabel manajemen varian lengkap akan tersedia pada tahap P8-05.
        </p>
      </section>

      {/* Seksi Gambar Produk — akan diisi ImageUploader pada P8-06 */}
      <section
        aria-labelledby="product-images-heading"
        className="rounded-lg border border-sand bg-ivory p-6 shadow-xs space-y-3"
      >
        <div className="flex items-center justify-between gap-2 border-b border-sand pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-sand/30 text-espresso">
              <ImageIcon className="h-4 w-4" />
            </div>
            <div>
              <h2
                id="product-images-heading"
                className="font-serif text-lg font-bold text-espresso"
              >
                Galeri Gambar Produk ({product.images.length})
              </h2>
              <p className="text-xs text-espresso/70">
                Unggah dan atur urutan foto katalog untuk produk ini.
              </p>
            </div>
          </div>
        </div>
        {/* TODO(P8-06): pasang komponen ImageUploader di sini */}
        <p className="text-xs text-espresso/70">
          Produk ini saat ini memiliki <strong>{product.images.length}</strong> gambar terdaftar. Pengunggah dan pengatur urutan gambar akan tersedia pada tahap P8-06.
        </p>
      </section>
    </div>
  )
}
