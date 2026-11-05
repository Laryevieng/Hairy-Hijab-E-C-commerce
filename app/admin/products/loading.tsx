import { Skeleton } from '@/components/ui/skeleton'

export default function AdminProductsLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-5">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52 bg-sand/40" />
          <Skeleton className="h-4 w-80 bg-sand/30" />
        </div>
        <Skeleton className="h-10 w-40 bg-sand/40" />
      </div>

      <div className="rounded-lg border border-sand bg-sand/15 p-4 grid grid-cols-1 sm:grid-cols-12 gap-3">
        <Skeleton className="h-10 sm:col-span-5 bg-sand/30" />
        <Skeleton className="h-10 sm:col-span-3 bg-sand/30" />
        <Skeleton className="h-10 sm:col-span-2 bg-sand/30" />
        <Skeleton className="h-10 sm:col-span-2 bg-sand/30" />
      </div>

      <div className="rounded-md border border-sand bg-ivory p-4 space-y-4">
        {Array.from({ length: 6 }).map((_, idx) => (
          <Skeleton key={idx} className="h-12 w-full bg-sand/30" />
        ))}
      </div>
    </div>
  )
}
