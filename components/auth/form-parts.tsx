"use client"

import type { ReactNode } from "react"
import { Loader2 } from "lucide-react"
import type { Control, FieldPath, FieldValues, Path, UseFormReturn } from "react-hook-form"
import { Button } from "@/components/ui/button"
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils/cn"

interface AuthTextFieldProps<T extends FieldValues> {
  control: Control<T>
  name: FieldPath<T>
  label: string
  type?: "text" | "email" | "password"
  autoComplete?: string
  description?: string
}

export function AuthTextField<T extends FieldValues>({
  control,
  name,
  label,
  type = "text",
  autoComplete,
  description,
}: AuthTextFieldProps<T>) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input {...field} type={type} autoComplete={autoComplete} className="h-11 bg-ivory" />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

interface SubmitButtonProps {
  pending: boolean
  label: string
  pendingLabel?: string
}

export function SubmitButton({ pending, label, pendingLabel = "Memproses…" }: SubmitButtonProps) {
  return (
    <Button
      type="submit"
      disabled={pending}
      className="h-11 w-full bg-espresso text-ivory hover:bg-espresso/90"
    >
      {pending && <Loader2 className="size-4 animate-spin" aria-hidden="true" />}
      {pending ? pendingLabel : label}
    </Button>
  )
}

interface FormAlertProps {
  tone: "error" | "success"
  children: ReactNode
}

/** Teks status yang dibaca pembaca layar; melengkapi toast (§12.5). */
export function FormAlert({ tone, children }: FormAlertProps) {
  if (!children) return null
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "rounded-md border px-4 py-3 text-sm leading-relaxed",
        tone === "error"
          ? "border-destructive/40 bg-destructive/5 text-destructive"
          : "border-sand bg-sand/20 text-espresso",
      )}
    >
      {children}
    </div>
  )
}

/**
 * Menampilkan `fieldErrors` dari Server Action di bawah field terkait dan
 * memindahkan fokus ke field pertama yang salah.
 */
export function applyServerFieldErrors<T extends FieldValues>(
  form: UseFormReturn<T>,
  fieldErrors: Record<string, string[]> | undefined,
  fields: readonly Path<T>[],
): void {
  let focused = false
  for (const field of fields) {
    const message = fieldErrors?.[field]?.[0]
    if (!message) continue
    form.setError(field, { type: "server", message }, { shouldFocus: !focused })
    focused = true
  }
}
