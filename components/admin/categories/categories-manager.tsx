'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { Plus, Pencil, Trash2, EyeOff, Eye } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { CategoryFormDialog } from './category-form-dialog'
import {
  toggleCategoryActive,
  deleteCategory,
} from '@/actions/admin-catalog.actions'
import type { AdminCategoryItem } from '@/services/admin/categories.service'

export interface CategoriesManagerProps {
  categories: AdminCategoryItem[]
}

export function CategoriesManager({ categories }: CategoriesManagerProps) {
  const router = useRouter()

  const [formOpen, setFormOpen] = React.useState(false)
  const [editingCategory, setEditingCategory] =
    React.useState<AdminCategoryItem | null>(null)
  const [deletingCategory, setDeletingCategory] =
    React.useState<AdminCategoryItem | null>(null)
  const [togglingId, setTogglingId] = React.useState<string | null>(null)

  const handleOpenCreate = () => {
    setEditingCategory(null)
    setFormOpen(true)
  }

  const handleOpenEdit = (cat: AdminCategoryItem) => {
    setEditingCategory(cat)
    setFormOpen(true)
  }

  const handleToggleActive = async (cat: AdminCategoryItem) => {
    setTogglingId(cat.id)
    try {
      const nextState = !cat.is_active
      const res = await toggleCategoryActive(cat.id, nextState)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success(
        nextState
          ? `Kategori "${cat.name}" diaktifkan.`
          : `Kategori "${cat.name}" dinonaktifkan dari katalog publik.`
      )
      router.refresh()
    } finally {
      setTogglingId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingCategory) return
    const res = await deleteCategory(deletingCategory.id)
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(`Kategori "${deletingCategory.name}" berhasil dihapus.`)
    setDeletingCategory(null)
    router.refresh()
  }

  const columns: ColumnDef<AdminCategoryItem>[] = [
    {
      header: 'Urutan',
      className: 'w-20 text-center font-mono text-xs',
      headClassName: 'w-20 text-center',
      cell: (cat) => cat.sort_order,
    },
    {
      header: 'Kategori & Slug',
      cell: (cat) => (
        <div className="space-y-1">
          <div className="font-semibold text-espresso">{cat.name}</div>
          <div className="text-xs font-mono text-espresso/65">/{cat.slug}</div>
          {cat.description && (
            <p className="text-xs text-espresso/70 line-clamp-1 max-w-md">
              {cat.description}
            </p>
          )}
        </div>
      ),
    },
    {
      header: 'Aturan Ukuran',
      cell: (cat) =>
        cat.requires_size ? (
          <div className="space-y-1.5">
            <Badge variant="default" className="text-[11px] bg-espresso text-ivory">
              Wajib Ukuran
            </Badge>
            <div className="flex flex-wrap gap-1">
              {cat.size_options.map((sz) => (
                <span
                  key={sz}
                  className="inline-flex items-center rounded border border-sand bg-sand/25 px-1.5 py-0.5 text-[11px] font-medium text-espresso"
                >
                  {sz}
                </span>
              ))}
            </div>
          </div>
        ) : (
          <span className="text-xs text-espresso/60">Opsional / Bebas</span>
        ),
    },
    {
      header: 'Produk',
      className: 'w-28 text-center',
      headClassName: 'w-28 text-center',
      cell: (cat) => (
        <span className="inline-flex items-center rounded-full bg-sand/30 px-2.5 py-0.5 text-xs font-medium text-espresso">
          {cat.product_count} produk
        </span>
      ),
    },
    {
      header: 'Status',
      className: 'w-28',
      cell: (cat) =>
        cat.is_active ? (
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
      cell: (cat) => {
        const hasProducts = cat.product_count > 0
        const isToggling = togglingId === cat.id

        return (
          <div className="flex items-center justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleOpenEdit(cat)}
              className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
              aria-label={`Ubah kategori ${cat.name}`}
            >
              <Pencil className="h-3.5 w-3.5" />
              <span>Ubah</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isToggling}
              onClick={() => handleToggleActive(cat)}
              className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
              aria-label={
                cat.is_active
                  ? `Nonaktifkan kategori ${cat.name}`
                  : `Aktifkan kategori ${cat.name}`
              }
            >
              {cat.is_active ? (
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
                hasProducts
                  ? 'Kategori yang sudah memiliki produk tidak dapat dihapus. Gunakan tombol Nonaktifkan.'
                  : `Hapus kategori ${cat.name}`
              }
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={hasProducts}
                onClick={() => setDeletingCategory(cat)}
                className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/40 disabled:opacity-40"
                aria-label={`Hapus kategori ${cat.name}`}
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only">Hapus</span>
              </Button>
            </span>
          </div>
        )
      },
    },
  ]

  const activeCount = categories.filter((c) => c.is_active).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-5">
        <div>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-espresso">
            Kategori Produk
          </h1>
          <p className="text-sm text-espresso/70 mt-1">
            Kelola struktur kategori katalog, aturan pilihan ukuran, dan visibilitas menu toko ({activeCount} aktif dari {categories.length} kategori).
          </p>
        </div>

        <Button
          type="button"
          onClick={handleOpenCreate}
          className="bg-espresso text-ivory hover:bg-espresso/90 gap-2 self-start sm:self-auto"
        >
          <Plus className="h-4 w-4" />
          <span>Tambah Kategori</span>
        </Button>
      </div>

      {/* Tabel Kategori */}
      <DataTable
        columns={columns}
        data={categories}
        emptyMessage="Belum ada kategori yang terdaftar."
      />

      {/* Catatan aturan hapus */}
      <p className="text-xs text-espresso/65">
        * Kategori yang sudah memiliki produk tidak dapat dihapus demi menjaga integritas katalog dan riwayat pesanan. Gunakan tombol <strong>Nonaktifkan</strong> untuk menyembunyikan kategori dari toko publik.
      </p>

      {/* Dialog Tambah / Ubah */}
      <CategoryFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        category={editingCategory}
      />

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deletingCategory)}
        onOpenChange={(open) => !open && setDeletingCategory(null)}
        title="Hapus Kategori?"
        description={
          deletingCategory ? (
            <>
              Apakah Anda yakin ingin menghapus kategori{' '}
              <strong>{deletingCategory.name}</strong> (<code>/{deletingCategory.slug}</code>) secara permanen? Tindakan ini tidak dapat dibatalkan.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Ya, Hapus Kategori"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
