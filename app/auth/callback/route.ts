import type { EmailOtpType } from "@supabase/supabase-js"
import { NextResponse, type NextRequest } from "next/server"
import { safeNextPath } from "@/lib/auth/next-path"
import { createClient } from "@/lib/supabase/server"

const OTP_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"]

function isOtpType(value: string | null): value is EmailOtpType {
  return value !== null && OTP_TYPES.includes(value)
}

function redirectTo(request: NextRequest, path: string) {
  // `path` selalu relatif (hasil safeNextPath atau konstanta), jadi origin tetap situs ini.
  const response = NextResponse.redirect(new URL(path, request.url))
  // Respons ini membawa cookie sesi; jangan disimpan cache bersama.
  response.headers.set("Cache-Control", "private, no-store")
  return response
}

/**
 * Menukar tautan email Supabase (konfirmasi daftar, atur ulang kata sandi) menjadi sesi.
 * Mendukung `code` (PKCE, bawaan @supabase/ssr) dan `token_hash` + `type` (template email kustom).
 */
export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams
  const next = safeNextPath(params.get("next"))
  const code = params.get("code")
  const tokenHash = params.get("token_hash")
  const type = params.get("type")

  if (code || (tokenHash && isOtpType(type))) {
    const supabase = await createClient()
    const { error } = code
      ? await supabase.auth.exchangeCodeForSession(code)
      : await supabase.auth.verifyOtp({ token_hash: tokenHash!, type: type as EmailOtpType })

    if (!error) return redirectTo(request, next)
    console.error("[auth] callback gagal:", error.code ?? error.status)
  }

  return redirectTo(request, "/login?error=link_invalid")
}
