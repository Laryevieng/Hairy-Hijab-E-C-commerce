import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ConfirmDialog } from '@/components/admin/confirm-dialog'

describe('ConfirmDialog Component', () => {
  it('renders title, description, and buttons when open', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Batalkan Pesanan?"
        description="Pesanan yang dibatalkan akan melepaskan stok kembali."
        confirmLabel="Ya, Batalkan"
        cancelLabel="Kembali"
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByText('Batalkan Pesanan?')).toBeInTheDocument()
    expect(
      screen.getByText('Pesanan yang dibatalkan akan melepaskan stok kembali.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ya, Batalkan' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Kembali' })).toBeInTheDocument()
  })

  it('calls onOpenChange(false) when cancel button is clicked', () => {
    const handleOpenChange = vi.fn()
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Konfirmasi"
        description="Lanjutkan tindakan ini?"
        onConfirm={vi.fn()}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Batal' }))
    expect(handleOpenChange).toHaveBeenCalledWith(false)
  })

  it('calls onConfirm and then closes when confirm button is clicked', async () => {
    const handleConfirm = vi.fn().mockResolvedValue(undefined)
    const handleOpenChange = vi.fn()

    render(
      <ConfirmDialog
        open={true}
        onOpenChange={handleOpenChange}
        title="Verifikasi Pembayaran"
        description="Pastikan mutasi rekening valid."
        confirmLabel="Verifikasi"
        onConfirm={handleConfirm}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Verifikasi' }))

    await waitFor(() => {
      expect(handleConfirm).toHaveBeenCalledTimes(1)
      expect(handleOpenChange).toHaveBeenCalledWith(false)
    })
  })

  it('renders destructive styling when variant is destructive', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Hapus Produk"
        description="Tindakan ini tidak dapat diurungkan."
        variant="destructive"
        confirmLabel="Hapus Permanen"
        onConfirm={vi.fn()}
      />
    )

    const confirmButton = screen.getByRole('button', { name: 'Hapus Permanen' })
    expect(confirmButton.className).toContain('bg-danger')
  })

  it('disables buttons when isLoading is true', () => {
    render(
      <ConfirmDialog
        open={true}
        onOpenChange={vi.fn()}
        title="Memproses"
        description="Mohon tunggu..."
        isLoading={true}
        onConfirm={vi.fn()}
      />
    )

    expect(screen.getByRole('button', { name: 'Memproses...' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Batal' })).toBeDisabled()
  })
})
