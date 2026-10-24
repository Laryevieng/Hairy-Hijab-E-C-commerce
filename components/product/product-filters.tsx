'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import { Button } from '@/components/ui/button'

interface ProductFiltersProps {
  sizes: string[]
  colors: string[]
  categories: Array<{ slug: string; name: string }>
  pathname: string
  searchParams: string
}

export function ProductFilters({ sizes, colors, categories, pathname, searchParams }: ProductFiltersProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const currentParams = new URLSearchParams(searchParams)

  function setParam(name: string, value: string, checked: boolean) {
    const next = new URLSearchParams(searchParams)
    const values = next.getAll(name).filter((item) => item !== value)
    next.delete(name)
    for (const item of checked ? [...values, value] : values) next.append(name, item)
    next.delete('page')
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`))
  }

  function setPrice(name: 'min' | 'max', value: string) {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(name, value)
    else next.delete(name)
    next.delete('page')
    startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`))
  }

  function reset() {
    startTransition(() => router.push(pathname))
  }

  return (
    <aside aria-label="Filter produk" className="space-y-5 rounded-md border border-sand/50 bg-ivory p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-serif text-lg font-semibold">Filter</h2>
        <Button type="button" variant="link" onClick={reset} className="h-auto p-0 text-sm">
          Hapus filter
        </Button>
      </div>

      {categories.length > 0 && (
        <label className="block space-y-2 text-sm font-semibold">
          Kategori
          <select
            value={currentParams.get('category') ?? ''}
            onChange={(event) => {
              if (pathname.startsWith('/categories/')) {
                const destination = event.target.value ? `/categories/${event.target.value}` : '/products'
                startTransition(() => router.push(destination))
                return
              }
              const next = new URLSearchParams(searchParams)
              if (event.target.value) next.set('category', event.target.value)
              else next.delete('category')
              next.delete('page')
              startTransition(() => router.push(`${pathname}${next.size ? `?${next}` : ''}`))
            }}
            className="h-10 w-full rounded-md border border-input bg-ivory px-3 font-normal"
          >
            <option value="">Semua kategori</option>
            {categories.map((category) => <option key={category.slug} value={category.slug}>{category.name}</option>)}
          </select>
        </label>
      )}

      {sizes.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Ukuran</legend>
          {sizes.map((size) => (
            <label key={size} className="flex min-h-8 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={new URLSearchParams(searchParams).getAll('size').includes(size)}
                onChange={(event) => setParam('size', size, event.target.checked)}
                className="size-4 accent-espresso"
              />
              {size}
            </label>
          ))}
        </fieldset>
      )}

      {colors.length > 0 && (
        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold">Warna</legend>
          {colors.map((color) => (
            <label key={color} className="flex min-h-8 items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={new URLSearchParams(searchParams).getAll('color').includes(color)}
                onChange={(event) => setParam('color', color, event.target.checked)}
                className="size-4 accent-espresso"
              />
              {color}
            </label>
          ))}
        </fieldset>
      )}

      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-semibold">Rentang harga (Rp)</legend>
        <label className="block space-y-1 text-xs text-espresso/70">
          Minimum
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={new URLSearchParams(searchParams).get('min') ?? ''}
            onChange={(event) => setPrice('min', event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-espresso"
          />
        </label>
        <label className="block space-y-1 text-xs text-espresso/70">
          Maksimum
          <input
            type="number"
            min="0"
            inputMode="numeric"
            value={new URLSearchParams(searchParams).get('max') ?? ''}
            onChange={(event) => setPrice('max', event.target.value)}
            className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm text-espresso"
          />
        </label>
      </fieldset>
      <span className="sr-only" aria-live="polite">{pending ? 'Memperbarui filter…' : ''}</span>
    </aside>
  )
}
