import Link from 'next/link'

interface PaginationProps {
  page: number
  pageSize: number
  count: number
  pathname: string
  searchParams: string
  ariaLabel?: string
}

function pageHref(pathname: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params)
  if (page <= 1) next.delete('page')
  else next.set('page', String(page))
  return `${pathname}${next.size ? `?${next}` : ''}`
}

export function Pagination({ page, pageSize, count, pathname, searchParams, ariaLabel = "Navigasi halaman" }: PaginationProps) {
  const pageCount = Math.ceil(count / pageSize)
  if (pageCount <= 1) return null

  return (
    <nav aria-label={ariaLabel} className="mt-8 flex items-center justify-center gap-2">
      {page > 1 ? (
        <Link className="inline-flex min-h-11 items-center rounded-md border border-sand px-4 text-sm hover:bg-sand/30" href={pageHref(pathname, new URLSearchParams(searchParams), page - 1)}>
          Sebelumnya
        </Link>
      ) : (
        <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-md border border-sand/50 px-4 text-sm text-espresso/40">
          Sebelumnya
        </span>
      )}
      <span aria-live="polite" className="px-2 text-sm">Halaman {page} dari {pageCount}</span>
      {page < pageCount ? (
        <Link className="inline-flex min-h-11 items-center rounded-md border border-sand px-4 text-sm hover:bg-sand/30" href={pageHref(pathname, new URLSearchParams(searchParams), page + 1)}>
          Berikutnya
        </Link>
      ) : (
        <span aria-disabled="true" className="inline-flex min-h-11 items-center rounded-md border border-sand/50 px-4 text-sm text-espresso/40">
          Berikutnya
        </span>
      )}
    </nav>
  )
}
