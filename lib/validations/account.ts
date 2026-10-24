import { z } from 'zod'
import { PROVINCES } from '@/config/regions'
import { normalizePhoneID } from '@/lib/utils/phone'

const phoneSchema = z
  .string()
  .trim()
  .min(1, 'Nomor telepon wajib diisi.')
  .refine((phone) => normalizePhoneID(phone) !== null, 'Masukkan nomor telepon Indonesia yang valid.')
  .transform((phone) => normalizePhoneID(phone)!)

export const profileSchema = z.object({
  fullName: z.string().trim().min(2, 'Nama minimal 2 karakter.').max(100, 'Nama maksimal 100 karakter.'),
  phone: phoneSchema,
})

export const addressSchema = z.object({
  label: z.string().trim().max(50, 'Label maksimal 50 karakter.').transform((value) => value || null),
  recipientName: z.string().trim().min(2, 'Nama penerima minimal 2 karakter.').max(100),
  phone: phoneSchema,
  province: z.enum(PROVINCES, { error: 'Pilih provinsi yang tersedia.' }),
  city: z.string().trim().min(1, 'Kota/kabupaten wajib diisi.').max(100),
  district: z.string().trim().min(1, 'Kecamatan wajib diisi.').max(100),
  postalCode: z.string().trim().regex(/^\d{5}$/, 'Kode pos harus terdiri dari 5 angka.'),
  addressDetail: z.string().trim().min(5, 'Alamat lengkap minimal 5 karakter.').max(500),
  isDefault: z.boolean(),
})

export const addressIdSchema = z.string().uuid('Alamat tidak valid.')

export type ProfileInput = z.input<typeof profileSchema>
export type AddressInput = z.input<typeof addressSchema>
