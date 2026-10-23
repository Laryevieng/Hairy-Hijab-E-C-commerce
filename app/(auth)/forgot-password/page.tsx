import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, authLinkClassName, ForgotPasswordForm } from "@/components/auth"

export const metadata: Metadata = {
  title: "Lupa Kata Sandi | Hairy Hijab",
  robots: { index: false },
}

export default function ForgotPasswordPage() {
  return (
    <AuthCard
      title="Lupa kata sandi"
      description="Masukkan email akun Anda. Kami akan mengirim tautan untuk mengatur ulang kata sandi."
      footer={
        <Link href="/login" className={authLinkClassName}>
          Kembali ke halaman masuk
        </Link>
      }
    >
      <ForgotPasswordForm />
    </AuthCard>
  )
}
