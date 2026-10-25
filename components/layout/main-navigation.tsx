"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils/cn"
import type { CategoryListItem } from "@/types/domain"

interface MainNavigationProps {
  categories?: Pick<CategoryListItem, "id" | "name" | "slug">[]
  className?: string
}

export function MainNavigation({ categories = [], className }: MainNavigationProps) {
  const pathname = usePathname()

  return (
    <nav
      aria-label="Navigasi Utama"
      className={cn("items-center justify-center gap-1", className)}
    >
      <ul className="flex flex-wrap items-center justify-center gap-1 text-sm font-medium">
        {categories.map((category) => {
          const href = `/categories/${category.slug}`
          const isActive = pathname === href

          return (
            <li key={category.id}>
              <Link
                href={href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "inline-flex items-center justify-center px-3 py-2 rounded-md text-espresso/80 transition-colors hover:text-espresso hover:bg-sand/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]",
                  isActive && "text-espresso font-semibold bg-sand/40"
                )}
              >
                {category.name}
              </Link>
            </li>
          )
        })}
        <li>
          <Link
            href="/sale"
            aria-current={pathname === "/sale" ? "page" : undefined}
            className={cn(
              "inline-flex items-center justify-center px-3 py-2 rounded-md text-danger font-semibold transition-colors hover:bg-danger/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[44px]",
              pathname === "/sale" && "bg-danger/15"
            )}
          >
            Sale
          </Link>
        </li>
      </ul>
    </nav>
  )
}
