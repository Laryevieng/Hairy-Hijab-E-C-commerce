"use client"

import { useState, useTransition } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { requestPasswordReset } from "@/actions/auth.actions"
import { Form } from "@/components/ui/form"
import { forgotPasswordSchema, type ForgotPasswordInput } from "@/lib/validations/auth"
import { applyServerFieldErrors, AuthTextField, FormAlert, SubmitButton } from "./form-parts"

const FIELDS = ["email"] as const

export function ForgotPasswordForm() {
  const [pending, startTransition] = useTransition()
  const [formError, setFormError] = useState<string>()
  const [sentMessage, setSentMessage] = useState<string>()
  const form = useForm<ForgotPasswordInput>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  })

  function onSubmit(values: ForgotPasswordInput) {
    setFormError(undefined)
    startTransition(async () => {
      const result = await requestPasswordReset(values)
      if (!result) return
      if (result.ok) {
        setSentMessage(result.data.message)
        toast.success("Permintaan diterima.")
        return
      }
      applyServerFieldErrors(form, result.error.fieldErrors, FIELDS)
      setFormError(result.error.message)
      toast.error(result.error.message)
    })
  }

  if (sentMessage) return <FormAlert tone="success">{sentMessage}</FormAlert>

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} noValidate className="space-y-5">
        <FormAlert tone="error">{formError}</FormAlert>
        <AuthTextField control={form.control} name="email" label="Email" type="email" autoComplete="email" />
        <SubmitButton pending={pending} label="Kirim tautan" />
      </form>
    </Form>
  )
}
