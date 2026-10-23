import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, authLinkClassName, ResetPasswordForm } from "@/components/auth"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/guards"

export const metadata: Metadata = {
  title: "Atur Ulang Kata Sandi | Hairy Hijab",
  robots: { index: false },
}

// Sesi pemulihan dibuat /auth/callback dari tautan email; tanpa sesi, form tidak berguna.
async function ResetContent() {
  const user = await getCurrentUser()
  if (!user) {
    return (
      <p role="alert" className="text-sm leading-relaxed text-espresso/80">
        Tautan atur ulang tidak valid atau sudah kedaluwarsa.{" "}
        <Link href="/forgot-password" className={authLinkClassName}>
          Minta tautan baru
        </Link>
        .
      </p>
    )
  }
  return <ResetPasswordForm />
}

export default function ResetPasswordPage() {
  return (
    <AuthCard title="Atur ulang kata sandi" description="Buat kata sandi baru untuk akun Anda.">
      <Suspense
        fallback={
          <div role="status" aria-busy="true" aria-label="Memuat formulir" className="space-y-5">
            <Skeleton className="h-11 w-full bg-sand/30" />
            <Skeleton className="h-11 w-full bg-sand/30" />
          </div>
        }
      >
        <ResetContent />
      </Suspense>
    </AuthCard>
  )
}
