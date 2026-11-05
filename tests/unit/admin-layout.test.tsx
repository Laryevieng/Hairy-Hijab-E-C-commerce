import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import AdminLayout, { metadata } from '@/app/admin/layout'

// Mock dependencies
const mockRequireStaff = vi.fn()

vi.mock('@/lib/auth/guards', () => ({
  requireStaff: () => mockRequireStaff(),
}))

vi.mock('next/navigation', () => ({
  usePathname: () => '/admin',
}))

vi.mock('@/actions/auth.actions', () => ({
  signOut: vi.fn(),
}))

describe('AdminLayout (P8-01)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('has robots metadata set to noindex, nofollow', () => {
    expect(metadata.robots).toEqual({
      index: false,
      follow: false,
    })
  })

  it('renders admin layout shell and children when user is staff', async () => {
    mockRequireStaff.mockResolvedValue({
      user: { id: 'staff-1', email: 'staff@example.com' },
      role: 'staff',
    })

    const LayoutComponent = await AdminLayout({
      children: <div data-testid="admin-child">Konten Dashboard</div>,
    })

    render(LayoutComponent)

    expect(screen.getByTestId('admin-child')).toBeInTheDocument()
    expect(screen.getByText('Konten Dashboard')).toBeInTheDocument()
    expect(screen.getByText('staff@example.com')).toBeInTheDocument()
    expect(screen.getAllByText('Staf')[0]).toBeInTheDocument()
  })

  it('delegates authorization to requireStaff', async () => {
    mockRequireStaff.mockRejectedValue(new Error('NEXT_NOT_FOUND'))

    await expect(
      AdminLayout({ children: <div>Protected</div> })
    ).rejects.toThrow('NEXT_NOT_FOUND')
  })
})
