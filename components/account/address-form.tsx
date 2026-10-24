'use client'

import { useState, useTransition } from 'react'
import { deleteAddress, saveAddress } from '@/actions/account.actions'
import { PROVINCES } from '@/config/regions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import type { Database } from '@/types/database.types'

type Address = Database['public']['Tables']['addresses']['Row']
type FormValues = Omit<Address, 'id' | 'user_id' | 'created_at' | 'updated_at'>

const EMPTY: FormValues = {
  label: '', recipient_name: '', phone: '', province: '', city: '', district: '',
  postal_code: '', address_detail: '', is_default: false,
}

export function AddressForm({ address, isNew = false }: { address?: Address; isNew?: boolean }) {
  const [values, setValues] = useState<FormValues>(address ? {
    label: address.label, recipient_name: address.recipient_name, phone: address.phone,
    province: address.province, city: address.city, district: address.district,
    postal_code: address.postal_code, address_detail: address.address_detail, is_default: address.is_default,
  } : EMPTY)
  const [message, setMessage] = useState<string>()
  const [pending, startTransition] = useTransition()
  const id = address?.id

  function field<K extends keyof FormValues>(key: K, value: FormValues[K]) {
    setValues((current) => ({ ...current, [key]: value }))
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(undefined)
    startTransition(async () => {
      const result = await saveAddress({
        label: values.label ?? '', recipientName: values.recipient_name, phone: values.phone,
        province: values.province, city: values.city, district: values.district,
        postalCode: values.postal_code, addressDetail: values.address_detail, isDefault: values.is_default,
      }, id)
      setMessage(result.ok ? 'Alamat berhasil disimpan.' : result.error.message)
    })
  }

  function remove() {
    if (!id || !window.confirm('Hapus alamat ini?')) return
    startTransition(async () => {
      const result = await deleteAddress(id)
      setMessage(result.ok ? 'Alamat berhasil dihapus.' : result.error.message)
    })
  }

  const prefix = id ?? 'new'
  return (
    <form onSubmit={submit} className="space-y-4 rounded-lg border border-sand p-5" noValidate>
      <h3 className="font-medium">{isNew ? 'Tambah alamat' : address?.label || 'Alamat tersimpan'}</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field id={`${prefix}-label`} label="Label alamat (opsional)"><Input id={`${prefix}-label`} maxLength={50} value={values.label ?? ''} onChange={(e) => field('label', e.target.value)} /></Field>
        <Field id={`${prefix}-recipient`} label="Nama penerima"><Input id={`${prefix}-recipient`} autoComplete="name" required value={values.recipient_name} onChange={(e) => field('recipient_name', e.target.value)} /></Field>
        <Field id={`${prefix}-phone`} label="Nomor telepon"><Input id={`${prefix}-phone`} type="tel" autoComplete="tel" required value={values.phone} onChange={(e) => field('phone', e.target.value)} /></Field>
        <Field id={`${prefix}-province`} label="Provinsi"><select id={`${prefix}-province`} required value={values.province} onChange={(e) => field('province', e.target.value)} className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Pilih provinsi</option>{PROVINCES.map((province) => <option key={province} value={province}>{province}</option>)}</select></Field>
        <Field id={`${prefix}-city`} label="Kota/kabupaten"><Input id={`${prefix}-city`} required value={values.city} onChange={(e) => field('city', e.target.value)} /></Field>
        <Field id={`${prefix}-district`} label="Kecamatan"><Input id={`${prefix}-district`} required value={values.district} onChange={(e) => field('district', e.target.value)} /></Field>
        <Field id={`${prefix}-postal`} label="Kode pos"><Input id={`${prefix}-postal`} inputMode="numeric" autoComplete="postal-code" required maxLength={5} value={values.postal_code} onChange={(e) => field('postal_code', e.target.value)} /></Field>
      </div>
      <Field id={`${prefix}-detail`} label="Alamat lengkap"><textarea id={`${prefix}-detail`} required minLength={5} maxLength={500} rows={3} value={values.address_detail} onChange={(e) => field('address_detail', e.target.value)} className="w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" /></Field>
      <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={values.is_default} onChange={(e) => field('is_default', e.target.checked)} />Jadikan alamat utama</label>
      <div className="flex flex-wrap gap-3"><Button type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan alamat'}</Button>{id && <Button type="button" variant="outline" disabled={pending} onClick={remove}>Hapus</Button>}</div>
      {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
    </form>
  )
}

function Field({ id, label, children }: { id: string; label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label htmlFor={id}>{label}</Label>{children}</div>
}
