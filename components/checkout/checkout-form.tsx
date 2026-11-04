'use client'

import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { zodResolver } from '@hookform/resolvers/zod'
import { AlertCircle, ShoppingBag } from 'lucide-react'
import { useForm, useWatch, type FieldPath } from 'react-hook-form'
import { toast } from 'sonner'
import { placeOrder, quoteShipping } from '@/actions/checkout.actions'
import { AddressFields } from '@/components/checkout/address-fields'
import { CheckoutSummary, type ShippingState } from '@/components/checkout/checkout-summary'
import { EmptyState } from '@/components/common/empty-state'
import { ErrorState } from '@/components/common/error-state'
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { PROVINCES } from '@/config/regions'
import { useCartSnapshot } from '@/components/cart/use-cart-snapshot'
import { computeCartTotals } from '@/lib/cart/cart-totals'
import { calculateTotals, type Totals } from '@/lib/pricing/calculate-totals'
import type { ShippingQuote } from '@/services/shipping.service'
import {
  checkoutFormSchema,
  type CheckoutFormInput,
  type CheckoutInitialData,
  type CheckoutInput,
} from '@/lib/validations/checkout'
import { useCartStore } from '@/stores/cart.store'
import { useCartHydration } from '@/stores/use-cart-hydration'
import type { ActionResult } from '@/types/action'

export interface CheckoutFormProps {
  initialData?: CheckoutInitialData
  onSubmitOrder?: (input: CheckoutInput) => Promise<ActionResult<{ orderNumber: string; publicToken?: string }>>
}

function CheckoutSkeleton() {
  return (
    <div role="status" aria-label="Memuat checkout" className="grid gap-8 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-6">
        <div className="h-64 animate-pulse rounded-lg bg-sand/40" />
        <div className="h-72 animate-pulse rounded-lg bg-sand/40" />
      </div>
      <div className="h-96 animate-pulse rounded-lg bg-sand/40" />
      <span className="sr-only">Memuat halaman checkout…</span>
    </div>
  )
}

