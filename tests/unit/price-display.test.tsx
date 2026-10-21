import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { PriceDisplay } from '@/components/product/price-display'

describe('PriceDisplay (P1-04)', () => {
  it('merender harga normal dengan benar tanpa harga coret jika compareAtPrice tidak diberikan', () => {
    render(<PriceDisplay price={125000} />)
    expect(screen.getByText('Rp 125.000')).toBeInTheDocument()
    expect(screen.queryByRole('deletion')).not.toBeInTheDocument()
    expect(screen.queryByText(/Hemat/i)).not.toBeInTheDocument()
  })

  it('merender harga normal tanpa harga coret jika compareAtPrice bernilai null atau undefined', () => {
    render(<PriceDisplay price={89000} compareAtPrice={null} />)
    expect(screen.getByText('Rp 89.000')).toBeInTheDocument()
    expect(screen.queryByText(/Hemat/i)).not.toBeInTheDocument()
  })

  it('tidak menampilkan diskon jika compareAtPrice lebih kecil atau sama dengan price', () => {
    render(<PriceDisplay price={100000} compareAtPrice={100000} />)
    expect(screen.getByText('Rp 100.000')).toBeInTheDocument()
    expect(screen.queryByText(/Hemat/i)).not.toBeInTheDocument()

    render(<PriceDisplay price={100000} compareAtPrice={90000} />)
    expect(screen.queryByText(/Hemat/i)).not.toBeInTheDocument()
  })

  it('menghitung persentase hemat dengan formula integer Math.round((compare - price) / compare * 100)', () => {
    // Kasus 1: compare = 85000, price = 65000
    // Math.round((85000 - 65000) / 85000 * 100) = Math.round(23.529...) = 24%
    const { unmount } = render(<PriceDisplay price={65000} compareAtPrice={85000} />)
    expect(screen.getByText('Rp 65.000')).toBeInTheDocument()
    expect(screen.getByText('Rp 85.000')).toBeInTheDocument()
    expect(screen.getByText('Hemat 24%')).toBeInTheDocument()
    unmount()

    // Kasus 2: compare = 150000, price = 120000
    // Math.round((150000 - 120000) / 150000 * 100) = Math.round(20) = 20%
    const { unmount: unmount2 } = render(<PriceDisplay price={120000} compareAtPrice={150000} />)
    expect(screen.getByText('Rp 120.000')).toBeInTheDocument()
    expect(screen.getByText('Rp 150.000')).toBeInTheDocument()
    expect(screen.getByText('Hemat 20%')).toBeInTheDocument()
    unmount2()

    // Kasus 3: compare = 125000, price = 99000
    // Math.round((125000 - 99000) / 125000 * 100) = Math.round(20.8) = 21%
    render(<PriceDisplay price={99000} compareAtPrice={125000} />)
    expect(screen.getByText('Rp 99.000')).toBeInTheDocument()
    expect(screen.getByText('Hemat 21%')).toBeInTheDocument()
  })

  it('memiliki atribut aria-label aksesibel untuk pembaca layar', () => {
    render(<PriceDisplay price={65000} compareAtPrice={85000} />)
    const container = screen.getByLabelText(/Harga Rp 65\.000.*hemat 24%/i)
    expect(container).toBeInTheDocument()
  })
})
