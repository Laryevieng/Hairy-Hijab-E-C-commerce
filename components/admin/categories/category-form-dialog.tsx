'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import { slugify } from '@/lib/utils/slug'
import { createCategory, updateCategory } from '@/actions/admin-catalog.actions'
import type { AdminCategoryItem } from '@/services/admin/categories.service'

export interface CategoryFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category?: AdminCategoryItem | null
  onSuccess?: () => void
}

interface CategoryFormBodyProps {
  category?: AdminCategoryItem | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function CategoryFormBody({
  category,
  onOpenChange,
  onSuccess,
}: CategoryFormBodyProps) {
  const router = useRouter()
  const isEdit = Boolean(category)

  const [name, setName] = React.useState(category?.name ?? '')
  const [slug, setSlug] = React.useState(category?.slug ?? '')
  const [slugTouched, setSlugTouched] = React.useState(Boolean(category))
  const [description, setDescription] = React.useState(
    category?.description ?? ''
  )
  const [imagePath, setImagePath] = React.useState(category?.image_path ?? '')
  const [requiresSize, setRequiresSize] = React.useState(
    category?.requires_size ?? false
  )
  const [sizeOptionsText, setSizeOptionsText] = React.useState(
    category?.size_options && category.size_options.length > 0
      ? category.size_options.join(', ')
      : 'S, M'
  )
  const [isActive, setIsActive] = React.useState(category?.is_active ?? true)
  const [sortOrder, setSortOrder] = React.useState(
    String(category?.sort_order ?? 0)
  )

  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({})

  const handleNameChange = (value: string) => {
    setName(value)
    if (!slugTouched) {
      setSlug(slugify(value))
    }
  }

  const handleSlugChange = (value: string) => {
    setSlugTouched(true)
    setSlug(value)
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const payload = {
        name,
        slug,
        description: description.trim() || null,
        image_path: imagePath.trim() || null,
        requires_size: requiresSize,
        size_options: requiresSize ? sizeOptionsText : [],
        is_active: isActive,
        sort_order: Number(sortOrder),
      }

      const result =
        isEdit && category
          ? await updateCategory(category.id, payload)
          : await createCategory(payload)

      if (!result.ok) {
        setFormError(result.error.message)
        if (result.error.fieldErrors) {
          setFieldErrors(result.error.fieldErrors)
        }
        toast.error(result.error.message)
        return
      }

      toast.success(
        isEdit
          ? 'Kategori berhasil diperbarui.'
          : 'Kategori baru berhasil ditambahkan.'
      )
      onOpenChange(false)
      onSuccess?.()
      router.refresh()
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mt-2" noValidate>
      {formError && (
        <div
          role="alert"
          className="rounded-md border border-danger/40 bg-danger/10 px-3.5 py-2.5 text-xs font-medium text-danger"
        >
          {formError}
        </div>
      )}

      {/* Nama Kategori */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-name" className="text-xs font-semibold">
          Nama Kategori <span className="text-danger">*</span>
        </Label>
        <Input
          id="cat-name"
          name="name"
          value={name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Contoh: Bergo Non Karet"
          aria-invalid={Boolean(fieldErrors.name)}
          disabled={submitting}
          required
          className="bg-ivory border-sand"
        />
        {fieldErrors.name?.[0] && (
          <p className="text-xs text-danger">{fieldErrors.name[0]}</p>
        )}
      </div>

      {/* Slug Kategori */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="cat-slug" className="text-xs font-semibold">
            Slug URL <span className="text-danger">*</span>
          </Label>
          <button
            type="button"
            onClick={() => {
              setSlug(slugify(name))
              setSlugTouched(true)
            }}
            disabled={submitting || !name.trim()}
            className="text-[11px] font-medium text-gold-deep hover:underline disabled:opacity-50"
          >
            Buat otomatis dari nama
          </button>
        </div>
        <Input
          id="cat-slug"
          name="slug"
          value={slug}
          onChange={(e) => handleSlugChange(e.target.value)}
          placeholder="bergo-non-karet"
          aria-invalid={Boolean(fieldErrors.slug)}
          disabled={submitting}
          required
          className="bg-ivory border-sand font-mono text-xs"
        />
        {fieldErrors.slug?.[0] ? (
          <p className="text-xs text-danger">{fieldErrors.slug[0]}</p>
        ) : (
          <p className="text-[11px] text-espresso/60">
            Digunakan pada alamat URL: <code>/categories/{slug || '...'}</code>
          </p>
        )}
      </div>

      {/* Deskripsi */}
      <div className="space-y-1.5">
        <Label htmlFor="cat-description" className="text-xs font-semibold">
          Deskripsi
        </Label>
        <Textarea
          id="cat-description"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Deskripsi singkat koleksi kategori ini..."
          rows={3}
          aria-invalid={Boolean(fieldErrors.description)}
          disabled={submitting}
          className="bg-ivory border-sand"
        />
        {fieldErrors.description?.[0] && (
          <p className="text-xs text-danger">{fieldErrors.description[0]}</p>
        )}
      </div>

      {/* Gambar & Urutan */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="sm:col-span-2 space-y-1.5">
          <Label htmlFor="cat-image-path" className="text-xs font-semibold">
            Path Gambar (Opsional)
          </Label>
          <Input
            id="cat-image-path"
            name="image_path"
            value={imagePath}
            onChange={(e) => setImagePath(e.target.value)}
            placeholder="categories/bergo.jpg"
            aria-invalid={Boolean(fieldErrors.image_path)}
            disabled={submitting}
            className="bg-ivory border-sand text-xs"
          />
          {fieldErrors.image_path?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.image_path[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="cat-sort-order" className="text-xs font-semibold">
            Urutan Tampil
          </Label>
          <Input
            id="cat-sort-order"
            name="sort_order"
            type="number"
            min={0}
            max={9999}
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            aria-invalid={Boolean(fieldErrors.sort_order)}
            disabled={submitting}
            className="bg-ivory border-sand"
          />
          {fieldErrors.sort_order?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.sort_order[0]}</p>
          )}
        </div>
      </div>

      {/* Pengaturan Ukuran */}
      <div className="rounded-md border border-sand bg-sand/15 p-3.5 space-y-3">
        <div className="flex items-start gap-2.5">
          <Checkbox
            id="cat-requires-size"
            checked={requiresSize}
            onCheckedChange={(checked) => setRequiresSize(Boolean(checked))}
            disabled={submitting}
            className="mt-0.5"
          />
          <div className="space-y-0.5">
            <Label
              htmlFor="cat-requires-size"
              className="text-xs font-semibold cursor-pointer"
            >
              Wajib memiliki ukuran (Requires Size)
            </Label>
            <p className="text-[11px] text-espresso/70">
              Jika aktif, setiap varian produk di kategori ini wajib memilih salah satu ukuran di bawah.
            </p>
          </div>
        </div>

        {requiresSize && (
          <div className="space-y-1.5 pl-6">
            <Label htmlFor="cat-size-options" className="text-xs font-semibold">
              Daftar Pilihan Ukuran (pisahkan dengan koma){' '}
              <span className="text-danger">*</span>
            </Label>
            <Input
              id="cat-size-options"
              name="size_options"
              value={sizeOptionsText}
              onChange={(e) => setSizeOptionsText(e.target.value)}
              placeholder="Contoh: S, M, L"
              aria-invalid={Boolean(fieldErrors.size_options)}
              disabled={submitting}
              className="bg-ivory border-sand text-xs"
            />
            {fieldErrors.size_options?.[0] ? (
              <p className="text-xs text-danger">
                {fieldErrors.size_options[0]}
              </p>
            ) : (
              <p className="text-[11px] text-espresso/60">
                Contoh untuk Bergo: <code>S, M</code>
              </p>
            )}
          </div>
        )}
      </div>

      {/* Status Aktif */}
      <div className="flex items-start gap-2.5 rounded-md border border-sand p-3.5">
        <Checkbox
          id="cat-is-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(Boolean(checked))}
          disabled={submitting}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label
            htmlFor="cat-is-active"
            className="text-xs font-semibold cursor-pointer"
          >
            Kategori Aktif
          </Label>
          <p className="text-[11px] text-espresso/70">
            Kategori nonaktif disembunyikan dari menu navigasi, beranda, dan katalog publik.
          </p>
        </div>
      </div>

      <DialogFooter className="pt-2 gap-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
          disabled={submitting}
          className="border-sand bg-ivory text-espresso hover:bg-sand/30"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={submitting}
          className="bg-espresso text-ivory hover:bg-espresso/90"
        >
          {submitting
            ? 'Menyimpan...'
            : isEdit
            ? 'Simpan Perubahan'
            : 'Tambah Kategori'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function CategoryFormDialog({
  open,
  onOpenChange,
  category,
  onSuccess,
}: CategoryFormDialogProps) {
  const isEdit = Boolean(category)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-ivory border-sand text-espresso max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-espresso">
            {isEdit ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
          </DialogTitle>
          <DialogDescription className="text-sm text-espresso/75">
            {isEdit
              ? 'Perbarui detail kategori produk. Perubahan langsung tercermin pada menu dan katalog toko.'
              : 'Tambahkan kategori baru untuk mengelompokkan produk di katalog Hairy Hijab.'}
          </DialogDescription>
        </DialogHeader>

        <CategoryFormBody
          key={`${open ? 'open' : 'closed'}-${category?.id ?? 'new'}`}
          category={category}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
