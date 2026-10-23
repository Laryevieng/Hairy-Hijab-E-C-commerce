import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { publicEnv } from '@/lib/env'
import type { Database } from '@/types/database.types'

const PROTECTED_PREFIXES = ['/account', '/admin']
const CACHE_HEADERS = ['cache-control', 'expires', 'pragma']

function isProtected(path: string): boolean {
  return PROTECTED_PREFIXES.some((prefix) => path === prefix || path.startsWith(`${prefix}/`))
}

/**
 * Me-refresh sesi Supabase di setiap permintaan dan mengalihkan tamu dari halaman
 * terlindungi. Redirect ini hanya kenyamanan; otorisasi sebenarnya ada di guard dan RLS.
 */
export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({ request })

  const supabase = createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet, headers) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
          // Cegah CDN menyimpan respons yang membawa token sesi pengguna lain.
          Object.entries(headers).forEach(([key, value]) => response.headers.set(key, value))
        },
      },
    },
  )

  // Jangan menjalankan kode apa pun antara createServerClient dan getClaims().
  const { data } = await supabase.auth.getClaims()
  const path = request.nextUrl.pathname

  if (!data?.claims && isProtected(path)) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.search = ''
    url.searchParams.set('next', path)

    // Respons baru harus membawa cookie dan header cache hasil refresh, kalau tidak sesi hilang.
    const redirect = NextResponse.redirect(url)
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie))
    CACHE_HEADERS.forEach((header) => {
      const value = response.headers.get(header)
      if (value) redirect.headers.set(header, value)
    })
    return redirect
  }

  return response
}
