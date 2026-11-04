'use client'

import type { Control } from 'react-hook-form'
import { PROVINCES } from '@/config/regions'
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import type { CheckoutFormInput } from '@/lib/validations/checkout'

interface AddressFieldsProps {
  control: Control<CheckoutFormInput>
  disabled?: boolean
  onProvinceChange?: (province: string) => void
}

export function AddressFields({ control, disabled = false, onProvinceChange }: AddressFieldsProps) {
  return (
    <div className="space-y-4">
      <FormField
        control={control}
        name="address.province"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Provinsi</FormLabel>
            <FormControl>
              <select
                {...field}
                disabled={disabled}
                value={field.value ?? ''}
                onChange={(e) => {
                  field.onChange(e)
                  onProvinceChange?.(e.target.value)
                }}
                className="h-11 w-full rounded-md border border-input bg-ivory px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Pilih provinsi</option>
                {PROVINCES.map((province) => (
                  <option key={province} value={province}>
                    {province}
                  </option>
                ))}
              </select>
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <FormField
          control={control}
          name="address.city"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kota / Kabupaten</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
                  placeholder="Contoh: Kota Bandung"
                  autoComplete="address-level2"
                  className="h-11 bg-ivory"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={control}
          name="address.district"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Kecamatan</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  disabled={disabled}
                  placeholder="Contoh: Coblong"
                  autoComplete="address-level3"
                  className="h-11 bg-ivory"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <FormField
        control={control}
        name="address.postalCode"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Kode Pos</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={field.value ?? ''}
                disabled={disabled}
                inputMode="numeric"
                maxLength={5}
                placeholder="5 angka (contoh: 40132)"
                autoComplete="postal-code"
                className="h-11 bg-ivory sm:max-w-xs"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />

      <FormField
        control={control}
        name="address.addressDetail"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Alamat Lengkap</FormLabel>
            <FormControl>
              <Textarea
                {...field}
                value={field.value ?? ''}
                disabled={disabled}
                rows={3}
                maxLength={300}
                placeholder="Nama jalan, nomor rumah, RT/RW, patokan lokasi (minimal 10 karakter)"
                autoComplete="street-address"
                className="bg-ivory"
              />
            </FormControl>
            <FormMessage />
          </FormItem>
        )}
      />
    </div>
  )
}
