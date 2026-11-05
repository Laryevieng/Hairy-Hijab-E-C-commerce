import Link from 'next/link'
import { requireUser } from '@/lib/auth/guards'

export default async function AccountLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser()

  return (
    <main className="mx-auto min-h-[60vh] max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <header className="mb-8 border-b border-sand pb-6">
        <p className="text-sm text-muted-foreground">Akun pelanggan</p>
        <h1 className="font-heading text-4xl text-espresso">Halo{user.email ? `, ${user.email}` : ''}</h1>
        <nav aria-label="Navigasi akun" className="mt-5 flex flex-wrap gap-x-6 gap-y-2 text-sm">
          <Link className="underline-offset-4 hover:underline" href="/account">Ringkasan</Link>
          <Link className="underline-offset-4 hover:underline" href="/account/orders">Pesanan</Link>
          <Link className="underline-offset-4 hover:underline" href="/account/profile">Profil</Link>
          <Link className="underline-offset-4 hover:underline" href="/account/addresses">Alamat</Link>
        </nav>
      </header>
      {children}
    </main>
  )
}
