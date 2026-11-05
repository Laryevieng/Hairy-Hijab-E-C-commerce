'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Badge } from '@/components/ui/badge'
import { AdminSidebar } from './admin-sidebar'
import type { StaffRole, CurrentUser } from '@/lib/auth/guards'

interface AdminLayoutShellProps {
  user: CurrentUser
  role: StaffRole
  children: React.ReactNode
}

export function AdminLayoutShell({ user, role, children }: AdminLayoutShellProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="min-h-screen bg-ivory flex flex-col lg:flex-row text-espresso">
      {/* Desktop Sidebar (visible on lg+) */}
      <div className="hidden lg:block w-64 shrink-0 h-screen sticky top-0 z-30">
        <AdminSidebar role={role} userEmail={user.email} className="h-full" />
      </div>

      {/* Mobile Top Header (visible < lg) */}
      <header className="lg:hidden sticky top-0 z-40 flex h-14 items-center justify-between border-b border-sand bg-ivory px-4">
        <div className="flex items-center gap-3">
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                className="h-9 w-9 border-sand bg-ivory text-espresso hover:bg-sand/30"
                aria-label="Buka menu navigasi admin"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-ivory border-sand">
              <SheetHeader className="sr-only">
                <SheetTitle>Navigasi Admin Hairy Hijab</SheetTitle>
              </SheetHeader>
              <AdminSidebar
                role={role}
                userEmail={user.email}
                className="h-full border-none"
                onNavigate={() => setMobileOpen(false)}
              />
            </SheetContent>
          </Sheet>

          <Link href="/admin" className="font-serif text-base font-bold text-espresso">
            Hairy Hijab Admin
          </Link>
        </div>

        <Badge
          variant={role === 'admin' ? 'default' : 'secondary'}
          className="capitalize text-xs"
        >
          {role === 'admin' ? 'Admin' : 'Staf'}
        </Badge>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {children}
        </main>
      </div>
    </div>
  )
}
