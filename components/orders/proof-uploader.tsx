'use client'

import { useState, useTransition, useRef, useId } from 'react'
import Image from 'next/image'
import { UploadCloud, CheckCircle2, AlertCircle, Loader2, Image as ImageIcon, X } from 'lucide-react'
import { toast } from 'sonner'
import { submitPaymentProof } from '@/actions/payment.actions'
import { formatDateTimeID } from '@/lib/utils/format'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import type {
  OrderStatus,
  PaymentStatus,
  OrderViewPayment,
  StoreBankAccount,
} from '@/services/orders.public.service'
import type { ActionResult } from '@/types/action'
import type { SubmitPaymentProofResult } from '@/actions/payment.actions'

export interface ProofUploaderProps {
  orderId: string
  orderNumber: string
  token?: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  latestPayment: OrderViewPayment | null
  bankAccounts?: StoreBankAccount[]
  onSubmitProof?: (formData: FormData) => Promise<ActionResult<SubmitPaymentProofResult>>
}

/**
 * Kompresi gambar sisi klien via HTML Canvas (P7-01b):
 * Sisi terpanjang disesuaikan maksimal 1600 px dan kualitas JPEG 0.8.
 */
async function compressImageClient(file: File): Promise<File> {
  // Bila bukan gambar, atau di lingkungan test jsdom tanpa image loader native
  if (
    !file.type.startsWith('image/') ||
    typeof document === 'undefined' ||
    typeof window === 'undefined' ||
    process.env.NODE_ENV === 'test'
  ) {
    return file
  }

  return new Promise((resolve) => {
    const img = new window.Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      const maxDim = 1600
      let { width, height } = img

      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width)
          width = maxDim
        } else {
          width = Math.round((width * maxDim) / height)
          height = maxDim
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')

      if (!ctx) {
        resolve(file)
        return
      }

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(file)
            return
          }
          const fileName = file.name.replace(/\.[^.]+$/, '') + '.jpg'
          const compressed = new File([blob], fileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressed)
        },
        'image/jpeg',
        0.8
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}

