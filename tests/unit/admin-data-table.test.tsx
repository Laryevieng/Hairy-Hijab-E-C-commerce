import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import { DataTable, type ColumnDef } from '@/components/admin/data-table'

interface TestItem {
  id: string
  name: string
  role: string
  active: boolean
}

const mockColumns: ColumnDef<TestItem>[] = [
  { header: 'Nama', accessorKey: 'name' },
  { header: 'Peran', accessorKey: 'role' },
  {
    header: 'Status',
    cell: (item) => (
      <span data-testid={`status-${item.id}`}>
        {item.active ? 'Aktif' : 'Nonaktif'}
      </span>
    ),
  },
]

const mockData: TestItem[] = [
  { id: '1', name: 'Siti Aminah', role: 'Staff', active: true },
  { id: '2', name: 'Dewi Sartika', role: 'Admin', active: false },
]

describe('DataTable Component', () => {
  it('renders table headers and data rows correctly', () => {
    render(<DataTable columns={mockColumns} data={mockData} />)

    expect(screen.getByText('Nama')).toBeInTheDocument()
    expect(screen.getByText('Peran')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()

    expect(screen.getByText('Siti Aminah')).toBeInTheDocument()
    expect(screen.getByText('Dewi Sartika')).toBeInTheDocument()
    expect(screen.getByTestId('status-1')).toHaveTextContent('Aktif')
    expect(screen.getByTestId('status-2')).toHaveTextContent('Nonaktif')
  })

  it('renders empty message when data array is empty', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={[]}
        emptyMessage="Tidak ada data staf ditemukan."
      />
    )

    expect(screen.getByText('Tidak ada data staf ditemukan.')).toBeInTheDocument()
  })

  it('renders skeleton rows when isLoading is true', () => {
    const { container } = render(
      <DataTable columns={mockColumns} data={mockData} isLoading={true} />
    )

    // Skeleton elements should be rendered instead of real data
    expect(screen.queryByText('Siti Aminah')).not.toBeInTheDocument()
    const skeletons = container.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
  })

  it('renders server-side pagination when pagination prop is provided', () => {
    render(
      <DataTable
        columns={mockColumns}
        data={mockData}
        pagination={{
          page: 1,
          pageSize: 2,
          count: 10,
          pathname: '/admin/orders',
          searchParams: 'status=paid',
          ariaLabel: 'Navigasi tabel pesanan',
        }}
      />
    )

    expect(
      screen.getByRole('navigation', { name: 'Navigasi tabel pesanan' })
    ).toBeInTheDocument()
    expect(screen.getByText(/Halaman 1 dari 5/i)).toBeInTheDocument()
  })
})
