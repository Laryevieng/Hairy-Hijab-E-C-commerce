import { AlertCircle, RefreshCw } from "lucide-react"
import { cn } from "@/lib/utils/cn"
import { Button } from "@/components/ui/button"

export interface ErrorStateProps {
  title?: string
  message?: string
  onRetry?: () => void
  retryLabel?: string
  className?: string
}

export function ErrorState({
  title = "Terjadi Kesalahan",
  message = "Gagal memuat data saat ini. Silakan coba kembali beberapa saat lagi.",
  onRetry,
  retryLabel = "Coba Lagi",
  className,
}: ErrorStateProps) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center justify-center rounded-md border border-danger/30 bg-danger/5 p-8 text-center sm:p-12",
        className
      )}
    >
      <div className="mb-4 inline-flex size-14 items-center justify-center rounded-full bg-danger/10 text-danger">
        <AlertCircle className="size-7" />
      </div>

      <h3 className="font-serif text-xl sm:text-2xl font-semibold text-danger">
        {title}
      </h3>

      <p className="mt-2 max-w-sm text-sm text-espresso/80 leading-relaxed">
        {message}
      </p>

      {onRetry && (
        <div className="mt-6">
          <Button
            onClick={onRetry}
            variant="default"
            className="inline-flex items-center gap-2 bg-espresso text-ivory hover:bg-espresso/90 min-h-[44px]"
          >
            <RefreshCw className="size-4" />
            <span>{retryLabel}</span>
          </Button>
        </div>
      )}
    </div>
  )
}
