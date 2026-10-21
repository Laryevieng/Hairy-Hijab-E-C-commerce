import type { ReactNode } from "react"
import { cn } from "@/lib/utils/cn"
import type { ProductListItem } from "@/types/domain"
import { ProductCard } from "@/components/product/product-card"

export interface ProductGridProps {
  products?: ProductListItem[]
  children?: ReactNode
  className?: string
}

export function ProductGrid({
  products,
  children,
  className,
}: ProductGridProps) {
  return (
    <div
      data-testid="product-grid"
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6",
        className
      )}
    >
      {products
        ? products.map((product, index) => (
            <ProductCard
              key={product.id}
              product={product}
              priority={index < 4}
            />
          ))
        : children}
    </div>
  )
}
