import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

describe('shadcn/ui Button & Input dengan token warna Hairy Hijab', () => {
  it('merender Button default dengan kelas token primary (espresso) dan primary-foreground (ivory)', () => {
    render(<Button>Beli Sekarang</Button>)
    const button = screen.getByRole('button', { name: 'Beli Sekarang' })
    expect(button).toBeInTheDocument()
    expect(button).toHaveClass('bg-primary', 'text-primary-foreground')
  })

  it('merender Input dengan kelas token border-input dan ring fokus', () => {
    render(<Input aria-label="Cari produk" placeholder="Cari hijab..." />)
    const input = screen.getByRole('textbox', { name: 'Cari produk' })
    expect(input).toBeInTheDocument()
    expect(input).toHaveClass('border-input')
  })
})
