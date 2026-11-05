import type { Metadata } from 'next'
import { requireStaff } from '@/lib/auth/guards'
import { AdminLayoutShell } from '@/components/admin/admin-layout-shell'

export const metadata: Metadata = {
  title: 'Admin Portal | Hairy Hijab',
  robots: {
    index: false,
    follow: false,
  },
}

export const instant = false

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { user, role } = await requireStaff()

  return (
    <AdminLayoutShell user={user} role={role}>
      {children}
    </AdminLayoutShell>
  )
}