export function ProofUploader({
  orderId,
  orderNumber,
  token,
  status,
  paymentStatus,
  latestPayment,
  bankAccounts = [],
  onSubmitProof,
}: ProofUploaderProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [bankName, setBankName] = useState(bankAccounts[0]?.bank ?? '')
  const [senderName, setSenderName] = useState('')
  const [customerNote, setCustomerNote] = useState('')
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({})
  const [isPending, startTransition] = useTransition()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const fileInputId = useId()
  const bankNameId = useId()
  const senderNameId = useId()
  const noteId = useId()

  // Hanya tampil untuk pesanan pending
  if (status !== 'pending' || paymentStatus === 'paid') {
    return null
  }

  // Tampilan status: "Menunggu verifikasi" (P7-01d)
  if (paymentStatus === 'proof_submitted') {
    return (
      <div className="rounded-xl border border-sky-200 bg-sky-50/60 p-5 sm:p-6 shadow-xs">
        <div className="flex items-start gap-3">
          <CheckCircle2 className="size-5 shrink-0 text-sky-700 mt-0.5" />
          <div className="space-y-2">
            <div>
              <h4 className="text-sm font-semibold text-sky-950">Menunggu Verifikasi Pembayaran</h4>
              <p className="text-xs text-sky-800 leading-relaxed mt-1">
                Bukti transfer berhasil dikirim
                {latestPayment?.submittedAt ? ` pada ${formatDateTimeID(latestPayment.submittedAt)}` : ''}.
                Staf Hairy Hijab sedang memverifikasi pembayaran Anda. Status pesanan akan diperbarui secara otomatis.
              </p>
            </div>

            {latestPayment && (
              <div className="rounded-md border border-sky-200/80 bg-white/70 p-3 text-xs text-sky-900 space-y-1">
                {latestPayment.bankName && (
                  <p><span className="text-sky-700 font-medium">Bank Tujuan:</span> {latestPayment.bankName}</p>
                )}
                {latestPayment.senderName && (
                  <p><span className="text-sky-700 font-medium">Nama Pengirim:</span> {latestPayment.senderName}</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setSelectedFile(file)
    setFieldErrors((prev) => {
      const next = { ...prev }
      delete next.file
      return next
    })

    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleRemoveFile = () => {
    setSelectedFile(null)
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
      setPreviewUrl(null)
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFieldErrors({})

    if (!selectedFile) {
      setFieldErrors({ file: ['Pilih file foto bukti transfer terlebih dahulu.'] })
      return
    }

    startTransition(async () => {
      try {
        // Kompresi di klien (P7-01b)
        const fileToUpload = await compressImageClient(selectedFile)

        const formData = new FormData()
        formData.append('orderId', orderId)
        if (token) {
          formData.append('token', token)
        }
        formData.append('bankName', bankName)
        formData.append('senderName', senderName)
        if (customerNote) {
          formData.append('customerNote', customerNote)
        }
        formData.append('file', fileToUpload)

        const actionFn = onSubmitProof ?? submitPaymentProof
        const res = await actionFn(formData)

        if (!res.ok) {
          if (res.error.fieldErrors) {
            setFieldErrors(res.error.fieldErrors)
          }
          toast.error(res.error.message || 'Gagal mengunggah bukti pembayaran.')
          return
        }

        toast.success('Bukti transfer berhasil dikirim. Menunggu verifikasi staf.')
        handleRemoveFile()
      } catch {
        toast.error('Terjadi kesalahan saat memproses file bukti transfer.')
      }
    })
  }

  return (
    <div className="rounded-xl border border-sand bg-white p-5 sm:p-6 shadow-xs space-y-5">
      {/* Catatan penolakan jika bukti sebelumnya ditolak staf (P7-01d) */}
      {latestPayment?.reviewNote && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-left flex items-start gap-3">
          <AlertCircle className="size-5 shrink-0 text-red-600 mt-0.5" />
          <div className="text-xs text-red-900 space-y-1">
            <p className="font-semibold text-red-950">Bukti pembayaran sebelumnya ditolak:</p>
            <p className="italic text-red-800 bg-white/60 p-2 rounded border border-red-200/50">
              &quot;{latestPayment.reviewNote}&quot;
            </p>
            <p className="text-red-700 pt-0.5">
              Silakan unggah ulang bukti transfer yang jelas dan sesuai dengan nominal pesanan.
            </p>
          </div>
        </div>
      )}

      <div className="border-b border-sand pb-3">
        <h3 className="font-heading text-lg text-espresso flex items-center gap-2">
          <UploadCloud className="size-5 text-espresso/70" />
          Konfirmasi & Unggah Bukti Transfer
        </h3>
        <p className="text-xs text-muted-foreground mt-1">
          Sudah melakukan transfer untuk pesanan <strong>{orderNumber}</strong>? Unggah struk atau bukti transfer di bawah ini.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Pilihan / Nama Bank */}
        <div className="space-y-1.5">
          <Label htmlFor={bankNameId} className="text-xs font-medium text-espresso">
            Bank Tujuan Transfer <span className="text-red-500">*</span>
          </Label>
          {bankAccounts.length > 0 ? (
            <div className="space-y-2">
              <select
                id={bankNameId}
                value={bankName}
                onChange={(e) => {
                  setBankName(e.target.value)
                  setFieldErrors((prev) => {
                    const n = { ...prev }
                    delete n.bankName
                    return n
                  })
                }}
                disabled={isPending}
                className="w-full rounded-md border border-input bg-ivory px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {bankAccounts.map((b) => (
                  <option key={`${b.bank}-${b.accountNumber}`} value={b.bank}>
                    {b.bank} — {b.accountNumber} (a.n. {b.accountName})
                  </option>
                ))}
                <option value="Lainnya">Bank Lainnya</option>
              </select>
            </div>
          ) : (
            <Input
              id={bankNameId}
              type="text"
              placeholder="Contoh: BCA / Mandiri / BSI"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              disabled={isPending}
              maxLength={50}
            />
          )}
          {fieldErrors.bankName && (
            <p className="text-xs text-red-600">{fieldErrors.bankName[0]}</p>
          )}
        </div>

        {/* Nama Pemilik Rekening Pengirim */}
        <div className="space-y-1.5">
          <Label htmlFor={senderNameId} className="text-xs font-medium text-espresso">
            Nama Pengirim di Rekening <span className="text-red-500">*</span>
          </Label>
          <Input
            id={senderNameId}
            type="text"
            placeholder="Nama pemilik rekening yang mentransfer dana"
            value={senderName}
            onChange={(e) => {
              setSenderName(e.target.value)
              setFieldErrors((prev) => {
                const n = { ...prev }
                delete n.senderName
                return n
              })
            }}
            disabled={isPending}
            maxLength={80}
          />
          {fieldErrors.senderName && (
            <p className="text-xs text-red-600">{fieldErrors.senderName[0]}</p>
          )}
        </div>

        {/* Catatan Pembayaran (Opsional) */}
        <div className="space-y-1.5">
          <Label htmlFor={noteId} className="text-xs font-medium text-espresso">
            Catatan Tambahan <span className="text-muted-foreground font-normal">(opsional)</span>
          </Label>
          <Textarea
            id={noteId}
            rows={2}
            placeholder="Nomor referensi atau catatan lain (maksimal 200 karakter)"
            value={customerNote}
            onChange={(e) => setCustomerNote(e.target.value)}
            disabled={isPending}
            maxLength={200}
            className="text-xs"
          />
          {fieldErrors.customerNote && (
            <p className="text-xs text-red-600">{fieldErrors.customerNote[0]}</p>
          )}
        </div>

        {/* Upload File Bukti */}
        <div className="space-y-2">
          <Label htmlFor={fileInputId} className="text-xs font-medium text-espresso">
            Foto / Tangkapan Layar Bukti Transfer <span className="text-red-500">*</span>
          </Label>

          {!selectedFile ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-sand p-6 text-center cursor-pointer hover:bg-sand/15 transition-colors"
            >
              <div className="mx-auto flex size-10 items-center justify-center rounded-full bg-sand/30 text-espresso/70 mb-2">
                <ImageIcon className="size-5" />
              </div>
              <p className="text-xs font-medium text-espresso">
                Klik untuk memilih foto bukti transfer
              </p>
              <p className="text-[11px] text-muted-foreground mt-1">
                Format JPG, PNG, atau WebP (maksimal 4 MB). Gambar akan dikompresi otomatis.
              </p>
            </div>
          ) : (
            <div className="relative rounded-lg border border-sand bg-ivory p-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 overflow-hidden">
                {previewUrl && (
                  <div className="relative size-14 shrink-0 overflow-hidden rounded border border-sand bg-stone-100">
                    <Image
                      src={previewUrl}
                      alt="Pratinjau bukti transfer"
                      fill
                      unoptimized
                      className="object-cover"
                    />
                  </div>
                )}
                <div className="overflow-hidden text-xs">
                  <p className="font-medium text-espresso truncate">{selectedFile.name}</p>
                  <p className="text-muted-foreground">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleRemoveFile}
                disabled={isPending}
                className="rounded-full p-1 text-muted-foreground hover:bg-sand/30 hover:text-espresso"
                aria-label="Hapus file terpilih"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          <input
            id={fileInputId}
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            disabled={isPending}
            className="sr-only"
          />

          {fieldErrors.file && (
            <p className="text-xs text-red-600">{fieldErrors.file[0]}</p>
          )}
        </div>

        <Button
          type="submit"
          disabled={isPending || !selectedFile}
          className="w-full gap-2 text-xs font-medium min-h-11"
        >
          {isPending ? (
            <>
              <Loader2 className="size-4 animate-spin" />
              Mengompres & Mengunggah Bukti...
            </>
          ) : (
            'Kirim Bukti Pembayaran'
          )}
        </Button>
      </form>
    </div>
  )
}
