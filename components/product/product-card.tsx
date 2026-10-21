import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils/cn"
import type { ProductListItem } from "@/types/domain"
import { PriceDisplay } from "@/components/product/price-display"
import { StockBadge } from "@/components/product/stock-badge"

export interface ProductCardProps {
  product: ProductListItem
  className?: string
  priority?: boolean
}

export function ProductCard({
  product,
  className,
  priority = false,
}: ProductCardProps) {
  const isSoldOut = product.totalStock <= 0
  const productHref = `/products/${product.slug}`

  return (
    <article
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-md border border-sand/40 bg-ivory transition-all duration-200 hover:border-sand hover:shadow-sm",
        className
      )}
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Gambar & Badge Container */}
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-sand/20">
        <Link
          href={productHref}
          className="block h-full w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          tabIndex={-1}
          aria-hidden="true"
        >
          <Image
            src={product.primaryImageUrl}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            priority={priority}
            className={cn(
              "object-cover object-center transition-transform duration-300 group-hover:scale-105",
              isSoldOut && "grayscale opacity-75"
            )}
          />
        </Link>

        {/* Badge Overlay */}
        <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10 pointer-events-none">
          {isSoldOut ? (
            <StockBadge stock={product.totalStock} />
          ) : (
            product.totalStock <= 5 && (
              <StockBadge stock={product.totalStock} />
            )
          )}
        </div>
      </div>

      {/* Informasi Produk */}
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {/* Kategori */}
        <p className="text-[11px] font-semibold uppercase tracking-wider text-espresso/60 mb-1">
          {product.categoryName}
        </p>

        {/* Nama Produk */}
        <h3
          id={`product-title-${product.id}`}
          className="font-serif text-base sm:text-lg font-semibold text-espresso line-clamp-2 min-h-[44px] flex items-center mb-1"
        >
          <Link
            href={productHref}
            className="hover:text-gold-deep transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm py-1"
          >
            {product.name}
          </Link>
        </h3>

        {/* Harga */}
        <div className="mt-auto pt-2">
          <PriceDisplay
            price={product.price}
            compareAtPrice={product.compareAtPrice}
            size="sm"
          />
        </div>

        {/* Palet Warna (bila ada) */}
        {product.colors && product.colors.length > 0 && (
          <div
            className="mt-3 flex items-center gap-1.5 pt-2 border-t border-sand/30"
            aria-label={`${product.colors.length} pilihan warna tersedia`}
          >
            {product.colors.map((color, index) => (
              <span
                key={index}
                title={color.name}
                className="relative size-3.5 rounded-full border border-sand/60 shadow-xs"
                style={{
                  background: color.hex2
                    ? `linear-gradient(135deg, ${color.hex} 50%, ${color.hex2} 50%)`
                    : color.hex,
                }}
              />
            ))}
            <span className="sr-only">
              {product.colors.map((c) => c.name).join(", ")}
            </span>
          </div>
        )}
      </div>
    </article>
  )
}
