import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getProductBySlug, listProducts } from '@/services/catalog.service'
import { ProductGallery, type ProductGalleryImage } from '@/components/product/product-gallery'
import type { SelectableVariant } from '@/components/product/variant-selector'
import { ProductVariantDetails } from '@/components/product/product-variant-details'
import { CatalogProductCard, type CatalogProduct } from '@/components/product/catalog-product-card'
import { getPublicEnv } from '@/lib/env'

type ProductPageProps = { params: Promise<{ slug: string }> }

function imageUrl(path: string) {
  const safePath = path.split('/').map(encodeURIComponent).join('/')
  return `${getPublicEnv().NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/product-images/${safePath}`
}

async function loadProduct(slug: string) {
  const product = await getProductBySlug(slug)
  if (!product || !product.category || !Array.isArray(product.variants)) return null
  const variants = product.variants.filter((variant) => variant.is_active)
  return variants.length ? { ...product, variants } : null
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) return { title: 'Produk tidak ditemukan', robots: { index: false } }
  const primary = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)[0]
  const description = product.description?.trim() || `Lihat detail varian dan ketersediaan ${product.name} di Hairy Hijab.`
  return {
    title: product.name,
    description,
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: { title: product.name, description, ...(primary ? { images: [imageUrl(primary.storage_path)] } : {}) },
  }
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params
  const product = await loadProduct(slug)
  if (!product) notFound()

  const sortedImages = [...(product.images ?? [])].sort((a, b) => a.sort_order - b.sort_order)
  const gallery: ProductGalleryImage[] = sortedImages.map((image) => ({ id: image.id, url: imageUrl(image.storage_path), alt: image.alt_text ?? product.name }))
  const variants: SelectableVariant[] = product.variants.map(({ id, sku, size, color_name, color_hex, color_hex_2, price, compare_at_price, stock_quantity }) => ({ id, sku, size, color_name, color_hex, color_hex_2, price, compare_at_price, stock_quantity }))
  const related = await listProducts({ page: 1, sort: 'newest', category: product.category.slug, size: [], color: [] })
  const relatedProducts = related.data.filter((item) => item.id !== product.id).slice(0, 4) as CatalogProduct[]
  const offers = variants.map((variant) => ({ '@type': 'Offer', priceCurrency: 'IDR', price: variant.price, availability: variant.stock_quantity > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock', url: `${getPublicEnv().NEXT_PUBLIC_SITE_URL}/products/${product.slug}`, ...(variant.stock_quantity > 0 ? { eligibleQuantity: { '@type': 'QuantitativeValue', value: variant.stock_quantity } } : {}) }))
  const jsonLd = { '@context': 'https://schema.org', '@type': 'Product', name: product.name, description: product.description ?? undefined, image: gallery.map((image) => image.url), sku: variants.length === 1 ? variants[0].sku : undefined, offers: offers.length === 1 ? offers[0] : offers }

  return <main className="mx-auto max-w-7xl space-y-12 px-4 py-8 sm:px-6 lg:px-8">
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replaceAll('<', '\\u003c') }} />
    <section className="grid gap-8 md:grid-cols-2 md:gap-12">
      <ProductGallery images={gallery} productName={product.name} />
      <div className="space-y-6">
        <div><p className="text-sm uppercase tracking-wide text-espresso/60">{product.category.name}</p><h1 className="mt-2 font-serif text-3xl font-semibold text-espresso">{product.name}</h1></div>
        <ProductVariantDetails variants={variants} productName={product.name} />
        {product.description && <p className="whitespace-pre-line leading-relaxed text-espresso/80">{product.description}</p>}
        {product.specs && Object.keys(product.specs).length > 0 && <dl className="space-y-2 border-t border-sand pt-4">{Object.entries(product.specs).map(([key, value]) => <div key={key} className="flex gap-2 text-sm"><dt className="font-medium capitalize">{key.replaceAll('_', ' ')}:</dt><dd>{String(value)}</dd></div>)}</dl>}
        {product.material && <p className="text-sm">Bahan: {product.material}</p>}{product.care_instructions && <p className="text-sm">Perawatan: {product.care_instructions}</p>}
      </div>
    </section>
    {relatedProducts.length > 0 && <section className="space-y-4"><h2 className="font-serif text-2xl font-semibold text-espresso">Produk terkait</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{relatedProducts.map((item) => <CatalogProductCard key={item.id} product={item} />)}</div></section>}
  </main>
}
