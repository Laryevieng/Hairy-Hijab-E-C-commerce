'use client'

import { useState, useTransition } from 'react'
import { updateProfile } from '@/actions/account.actions'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import type { ProfileInput } from '@/lib/validations/account'

export function ProfileForm({ fullName, phone }: ProfileInput) {
  const [name, setName] = useState(fullName)
  const [telephone, setTelephone] = useState(phone)
  const [message, setMessage] = useState<string>()
  const [pending, startTransition] = useTransition()

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(undefined)
    startTransition(async () => {
      const result = await updateProfile({ fullName: name, phone: telephone })
      if (result.ok) {
        setMessage('Profil berhasil diperbarui.')
        toast.success('Profil berhasil diperbarui.')
      } else {
        setMessage(result.error.message)
        toast.error(result.error.message)
      }
    })
  }

  return (
    <form onSubmit={submit} className="max-w-xl space-y-5" noValidate>
      <div className="space-y-2"><Label htmlFor="fullName">Nama lengkap</Label><Input id="fullName" autoComplete="name" required minLength={2} maxLength={100} value={name} onChange={(event) => setName(event.target.value)} /></div>
      <div className="space-y-2"><Label htmlFor="phone">Nomor telepon</Label><Input id="phone" type="tel" autoComplete="tel" required value={telephone} onChange={(event) => setTelephone(event.target.value)} /><p className="text-xs text-muted-foreground">Simpan dengan format nomor Indonesia, misalnya 0812 3456 7890.</p></div>
      <Button type="submit" disabled={pending}>{pending ? 'Menyimpan…' : 'Simpan profil'}</Button>
      {message && <p role="status" aria-live="polite" className="text-sm">{message}</p>}
    </form>
  )
}
