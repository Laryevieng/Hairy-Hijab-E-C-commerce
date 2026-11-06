'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, EyeOff, Eye, Layers } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import {
  VariantFormDialog,
  type VariantCategoryInfo,
} from './variant-form-dialog'
import { formatRupiah } from '@/lib/utils/format'
import {
  toggleVariantActive,
  deleteVariant,
} from '@/actions/admin-catalog.actions'
import type { AdminVariantItem } from '@/services/admin/products.service'

export interface VariantTableProps {
  productId: string
  category: VariantCategoryInfo
  variants: AdminVariantItem[]
}

export function VariantTable({
  productId,
  category,
  variants,
}: VariantTableProps) {
  const router = useRouter()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingVariant, setEditingVariant] =
    React.useState<AdminVariantItem | null>(null)
  const [deletingVariant, setDeletingVariant] =
    React.useState<AdminVariantItem | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingVariant(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (variant: AdminVariantItem) => {
    setEditingVariant(variant)
    setFormOpen(true)
  }

  const handleToggleActive = async (variant: AdminVariantItem) => {
    setTogglingId(variant.id)
    try {
      const nextState = !variant.is_active
      const res = await toggleVariantActive(variant.id, nextState)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success(
        nextState
          ? `Varian "${variant.sku}" diaktifkan.`
          : `Varian "${variant.sku}" dinonaktifkan.`
      )
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingVariant) return
    const res = await deleteVariant(deletingVariant.id)
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(`Varian "${deletingVariant.sku}" berhasil dihapus.`)
    setDeletingVariant(null)
    router.refresh()
  }

  const columns: ColumnDef<AdminVariantItem>[] = [
    {
      header: 'SKU',
      className: 'font-mono text-xs font-semibold',
      cell: (v) => v.sku,
    },
    {
      header: 'Ukuran & Warna',
      cell: (v) => (
        <div className="flex flex-wrap items-center gap-2">
          {v.size ? (
            <span className="inline-flex items-center rounded border border-sand bg-sand/25 px-2 py-0.5 text-xs font-semibold text-espresso">
              Ukuran: {v.size}
            </span>
          ) : (
            <span className="text-xs text-espresso/50">Tanpa ukuran</span>
          )}

          {v.color_name && (
            <span className="inline-flex items-center gap-1.5 rounded border border-sand/60 bg-ivory px-2 py-0.5 text-xs font-medium text-espresso">
              {v.color_hex && (
                <span
                  aria-hidden="true"
                  className="inline-block h-3.5 w-3.5 rounded-full border border-espresso/20"
                  style={
                    v.color_hex_2
                      ? {
                          background: `linear-gradient(135deg, ${v.color_hex} 50%, ${v.color_hex_2} 50%)`,
                        }
                      : { backgroundColor: v.color_hex }
                  }
                />
              )}
              <span>{v.color_name}</span>
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Harga',
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="font-semibold text-espresso">
            {formatRupiah(v.price)}
          </div>
          {v.compare_at_price !== null && v.compare_at_price > v.price && (
            <div className="text-xs text-espresso/55 line-through">
              {formatRupiah(v.compare_at_price)}
            </div>
          )}
        </div>
      ),
    },
    {
      header: 'Stok (Baca Saja)',
      cell: (v) => (
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="font-mono text-sm font-bold text-espresso">
              {v.stock_quantity}
            </span>
            {v.stock_quantity <= 0 && (
              <Badge
                variant="destructive"
                className="bg-danger/15 text-danger border border-danger/30 text-[10px] px-1.5 py-0"
              >
                Sold Out
              </Badge>
            )}
          </div>
          {/* TODO(P8-07): integrasikan dengan StockAdjustDialog / halaman Inventori */}
          <div className="text-[11px] text-espresso/55">
            Baca saja (ubah di Inventori)
          </div>
        </div>
      ),
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (v) =>
        v.is_active ? (
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
      className: 'text-right w-64',
      headClassName: 'text-right w-64',
      cell: (v) => {
        const isToggling = togglingId === v.id
        const isOrdered = Boolean(v.has_orders)

        return (
          <div className="flex flex-col items-end gap-1">
            <div className="flex items-center justify-end gap-1.5">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleOpenEdit(v)}
                className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
                aria-label={`Ubah varian ${v.sku}`}
              >
                <Pencil className="h-3.5 w-3.5" />
                <span>Ubah</span>
              </Button>

              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isToggling}
                onClick={() => handleToggleActive(v)}
                className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
                aria-label={
                  v.is_active
                    ? `Nonaktifkan varian ${v.sku}`
                    : `Aktifkan varian ${v.sku}`
                }
              >
                {v.is_active ? (
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
                    ? 'Varian ini sudah pernah dipesan sehingga tidak dapat dihapus (D-15). Gunakan tombol Nonaktifkan.'
                    : `Hapus varian ${v.sku}`
                }
              >
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={isOrdered}
                  onClick={() => setDeletingVariant(v)}
                  className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/40 disabled:opacity-40"
                  aria-label={`Hapus varian ${v.sku}`}
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
    <section
      aria-labelledby="product-variants-heading"
      className="rounded-lg border border-sand bg-ivory p-6 shadow-xs space-y-5"
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/30 text-espresso mt-0.5">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h2
              id="product-variants-heading"
              className="font-serif text-lg font-bold text-espresso"
            >
              Varian Produk ({variants.length})
            </h2>
            <p className="text-xs text-espresso/70 mt-0.5">
              Kategori <strong>{category.name}</strong>:{' '}
              {category.requires_size
                ? `Wajib memilih ukuran (${category.size_options.join(', ')})`
                : 'Ukuran opsional / bebas'}
              . Stok ditampilkan baca saja.
            </p>
          </div>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="bg-espresso text-ivory hover:bg-espresso/90 gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Varian</span>
        </Button>
      </div>

      <DataTable
        columns={columns}
        data={variants}
        emptyMessage="Belum ada varian untuk produk ini. Tambahkan minimal satu varian aktif agar produk tampil di katalog toko."
      />

      <VariantFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        productId={productId}
        category={category}
        variant={editingVariant}
      />

      <ConfirmDialog
        open={Boolean(deletingVariant)}
        onOpenChange={(open) => !open && setDeletingVariant(null)}
        title="Hapus Varian Produk?"
        description={
          deletingVariant ? (
            <>
              Apakah Anda yakin ingin menghapus varian{' '}
              <strong>{deletingVariant.sku}</strong> secara permanen? Tindakan ini tidak dapat dibatalkan.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Ya, Hapus Varian"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
