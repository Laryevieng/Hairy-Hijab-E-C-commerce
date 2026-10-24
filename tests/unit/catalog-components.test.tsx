import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const push = vi.fn()
vi.mock('next/navigation', () => ({ useRouter: () => ({ push }) }))

import { ProductFilters } from '@/components/product/product-filters'
import { SortSelector } from '@/components/product/sort-selector'
import { Pagination } from '@/components/product/pagination'

describe('catalog URL controls', () => {
  beforeEach(() => push.mockClear())

  it('changes filters in shareable URLs and drops the old page', () => {
    render(
      <ProductFilters
        pathname="/products"
        searchParams="page=3&sort=price_asc"
        sizes={['S']}
        colors={['Hitam']}
        categories={[{ slug: 'bergo', name: 'Bergo' }]}
      />,
    )

    fireEvent.click(screen.getByRole('checkbox', { name: 'S' }))
    expect(push).toHaveBeenCalledWith('/products?sort=price_asc&size=S')
  })

  it('preserves filters when changing sort', () => {
    render(<SortSelector pathname="/search" searchParams="q=hijab&size=M&page=2" />)
    fireEvent.change(screen.getByRole('combobox', { name: 'Urutkan produk' }), { target: { value: 'price_desc' } })
    expect(push).toHaveBeenCalledWith('/search?q=hijab&size=M&sort=price_desc')
  })

  it('keeps the current filter query when moving between pages', () => {
    render(
      <Pagination
        page={2}
        pageSize={24}
        count={50}
        pathname="/products"
        searchParams="size=M&sort=price_asc&page=2"
      />,
    )
    expect(screen.getByRole('link', { name: 'Berikutnya' })).toHaveAttribute(
      'href',
      '/products?size=M&sort=price_asc&page=3',
    )
    expect(screen.getByRole('link', { name: 'Sebelumnya' })).toHaveAttribute(
      'href',
      '/products?size=M&sort=price_asc',
    )
  })
})
