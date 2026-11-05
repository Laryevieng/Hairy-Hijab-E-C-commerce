import { Skeleton } from '@/components/ui/skeleton'

export default function AdminDashboardLoading() {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Header Skeleton */}
      <div className="space-y-2">
        <Skeleton className="h-8 w-48 bg-sand/40" />
        <Skeleton className="h-4 w-72 bg-sand/30" />
      </div>

      {/* Grid of 6 Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {Array.from({ length: 6 }).map((_, idx) => (
          <div
            key={idx}
            className="p-6 rounded-lg border border-sand bg-ivory shadow-xs space-y-4"
          >
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-32 bg-sand/40" />
              <Skeleton className="h-8 w-8 rounded-full bg-sand/40" />
            </div>
            <Skeleton className="h-8 w-24 bg-sand/50" />
            <Skeleton className="h-3 w-40 bg-sand/30" />
          </div>
        ))}
      </div>
    </div>
  )
}
