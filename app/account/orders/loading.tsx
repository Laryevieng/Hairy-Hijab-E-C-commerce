import { Skeleton } from '@/components/ui/skeleton'

export default function AccountOrdersLoading() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="border-b border-sand pb-4 space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-72" />
      </div>

      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="rounded-xl border border-sand bg-white/70 p-6 space-y-4">
            <div className="flex justify-between items-center border-b border-sand/40 pb-3">
              <div className="space-y-1">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-3 w-28" />
              </div>
              <Skeleton className="h-6 w-24" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
            <div className="flex justify-end pt-2">
              <Skeleton className="h-8 w-36" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
