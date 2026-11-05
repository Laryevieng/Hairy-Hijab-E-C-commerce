'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Tags,
  Shirt,
  Users,
  Settings,
  Store,
  LogOut,
} from 'lucide-react'
import { cn } from '@/lib/utils/cn'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { signOut } from '@/actions/auth.actions'
import type { StaffRole } from '@/lib/auth/guards'

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  adminOnly?: boolean
}

export const ADMIN_NAV_ITEMS: NavItem[] = [
  {
    label: 'Dashboard',
    href: '/admin',
    icon: LayoutDashboard,
  },
  {
    label: 'Pesanan',
    href: '/admin/orders',
    icon: ShoppingBag,
  },
  {
    label: 'Inventori',
    href: '/admin/inventory',
    icon: Package,
  },
  {
    label: 'Kategori',
    href: '/admin/categories',
    icon: Tags,
    adminOnly: true,
  },
  {
    label: 'Produk',
    href: '/admin/products',
    icon: Shirt,
    adminOnly: true,
  },
  {
    label: 'Pelanggan',
    href: '/admin/customers',
    icon: Users,
    adminOnly: true,
  },
  {
    label: 'Pengaturan',
    href: '/admin/settings',
    icon: Settings,
    adminOnly: true,
  },
]

interface AdminSidebarProps {
  role: StaffRole
  userEmail?: string | null
  className?: string
  onNavigate?: () => void
}

export function AdminSidebar({
  role,
  userEmail,
  className,
  onNavigate,
}: AdminSidebarProps) {
  const pathname = usePathname()

  const allowedNavItems = ADMIN_NAV_ITEMS.filter(
    (item) => !item.adminOnly || role === 'admin'
  )

  const handleSignOut = async () => {
    await signOut()
  }

  return (
    <aside
      className={cn(
        'flex h-full flex-col justify-between bg-ivory border-r border-sand p-4 text-espresso',
        className
      )}
      aria-label="Navigasi Admin"
    >
      <div className="space-y-6">
        {/* Brand Header */}
        <div className="flex items-center justify-between border-b border-sand pb-4">
          <Link
            href="/admin"
            onClick={onNavigate}
            className="flex flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-deep rounded"
          >
            <span className="font-serif text-lg font-bold tracking-tight text-espresso">
              Hairy Hijab
            </span>
            <span className="text-xs uppercase tracking-wider text-taupe font-sans font-medium">
              Admin Portal
            </span>
          </Link>
          <Badge
            variant={role === 'admin' ? 'default' : 'secondary'}
            className="capitalize text-xs font-medium"
          >
            {role === 'admin' ? 'Admin' : 'Staf'}
          </Badge>
        </div>

        {/* Navigation Links */}
        <nav className="space-y-1" aria-label="Menu Admin">
          {allowedNavItems.map((item) => {
            const Icon = item.icon
            // Exact match for /admin, prefix match for others
            const isActive =
              item.href === '/admin'
                ? pathname === '/admin'
                : pathname.startsWith(item.href)

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-espresso text-ivory font-semibold shadow-xs'
                    : 'text-espresso/80 hover:bg-sand/40 hover:text-espresso'
                )}
                aria-current={isActive ? 'page' : undefined}
              >
                <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-ivory' : 'text-espresso/70')} />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Footer Info & Actions */}
      <div className="space-y-3 border-t border-sand pt-4">
        {userEmail && (
          <div className="px-2">
            <p className="text-xs text-taupe font-medium">Masuk sebagai:</p>
            <p className="truncate text-xs font-semibold text-espresso" title={userEmail}>
              {userEmail}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-1.5 pt-1">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-md px-3 py-2 text-xs font-medium text-espresso/75 hover:bg-sand/30 hover:text-espresso transition-colors"
          >
            <Store className="h-4 w-4 text-espresso/70" />
            <span>Lihat Toko Publik</span>
          </Link>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleSignOut}
            className="w-full justify-start gap-2 px-3 text-xs font-medium text-danger hover:bg-danger/10 hover:text-danger cursor-pointer"
          >
            <LogOut className="h-4 w-4" />
            <span>Keluar</span>
          </Button>
        </div>
      </div>
    </aside>
  )
}
