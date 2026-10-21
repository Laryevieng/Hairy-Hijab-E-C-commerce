import { Skeleton } from "@/components/ui/skeleton"
import { cn } from "@/lib/utils/cn"

export interface LoadingStateProps {
  count?: number
  variant?: "grid" | "list"
  className?: string
}

export function LoadingState({
  count = 8,
  variant = "grid",
  className,
}: LoadingStateProps) {
  if (variant === "list") {
    return (
      <div
        role="status"
        aria-busy="true"
        aria-label="Memuat data..."
        className={cn("space-y-4", className)}
      >
        {Array.from({ length: count }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-4 rounded-md border border-sand/40 p-4 bg-ivory"
          >
            <Skeleton className="size-16 rounded-md bg-sand/30" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-1/3 bg-sand/30" />
              <Skeleton className="h-3 w-1/4 bg-sand/30" />
            </div>
            <Skeleton className="h-6 w-20 bg-sand/30" />
          </div>
        ))}
      </div>
    )
  }

  return (
    <div
      role="status"
      aria-busy="true"
      aria-label="Memuat katalog produk..."
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-6",
        className
      )}
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col overflow-hidden rounded-md border border-sand/40 bg-ivory"
        >
          {/* Skeleton gambar 3:4 */}
          <Skeleton className="aspect-[3/4] w-full rounded-none bg-sand/30" />
          {/* Skeleton teks */}
          <div className="p-3 sm:p-4 space-y-2.5">
            <Skeleton className="h-3 w-1/3 bg-sand/30" />
            <Skeleton className="h-4 w-4/5 bg-sand/30" />
            <Skeleton className="h-4 w-1/2 bg-sand/30 pt-1" />
          </div>
        </div>
      ))}
    </div>
  )
}
