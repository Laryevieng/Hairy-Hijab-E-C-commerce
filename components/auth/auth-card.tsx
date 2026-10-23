import type { ReactNode } from "react"

interface AuthCardProps {
  title: string
  description?: string
  children: ReactNode
  footer?: ReactNode
}

export function AuthCard({ title, description, children, footer }: AuthCardProps) {
  return (
    <div className="mx-auto w-full max-w-md px-4 py-12 sm:py-16">
      <div className="rounded-lg border border-sand/50 bg-ivory p-6 shadow-sm sm:p-8">
        <h1 className="font-serif text-3xl font-bold tracking-tight text-espresso">{title}</h1>
        {description && <p className="mt-2 text-sm leading-relaxed text-espresso/75">{description}</p>}
        <div className="mt-6">{children}</div>
      </div>
      {footer && <div className="mt-6 text-center text-sm text-espresso/75">{footer}</div>}
    </div>
  )
}

export const authLinkClassName =
  "font-medium text-gold-deep underline underline-offset-4 hover:text-espresso focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm"
