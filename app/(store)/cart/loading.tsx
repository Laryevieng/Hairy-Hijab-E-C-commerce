export default function Loading() {
  return (
    <div role="status" aria-label="Memuat keranjang" className="container mx-auto space-y-8 px-4 py-8 sm:py-12 lg:px-8">
      <div className="h-9 w-48 animate-pulse rounded bg-sand/50" />
      <div className="grid gap-8 lg:grid-cols-[1fr_22rem]">
        <div className="h-64 animate-pulse rounded bg-sand/50" />
        <div className="h-48 animate-pulse rounded-md bg-sand/50" />
      </div>
      <span className="sr-only">Memuat keranjang…</span>
    </div>
  )
}
