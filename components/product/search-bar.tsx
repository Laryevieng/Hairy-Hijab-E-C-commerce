'use client'

import { Search } from 'lucide-react'

export function SearchBar({ query }: { query?: string }) {
  return (
    <form action="/search" method="get" role="search" className="flex w-full max-w-xl gap-2">
      <label htmlFor="catalog-search" className="sr-only">Cari produk</label>
      <input
        id="catalog-search"
        name="q"
        type="search"
        maxLength={80}
        defaultValue={query ?? ''}
        placeholder="Cari nama produk…"
        className="h-11 min-w-0 flex-1 rounded-md border border-input bg-ivory px-3 text-espresso"
      />
      <button type="submit" className="inline-flex min-h-11 items-center gap-2 rounded-md bg-espresso px-4 text-sm font-semibold text-ivory hover:bg-espresso/90">
        <Search aria-hidden="true" className="size-4" /> Cari
      </button>
    </form>
  )
}
