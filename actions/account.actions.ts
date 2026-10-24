'use server'

import { revalidatePath } from 'next/cache'
import { requireUser } from '@/lib/auth/guards'
import { mapDbError } from '@/lib/errors'
import { createClient } from '@/lib/supabase/server'
import { addressIdSchema, addressSchema, profileSchema } from '@/lib/validations/account'
import type { ActionResult } from '@/types/action'

type Failure = Extract<ActionResult, { ok: false }>

function validationFailure(fieldErrors: Record<string, string[] | undefined>): Failure {
  const errors: Record<string, string[]> = {}
  for (const [field, messages] of Object.entries(fieldErrors)) {
    if (messages?.length) errors[field] = messages
  }
  return { ok: false, error: { code: 'VALIDATION', message: 'Periksa kembali data yang diisi.', fieldErrors: errors } }
}

function dbFailure(error: { code?: string; message: string }): Failure {
  const mapped = mapDbError(error)
  return { ok: false, error: { code: mapped.code, message: mapped.message } }
}

export async function updateProfile(input: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = profileSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error.flatten().fieldErrors)

  const supabase = await createClient()
  const { error } = await supabase.from('profiles').update({
    full_name: parsed.data.fullName,
    phone: parsed.data.phone,
  }).eq('id', user.id)

  if (error) return dbFailure(error)
  revalidatePath('/account')
  revalidatePath('/account/profile')
  return { ok: true, data: undefined }
}

export async function saveAddress(input: unknown, addressId?: unknown): Promise<ActionResult<{ id: string }>> {
  const user = await requireUser()
  const parsed = addressSchema.safeParse(input)
  if (!parsed.success) return validationFailure(parsed.error.flatten().fieldErrors)

  const id = addressId === undefined ? undefined : addressIdSchema.safeParse(addressId)
  if (id && !id.success) return validationFailure({ addressId: ['Alamat tidak valid.'] })

  const supabase = await createClient()
  const { data, error } = id
    ? await supabase.from('addresses').update({
        label: parsed.data.label,
        recipient_name: parsed.data.recipientName,
        phone: parsed.data.phone,
        province: parsed.data.province,
        city: parsed.data.city,
        district: parsed.data.district,
        postal_code: parsed.data.postalCode,
        address_detail: parsed.data.addressDetail,
        is_default: parsed.data.isDefault,
      }).eq('id', id.data).eq('user_id', user.id).select('id').maybeSingle()
    : await supabase.from('addresses').insert({
        user_id: user.id,
        label: parsed.data.label,
        recipient_name: parsed.data.recipientName,
        phone: parsed.data.phone,
        province: parsed.data.province,
        city: parsed.data.city,
        district: parsed.data.district,
        postal_code: parsed.data.postalCode,
        address_detail: parsed.data.addressDetail,
        is_default: parsed.data.isDefault,
      }).select('id').single()

  if (error) return dbFailure(error)
  if (!data) return { ok: false, error: { code: 'NOT_FOUND', message: 'Alamat tidak ditemukan.' } }
  revalidatePath('/account/addresses')
  revalidatePath('/account')
  return { ok: true, data: { id: data.id } }
}

export async function deleteAddress(input: unknown): Promise<ActionResult> {
  const user = await requireUser()
  const parsed = addressIdSchema.safeParse(input)
  if (!parsed.success) return validationFailure({ addressId: ['Alamat tidak valid.'] })

  const supabase = await createClient()
  const { data, error } = await supabase.from('addresses').delete()
    .eq('id', parsed.data).eq('user_id', user.id).select('id').maybeSingle()
  if (error) return dbFailure(error)
  if (!data) return { ok: false, error: { code: 'NOT_FOUND', message: 'Alamat tidak ditemukan.' } }
  revalidatePath('/account/addresses')
  revalidatePath('/account')
  return { ok: true, data: undefined }
}
