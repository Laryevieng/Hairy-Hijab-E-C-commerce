'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  Search,
  Pencil,
  Trash2,
  EyeOff,
  Eye,
  Star,
  RotateCcw,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  toggleProductActive,
  deleteProduct,
} from '@/actions/admin-catalog.actions'
import type { AdminProductListItem } from '@/services/admin/products.service'
import type { AdminProductsSearchParams } from '@/lib/validations/product'

export interface ProductCategoryOption {
  id: string
  name: string
}

export interface ProductsTableProps {
  products: AdminProductListItem[]
  count: number
  page: number
  pageSize: number
  filters: AdminProductsSearchParams
  categories: ProductCategoryOption[]
}

export function ProductsTable({
  products,
  count,
  page,
  pageSize,
  filters,
  categories,
}: ProductsTableProps) {
  const router = useRouter()

  const [q, setQ] = React.useState(filters.q)
  const [category, setCategory] = React.useState(filters.category ?? '')
  const [status, setStatus] = React.useState<'all' | 'active' | 'inactive'>(
    filters.status
  )
  const [togglingId, setTogglingId] = React.useState<string | null>(null)
  const [deletingProduct, setDeletingProduct] =
    React.useState<AdminProductListItem | null>(null)

  const buildQueryString = (
    nextFilters: Partial<AdminProductsSearchParams>
  ): string => {
    const params = new URLSearchParams()
    const nextQ = nextFilters.q !== undefined ? nextFilters.q : q
    const nextCat =
      nextFilters.category !== undefined ? nextFilters.category : category
    const nextStatus =
      nextFilters.status !== undefined ? nextFilters.status : status

    if (nextQ.trim()) params.set('q', nextQ.trim())
    if (nextCat) params.set('category', nextCat)
    if (nextStatus && nextStatus !== 'all') params.set('status', nextStatus)
    return params.toString()
  }

  const handleFilterSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const qs = buildQueryString({ q, category: category || undefined, status })
    router.push(`/admin/products${qs ? `?${qs}` : ''}`)
  }

  const handleResetFilters = () => {
    setQ('')
    setCategory('')
    setStatus('all')
    router.push('/admin/products')
  }

  const handleToggleActive = async (prod: AdminProductListItem) => {
    setTogglingId(prod.id)
    try {
      const nextState = !prod.is_active
      const res = await toggleProductActive(prod.id, nextState)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success(
        nextState
          ? `Produk "${prod.name}" diaktifkan.`
          : `Produk "${prod.name}" dinonaktifkan dari katalog publik.`
      )
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingProduct) return
    const res = await deleteProduct(deletingProduct.id)
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(`Produk "${deletingProduct.name}" berhasil dihapus.`)
    setDeletingProduct(null)
    router.refresh()
  }

  const hasActiveFilters =
    Boolean(filters.q) ||
    Boolean(filters.category) ||
    filters.status !== 'all'

  const currentSearchParams = React.useMemo(() => {
    const params = new URLSearchParams()
    if (filters.q) params.set('q', filters.q)
    if (filters.category) params.set('category', filters.category)
    if (filters.status !== 'all') params.set('status', filters.status)
    return params.toString()
  }, [filters])

  const columns: ColumnDef<AdminProductListItem>[] = [
    {
      header: 'Produk & Slug',
      cell: (prod) => (
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/admin/products/${prod.id}/edit`}
              className="font-semibold text-espresso hover:text-gold-deep hover:underline"
            >
              {prod.name}
            </Link>
            {prod.is_featured && (
              <Badge
                variant="secondary"
                className="gap-1 bg-gold/20 text-espresso border border-gold/40 text-[11px]"
              >
                <Star className="h-3 w-3 fill-gold-deep text-gold-deep" />
                <span>Unggulan</span>
              </Badge>
            )}
          </div>
          <div className="text-xs font-mono text-espresso/65">
            /products/{prod.slug}
          </div>
        </div>
      ),
    },
    {
      header: 'Kategori',
      cell: (prod) => (
        <span className="inline-flex items-center rounded-md border border-sand bg-sand/20 px-2.5 py-1 text-xs font-medium text-espresso">
          {prod.category_name}
        </span>
      ),
    },
    {
      header: 'Varian & Stok',
      cell: (prod) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-medium text-espresso">
            {prod.variant_count} varian{' '}
            <span className="text-espresso/65">
              ({prod.active_variant_count} aktif)
            </span>
          </div>
          <div className="text-espresso/70">Total stok: {prod.total_stock}</div>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (prod) =>
        prod.is_active ? (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-success/30 bg-success/15 px-2.5 py-0.5 text-xs font-semibold text-success">
            <span className="h-1.5 w-1.5 rounded-full bg-success" />
            Aktif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 rounded-full border border-sand bg-sand/30 px-2.5 py-0.5 text-xs font-medium text-espresso/70">
            <span className="h-1.5 w-1.5 rounded-full bg-espresso/40" />
            Nonaktif
          </span>
        ),
    },
    {
      header: 'Aksi',
      className: 'text-right w-72',
      headClassName: 'text-right w-72',
      cell: (prod) => {
        const isToggling = togglingId === prod.id
        const isOrdered = prod.has_orders

        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                asChild
                variant="outline"
                size="sm"
                className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
              >
                <Link
                  href={`/admin/products/${prod.id}/edit`}
                  aria-label={`Ubah produk ${prod.name}`}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span>Ubah</span>
                </Link>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isToggling}
                onClick={() => handleToggleActive(prod)}
                className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
                aria-label={
                  prod.is_active
                    ? `Nonaktifkan produk ${prod.name}`
                    : `Aktifkan produk ${prod.name}`
                }
              >
                {prod.is_active ? (
                  <>
                    <EyeOff className="h-3.5 w-3.5 text-warning" />
                    <span>Nonaktifkan</span>
                  </>
                ) : (
                  <>
                    <Eye className="h-3.5 w-3.5 text-success" />
                    <span>Aktifkan</span>
                  </>
                )}
              </Button>

              <span
                title={
                  isOrdered
                    ? 'Produk sudah pernah dipesan sehingga tidak dapat dihapus (D-15). Gunakan tombol Nonaktifkan.'
                    : `Hapus produk ${prod.name}`
                }
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isOrdered}
                  onClick={() => setDeletingProduct(prod)}
                  className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/40 disabled:opacity-40"
                  aria-label={`Hapus produk ${prod.name}`}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="sr-only sm:not-sr-only">Hapus</span>
                </Button>
              </span>
            </div>
            {isOrdered && (
              <span className="text-[11px] text-espresso/60">
                Pernah dipesan (tidak dapat dihapus)
              </span>
            )}
          </div>
        )
      },
    },
  ]

  return (
    <div className="space-y-5">
      {/* Bar Pencarian & Filter */}
      <form
        onSubmit={handleFilterSubmit}
        aria-label="Filter daftar produk"
        className="grid grid-cols-1 sm:grid-cols-12 gap-3 rounded-lg border border-sand bg-sand/15 p-4"
      >
        <div className="sm:col-span-5">
          <label htmlFor="filter-product-q" className="sr-only">
            Cari nama produk
          </label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-espresso/50" />
            <Input
              id="filter-product-q"
              name="q"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Cari nama produk..."
              className="pl-9 bg-ivory border-sand text-sm h-10"
            />
          </div>
        </div>

        <div className="sm:col-span-3">
          <label htmlFor="filter-product-category" className="sr-only">
            Filter kategori
          </label>
          <select
            id="filter-product-category"
            name="category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="flex h-10 w-full rounded-md border border-sand bg-ivory px-3 py-2 text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
          >
            <option value="">Semua Kategori</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label htmlFor="filter-product-status" className="sr-only">
            Filter status
          </label>
          <select
            id="filter-product-status"
            name="status"
            value={status}
            onChange={(e) =>
              setStatus(e.target.value as 'all' | 'active' | 'inactive')
            }
            className="flex h-10 w-full rounded-md border border-sand bg-ivory px-3 py-2 text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
          >
            <option value="all">Semua Status</option>
            <option value="active">Aktif</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>

        <div className="sm:col-span-2 flex items-center gap-2">
          <Button
            type="submit"
            className="flex-1 h-10 bg-espresso text-ivory hover:bg-espresso/90 text-xs font-semibold"
          >
            Terapkan
          </Button>
          {hasActiveFilters && (
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={handleResetFilters}
              title="Reset filter"
              aria-label="Reset filter"
              className="h-10 w-10 border-sand bg-ivory text-espresso hover:bg-sand/30 shrink-0"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </form>

      {/* Tabel Produk */}
      <DataTable
        columns={columns}
        data={products}
        emptyMessage="Tidak ada produk yang cocok dengan filter pencarian."
        pagination={{
          page,
          pageSize,
          count,
          pathname: '/admin/products',
          searchParams: currentSearchParams,
          ariaLabel: 'Navigasi halaman produk admin',
        }}
      />

      <p className="text-xs text-espresso/65">
        * Sesuai aturan D-15, produk yang sudah pernah dipesan tidak dapat dihapus keras demi menjaga riwayat pesanan pelanggan. Gunakan tombol <strong>Nonaktifkan</strong> untuk menyembunyikan produk dari katalog publik.
      </p>

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deletingProduct)}
        onOpenChange={(open) => !open && setDeletingProduct(null)}
        title="Hapus Produk?"
        description={
          deletingProduct ? (
            <>
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong>{deletingProduct.name}</strong> (
              <code>/products/{deletingProduct.slug}</code>) beserta seluruh varian dan gambarnya secara permanen? Tindakan ini tidak dapat dibatalkan.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Ya, Hapus Produk"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
