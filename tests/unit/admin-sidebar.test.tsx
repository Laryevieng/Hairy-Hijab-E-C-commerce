import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { AdminSidebar, ADMIN_NAV_ITEMS } from '@/components/admin/admin-sidebar'

const mockSignOut = vi.fn()

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

vi.mock('@/actions/auth.actions', () => ({
  signOut: () => mockSignOut(),
}))

describe('AdminSidebar Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders limited menus for staff role (Dashboard, Pesanan, Inventori)', () => {
    render(<AdminSidebar role="staff" userEmail="staff@example.com" />)

    // Allowed for staff
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pesanan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /inventori/i })).toBeInTheDocument()

    // Forbidden for staff
    expect(screen.queryByRole('link', { name: /kategori/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /produk/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /pelanggan/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /pengaturan/i })).not.toBeInTheDocument()

    // Staff badge and user email
    expect(screen.getByText('Staf')).toBeInTheDocument()
    expect(screen.getByText('staff@example.com')).toBeInTheDocument()
  })

  it('renders all menus for admin role', () => {
    render(<AdminSidebar role="admin" userEmail="admin@example.com" />)

    // All navigation items
    expect(screen.getByRole('link', { name: /dashboard/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pesanan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /inventori/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /kategori/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /produk/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pelanggan/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /pengaturan/i })).toBeInTheDocument()

    // Admin badge
    expect(screen.getByText('Admin')).toBeInTheDocument()
  })

  it('calls signOut action when clicking Keluar', async () => {
    render(<AdminSidebar role="staff" userEmail="staff@example.com" />)

    const logoutBtn = screen.getByRole('button', { name: /keluar/i })
    fireEvent.click(logoutBtn)

    expect(mockSignOut).toHaveBeenCalledTimes(1)
  })

  it('nav items definition defines 7 modules correctly with adminOnly flags', () => {
    expect(ADMIN_NAV_ITEMS).toHaveLength(7)
    const adminOnlyItems = ADMIN_NAV_ITEMS.filter((i) => i.adminOnly)
    expect(adminOnlyItems.map((i) => i.label)).toEqual([
      'Kategori',
      'Produk',
      'Pelanggan',
      'Pengaturan',
    ])
  })
})
