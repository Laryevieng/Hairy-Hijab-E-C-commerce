import type { ReactNode } from "react"
import Link from "next/link"
import { PackageSearch } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"

export interface EmptyStateProps {
  title?: string
  description?: string
  icon?: ReactNode
  actionLabel?: string
  actionHref?: string
  onAction?: () => void
  className?: string
}

export function EmptyState({
  title = "Belum Ada Produk",
  description = "Produk pada kategori atau pencarian ini belum tersedia saat ini.",
  icon,
  actionLabel,
  actionHref,
  onAction,
  className,
}: EmptyStateProps) {
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-dashed border-sand p-8 text-center sm:p-12 bg-ivory",
        className
      )}
    >
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-sand/30 text-espresso/70">
        {icon ?? <PackageSearch className="size-7" />}
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-espresso">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-espresso/70 leading-relaxed">
        {description}
      </p>

      {(actionLabel && (actionHref || onAction)) && (
        <div className="mt-6">
          {actionHref ? (
            <Button asChild className="bg-primary text-primary-foreground min-h-[44px]">
              <Link href={actionHref}>{actionLabel}</Link>
            </Button>
          ) : (
            <Button
              onClick={onAction}
              className="bg-primary text-primary-foreground min-h-[44px]"
            >
              {actionLabel}
            </Button>
          )}
        </div>
      )}
    </div>
  )
}
