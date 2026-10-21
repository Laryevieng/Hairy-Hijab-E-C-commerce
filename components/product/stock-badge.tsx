import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils/cn"

export interface StockBadgeProps {
  stock: number
  threshold?: number // Batas stok menipis, default 5
  showInStock?: boolean // Tampilkan badge jika stok aman (> threshold)
  className?: string
}

export function StockBadge({
  stock,
  threshold = 5,
  showInStock = false,
  className,
}: StockBadgeProps) {
  if (stock <= 0) {
    return (
      <Badge
        variant="destructive"
        className={cn(
          "bg-danger text-ivory font-semibold tracking-wider uppercase text-[10px] px-2 py-0.5",
          className
        )}
      >
        Sold Out
      </Badge>
    )
  }

  if (stock <= threshold) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-warning bg-warning/10 text-warning font-medium text-[11px] px-2 py-0.5",
          className
        )}
      >
        Sisa {stock} item
      </Badge>
    )
  }

  if (showInStock) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "border-success/40 bg-success/10 text-success font-medium text-[11px] px-2 py-0.5",
          className
        )}
      >
        Tersedia
      </Badge>
    )
  }

  return null
}
