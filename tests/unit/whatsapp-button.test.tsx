import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { WhatsAppButton } from '@/components/common/whatsapp-button'

describe('WhatsAppButton (P7-02)', () => {
  it('merender tombol dengan tautan wa.me yang benar ketika nomor valid', () => {
    render(<WhatsAppButton phone="0812-3456-7890" />)

    const link = screen.getByRole('link', { name: /Hubungi customer service Hairy Hijab via WhatsApp/i })
    expect(link).toBeInTheDocument()
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')

    const href = link.getAttribute('href')
    expect(href).toContain('https://wa.me/6281234567890')
    expect(href).toContain('text=Halo+Hairy+Hijab%2C+saya+ingin+bertanya+tentang+produk+dan+pesanan.')
  })

  it('menyusun tautan dengan pesan nomor pesanan ketika orderNumber diisi', () => {
    render(<WhatsAppButton phone="6281234567890" orderNumber="HH-261105-ABCDE" />)

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')
    expect(href).toContain('https://wa.me/6281234567890')
    expect(href).toContain('text=Halo+Hairy+Hijab%2C+saya+ingin+konfirmasi+pesanan+HH-261105-ABCDE.')
  })

  it('menyusun tautan dengan pesan kustom jika parameter message diberikan', () => {
    render(<WhatsAppButton phone="081234567890" message="Halo CS, apakah pashmina abu restock?" />)

    const link = screen.getByRole('link')
    const href = link.getAttribute('href')
    expect(href).toContain('https://wa.me/6281234567890')
    expect(href).toContain('text=Halo+CS%2C+apakah+pashmina+abu+restock%3F')
  })

  it('tidak merender apapun (null) bila nomor telepon tidak ada (undefined / null)', () => {
    const { container: c1 } = render(<WhatsAppButton phone={undefined} />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(<WhatsAppButton phone={null} />)
    expect(c2).toBeEmptyDOMElement()
  })

  it('tidak merender apapun (null) bila nomor telepon string kosong atau hanya spasi', () => {
    const { container: c1 } = render(<WhatsAppButton phone="" />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(<WhatsAppButton phone="    " />)
    expect(c2).toBeEmptyDOMElement()
  })

  it('tidak merender apapun (null) bila nomor telepon bukan format telepon Indonesia yang valid', () => {
    // Nomor terlalu pendek / bukan format 628
    const { container: c1 } = render(<WhatsAppButton phone="12345" />)
    expect(c1).toBeEmptyDOMElement()

    const { container: c2 } = render(<WhatsAppButton phone="021-555-1234" />)
    expect(c2).toBeEmptyDOMElement()
  })
})
