import { z } from 'zod'
import { PROVINCES } from '@/config/regions'
import { normalizePhoneID } from '@/lib/utils/phone'

// Batas §9.2: 1–20 per baris, maksimal 30 baris.
export const CHECKOUT_MAX_LINES = 30
export const CHECKOUT_MAX_QUANTITY = 20

const optionalText = (max: number, message: string) =>
  z
    .string()
    .trim()
    .max(max, { error: message })
    .optional()
    .transform((value) => value || undefined)

export const customerSchema = z.object({
  name: z
    .string({ error: 'Nama wajib diisi.' })
    .trim()
    .min(2, { error: 'Nama minimal 2 karakter.' })
    .max(80, { error: 'Nama maksimal 80 karakter.' }),
  phone: z
    .string({ error: 'Nomor telepon wajib diisi.' })
    .trim()
    .min(1, { error: 'Nomor telepon wajib diisi.' })
    .refine((phone) => normalizePhoneID(phone) !== null, { error: 'Masukkan nomor telepon Indonesia yang valid.' })
    .transform((phone) => normalizePhoneID(phone)!),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .optional()
    .transform((value) => value || undefined)
    .pipe(z.email({ error: 'Format email tidak valid.' }).max(254, { error: 'Email terlalu panjang.' }).optional()),
})

export const addressSchema = z.object({
  province: z.enum(PROVINCES, { error: 'Pilih provinsi yang tersedia.' }),
  city: z
    .string({ error: 'Kota/kabupaten wajib diisi.' })
    .trim()
    .min(1, { error: 'Kota/kabupaten wajib diisi.' })
    .max(100, { error: 'Kota/kabupaten maksimal 100 karakter.' }),
  district: z
    .string({ error: 'Kecamatan wajib diisi.' })
    .trim()
    .min(1, { error: 'Kecamatan wajib diisi.' })
    .max(100, { error: 'Kecamatan maksimal 100 karakter.' }),
  postalCode: z
    .string({ error: 'Kode pos wajib diisi.' })
    .trim()
    .regex(/^\d{5}$/, { error: 'Kode pos harus terdiri dari 5 angka.' }),
  addressDetail: z
    .string({ error: 'Alamat lengkap wajib diisi.' })
    .trim()
    .min(10, { error: 'Alamat lengkap minimal 10 karakter.' })
    .max(300, { error: 'Alamat lengkap maksimal 300 karakter.' }),
})

export const checkoutItemSchema = z.object({
  variantId: z.uuid({ error: 'Item tidak valid.' }),
  quantity: z
    .number({ error: 'Jumlah tidak valid.' })
    .int({ error: 'Jumlah tidak valid.' })
    .min(1, { error: 'Jumlah minimal 1.' })
    .max(CHECKOUT_MAX_QUANTITY, { error: `Jumlah maksimal ${CHECKOUT_MAX_QUANTITY} per produk.` }),
})

/**
 * Skema input form checkout di browser (data pembeli, alamat, dan catatan).
 * Field `items` dan `idempotencyKey` digabungkan saat submit membentuk `checkoutSchema`.
 */
export const checkoutFormSchema = z.object({
  customer: customerSchema,
  address: addressSchema,
  notes: optionalText(300, 'Catatan maksimal 300 karakter.'),
})

/**
 * Input checkout dari browser. Sengaja tidak memuat harga, ongkir, atau total:
 * `z.object` membuang field yang tidak dikenal, dan `create_order` menghitung ulang semuanya.
 */
export const checkoutSchema = z.object({
  idempotencyKey: z.uuid({ error: 'Sesi checkout tidak valid. Muat ulang halaman.' }),
  customer: customerSchema,
  address: addressSchema,
  items: z
    .array(checkoutItemSchema, { error: 'Keranjang tidak valid.' })
    .min(1, { error: 'Keranjang kosong.' })
    .max(CHECKOUT_MAX_LINES, { error: `Maksimal ${CHECKOUT_MAX_LINES} produk per pesanan.` }),
  notes: optionalText(300, 'Catatan maksimal 300 karakter.'),
})

export type CustomerInput = z.input<typeof customerSchema>
export type AddressInput = z.input<typeof addressSchema>
export type CheckoutFormInput = z.input<typeof checkoutFormSchema>
export type CheckoutFormData = z.output<typeof checkoutFormSchema>
export type CheckoutInput = z.input<typeof checkoutSchema>
export type CheckoutData = z.output<typeof checkoutSchema>

export interface CheckoutInitialData {
  customer?: {
    name?: string
    phone?: string
    email?: string
  }
  address?: {
    province?: string
    city?: string
    district?: string
    postalCode?: string
    addressDetail?: string
  }
  notes?: string
}
