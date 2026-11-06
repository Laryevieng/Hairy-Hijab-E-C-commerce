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
import { Checkbox } from '@/components/ui/checkbox'
import { createVariant, updateVariant } from '@/actions/admin-catalog.actions'
import type { AdminVariantItem } from '@/services/admin/products.service'

export interface VariantCategoryInfo {
  id: string
  name: string
  slug: string
  requires_size: boolean
  size_options: string[]
}

export interface VariantFormDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  productId: string
  category: VariantCategoryInfo
  variant?: AdminVariantItem | null
  onSuccess?: () => void
}

interface VariantFormBodyProps {
  productId: string
  category: VariantCategoryInfo
  variant?: AdminVariantItem | null
  onOpenChange: (open: boolean) => void
  onSuccess?: () => void
}

function VariantFormBody({
  productId,
  category,
  variant,
  onOpenChange,
  onSuccess,
}: VariantFormBodyProps) {
  const router = useRouter()
  const isEdit = Boolean(variant)

  const isTwoToneCategory =
    category.slug.toLowerCase().includes('two-tone') ||
    category.name.toLowerCase().includes('two tone') ||
    Boolean(variant?.color_hex_2)

  const [sku, setSku] = React.useState(variant?.sku ?? '')
  const [size, setSize] = React.useState(
    variant?.size ??
      (category.requires_size && category.size_options.length > 0
        ? category.size_options[0]
        : '')
  )
  const [colorName, setColorName] = React.useState(variant?.color_name ?? '')
  const [colorHex, setColorHex] = React.useState(variant?.color_hex ?? '')
  const [colorHex2, setColorHex2] = React.useState(variant?.color_hex_2 ?? '')
  const [price, setPrice] = React.useState(
    variant ? String(variant.price) : ''
  )
  const [compareAtPrice, setCompareAtPrice] = React.useState(
    variant?.compare_at_price !== null &&
      variant?.compare_at_price !== undefined
      ? String(variant.compare_at_price)
      : ''
  )
  const [initialStock, setInitialStock] = React.useState('0')
  const [isActive, setIsActive] = React.useState(variant?.is_active ?? true)

  const [submitting, setSubmitting] = React.useState(false)
  const [formError, setFormError] = React.useState<string | null>(null)
  const [fieldErrors, setFieldErrors] = React.useState<
    Record<string, string[]>
  >({})

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setSubmitting(true)
    setFormError(null)
    setFieldErrors({})

    try {
      const basePayload = {
        sku: sku.trim(),
        size: size.trim() || null,
        color_name: colorName.trim() || null,
        color_hex: colorHex.trim() || null,
        color_hex_2: isTwoToneCategory ? colorHex2.trim() || null : null,
        price: price.trim() === '' ? NaN : Number(price),
        compare_at_price:
          compareAtPrice.trim() === '' ? null : Number(compareAtPrice),
        is_active: isActive,
      }

      const result =
        isEdit && variant
          ? await updateVariant(variant.id, basePayload)
          : await createVariant({
              ...basePayload,
              product_id: productId,
              stock_quantity:
                initialStock.trim() === '' ? 0 : Number(initialStock),
            })

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
          ? 'Varian produk berhasil diperbarui.'
          : 'Varian baru berhasil ditambahkan.'
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

      {/* SKU Varian */}
      <div className="space-y-1.5">
        <Label htmlFor="var-sku" className="text-xs font-semibold">
          SKU Varian <span className="text-danger">*</span>
        </Label>
        <Input
          id="var-sku"
          name="sku"
          value={sku}
          onChange={(e) => setSku(e.target.value)}
          placeholder="Contoh: HH-BNK-S-HITAM"
          aria-invalid={Boolean(fieldErrors.sku)}
          disabled={submitting}
          required
          className="bg-ivory border-sand font-mono text-xs"
        />
        {fieldErrors.sku?.[0] && (
          <p className="text-xs text-danger">{fieldErrors.sku[0]}</p>
        )}
      </div>

      {/* Ukuran & Nama Warna */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="var-size" className="text-xs font-semibold">
            Ukuran ({category.name}){' '}
            {category.requires_size && <span className="text-danger">*</span>}
          </Label>
          {category.requires_size ? (
            <select
              id="var-size"
              name="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              aria-invalid={Boolean(fieldErrors.size)}
              disabled={submitting}
              required
              className="flex h-9 w-full rounded-md border border-sand bg-ivory px-3 py-1.5 text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
            >
              <option value="">-- Pilih Ukuran --</option>
              {category.size_options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          ) : (
            <Input
              id="var-size"
              name="size"
              value={size}
              onChange={(e) => setSize(e.target.value)}
              placeholder="Opsional (mis. All Size)"
              aria-invalid={Boolean(fieldErrors.size)}
              disabled={submitting}
              className="bg-ivory border-sand"
            />
          )}
          {fieldErrors.size?.[0] ? (
            <p className="text-xs text-danger">{fieldErrors.size[0]}</p>
          ) : (
            <p className="text-[11px] text-espresso/60">
              {category.requires_size
                ? `Wajib dipilih dari: ${category.size_options.join(', ')}`
                : 'Kategori ini tidak mewajibkan ukuran.'}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="var-color-name" className="text-xs font-semibold">
            Nama Warna
          </Label>
          <Input
            id="var-color-name"
            name="color_name"
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder={
              isTwoToneCategory
                ? 'Contoh: Hitam - Latte'
                : 'Contoh: Hitam / Cokelat'
            }
            aria-invalid={Boolean(fieldErrors.color_name)}
            disabled={submitting}
            className="bg-ivory border-sand"
          />
          {fieldErrors.color_name?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.color_name[0]}</p>
          )}
        </div>
      </div>

      {/* Kode Hex Warna */}
      <div
        className={
          isTwoToneCategory
            ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
            : 'space-y-1.5'
        }
      >
        <div className="space-y-1.5">
          <Label htmlFor="var-color-hex" className="text-xs font-semibold">
            Kode Hex Warna (#RRGGBB, Opsional)
          </Label>
          <div className="flex items-center gap-2">
            <Input
              id="var-color-hex"
              name="color_hex"
              value={colorHex}
              onChange={(e) => setColorHex(e.target.value)}
              placeholder="#3B3028"
              aria-invalid={Boolean(fieldErrors.color_hex)}
              disabled={submitting}
              className="bg-ivory border-sand font-mono text-xs"
            />
            {/^#[0-9A-Fa-f]{6}$/.test(colorHex.trim()) && (
              <span
                aria-hidden="true"
                className="h-8 w-8 shrink-0 rounded-md border border-sand shadow-2xs"
                style={{ backgroundColor: colorHex.trim() }}
              />
            )}
          </div>
          {fieldErrors.color_hex?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.color_hex[0]}</p>
          )}
        </div>

        {isTwoToneCategory && (
          <div className="space-y-1.5">
            <Label htmlFor="var-color-hex-2" className="text-xs font-semibold">
              Kode Hex Warna Kedua (Two Tone)
            </Label>
            <div className="flex items-center gap-2">
              <Input
                id="var-color-hex-2"
                name="color_hex_2"
                value={colorHex2}
                onChange={(e) => setColorHex2(e.target.value)}
                placeholder="#D9C7B4"
                aria-invalid={Boolean(fieldErrors.color_hex_2)}
                disabled={submitting}
                className="bg-ivory border-sand font-mono text-xs"
              />
              {/^#[0-9A-Fa-f]{6}$/.test(colorHex2.trim()) && (
                <span
                  aria-hidden="true"
                  className="h-8 w-8 shrink-0 rounded-md border border-sand shadow-2xs"
                  style={{ backgroundColor: colorHex2.trim() }}
                />
              )}
            </div>
            {fieldErrors.color_hex_2?.[0] && (
              <p className="text-xs text-danger">
                {fieldErrors.color_hex_2[0]}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Harga Jual & Harga Coret */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="var-price" className="text-xs font-semibold">
            Harga Jual (Rp, Integer) <span className="text-danger">*</span>
          </Label>
          <Input
            id="var-price"
            name="price"
            type="number"
            min={0}
            step={1}
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="45000"
            aria-invalid={Boolean(fieldErrors.price)}
            disabled={submitting}
            required
            className="bg-ivory border-sand"
          />
          {fieldErrors.price?.[0] && (
            <p className="text-xs text-danger">{fieldErrors.price[0]}</p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label
            htmlFor="var-compare-at-price"
            className="text-xs font-semibold"
          >
            Harga Coret / Promo (Rp, Opsional)
          </Label>
          <Input
            id="var-compare-at-price"
            name="compare_at_price"
            type="number"
            min={0}
            step={1}
            value={compareAtPrice}
            onChange={(e) => setCompareAtPrice(e.target.value)}
            placeholder="Kosongkan jika tidak promo"
            aria-invalid={Boolean(fieldErrors.compare_at_price)}
            disabled={submitting}
            className="bg-ivory border-sand"
          />
          {fieldErrors.compare_at_price?.[0] ? (
            <p className="text-xs text-danger">
              {fieldErrors.compare_at_price[0]}
            </p>
          ) : (
            <p className="text-[11px] text-espresso/60">
              Harus lebih besar dari harga jual.
            </p>
          )}
        </div>
      </div>

      {/* Stok Awal (hanya saat membuat) atau Info Stok Baca-Saja (saat ubah) */}
      {!isEdit ? (
        <div className="space-y-1.5 rounded-md border border-sand bg-sand/15 p-3.5">
          <Label htmlFor="var-initial-stock" className="text-xs font-semibold">
            Stok Awal
          </Label>
          <Input
            id="var-initial-stock"
            name="stock_quantity"
            type="number"
            min={0}
            step={1}
            value={initialStock}
            onChange={(e) => setInitialStock(e.target.value)}
            aria-invalid={Boolean(fieldErrors.stock_quantity)}
            disabled={submitting}
            className="bg-ivory border-sand max-w-[180px]"
          />
          {fieldErrors.stock_quantity?.[0] ? (
            <p className="text-xs text-danger">
              {fieldErrors.stock_quantity[0]}
            </p>
          ) : (
            <p className="text-[11px] text-espresso/70">
              Stok awal hanya diisi saat membuat varian baru. Perubahan stok selanjutnya dilakukan lewat menu Inventori.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-md border border-sand bg-sand/15 p-3.5 text-xs text-espresso/80">
          <span className="font-semibold">Stok saat ini (baca saja):</span>{' '}
          <span className="font-mono font-bold">{variant?.stock_quantity}</span>{' '}
          item. Penyesuaian stok dilakukan melalui menu Inventori.
        </div>
      )}

      {/* Status Aktif */}
      <div className="flex items-start gap-2.5 rounded-md border border-sand p-3.5">
        <Checkbox
          id="var-is-active"
          checked={isActive}
          onCheckedChange={(checked) => setIsActive(Boolean(checked))}
          disabled={submitting}
          className="mt-0.5"
        />
        <div className="space-y-0.5">
          <Label
            htmlFor="var-is-active"
            className="text-xs font-semibold cursor-pointer"
          >
            Varian Aktif
          </Label>
          <p className="text-[11px] text-espresso/70">
            Varian nonaktif tidak dapat dipilih atau dibeli oleh pelanggan di halaman produk.
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
            : 'Tambah Varian'}
        </Button>
      </DialogFooter>
    </form>
  )
}

export function VariantFormDialog({
  open,
  onOpenChange,
  productId,
  category,
  variant,
  onSuccess,
}: VariantFormDialogProps) {
  const isEdit = Boolean(variant)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-ivory border-sand text-espresso max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl font-bold text-espresso">
            {isEdit ? 'Ubah Varian Produk' : 'Tambah Varian Baru'}
          </DialogTitle>
          <DialogDescription className="text-sm text-espresso/75">
            {isEdit
              ? 'Perbarui SKU, ukuran, warna, atau harga varian produk ini.'
              : 'Tambahkan kombinasi ukuran, warna, harga, dan stok awal untuk produk ini.'}
          </DialogDescription>
        </DialogHeader>

        <VariantFormBody
          key={`${open ? 'open' : 'closed'}-${variant?.id ?? 'new'}-${category.id}`}
          productId={productId}
          category={category}
          variant={variant}
          onOpenChange={onOpenChange}
          onSuccess={onSuccess}
        />
      </DialogContent>
    </Dialog>
  )
}
