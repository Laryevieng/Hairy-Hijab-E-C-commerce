import 'server-only'
import { notFound, redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database.types'

export type StaffRole = Database['public']['Enums']['staff_role']

export interface CurrentUser {
  id: string
  email: string | null
}

/** Identitas dari JWT yang sudah diverifikasi `getClaims()`; jangan pakai `getSession()` di server. */
export async function getCurrentUser(): Promise<CurrentUser | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getClaims()
  if (error || !data?.claims) return null
  return { id: data.claims.sub, email: data.claims.email ?? null }
}

export async function requireUser(): Promise<CurrentUser> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}

/** Non-staf mendapat 404 agar keberadaan area admin tidak terungkap. */
export async function requireStaff(): Promise<{ user: CurrentUser; role: StaffRole }> {
  const user = await requireUser()
  const supabase = await createClient()
  // RLS staff_roles_read_own: klien sesi hanya bisa membaca baris miliknya sendiri.
  const { data, error } = await supabase
    .from('staff_roles')
    .select('role')
    .eq('user_id', user.id)
    .maybeSingle()
  if (error || !data) notFound()
  return { user, role: data.role }
}

export async function requireAdmin(): Promise<{ user: CurrentUser; role: 'admin' }> {
  const { user, role } = await requireStaff()
  if (role !== 'admin') notFound()
  return { user, role }
}
