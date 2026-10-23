"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { signUp } from "@/actions/auth.actions"
import { Form } from "@/components/ui/form"
import { registerSchema, type RegisterInput } from "@/lib/validations/auth"
import { applyServerFieldErrors, AuthTextField, FormAlert, SubmitButton } from "./form-parts"

const FIELDS = ["fullName", "email", "password"] as const
const CONFIRM_MESSAGE =
  "Pendaftaran diterima. Kami mengirim tautan konfirmasi ke email Anda. Buka tautan tersebut untuk mengaktifkan akun, lalu masuk."

export function RegisterForm() {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [done, setDone] = useState(false)
  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: { fullName: "", email: "", password: "" },
  })

  function onSubmit(values: RegisterInput) {
    setFormError(undefined)
    startTransition(async () => {
      const result = await signUp(values)
      if (!result) return
      if (result.ok) {
        setDone(true)
        toast.success("Periksa email Anda untuk konfirmasi.")
        return
      }
      applyServerFieldErrors(form, result.error.fieldErrors, FIELDS)
      setFormError(result.error.message)
      toast.error(result.error.message)
    })
  }

  if (done) return <FormAlert tone="success">{CONFIRM_MESSAGE}</FormAlert>

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert tone="error">{formError}</FormAlert>
        <AuthTextField control={form.control} name="fullName" label="Nama lengkap" autoComplete="name" />
        <AuthTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
        <AuthTextField
          control={form.control}
          name="password"
          label="Kata sandi"
          type="password"
          autoComplete="new-password"
          description="Minimal 8 karakter."
        />
        <SubmitButton pending={pending} label="Daftar" />
      </form>
    </Form>
  )
}
