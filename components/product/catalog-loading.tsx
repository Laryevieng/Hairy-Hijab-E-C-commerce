import { LoadingState } from '@/components/common/loading-state'

export function CatalogLoading() {
  return (
    <section className="container mx-auto space-y-6 px-4 py-8 sm:py-12 lg:px-8" aria-label="Memuat katalog">
      <div className="space-y-3">
        <div className="h-3 w-28 animate-pulse rounded bg-sand/50" />
        <div className="h-10 w-64 animate-pulse rounded bg-sand/50" />
        <div className="h-4 w-full max-w-xl animate-pulse rounded bg-sand/50" />
      </div>
      <LoadingState count={8} />
    </section>
  )
}
