import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { ImageUploader } from '@/components/admin/products/image-uploader'
import type { ProductImageRow } from '@/services/admin/products.service'

if (typeof globalThis.ResizeObserver === 'undefined') {
  globalThis.ResizeObserver = class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
}

const mockRefresh = vi.fn()
const mockStorageUpload = vi.fn()
const mockStorageRemove = vi.fn()
const mockCreateProductImage = vi.fn()
const mockUpdateProductImage = vi.fn()
const mockMoveProductImageOrder = vi.fn()
const mockDeleteProductImage = vi.fn()

vi.mock('next/navigation', () => ({
  useRouter: () => ({
    refresh: mockRefresh,
  }),
}))

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    storage: {
      from: () => ({
        upload: (...args: unknown[]) => mockStorageUpload(...args),
        remove: (...args: unknown[]) => mockStorageRemove(...args),
      }),
    },
  }),
}))

vi.mock('@/actions/admin-catalog.actions', () => ({
  createProductImage: (...args: unknown[]) => mockCreateProductImage(...args),
  updateProductImage: (...args: unknown[]) => mockUpdateProductImage(...args),
  moveProductImageOrder: (...args: unknown[]) =>
    mockMoveProductImageOrder(...args),
  deleteProductImage: (...args: unknown[]) => mockDeleteProductImage(...args),
}))

const productId = 'b0000000-0000-4000-8000-000000000001'
const sampleImages: ProductImageRow[] = [
  {
    id: 'd0000000-0000-4000-8000-000000000001',
    product_id: productId,
    variant_id: null,
    storage_path: `${productId}/img-1.jpg`,
    alt_text: 'Bergo Non Karet Hitam Depan',
    sort_order: 0,
    created_at: '2026-10-25T00:00:00Z',
  },
  {
    id: 'd0000000-0000-4000-8000-000000000002',
    product_id: productId,
    variant_id: null,
    storage_path: `${productId}/img-2.jpg`,
    alt_text: 'Bergo Non Karet Hitam Samping',
    sort_order: 1,
    created_at: '2026-10-25T00:01:00Z',
  },
]

describe('ImageUploader UI (P8-06)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('pre-fills default alt_text with product name and renders keyboard-operable reorder buttons', async () => {
    mockMoveProductImageOrder.mockResolvedValue({ ok: true, data: undefined })

    render(
      <ImageUploader
        productId={productId}
        productName="Bergo Non Karet"
        images={sampleImages}
        variants={[]}
      />
    )

    // Default alt text input is pre-filled with product name
    const defaultAltInput = screen.getByLabelText(
      /teks alternatif awal \(wajib\)/i
    )
    expect(defaultAltInput).toHaveValue('Bergo Non Karet')

    // First image cannot move up; second image can move up
    const moveUpImg1 = screen.getByRole('button', {
      name: /pindahkan gambar 1 ke atas/i,
    })
    const moveDownImg1 = screen.getByRole('button', {
      name: /pindahkan gambar 1 ke bawah/i,
    })
    const moveUpImg2 = screen.getByRole('button', {
      name: /pindahkan gambar 2 ke atas/i,
    })
    const moveDownImg2 = screen.getByRole('button', {
      name: /pindahkan gambar 2 ke bawah/i,
    })

    expect(moveUpImg1).toBeDisabled()
    expect(moveDownImg1).not.toBeDisabled()
    expect(moveUpImg2).not.toBeDisabled()
    expect(moveDownImg2).toBeDisabled()

    fireEvent.click(moveUpImg2)

    await waitFor(() => {
      expect(mockMoveProductImageOrder).toHaveBeenCalledWith(
        sampleImages[1].id,
        'up'
      )
    })
  })

  it('updates alt_text of an existing image and rejects empty alt_text', async () => {
    mockUpdateProductImage.mockResolvedValue({
      ok: true,
      data: { id: sampleImages[0].id },
    })

    render(
      <ImageUploader
        productId={productId}
        productName="Bergo Non Karet"
        images={sampleImages}
        variants={[]}
      />
    )

    const altInputs = screen.getAllByLabelText(/teks alternatif \(alt text\)/i)
    const firstAltInput = altInputs[0]

    // Clear alt text and submit -> validation error
    fireEvent.change(firstAltInput, { target: { value: '   ' } })
    fireEvent.click(
      screen.getByRole('button', { name: /simpan detail gambar 1/i })
    )
    expect(
      screen.getByText('Teks alternatif (alt text) wajib diisi.')
    ).toBeInTheDocument()
    expect(mockUpdateProductImage).not.toHaveBeenCalled()

    // Enter valid new alt text and submit
    fireEvent.change(firstAltInput, {
      target: { value: 'Bergo Non Karet Detail Bahan' },
    })
    fireEvent.click(
      screen.getByRole('button', { name: /simpan detail gambar 1/i })
    )

    await waitFor(() => {
      expect(mockUpdateProductImage).toHaveBeenCalledWith({
        id: sampleImages[0].id,
        alt_text: 'Bergo Non Karet Detail Bahan',
        variant_id: null,
      })
    })
  })

  it('uploads valid JPEG file to product-images/<product_id>/<uuid>.jpg and saves DB record', async () => {
    mockStorageUpload.mockResolvedValue({ data: { path: 'ok' }, error: null })
    mockCreateProductImage.mockResolvedValue({
      ok: true,
      data: { id: 'new-img-id' },
    })

    render(
      <ImageUploader
        productId={productId}
        productName="Bergo Non Karet"
        images={[]}
        variants={[]}
      />
    )

    // Create valid JPEG bytes (FF D8 FF E0 + padding >= 12 bytes)
    const jpegBytes = new Uint8Array([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
    ])
    const validFile = new File([jpegBytes], 'foto-produk.jpg', {
      type: 'image/jpeg',
    })

    const fileInput = screen.getByLabelText(/pilih file gambar produk/i)
    fireEvent.change(fileInput, { target: { files: [validFile] } })

    await waitFor(() => {
      expect(mockStorageUpload).toHaveBeenCalledTimes(1)
      const [uploadedPath] = mockStorageUpload.mock.calls[0]
      expect(uploadedPath).toMatch(
        new RegExp(`^${productId}/[0-9a-f-]+\\.jpg$`, 'i')
      )
      expect(mockCreateProductImage).toHaveBeenCalledWith(
        expect.objectContaining({
          product_id: productId,
          storage_path: uploadedPath,
          alt_text: 'Bergo Non Karet',
          sort_order: 0,
        })
      )
    })
  })
})
