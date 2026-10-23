import type { Metadata } from "next"
import Link from "next/link"
import { AuthCard, authLinkClassName, RegisterForm } from "@/components/auth"

export const metadata: Metadata = {
  title: "Daftar | Hairy Hijab",
  robots: { index: false },
}

export default function RegisterPage() {
  return (
    <AuthCard
      title="Daftar"
      description="Buat akun untuk menyimpan alamat dan melacak pesanan."
      footer={
        <>
          Sudah punya akun?{" "}
          <Link href="/login" className={authLinkClassName}>
            Masuk
          </Link>
        </>
      }
    >
      <RegisterForm />
    </AuthCard>
  )
}
