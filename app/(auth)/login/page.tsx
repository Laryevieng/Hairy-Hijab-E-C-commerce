import { Suspense } from "react"
import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, authLinkClassName, LoginForm, SignOutButton } from "@/components/auth"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/guards"
import { safeNextPath } from "@/lib/auth/next-path"

export const metadata: Metadata = {
  title: "Masuk | Hairy Hijab",
  robots: { index: false },
}

// Hanya kode yang dikenal yang ditampilkan; nilai mentah dari URL tidak pernah dirender.
const CALLBACK_ERRORS: Record<string, string> = {
  link_invalid: "Tautan tidak valid atau sudah kedaluwarsa. Silakan coba lagi.",
}

function firstValue(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value
}

async function LoginContent({ searchParams }: { searchParams: PageProps<"/login">["searchParams"] }) {
  const params = await searchParams
  const next = safeNextPath(firstValue(params.next))
  const errorKey = firstValue(params.error)
  const user = await getCurrentUser()

  if (user) {
    return (
      <div className="space-y-4">
        <p role="status" className="text-sm text-espresso/80">
          Anda sudah masuk{user.email ? ` sebagai ${user.email}` : ""}.
        </p>
        <Button asChild className="h-11 w-full bg-espresso text-ivory hover:bg-espresso/90">
          <Link href={next}>Lanjutkan</Link>
        </Button>
        <SignOutButton />
      </div>
    )
  }

  return <LoginForm next={next} initialError={errorKey ? CALLBACK_ERRORS[errorKey] : undefined} />
}

function FormSkeleton() {
  return (
    <div role="status" aria-busy="true" aria-label="Memuat formulir" className="space-y-5">
      <Skeleton className="h-11 w-full bg-sand/30" />
      <Skeleton className="h-11 w-full bg-sand/30" />
      <Skeleton className="h-11 w-full bg-sand/30" />
    </div>
  )
}

export default function LoginPage({ searchParams }: PageProps<"/login">) {
  return (
    <AuthCard
      title="Masuk"
      description="Masuk untuk melihat pesanan dan mengelola alamat Anda."
      footer={
        <>
          Belum punya akun?{" "}
          <Link href="/register" className={authLinkClassName}>
            Daftar
          </Link>
        </>
      }
    >
      <Suspense fallback={<FormSkeleton />}>
        <LoginContent searchParams={searchParams} />
      </Suspense>
    </AuthCard>
  )
}
