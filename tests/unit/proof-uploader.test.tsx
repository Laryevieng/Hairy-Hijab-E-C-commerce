import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'

vi.mock('server-only', () => ({}))
vi.mock('@/actions/payment.actions', () => ({
  submitPaymentProof: vi.fn(),
}))

import { ProofUploader } from '@/components/orders/proof-uploader'

describe('ProofUploader Component (P7-01b & P7-01d)', () => {
  const defaultProps = {
    orderId: 'a0000000-0000-4000-8000-000000000001',
    orderNumber: 'HH-261105-ABCDE',
    token: 'test-token-123',
    status: 'pending' as const,
    paymentStatus: 'unpaid' as const,
    latestPayment: null,
    bankAccounts: [
      {
        bank: 'BCA',
        accountNumber: '1234567890',
        accountName: 'PT Hairy Hijab',
      },
    ],
  }

  it('tidak me-render apapun jika pesanan bukan pending atau sudah dibayar', () => {
    const { container: c1 } = render(
      <ProofUploader {...defaultProps} status="processing" paymentStatus="paid" />
    )
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(
      <ProofUploader {...defaultProps} status="completed" paymentStatus="paid" />
    )
    expect(c2).toBeEmptyDOMElement()
  })

  it('menampilkan status "Menunggu Verifikasi" bila bukti telah diunggah (proof_submitted)', () => {
    render(
      <ProofUploader
        {...defaultProps}
        status="pending"
        paymentStatus="proof_submitted"
        latestPayment={{
          id: 'pay-1',
          amount: 100000,
          method: 'manual_transfer',
          status: 'submitted',
          bankName: 'BCA',
          senderName: 'Siti Fulanah',
          submittedAt: '2026-11-05T10:00:00Z',
          reviewedAt: null,
          reviewNote: null,
        }}
      />
    )

    expect(screen.getByText('Menunggu Verifikasi Pembayaran')).toBeInTheDocument()
    expect(screen.getByText(/Staf Hairy Hijab sedang memverifikasi pembayaran Anda/i)).toBeInTheDocument()
    expect(screen.getByText('BCA')).toBeInTheDocument()
    expect(screen.getByText('Siti Fulanah')).toBeInTheDocument()
  })

  it('menampilkan catatan penolakan staf jika bukti sebelumnya ditolak dan tetap menampilkan form unggah ulang', () => {
    render(
      <ProofUploader
        {...defaultProps}
        status="pending"
        paymentStatus="unpaid"
        latestPayment={{
          id: 'pay-2',
          amount: 100000,
          method: 'manual_transfer',
          status: 'rejected',
          bankName: 'BCA',
          senderName: 'Siti Fulanah',
          submittedAt: '2026-11-05T10:00:00Z',
          reviewedAt: '2026-11-05T10:30:00Z',
          reviewNote: 'Nominal transfer kurang Rp 5.000',
        }}
      />
    )

    expect(screen.getByText('Bukti pembayaran sebelumnya ditolak:')).toBeInTheDocument()
    expect(screen.getByText('"Nominal transfer kurang Rp 5.000"')).toBeInTheDocument()
    expect(screen.getByText(/Silakan unggah ulang bukti transfer yang jelas/i)).toBeInTheDocument()

    // Form unggah bukti tetap tampil
    expect(screen.getByText(/Konfirmasi & Unggah Bukti Transfer/i)).toBeInTheDocument()
  })

  it('tombol kirim dinonaktifkan (disabled) jika belum ada file yang dipilih', () => {
    render(<ProofUploader {...defaultProps} />)

    const submitBtn = screen.getByRole('button', { name: 'Kirim Bukti Pembayaran' })
    expect(submitBtn).toBeDisabled()
  })

  it('memanggil onSubmitProof dengan FormData saat form disubmit dengan file', async () => {
    const mockSubmit = vi.fn().mockResolvedValue({
      ok: true,
      data: { orderId: defaultProps.orderId, orderNumber: defaultProps.orderNumber },
    })

    render(<ProofUploader {...defaultProps} onSubmitProof={mockSubmit} />)

    // Isi nama pengirim
    const senderInput = screen.getByPlaceholderText(/Nama pemilik rekening yang mentransfer dana/i)
    fireEvent.change(senderInput, { target: { value: 'Aisyah Putri' } })

    // Pilih file bukti transfer (simulasi dummy image file)
    const file = new File(['dummy content'], 'struk.jpg', { type: 'image/jpeg' })
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    expect(fileInput).not.toBeNull()

    // Mock createObjectURL
    window.URL.createObjectURL = vi.fn().mockReturnValue('blob:dummy-url')
    window.URL.revokeObjectURL = vi.fn()

    fireEvent.change(fileInput, { target: { files: [file] } })

    // Submit form
    const submitBtn = screen.getByRole('button', { name: 'Kirim Bukti Pembayaran' })
    fireEvent.click(submitBtn)

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalled()
    })

    const submittedFormData = mockSubmit.mock.calls[0][0] as FormData
    expect(submittedFormData.get('orderId')).toBe(defaultProps.orderId)
    expect(submittedFormData.get('token')).toBe(defaultProps.token)
    expect(submittedFormData.get('senderName')).toBe('Aisyah Putri')
    expect(submittedFormData.get('bankName')).toBe('BCA')
    expect(submittedFormData.get('file')).not.toBeNull()
  })
})
