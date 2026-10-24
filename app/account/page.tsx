import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { requireUser } from '@/lib/auth/guards'

export const instant = false

export default async function AccountPage() {
  const user = await requireUser()
  const supabase = await createClient()
  const [{ data: profile }, { data: addresses }] = await Promise.all([
    supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
    supabase.from('addresses').select('id, label, recipient_name, city, province, is_default').eq('user_id', user.id).order('is_default', { ascending: false }),
  ])

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <section className="rounded-lg border border-sand bg-white/50 p-6">
        <h2 className="font-heading text-2xl">Profil</h2>
        <p className="mt-3">{profile?.full_name || 'Nama belum diisi'}</p>
        <p className="text-sm text-muted-foreground">{profile?.phone || 'Telepon belum diisi'}</p>
        <Link className="mt-5 inline-block text-sm underline" href="/account/profile">Kelola profil</Link>
      </section>
      <section className="rounded-lg border border-sand bg-white/50 p-6">
        <h2 className="font-heading text-2xl">Alamat tersimpan</h2>
        {addresses?.length ? <ul className="mt-3 space-y-2">{addresses.map((address) => (
          <li key={address.id} className="text-sm">{address.label || address.recipient_name} — {address.city}, {address.province}{address.is_default ? ' (utama)' : ''}</li>
        ))}</ul> : <p className="mt-3 text-sm text-muted-foreground">Belum ada alamat tersimpan.</p>}
        <Link className="mt-5 inline-block text-sm underline" href="/account/addresses">Kelola alamat</Link>
      </section>
    </div>
  )
}
