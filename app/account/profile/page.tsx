import { ProfileForm } from '@/components/account/profile-form'
import { requireUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'

export const instant = false

export default async function ProfilePage() {
  const user = await requireUser()
  const supabase = await createClient()
  const { data } = await supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle()

  return (
    <section>
      <h2 className="mb-6 font-heading text-3xl">Profil saya</h2>
      <ProfileForm fullName={data?.full_name ?? ''} phone={data?.phone ?? ''} />
    </section>
  )
}
