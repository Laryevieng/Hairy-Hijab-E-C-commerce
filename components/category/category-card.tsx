import Link from "next/link"
import { ArrowRight } from "lucide-react"
import { cn } from "@/lib/utils/cn"

export interface CategoryCardProps {
  id: string
  name: string
  slug: string
  description?: string
  productCount?: number
  className?: string
}

export function CategoryCard({
  name,
  slug,
  description,
  productCount,
  className,
}: CategoryCardProps) {
  const href = `/categories/${slug}`

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col justify-between overflow-hidden rounded-md border border-sand/40 bg-sand/15 p-5 transition-all duration-300 hover:border-sand hover:bg-sand/25 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[140px]",
        className
      )}
      aria-label={`Jelajahi kategori ${name}${
        typeof productCount === "number" ? ` (${productCount} produk)` : ""
      }`}
    >
      <div className="space-y-1.5 z-10">
        <h3 className="font-serif text-xl sm:text-2xl font-bold tracking-tight text-espresso group-hover:text-gold-deep transition-colors">
          {name}
        </h3>
        {description && (
          <p className="text-xs sm:text-sm text-espresso/70 line-clamp-2 max-w-[280px]">
            {description}
          </p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between text-xs font-semibold text-espresso/80 z-10 pt-2">
        <span>
          {typeof productCount === "number"
            ? `${productCount} Produk`
            : "Lihat Koleksi"}
        </span>
        <span className="inline-flex size-8 items-center justify-center rounded-full bg-ivory text-espresso shadow-xs transition-transform duration-200 group-hover:translate-x-1 group-hover:bg-espresso group-hover:text-ivory">
          <ArrowRight className="size-4" />
        </span>
      </div>

      {/* Aksen Latar Lembut */}
      <div
        className="absolute -right-4 -bottom-4 size-24 rounded-full bg-sand/30 blur-xl transition-all group-hover:scale-125 group-hover:bg-gold/15"
        aria-hidden="true"
      />
    </Link>
  )
}
