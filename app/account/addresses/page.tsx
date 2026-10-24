import { AddressForm } from '@/components/account/address-form'
import { requireUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export const instant = false

export default async function AddressesPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data: addresses, error } = await supabase.from('addresses').select('*').eq('user_id', user.id)
    .order('is_default', { ascending: false }).order('created_at', { ascending: true })

  return (
    <section className="space-y-6">
      <div><h2 className="font-heading text-3xl">Buku alamat</h2><p className="mt-2 text-sm text-muted-foreground">Kelola alamat pengiriman Anda. Hanya satu alamat yang dapat menjadi alamat utama.</p></div>
      {error ? <p role="alert">Alamat tidak dapat dimuat saat ini.</p> : addresses?.map((address) => <AddressForm key={address.id} address={address} />)}
      {!error && <AddressForm isNew />}
    </section>
  )
}
