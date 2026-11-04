import type { Metadata } from 'next'
import { CheckoutForm } from '@/components/checkout/checkout-form'
import { getCurrentUser } from '@/lib/auth/guards'
import { createClient } from '@/lib/supabase/server'
import type { CheckoutInitialData } from '@/lib/validations/checkout'

export const instant = false

export const metadata: Metadata = {
  title: 'Checkout',
  description: 'Selesaikan pesanan Anda di Hairy Hijab.',
  robots: { index: false, follow: false },
}

export default async function CheckoutPage() {
  const user = await getCurrentUser()
  let initialData: CheckoutInitialData | undefined = undefined

  if (user) {
    const supabase = await createClient()
    const [{ data: profile }, { data: addresses }] = await Promise.all([
      supabase.from('profiles').select('full_name, phone').eq('id', user.id).maybeSingle(),
      supabase
        .from('addresses')
        .select('*')
        .eq('user_id', user.id)
        .order('is_default', { ascending: false })
        .order('created_at', { ascending: true })
        .limit(1),
    ])

    const defaultAddress = addresses?.[0]

    initialData = {
      customer: {
        name: defaultAddress?.recipient_name || profile?.full_name || '',
        phone: defaultAddress?.phone || profile?.phone || '',
        email: user.email || '',
      },
      address: defaultAddress
        ? {
            province: defaultAddress.province,
            city: defaultAddress.city,
            district: defaultAddress.district,
            postalCode: defaultAddress.postal_code,
            addressDetail: defaultAddress.address_detail,
          }
        : undefined,
    }
  }

  return (
    <div className="container mx-auto space-y-8 px-4 py-8 sm:py-12 lg:px-8">
      <h1 className="font-serif text-3xl font-semibold text-espresso">Checkout</h1>
      <CheckoutForm initialData={initialData} />
    </div>
  )
}
