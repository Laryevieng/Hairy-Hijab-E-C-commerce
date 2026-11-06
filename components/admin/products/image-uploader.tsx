'use client'

import * as React from 'react'
import { useRouter } from 'next/navigation'
import {
  Image as ImageIcon,
  UploadCloud,
  ArrowUp,
  ArrowDown,
  Trash2,
  Check,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import {
  detectImageMime,
  MIME_TO_EXT,
  type AllowedImageMime,
} from '@/lib/utils/file-signature'
import {
  MAX_IMAGES_PER_PRODUCT,
  MAX_PRODUCT_IMAGE_SIZE,
} from '@/lib/validations/product-image'
import {
  createProductImage,
  updateProductImage,
  moveProductImageOrder,
  deleteProductImage,
} from '@/actions/admin-catalog.actions'
import type {
  ProductImageRow,
  AdminVariantItem,
} from '@/services/admin/products.service'

export interface ImageUploaderProps {
  productId: string
  productName: string
  images: ProductImageRow[]
  variants: AdminVariantItem[]
}

/**
 * Kompresi gambar produk di sisi klien via HTML Canvas (P8-06a):
 * Sisi terpanjang maksimal 1600 px, kualitas JPEG 0.82.
 */
export async function compressProductImageClient(file: File): Promise<File> {
  if (
    !file.type.startsWith('image/') ||
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    process.env.NODE_ENV === 'test'
  ) {
    return file
  }

  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxDim = 1600
      let { width, height } = img

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          const compressed = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        'image/jpeg',
        0.82
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

function buildPublicImageUrl(storagePath: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const cleanPath = storagePath
    .replace(/^product-images\//, '')
    .split('/')
    .map(encodeURIComponent)
    .join('/')
  return `${baseUrl}/storage/v1/object/public/product-images/${cleanPath}`
}

interface ImageItemRowProps {
  image: ProductImageRow
  index: number
  total: number
  productName: string
  variants: AdminVariantItem[]
  busyId: string | null
  onMove: (id: string, direction: 'up' | 'down') => Promise<void>
  onSaveMeta: (
    id: string,
    altText: string,
    variantId: string | null
  ) => Promise<void>
  onRequestDelete: (image: ProductImageRow) => void
}

function ImageItemRow({
  image,
  index,
  total,
  productName,
  variants,
  busyId,
  onMove,
  onSaveMeta,
  onRequestDelete,
}: ImageItemRowProps) {
  const [altText, setAltText] = React.useState(image.alt_text || productName)
  const [variantId, setVariantId] = React.useState<string>(
    image.variant_id ?? ''
  )
  const [altError, setAltError] = React.useState<string | null>(null)

  const isBusy = busyId === image.id
  const isDirty =
    altText.trim() !== (image.alt_text ?? '') ||
    (variantId || null) !== (image.variant_id ?? null)

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = altText.trim()
    if (!trimmed) {
      setAltError('Teks alternatif (alt text) wajib diisi.')
      return
    }
    if (trimmed.length > 200) {
      setAltError('Teks alternatif maksimal 200 karakter.')
      return
    }
    setAltError(null)
    await onSaveMeta(image.id, trimmed, variantId || null)
  }

  return (
    <div className="flex flex-col sm:flex-row items-start gap-4 rounded-lg border border-sand bg-ivory p-4 shadow-2xs">
      {/* Pratinjau Thumbnail */}
      <div className="relative h-28 w-24 shrink-0 overflow-hidden rounded-md border border-sand bg-sand/20">
        {/* eslint-disable-next-line @next/next/no-img-element -- URL publik bucket product-images */}
        <img
          src={buildPublicImageUrl(image.storage_path)}
          alt={image.alt_text || productName}
          className="h-full w-full object-cover"
        />
        <Badge
          variant={index === 0 ? 'default' : 'secondary'}
          className="absolute left-1.5 top-1.5 text-[10px] px-1.5 py-0"
        >
          {index === 0 ? '#1 Utama' : `#${index + 1}`}
        </Badge>
      </div>

      {/* Form Edit Alt Text & Varian */}
      <form onSubmit={handleSave} className="flex-1 w-full space-y-3" noValidate>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
          <div className="md:col-span-7 space-y-1">
            <Label
              htmlFor={`img-alt-${image.id}`}
              className="text-xs font-semibold text-espresso"
            >
              Teks Alternatif (Alt Text) <span className="text-danger">*</span>
            </Label>
            <Input
              id={`img-alt-${image.id}`}
              value={altText}
              onChange={(e) => {
                setAltText(e.target.value)
                if (altError) setAltError(null)
              }}
              placeholder={productName}
              aria-invalid={Boolean(altError)}
              disabled={isBusy}
              className="h-9 bg-ivory border-sand text-xs"
            />
            {altError && <p className="text-xs text-danger">{altError}</p>}
          </div>

          <div className="md:col-span-5 space-y-1">
            <Label
              htmlFor={`img-var-${image.id}`}
              className="text-xs font-semibold text-espresso"
            >
              Kaitkan Varian (Opsional)
            </Label>
            <select
              id={`img-var-${image.id}`}
              value={variantId}
              onChange={(e) => setVariantId(e.target.value)}
              disabled={isBusy}
              className="flex h-9 w-full rounded-md border border-sand bg-ivory px-2.5 py-1 text-xs text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
            >
              <option value="">Semua Varian (Umum)</option>
              {variants.map((v) => {
                const label =
                  [v.size, v.color_name].filter(Boolean).join(' · ') || v.sku
                return (
                  <option key={v.id} value={v.id}>
                    {label} ({v.sku})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
          <span className="font-mono text-[11px] text-espresso/55 truncate max-w-xs">
            {image.storage_path}
          </span>

          <div className="flex items-center gap-1.5">
            {/* Tombol Simpan Alt Text / Varian */}
            <Button
              type="submit"
              variant="outline"
              size="sm"
              disabled={isBusy || !isDirty}
              className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-espresso hover:bg-sand/30"
              aria-label={`Simpan detail gambar ${index + 1}`}
            >
              <Check className="h-3.5 w-3.5 text-success" />
              <span>Simpan</span>
            </Button>

            {/* Tombol Urutan Naik (Keyboard Accessible) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || index === 0}
              onClick={() => onMove(image.id, 'up')}
              className="h-8 w-8 p-0 border-sand bg-ivory text-espresso hover:bg-sand/30"
              aria-label={`Pindahkan gambar ${index + 1} ke atas`}
              title="Pindahkan ke atas"
            >
              <ArrowUp className="h-3.5 w-3.5" />
            </Button>

            {/* Tombol Urutan Turun (Keyboard Accessible) */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy || index === total - 1}
              onClick={() => onMove(image.id, 'down')}
              className="h-8 w-8 p-0 border-sand bg-ivory text-espresso hover:bg-sand/30"
              aria-label={`Pindahkan gambar ${index + 1} ke bawah`}
              title="Pindahkan ke bawah"
            >
              <ArrowDown className="h-3.5 w-3.5" />
            </Button>

            {/* Tombol Hapus */}
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isBusy}
              onClick={() => onRequestDelete(image)}
              className="h-8 gap-1 border-sand bg-ivory px-2.5 text-xs text-danger hover:bg-danger/10 hover:border-danger/40"
              aria-label={`Hapus gambar ${index + 1}`}
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only">Hapus</span>
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}

export function ImageUploader({
  productId,
  productName,
  images,
  variants,
}: ImageUploaderProps) {
  const router = useRouter()
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const [defaultAltText, setDefaultAltText] = React.useState(productName)
  const [defaultVariantId, setDefaultVariantId] = React.useState<string>('')
  const [uploading, setUploading] = React.useState(false)
  const [uploadError, setUploadError] = React.useState<string | null>(null)
  const [busyImageId, setBusyImageId] = React.useState<string | null>(null)
  const [deletingImage, setDeletingImage] =
    React.useState<ProductImageRow | null>(null)

  const sortedImages = React.useMemo(
    () => [...images].sort((a, b) => a.sort_order - b.sort_order),
    [images]
  )

  const remainingSlots = Math.max(
    0,
    MAX_IMAGES_PER_PRODUCT - sortedImages.length
  )

  const handleFilesSelected = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const fileList = e.target.files
    if (!fileList || fileList.length === 0) return

    const selectedFiles = Array.from(fileList)
    e.target.value = ''
    setUploadError(null)

    const effectiveAltText = defaultAltText.trim() || productName.trim()
    if (!effectiveAltText) {
      const msg = 'Teks alternatif (alt text) wajib diisi sebelum mengunggah.'
      setUploadError(msg)
      toast.error(msg)
      return
    }

    if (selectedFiles.length > remainingSlots) {
      const msg =
        remainingSlots === 0
          ? `Batas maksimal ${MAX_IMAGES_PER_PRODUCT} gambar per produk telah tercapai.`
          : `Hanya tersisa ${remainingSlots} slot gambar lagi (maksimal ${MAX_IMAGES_PER_PRODUCT} gambar per produk).`
      setUploadError(msg)
      toast.error(msg)
      return
    }

    setUploading(true)
    const supabase = createBrowserSupabaseClient()
    let uploadedCount = 0

    try {
      for (let i = 0; i < selectedFiles.length; i += 1) {
        const rawFile = selectedFiles[i]

        // 1. Cek signature magic bytes file asli (JPEG / PNG / WebP)
        const rawBuffer = await rawFile.arrayBuffer()
        const detectedMime = detectImageMime(rawBuffer)
        if (!detectedMime) {
          const msg = `File "${rawFile.name}" ditolak: format harus JPEG, PNG, atau WebP yang valid.`
          setUploadError(msg)
          toast.error(msg)
          continue
        }

        // 2. Kecilkan di klien via canvas (±1600 px)
        const processedFile = await compressProductImageClient(rawFile)

        // 3. Pastikan ukuran <= 2 MB
        if (processedFile.size > MAX_PRODUCT_IMAGE_SIZE) {
          const msg = `File "${rawFile.name}" melebihi batas maksimal 2 MB.`
          setUploadError(msg)
          toast.error(msg)
          continue
        }

        const finalBuffer = await processedFile.arrayBuffer()
        const finalMime: AllowedImageMime =
          detectImageMime(finalBuffer) ?? detectedMime
        const ext = MIME_TO_EXT[finalMime]
        const storagePath = `${productId}/${crypto.randomUUID()}.${ext}`

        // 4. Unggah langsung ke bucket product-images lewat klien sesi (policy admin)
        const { error: storageError } = await supabase.storage
          .from('product-images')
          .upload(storagePath, processedFile, {
            contentType: finalMime,
            upsert: false,
          })

        if (storageError) {
          const msg = `Gagal mengunggah "${rawFile.name}": ${storageError.message}`
          setUploadError(msg)
          toast.error(msg)
          continue
        }

        // 5. Simpan baris product_images lewat Server Action
        const altForItem =
          selectedFiles.length > 1
            ? `${effectiveAltText} (${sortedImages.length + uploadedCount + 1})`
            : effectiveAltText

        const actionRes = await createProductImage({
          product_id: productId,
          storage_path: storagePath,
          alt_text: altForItem,
          sort_order: sortedImages.length + uploadedCount,
          variant_id: defaultVariantId || null,
        })

        if (!actionRes.ok) {
          // Pastikan objek yang sudah terunggah dihapus bila penyimpanan baris gagal
          await supabase.storage.from('product-images').remove([storagePath])
          setUploadError(actionRes.error.message)
          toast.error(actionRes.error.message)
          continue
        }

        uploadedCount += 1
      }

      if (uploadedCount > 0) {
        toast.success(`${uploadedCount} gambar produk berhasil ditambahkan.`)
        router.refresh()
      }
    } finally {
      setUploading(false)
    }
  }

  const handleMove = async (id: string, direction: 'up' | 'down') => {
    setBusyImageId(id)
    try {
      const res = await moveProductImageOrder(id, direction)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success('Urutan gambar diperbarui.')
      router.refresh()
    } finally {
      setBusyImageId(null)
    }
  }

  const handleSaveMeta = async (
    id: string,
    altText: string,
    variantId: string | null
  ) => {
    setBusyImageId(id)
    try {
      const res = await updateProductImage({
        id,
        alt_text: altText,
        variant_id: variantId,
      })
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success('Informasi gambar berhasil disimpan.')
      router.refresh()
    } finally {
      setBusyImageId(null)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingImage) return
    setBusyImageId(deletingImage.id)
    try {
      const res = await deleteProductImage(deletingImage.id)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      toast.success('Gambar produk berhasil dihapus dari katalog dan penyimpanan.')
      setDeletingImage(null)
      router.refresh()
    } finally {
      setBusyImageId(null)
    }
  }

  return (
    <section
      aria-labelledby="product-images-heading"
      className="rounded-lg border border-sand bg-ivory p-6 shadow-xs space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-4">
        <div className="flex items-start gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-sand/30 text-espresso mt-0.5">
            <ImageIcon className="h-4 w-4" />
          </div>
          <div>
            <h2
              id="product-images-heading"
              className="font-serif text-lg font-bold text-espresso"
            >
              Galeri Gambar Produk ({sortedImages.length}/
              {MAX_IMAGES_PER_PRODUCT})
            </h2>
            <p className="text-xs text-espresso/70 mt-0.5">
              Maksimal {MAX_IMAGES_PER_PRODUCT} foto per produk (JPEG, PNG, atau WebP, maks. 2 MB per foto; otomatis dikompresi ±1600 px). Gambar pertama (#1) menjadi foto utama di katalog.
            </p>
          </div>
        </div>
      </div>

      {uploadError && (
        <div
          role="alert"
          className="flex items-center gap-2 rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-medium text-danger"
        >
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{uploadError}</span>
        </div>
      )}

      {/* Panel Unggah Multi-File */}
      <div className="rounded-lg border border-dashed border-sand bg-sand/15 p-5 space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="upload-default-alt"
              className="text-xs font-semibold text-espresso"
            >
              Teks Alternatif Awal (Wajib){' '}
              <span className="text-danger">*</span>
            </Label>
            <Input
              id="upload-default-alt"
              value={defaultAltText}
              onChange={(e) => setDefaultAltText(e.target.value)}
              placeholder={productName}
              disabled={uploading || remainingSlots === 0}
              className="bg-ivory border-sand text-xs h-9"
            />
            <p className="text-[11px] text-espresso/60">
              Nilai awal diisi otomatis dengan nama produk untuk aksesibilitas dan SEO.
            </p>
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="upload-default-variant"
              className="text-xs font-semibold text-espresso"
            >
              Varian Terkait (Opsional)
            </Label>
            <select
              id="upload-default-variant"
              value={defaultVariantId}
              onChange={(e) => setDefaultVariantId(e.target.value)}
              disabled={uploading || remainingSlots === 0}
              className="flex h-9 w-full rounded-md border border-sand bg-ivory px-3 py-1 text-xs text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
            >
              <option value="">Semua Varian (Umum)</option>
              {variants.map((v) => {
                const label =
                  [v.size, v.color_name].filter(Boolean).join(' · ') || v.sku
                return (
                  <option key={v.id} value={v.id}>
                    {label} ({v.sku})
                  </option>
                )
              })}
            </select>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <p className="text-xs text-espresso/75">
            {remainingSlots > 0
              ? `Tersisa ${remainingSlots} slot gambar yang dapat diunggah.`
              : `Batas maksimal ${MAX_IMAGES_PER_PRODUCT} gambar telah tercapai. Hapus salah satu gambar jika ingin mengganti.`}
          </p>

          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp"
              onChange={handleFilesSelected}
              disabled={uploading || remainingSlots === 0}
              className="sr-only"
              aria-label="Pilih file gambar produk"
            />
            <Button
              type="button"
              disabled={uploading || remainingSlots === 0}
              onClick={() => fileInputRef.current?.click()}
              className="bg-espresso text-ivory hover:bg-espresso/90 gap-2"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Mengunggah...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="h-4 w-4" />
                  <span>Pilih & Unggah Gambar</span>
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Daftar Gambar Terdaftar */}
      {sortedImages.length === 0 ? (
        <div className="rounded-md border border-sand/60 bg-ivory p-8 text-center text-sm text-espresso/65">
          Belum ada gambar untuk produk ini. Unggah foto produk agar tampil di katalog toko publik.
        </div>
      ) : (
        <div className="space-y-3" role="list" aria-label="Daftar gambar produk">
          {sortedImages.map((img, idx) => (
            <div key={img.id} role="listitem">
              <ImageItemRow
                image={img}
                index={idx}
                total={sortedImages.length}
                productName={productName}
                variants={variants}
                busyId={busyImageId}
                onMove={handleMove}
                onSaveMeta={handleSaveMeta}
                onRequestDelete={setDeletingImage}
              />
            </div>
          ))}
        </div>
      )}

      {/* Dialog Konfirmasi Hapus */}
      <ConfirmDialog
        open={Boolean(deletingImage)}
        onOpenChange={(open) => !open && setDeletingImage(null)}
        title="Hapus Gambar Produk?"
        description={
          deletingImage ? (
            <>
              Apakah Anda yakin ingin menghapus gambar{' '}
              <strong>{deletingImage.alt_text || productName}</strong>? File gambar di penyimpanan dan data pada produk akan dihapus secara permanen.
            </>
          ) : (
            ''
          )
        }
        confirmLabel="Ya, Hapus Gambar"
        variant="destructive"
        onConfirm={handleConfirmDelete}
      />
    </section>
  )
}
