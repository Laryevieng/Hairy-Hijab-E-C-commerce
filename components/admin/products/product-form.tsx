'use client'

import * as React from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { useFieldArray, useForm, useWatch } from 'react-hook-form'
import {
  Plus,
  Trash2,
  ArrowLeft,
  Sparkles,
  EyeOff,
  Eye,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'
import { slugify } from '@/lib/utils/slug'
import {
  productFormSchema,
  type ProductFormValues,
  type ProductSpecEntry,
} from '@/lib/validations/product'
import {
  createProduct,
  updateProduct,
  toggleProductActive,
  deleteProduct,
} from '@/actions/admin-catalog.actions'
import type { AdminProductDetail } from '@/services/admin/products.service'

export interface ProductCategorySelectItem {
  id: string
  name: string
  is_active: boolean
}

export interface ProductFormProps {
  mode: 'create' | 'edit'
  categories: ProductCategorySelectItem[]
  product?: AdminProductDetail
}

function parseInitialSpecs(specs: unknown): ProductSpecEntry[] {
  if (!specs || typeof specs !== 'object' || Array.isArray(specs)) {
    return []
  }
  return Object.entries(specs as Record<string, unknown>).map(([k, v]) => ({
    key: String(k),
    value: String(v ?? ''),
  }))
}

export function ProductForm({ mode, categories, product }: ProductFormProps) {
  const router = useRouter()
  const isEdit = mode === 'edit' && Boolean(product)

  const [slugTouched, setSlugTouched] = React.useState(isEdit)
  const [suggestedSlug, setSuggestedSlug] = React.useState<string | null>(null)
  const [serverError, setServerError] = React.useState<string | null>(null)
  const [submitting, setSubmitting] = React.useState(false)
  const [togglingActive, setTogglingActive] = React.useState(false)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false)

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      name: product?.name ?? '',
      slug: product?.slug ?? '',
      category_id: product?.category_id ?? '',
      description: product?.description ?? '',
      material: product?.material ?? '',
      care_instructions: product?.care_instructions ?? '',
      specs: parseInitialSpecs(product?.specs),
      is_active: product?.is_active ?? true,
      is_featured: product?.is_featured ?? false,
    },
  })

  const {
    fields: specFields,
    append: appendSpec,
    remove: removeSpec,
  } = useFieldArray({
    control: form.control,
    name: 'specs',
  })

  const handleNameChange = (
    value: string,
    onChange: (val: string) => void
  ) => {
    onChange(value)
    if (!slugTouched) {
      form.setValue('slug', slugify(value), {
        shouldValidate: form.formState.isSubmitted,
      })
    }
  }

  const handleApplySuggestedSlug = () => {
    if (!suggestedSlug) return
    setSlugTouched(true)
    form.setValue('slug', suggestedSlug, { shouldValidate: true })
    form.clearErrors('slug')
    setSuggestedSlug(null)
    setServerError(null)
  }

  const onSubmit = async (values: ProductFormValues) => {
    setSubmitting(true)
    setServerError(null)
    setSuggestedSlug(null)

    try {
      const result =
        isEdit && product
          ? await updateProduct(product.id, values)
          : await createProduct(values)

      if (!result.ok) {
        setServerError(result.error.message)
        if (result.error.fieldErrors) {
          const suggestion = result.error.fieldErrors.suggestedSlug?.[0]
          if (suggestion) {
            setSuggestedSlug(suggestion)
          }
          for (const [field, messages] of Object.entries(
            result.error.fieldErrors
          )) {
            if (
              field === 'name' ||
              field === 'slug' ||
              field === 'category_id' ||
              field === 'description' ||
              field === 'material' ||
              field === 'care_instructions' ||
              field === 'specs'
            ) {
              form.setError(field, {
                type: 'server',
                message: messages[0],
              })
            }
          }
        }
        toast.error(result.error.message)
        return
      }

      if (isEdit) {
        toast.success('Perubahan produk berhasil disimpan.')
        router.refresh()
      } else {
        toast.success(
          'Produk berhasil dibuat. Silakan tambahkan varian dan gambar.'
        )
        router.push(`/admin/products/${result.data.id}/edit`)
      }
    } finally {
      setSubmitting(false)
    }
  }

  const handleToggleProductActive = async () => {
    if (!product) return
    setTogglingActive(true)
    try {
      const nextActive = !form.getValues('is_active')
      const res = await toggleProductActive(product.id, nextActive)
      if (!res.ok) {
        toast.error(res.error.message)
        return
      }
      form.setValue('is_active', nextActive)
      toast.success(
        nextActive
          ? `Produk "${product.name}" diaktifkan.`
          : `Produk "${product.name}" dinonaktifkan dari katalog publik.`
      )
      router.refresh()
    } finally {
      setTogglingActive(false)
    }
  }

  const handleConfirmDeleteProduct = async () => {
    if (!product) return
    const res = await deleteProduct(product.id)
    if (!res.ok) {
      toast.error(res.error.message)
      return
    }
    toast.success(`Produk "${product.name}" berhasil dihapus.`)
    router.push('/admin/products')
    router.refresh()
  }

  const currentName = useWatch({ control: form.control, name: 'name' }) ?? ''
  const currentSlug = useWatch({ control: form.control, name: 'slug' }) ?? ''
  const currentIsActive =
    useWatch({ control: form.control, name: 'is_active' }) ?? true

  return (
    <div className="space-y-6">
      {/* Navigasi Kembali */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-sand pb-5">
        <div className="space-y-1">
          <Link
            href="/admin/products"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-espresso/70 hover:text-espresso transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Kembali ke Daftar Produk</span>
          </Link>
          <h1 className="text-2xl md:text-3xl font-serif font-bold tracking-tight text-espresso">
            {isEdit ? `Edit Produk: ${product?.name}` : 'Tambah Produk Baru'}
          </h1>
          <p className="text-sm text-espresso/70">
            {isEdit
              ? 'Perbarui informasi dasar, spesifikasi, varian, dan galeri foto produk.'
              : 'Isi informasi dasar produk terlebih dahulu. Setelah disimpan, Anda akan diarahkan untuk menambah varian dan gambar.'}
          </p>
        </div>

        {isEdit && product && (
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={togglingActive || submitting}
              onClick={handleToggleProductActive}
              className="gap-1.5 border-sand bg-ivory text-xs text-espresso hover:bg-sand/30"
            >
              {currentIsActive ? (
                <>
                  <EyeOff className="h-3.5 w-3.5 text-warning" />
                  <span>Nonaktifkan Produk</span>
                </>
              ) : (
                <>
                  <Eye className="h-3.5 w-3.5 text-success" />
                  <span>Aktifkan Produk</span>
                </>
              )}
            </Button>

            <span
              title={
                product.has_orders
                  ? 'Produk ini sudah pernah dipesan sehingga tidak dapat dihapus keras (D-15). Gunakan tombol Nonaktifkan.'
                  : 'Hapus produk secara permanen'
              }
            >
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={product.has_orders || submitting}
                onClick={() => setDeleteConfirmOpen(true)}
                className="gap-1.5 border-sand bg-ivory text-xs text-danger hover:bg-danger/10 hover:border-danger/40 disabled:opacity-40"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Hapus Produk</span>
              </Button>
            </span>
          </div>
        )}
      </div>

      {isEdit && product?.has_orders && (
        <div
          role="note"
          className="flex items-start gap-2.5 rounded-md border border-sand bg-sand/20 px-4 py-3 text-xs text-espresso/80"
        >
          <AlertCircle className="h-4 w-4 text-gold-deep shrink-0 mt-0.5" />
          <p>
            <strong>Catatan Integritas Pesanan (D-15):</strong> Produk ini sudah
            pernah dipesan oleh pelanggan sehingga tombol <strong>Hapus Produk</strong>{' '}
            dinonaktifkan demi menjaga akurasi riwayat pesanan. Jika produk sudah
            tidak dijual, gunakan fitur <strong>Nonaktifkan Produk</strong>.
          </p>
        </div>
      )}

      {/* Formulir Utama Produk */}
      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-6 rounded-lg border border-sand bg-ivory p-6 shadow-xs"
          noValidate
        >
          {serverError && (
            <div
              role="alert"
              className="rounded-md border border-danger/40 bg-danger/10 px-4 py-3 text-xs font-medium text-danger space-y-2"
            >
              <p>{serverError}</p>
              {suggestedSlug && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="text-espresso/80">Saran slug tersedia:</span>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={handleApplySuggestedSlug}
                    className="h-7 gap-1.5 border-gold-deep bg-ivory px-2.5 text-xs font-semibold text-espresso hover:bg-sand/30"
                  >
                    <Sparkles className="h-3 w-3 text-gold-deep" />
                    <span>Gunakan &ldquo;{suggestedSlug}&rdquo;</span>
                  </Button>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nama Produk */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Nama Produk <span className="text-danger">*</span>
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) =>
                        handleNameChange(e.target.value, field.onChange)
                      }
                      placeholder="Contoh: Bergo Karet Daily"
                      disabled={submitting}
                      className="bg-ivory border-sand"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            {/* Slug Produk */}
            <FormField
              control={form.control}
              name="slug"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel className="text-xs font-semibold">
                      Slug URL <span className="text-danger">*</span>
                    </FormLabel>
                    <button
                      type="button"
                      onClick={() => {
                        setSlugTouched(true)
                        form.setValue('slug', slugify(currentName), {
                          shouldValidate: true,
                        })
                      }}
                      disabled={submitting || !currentName.trim()}
                      className="text-[11px] font-medium text-gold-deep hover:underline disabled:opacity-50"
                    >
                      Buat otomatis dari nama
                    </button>
                  </div>
                  <FormControl>
                    <Input
                      {...field}
                      onChange={(e) => {
                        setSlugTouched(true)
                        field.onChange(e.target.value)
                      }}
                      placeholder="bergo-karet-daily"
                      disabled={submitting}
                      className="bg-ivory border-sand font-mono text-xs"
                    />
                  </FormControl>
                  <FormDescription className="text-[11px] text-espresso/60">
                    URL publik: <code>/products/{currentSlug || '...'}</code>
                  </FormDescription>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Kategori Produk */}
          <FormField
            control={form.control}
            name="category_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">
                  Kategori <span className="text-danger">*</span>
                </FormLabel>
                <FormControl>
                  <select
                    {...field}
                    disabled={submitting}
                    aria-invalid={Boolean(form.formState.errors.category_id)}
                    className="flex h-10 w-full rounded-md border border-sand bg-ivory px-3 py-2 text-sm text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep"
                  >
                    <option value="">-- Pilih Kategori Produk --</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                        {!cat.is_active ? ' (Nonaktif)' : ''}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormDescription className="text-[11px] text-espresso/60">
                  Setiap produk wajib memiliki tepat satu kategori (§6.2).
                </FormDescription>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Deskripsi Produk */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-xs font-semibold">
                  Deskripsi Produk
                </FormLabel>
                <FormControl>
                  <Textarea
                    {...field}
                    rows={4}
                    placeholder="Tulis deskripsi detail mengenai kenyamanan, potongan, dan karakteristik produk..."
                    disabled={submitting}
                    className="bg-ivory border-sand"
                  />
                </FormControl>
                <FormMessage className="text-xs" />
              </FormItem>
            )}
          />

          {/* Bahan & Panduan Perawatan */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField
              control={form.control}
              name="material"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Bahan (Material)
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Jersey Korea Premium / Kaos Rayon"
                      disabled={submitting}
                      className="bg-ivory border-sand"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="care_instructions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-xs font-semibold">
                    Panduan Perawatan
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Contoh: Cuci tangan dengan air dingin, setrika suhu rendah"
                      disabled={submitting}
                      className="bg-ivory border-sand"
                    />
                  </FormControl>
                  <FormMessage className="text-xs" />
                </FormItem>
              )}
            />
          </div>

          {/* Spesifikasi (Pasangan Kunci-Nilai) */}
          <div className="space-y-3 rounded-md border border-sand bg-sand/10 p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 className="text-xs font-semibold text-espresso">
                  Spesifikasi Tambahan (Pasangan Kunci–Nilai)
                </h2>
                <p className="text-[11px] text-espresso/65">
                  Tambahkan atribut spesifik seperti Dimensi, Panjang Depan, Panjang Belakang, atau Finishing.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={submitting || specFields.length >= 20}
                onClick={() => appendSpec({ key: '', value: '' })}
                className="h-8 gap-1 border-sand bg-ivory text-xs text-espresso hover:bg-sand/30 self-start sm:self-auto"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Tambah Spesifikasi</span>
              </Button>
            </div>

            {specFields.length === 0 ? (
              <p className="text-xs text-espresso/60 italic py-2">
                Belum ada spesifikasi tambahan. Klik &ldquo;Tambah Spesifikasi&rdquo; untuk menambahkan baris.
              </p>
            ) : (
              <div className="space-y-2.5">
                {specFields.map((specField, index) => (
                  <div
                    key={specField.id}
                    className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-start"
                  >
                    <div className="sm:col-span-5">
                      <FormField
                        control={form.control}
                        name={`specs.${index}.key`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">
                              Nama Atribut {index + 1}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Atribut (mis. Dimensi)"
                                disabled={submitting}
                                className="bg-ivory border-sand text-xs h-9"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-6">
                      <FormField
                        control={form.control}
                        name={`specs.${index}.value`}
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="sr-only">
                              Nilai Atribut {index + 1}
                            </FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                placeholder="Nilai (mis. 175 x 75 cm)"
                                disabled={submitting}
                                className="bg-ivory border-sand text-xs h-9"
                              />
                            </FormControl>
                            <FormMessage className="text-xs" />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="sm:col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        disabled={submitting}
                        onClick={() => removeSpec(index)}
                        aria-label={`Hapus spesifikasi baris ${index + 1}`}
                        className="h-9 w-9 text-danger hover:bg-danger/10 hover:text-danger"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pengaturan Status & Unggulan */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="is_active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-sand p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                      disabled={submitting}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-semibold cursor-pointer">
                      Produk Aktif
                    </FormLabel>
                    <FormDescription className="text-[11px] text-espresso/70">
                      Produk aktif yang memiliki varian aktif akan tampil di katalog toko publik.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="is_featured"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start gap-3 space-y-0 rounded-md border border-sand p-4">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(Boolean(checked))
                      }
                      disabled={submitting}
                      className="mt-0.5"
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel className="text-xs font-semibold cursor-pointer">
                      Produk Unggulan (Featured)
                    </FormLabel>
                    <FormDescription className="text-[11px] text-espresso/70">
                      Tandai sebagai koleksi unggulan pilihan Hairy Hijab.
                    </FormDescription>
                  </div>
                </FormItem>
              )}
            />
          </div>

          {/* Tombol Aksi Simpan */}
          <div className="flex items-center justify-end gap-3 border-t border-sand pt-4">
            <Button
              asChild
              variant="outline"
              disabled={submitting}
              className="border-sand bg-ivory text-espresso hover:bg-sand/30"
            >
              <Link href="/admin/products">Batal</Link>
            </Button>

            <Button
              type="submit"
              disabled={submitting}
              className="bg-espresso text-ivory hover:bg-espresso/90"
            >
              {submitting
                ? 'Menyimpan...'
                : isEdit
                ? 'Simpan Perubahan Produk'
                : 'Simpan & Lanjut ke Varian'}
            </Button>
          </div>
        </form>
      </Form>

      {isEdit && product && (
        <ConfirmDialog
          open={deleteConfirmOpen}
          onOpenChange={setDeleteConfirmOpen}
          title="Hapus Produk Secara Permanen?"
          description={
            <>
              Apakah Anda yakin ingin menghapus produk{' '}
              <strong>{product.name}</strong> beserta seluruh varian dan gambarnya? Tindakan ini tidak dapat dibatalkan.
            </>
          }
          confirmLabel="Ya, Hapus Produk"
          variant="destructive"
          onConfirm={handleConfirmDeleteProduct}
        />
      )}
    </div>
  )
}
