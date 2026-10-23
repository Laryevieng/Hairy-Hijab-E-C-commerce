"use client"

import { useFormStatus } from "react-dom"
import { signOut } from "@/actions/auth.actions"
import { Button } from "@/components/ui/button"

function SignOutSubmit() {
  const { pending } = useFormStatus()
  return (
    <Button
      type="submit"
      variant="outline"
      disabled={pending}
      className="h-11 w-full border-sand bg-ivory text-espresso hover:bg-sand/30"
    >
      {pending ? "Keluar…" : "Keluar"}
    </Button>
  )
}

export function SignOutButton() {
  return (
    <form action={signOut}>
      <SignOutSubmit />
    </form>
  )
}
