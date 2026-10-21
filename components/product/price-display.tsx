import { cn } from "@/lib/utils/cn"
import { formatRupiah } from "@/lib/utils/format"

export interface PriceDisplayProps {
  price: number
  compareAtPrice?: number | null
  className?: string
  size?: "sm" | "md" | "lg"
}

export function PriceDisplay({
  price,
  compareAtPrice,
  className,
  size = "md",
}: PriceDisplayProps) {
  const hasDiscount =
    typeof compareAtPrice === "number" &&
    Number.isFinite(compareAtPrice) &&
    compareAtPrice > price

  const savingsPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0

  const sizeStyles = {
    sm: {
      current: "text-sm font-semibold",
      compare: "text-xs",
      badge: "text-[10px] px-1 py-0.2",
    },
    md: {
      current: "text-base font-semibold",
      compare: "text-xs",
      badge: "text-xs px-1.5 py-0.5",
    },
    lg: {
      current: "text-xl font-bold font-serif",
      compare: "text-sm",
      badge: "text-xs px-2 py-0.5",
    },
  }

  const currentStyles = sizeStyles[size]

  return (
    <div
      className={cn("flex flex-wrap items-baseline gap-x-2 gap-y-1", className)}
      aria-label={`Harga ${formatRupiah(price)}${
        hasDiscount
          ? `, harga normal ${formatRupiah(compareAtPrice)}, hemat ${savingsPercentage}%`
          : ""
      }`}
    >
      <span className={cn("text-espresso", currentStyles.current)}>
        {formatRupiah(price)}
      </span>

      {hasDiscount && (
        <>
          <del
            className={cn(
              "text-espresso/50 line-through decoration-espresso/40",
              currentStyles.compare
            )}
            aria-hidden="true"
          >
            {formatRupiah(compareAtPrice)}
          </del>
          <span
            className={cn(
              "font-semibold text-danger bg-danger/10 rounded-sm whitespace-nowrap",
              currentStyles.badge
            )}
            aria-hidden="true"
          >
            Hemat {savingsPercentage}%
          </span>
        </>
      )}
    </div>
  )
}
