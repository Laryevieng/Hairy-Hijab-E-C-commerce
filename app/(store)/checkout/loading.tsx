export default function CheckoutLoading() {
  return (
    <div
      role="status"
      aria-label="Memuat checkout"
      className="container mx-auto space-y-8 px-4 py-8 sm:py-12 lg:px-8"
    >
      <div className="h-9 w-48 animate-pulse rounded bg-sand/50" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-lg bg-sand/40" />
          <div className="h-72 animate-pulse rounded-lg bg-sand/40" />
        </div>
        <div className="h-96 animate-pulse rounded-lg bg-sand/40" />
      </div>
      <span className="sr-only">Memuat checkout…</span>
    </div>
  )
}
