"use client"

import { useState, useTransition } from "react"
import Link from "next/link"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { signIn } from "@/actions/auth.actions"
import { Form } from "@/components/ui/form"
import { loginSchema, type LoginInput } from "@/lib/validations/auth"
import { authLinkClassName } from "./auth-card"
import { applyServerFieldErrors, AuthTextField, FormAlert, SubmitButton } from "./form-parts"

const FIELDS = ["email", "password"] as const

interface LoginFormProps {
  next: string
  initialError?: string
}

export function LoginForm({ next, initialError }: LoginFormProps) {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string | undefined>(initialError)
  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
  })

  function onSubmit(values: LoginInput) {
    setFormError(undefined)
    startTransition(async () => {
      // Berhasil = redirect dari server; yang kembali ke sini hanya kegagalan.
      const result = await signIn(values, next)
      if (result && !result.ok) {
        applyServerFieldErrors(form, result.error.fieldErrors, FIELDS)
        setFormError(result.error.message)
        toast.error(result.error.message)
      }
    })
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert tone="error">{formError}</FormAlert>
        <AuthTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
        <AuthTextField
          control={form.control}
          name="password"
          label="Kata sandi"
          type="password"
          autoComplete="current-password"
        />
        <div className="flex justify-end text-sm">
          <Link href="/forgot-password" className={authLinkClassName}>
            Lupa kata sandi?
          </Link>
        </div>
        <SubmitButton pending={pending} label="Masuk" />
      </form>
    </Form>
  )
}
