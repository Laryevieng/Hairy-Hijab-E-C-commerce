import Link from 'next/link'
import { formatRupiah } from '@/lib/utils/format'

export interface CatalogProduct {
  id: string | null
  slug: string | null
  name: string | null
  category_slug: string | null
  min_price: number | null
  image_path: string | null
  in_stock: boolean | null
  colors: string[] | null
}

export function CatalogProductCard({ product, categoryName }: { product: CatalogProduct; categoryName?: string }) {
  if (!product.id || !product.slug || !product.name) return null

  const imagePath = product.image_path?.split('/').map(encodeURIComponent).join('/')
  const imageUrl = imagePath
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${imagePath}`
    : null

  return (
    <article className="overflow-hidden rounded-md border border-sand/40 bg-ivory">
      <Link
        href={`/products/${product.slug}`}
        className="group block focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <div className="relative aspect-[3/4] bg-sand/20">
          {imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- public Supabase Storage URL is assembled from a validated bucket path.
            <img
              src={imageUrl}
              alt={product.name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-espresso/60">
              Foto produk belum tersedia
            </div>
          )}
        </div>
        <div className="space-y-2 p-3 sm:p-4">
          {(categoryName || product.category_slug) && (
            <p className="text-[11px] font-semibold uppercase tracking-wider text-espresso/60">
              {categoryName ?? product.category_slug?.replaceAll('-', ' ')}
            </p>
          )}
          <h2 className="line-clamp-2 min-h-12 font-serif text-base font-semibold text-espresso sm:text-lg">
            {product.name}
          </h2>
          {product.min_price !== null && (
            <p className="font-semibold text-espresso">Mulai {formatRupiah(product.min_price)}</p>
          )}
          <p className={product.in_stock ? 'text-sm text-success' : 'text-sm text-danger'}>
            {product.in_stock ? 'Tersedia' : 'Habis'}
          </p>
          {product.colors?.length ? (
            <p className="border-t border-sand/30 pt-2 text-xs text-espresso/70">
              Warna: {product.colors.join(', ')}
            </p>
          ) : null}
        </div>
      </Link>
    </article>
  )
}
