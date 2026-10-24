'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'

export function SortSelector({ pathname, searchParams }: { pathname: string; searchParams: string }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const currentParams = new URLSearchParams(searchParams)

  function changeSort(sort: string) {
    const next = new URLSearchParams(searchParams)
    if (sort === 'newest') next.delete('sort')
    else next.set('sort', sort)
    next.delete('page')
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`))
  }

  return (
    <label className="flex items-center gap-2 text-sm">
      <span className="shrink-0">Urutkan</span>
      <select
        value={currentParams.get('sort') ?? 'newest'}
        onChange={(event) => changeSort(event.target.value)}
        aria-label="Urutkan produk"
        className="h-10 rounded-md border border-input bg-ivory px-3 text-espresso"
      >
        <option value="newest">Terbaru</option>
        <option value="price_asc">Harga terendah</option>
        <option value="price_desc">Harga tertinggi</option>
      </select>
      <span className="sr-only" aria-live="polite">{pending ? 'Mengurutkan produk…' : ''}</span>
    </label>
  )
}