export function CheckoutForm({ initialData, onSubmitOrder }: CheckoutFormProps) {
  const router = useRouter()
  const errorAlertId = useId()
  const hydrated = useCartHydration()
  const lines = useCartStore((state) => state.lines)
  const clearCart = useCartStore((state) => state.clear)

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formError, setFormError] = useState<string>()
  const [shippingQuoteResult, setShippingQuoteResult] = useState<{
    province: string
    status: 'ready' | 'error'
    quote?: ShippingQuote
    message?: string
  } | null>(null)

  // Idempotency key: dibuat sekali per sesi, dibuat ulang saat isi keranjang berubah atau order sukses,
  // dan dipertahankan saat submit gagal untuk percobaan ulang.
  const [idempotencyKey, setIdempotencyKey] = useState<string>(() => crypto.randomUUID())

  const cartSignature = useMemo(
    () => lines.map((l) => `${l.variantId}:${l.quantity}`).sort().join(','),
    [lines]
  )
  const prevSignatureRef = useRef<string>(cartSignature)

  useEffect(() => {
    if (prevSignatureRef.current !== cartSignature) {
      prevSignatureRef.current = cartSignature
      setIdempotencyKey(crypto.randomUUID())
    }
  }, [cartSignature])

  const [isOrderPlaced, setIsOrderPlaced] = useState(false)

  // Arahkan ke /cart bila keranjang kosong setelah hidrasi selesai (kecuali bila pesanan berhasil dibuat)
  useEffect(() => {
    if (hydrated && lines.length === 0 && !isOrderPlaced) {
      router.replace('/cart')
    }
  }, [hydrated, lines.length, router, isOrderPlaced])

  const snapshot = useCartSnapshot(lines.length > 0)

  const isKnownProvince = (val?: string): val is (typeof PROVINCES)[number] => {
    return Boolean(val && PROVINCES.includes(val as (typeof PROVINCES)[number]))
  }

  // Inisialisasi formulir dengan data pengguna login bila ada
  const form = useForm<CheckoutFormInput>({
    resolver: zodResolver(checkoutFormSchema),
    defaultValues: {
      customer: {
        name: initialData?.customer?.name ?? '',
        phone: initialData?.customer?.phone ?? '',
        email: initialData?.customer?.email ?? '',
      },
      address: {
        province: isKnownProvince(initialData?.address?.province) ? initialData.address.province : ('' as unknown as (typeof PROVINCES)[number]),
        city: initialData?.address?.city ?? '',
        district: initialData?.address?.district ?? '',
        postalCode: initialData?.address?.postalCode ?? '',
        addressDetail: initialData?.address?.addressDetail ?? '',
      },
      notes: initialData?.notes ?? '',
    },
  })

  // Pantau provinsi untuk menghitung ongkir
  const watchedProvince = useWatch({ control: form.control, name: 'address.province' })

  useEffect(() => {
    if (!watchedProvince || !isKnownProvince(watchedProvince)) {
      return
    }

    let cancelled = false

    quoteShipping(watchedProvince).then(
      (result) => {
        if (cancelled) return
        if (result.ok) {
          setShippingQuoteResult({ province: watchedProvince, status: 'ready', quote: result.data })
        } else {
          setShippingQuoteResult({ province: watchedProvince, status: 'error', message: result.error.message })
        }
      },
      () => {
        if (cancelled) return
        setShippingQuoteResult({
          province: watchedProvince,
          status: 'error',
          message: 'Gagal memuat tarif ongkos kirim. Silakan coba lagi.',
        })
      }
    )

    return () => {
      cancelled = true
    }
  }, [watchedProvince])

  const shippingState: ShippingState = useMemo(() => {
    if (!watchedProvince || !isKnownProvince(watchedProvince)) {
      return { status: 'idle' }
    }
    if (shippingQuoteResult?.province !== watchedProvince) {
      return { status: 'loading', province: watchedProvince }
    }
    if (shippingQuoteResult.status === 'ready' && shippingQuoteResult.quote) {
      return { status: 'ready', province: watchedProvince, quote: shippingQuoteResult.quote }
    }
    return {
      status: 'error',
      province: watchedProvince,
      message: shippingQuoteResult.message ?? 'Tarif pengiriman tidak tersedia.',
    }
  }, [watchedProvince, shippingQuoteResult])

  // Hitung total dengan calculateTotals
  const okLines = useMemo(() => {
    return snapshot.status === 'ready' ? snapshot.lines.filter((l) => l.status === 'ok') : []
  }, [snapshot])

  const totals: Totals | null = useMemo(() => {
    if (shippingState.status !== 'ready' || okLines.length === 0) return null
    try {
      return calculateTotals({
        lines: okLines.map((l) => ({ price: l.price, quantity: l.quantity })),
        shippingCost: shippingState.quote.cost,
      })
    } catch {
      return null
    }
  }, [okLines, shippingState])

  if (!hydrated || snapshot.status === 'loading') {
    return <CheckoutSkeleton />
  }

  if (lines.length === 0 || snapshot.status === 'empty') {
    return (
      <EmptyState
        icon={<ShoppingBag className="size-7" aria-hidden="true" />}
        title="Keranjang Anda masih kosong"
        description="Keranjang Anda kosong. Mengalihkan ke halaman keranjang…"
        actionLabel="Lihat Keranjang"
        actionHref="/cart"
      />
    )
  }

  if (snapshot.status === 'error') {
    return (
      <ErrorState
        title="Keranjang tidak dapat dimuat"
        message={snapshot.error}
        onRetry={snapshot.retry}
      />
    )
  }

  const cartTotals = computeCartTotals(snapshot.lines)

  async function handleSubmit(data: CheckoutFormInput) {
    if (isSubmitting) return // Cegah klik ganda

    setFormError(undefined)

    if (!cartTotals.canCheckout) {
      const msg = 'Harap periksa kembali keranjang Anda. Terdapat item yang tidak tersedia.'
      setFormError(msg)
      toast.error(msg)
      return
    }

    if (shippingState.status !== 'ready') {
      const msg = 'Pilih provinsi yang valid dan pastikan tarif pengiriman tersedia.'
      setFormError(msg)
      toast.error(msg)
      return
    }

    setIsSubmitting(true)

    const payload: CheckoutInput = {
      idempotencyKey,
      customer: {
        name: data.customer.name,
        phone: data.customer.phone,
        email: data.customer.email || undefined,
      },
      address: {
        province: data.address.province,
        city: data.address.city,
        district: data.address.district,
        postalCode: data.address.postalCode,
        addressDetail: data.address.addressDetail,
      },
      items: okLines.map((l) => ({
        variantId: l.variantId,
        quantity: l.quantity,
      })),
      notes: data.notes || undefined,
    }

    try {
      const executeOrder = onSubmitOrder ?? placeOrder
      const result = await executeOrder(payload)

      if (result.ok) {
        setIsOrderPlaced(true)
        toast.success('Pesanan berhasil dibuat!')
        // Sesi sukses: buat kunci baru & kosongkan keranjang
        setIdempotencyKey(crypto.randomUUID())
        clearCart()
        const tokenQuery = result.data.publicToken ? `?token=${encodeURIComponent(result.data.publicToken)}` : ''
        router.push(`/orders/${result.data.orderNumber}${tokenQuery}`)
      } else {
        setIsSubmitting(false)
        setFormError(result.error.message)
        toast.error(result.error.message)

        if (result.error.fieldErrors) {
          const fields: readonly FieldPath<CheckoutFormInput>[] = [
            'customer.name',
            'customer.phone',
            'customer.email',
            'address.province',
            'address.city',
            'address.district',
            'address.postalCode',
            'address.addressDetail',
            'notes',
          ]

          let focused = false
          for (const field of fields) {
            const err = result.error.fieldErrors[field]?.[0]
            if (err) {
              form.setError(field, { type: 'server', message: err }, { shouldFocus: !focused })
              focused = true
            }
          }
        }
      }
    } catch (err) {
      setIsSubmitting(false)
      const message = err instanceof Error ? err.message : 'Terjadi gangguan saat memproses pesanan. Silakan coba lagi.'
      setFormError(message)
      toast.error(message)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(handleSubmit)}
        noValidate
        aria-busy={isSubmitting}
        className="grid gap-8 lg:grid-cols-[1fr_22rem] lg:items-start"
      >
        <div className="space-y-8">
          {formError && (
            <div
              id={errorAlertId}
              role="alert"
              className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Pesanan belum dapat diproses</p>
                <p className="mt-1 leading-relaxed">{formError}</p>
              </div>
            </div>
          )}

          {cartTotals.problemCount > 0 && (
            <div
              role="alert"
              className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive"
            >
              <AlertCircle className="size-5 shrink-0" aria-hidden="true" />
              <div>
                <p className="font-medium">Ada masalah pada keranjang belanja Anda</p>
                <p className="mt-1 leading-relaxed">
                  Terdapat {cartTotals.problemCount} produk yang habis atau tidak lagi tersedia. Harap kembali ke{' '}
                  <a href="/cart" className="underline font-semibold">
                    halaman keranjang
                  </a>{' '}
                  untuk memperbaikinya sebelum melanjutkan.
                </p>
              </div>
            </div>
          )}

          {/* Bagian 1: Data Pembeli */}
          <section
            aria-labelledby="customer-info-heading"
            className="space-y-4 rounded-lg border border-sand/60 bg-white/70 p-5 sm:p-6"
          >
            <h2 id="customer-info-heading" className="font-serif text-xl font-semibold text-espresso">
              Informasi Pembeli
            </h2>

            <div className="space-y-4">
              <FormField
                control={form.control}
                name="customer.name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nama Lengkap</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        disabled={isSubmitting}
                        placeholder="Contoh: Aisyah Putri"
                        autoComplete="name"
                        className="h-11 bg-ivory"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid gap-4 sm:grid-cols-2">
                <FormField
                  control={form.control}
                  name="customer.phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nomor Telepon (WhatsApp)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          type="tel"
                          placeholder="08123456789"
                          autoComplete="tel"
                          className="h-11 bg-ivory"
                        />
                      </FormControl>
                      <FormDescription>Untuk konfirmasi pesanan dan informasi resi pengiriman.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="customer.email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email (opsional)</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          disabled={isSubmitting}
                          type="email"
                          placeholder="nama@contoh.com"
                          autoComplete="email"
                          className="h-11 bg-ivory"
                        />
                      </FormControl>
                      <FormDescription>Untuk salinan bukti pemesanan.</FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
          </section>

          {/* Bagian 2: Alamat Pengiriman */}
          <section
            aria-labelledby="shipping-address-heading"
            className="space-y-4 rounded-lg border border-sand/60 bg-white/70 p-5 sm:p-6"
          >
            <h2 id="shipping-address-heading" className="font-serif text-xl font-semibold text-espresso">
              Alamat Pengiriman
            </h2>
            <AddressFields control={form.control} disabled={isSubmitting} />
          </section>

          {/* Bagian 3: Catatan */}
          <section
            aria-labelledby="order-notes-heading"
            className="space-y-4 rounded-lg border border-sand/60 bg-white/70 p-5 sm:p-6"
          >
            <h2 id="order-notes-heading" className="font-serif text-xl font-semibold text-espresso">
              Catatan Pesanan (opsional)
            </h2>
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Textarea
                      {...field}
                      disabled={isSubmitting}
                      rows={3}
                      maxLength={300}
                      placeholder="Tuliskan catatan khusus untuk pesanan atau instruksi pengiriman (maksimal 300 karakter)"
                      className="bg-ivory"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </section>
        </div>

        {/* Ringkasan & Submit */}
        <CheckoutSummary
          lines={snapshot.lines}
          cartTotals={cartTotals}
          shippingState={shippingState}
          totals={totals}
          isSubmitting={isSubmitting}
          isRefreshing={snapshot.isRefreshing}
        />
      </form>
    </Form>
  )
}
