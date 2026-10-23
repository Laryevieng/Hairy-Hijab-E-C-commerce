"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { updatePassword } from "@/actions/auth.actions"
import { Form } from "@/components/ui/form"
import { resetPasswordSchema, type ResetPasswordInput } from "@/lib/validations/auth"
import { applyServerFieldErrors, AuthTextField, FormAlert, SubmitButton } from "./form-parts"

const FIELDS = ["password", "confirmPassword"] as const

export function ResetPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const form = useForm<ResetPasswordInput>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  })

  function onSubmit(values: ResetPasswordInput) {
    setFormError(undefined)
    startTransition(async () => {
      const result = await updatePassword(values)
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
        <AuthTextField
          control={form.control}
          name="password"
          label="Kata sandi baru"
          type="password"
          autoComplete="new-password"
          description="Minimal 8 karakter."
        />
        <AuthTextField
          control={form.control}
          name="confirmPassword"
          label="Ulangi kata sandi baru"
          type="password"
          autoComplete="new-password"
        />
        <SubmitButton pending={pending} label="Simpan kata sandi" />
      </form>
    </Form>
  )
}
