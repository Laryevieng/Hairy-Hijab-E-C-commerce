'use client'

import { useState } from 'react'
import { Copy, Check, CreditCard, AlertCircle, Info } from 'lucide-react'
import { toast } from 'sonner'
import type { OrderStatus, PaymentStatus, StoreBankAccount } from '@/services/orders.public.service'
import { formatRupiah } from '@/lib/utils/format'
import { ExpiryCountdown } from '@/components/orders/expiry-countdown'
import { Button } from '@/components/ui/button'

interface PaymentInstructionsProps {
  grandTotal: number
  bankAccounts: StoreBankAccount[]
  status: OrderStatus
  paymentStatus: PaymentStatus
  expiresAt: string
}

export function PaymentInstructions({
  grandTotal,
  bankAccounts,
  status,
  paymentStatus,
  expiresAt,
}: PaymentInstructionsProps) {
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  const handleCopy = async (text: string, label: string, key: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedKey(key)
      toast.success(`${label} berhasil disalin!`)
      setTimeout(() => setCopiedKey(null), 2000)
    } catch {
      toast.error('Gagal menyalin teks.')
    }
  }

  // Jika pesanan sudah dibayar, selesai, atau dibatalkan, instruksi pembayaran tidak aktif
  if (paymentStatus === 'paid' || status === 'completed') {
    return (
      <div className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
        <div className="flex items-center gap-3">
          <Check className="size-5 text-emerald-700" />
          <div>
            <h4 className="font-semibold text-emerald-950">Pembayaran Terkonfirmasi</h4>
            <p className="text-xs text-emerald-800">
              Terima kasih, pembayaran Anda sebesar {formatRupiah(grandTotal)} telah diverifikasi oleh tim kami.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (status === 'cancelled' || status === 'expired') {
    return null
  }

  return (
    <div className="rounded-xl border border-stone-200 bg-white p-5 sm:p-6 shadow-xs space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-stone-100 pb-4">
        <div>
          <h3 className="text-base font-bold text-stone-900 flex items-center gap-2">
            <CreditCard className="size-5 text-stone-700" />
            Instruksi Pembayaran Transfer Bank
          </h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Silakan lakukan transfer ke salah satu rekening resmi Hairy Hijab berikut.
          </p>
        </div>

        {status === 'pending' && paymentStatus === 'unpaid' && (
          <ExpiryCountdown expiresAt={expiresAt} />
        )}
      </div>

      {/* Rincian Nominal Tepat */}
      <div className="rounded-lg bg-stone-50 border border-stone-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <span className="text-xs text-stone-500 font-medium">Jumlah Total Tagihan</span>
          <div className="text-2xl font-extrabold text-stone-950 tracking-tight mt-0.5 font-mono">
            {formatRupiah(grandTotal)}
          </div>
          <p className="text-xs text-amber-700 font-medium mt-1 flex items-center gap-1">
            <AlertCircle className="size-3.5 shrink-0" />
            Transfer tepat hingga digit terakhir agar otomatis terverifikasi.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="shrink-0 font-medium text-stone-700"
          onClick={() => handleCopy(String(grandTotal), 'Nominal transfer', 'total')}
        >
          {copiedKey === 'total' ? (
            <>
              <Check className="mr-1.5 size-3.5 text-emerald-600" />
              Tersalin
            </>
          ) : (
            <>
              <Copy className="mr-1.5 size-3.5 text-stone-500" />
              Salin Nominal
            </>
          )}
        </Button>
      </div>

      {/* Daftar Rekening Bank */}
      <div className="space-y-3">
        <span className="text-xs font-semibold text-stone-600 uppercase tracking-wider">
          Pilihan Rekening Toko
        </span>

        {bankAccounts.length === 0 ? (
          <p className="text-xs text-stone-500 italic">
            Belum ada rekening yang terdaftar. Hubungi layanan pelanggan kami.
          </p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {bankAccounts.map((account, index) => {
              const copyId = `bank-${index}`
              return (
                <div
                  key={`${account.bank}-${account.accountNumber}`}
                  className="rounded-lg border border-stone-200 bg-white p-3.5 flex flex-col justify-between gap-2.5"
                >
                  <div className="space-y-1">
                    <span className="inline-block rounded-md bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-800">
                      Bank {account.bank}
                    </span>
                    <div className="font-mono text-base font-bold text-stone-900 tracking-wide">
                      {account.accountNumber}
                    </div>
                    <div className="text-xs text-stone-500">
                      a.n. <span className="font-semibold text-stone-700">{account.accountName}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center border border-stone-200 text-xs font-medium text-stone-700 hover:bg-stone-50"
                    onClick={() =>
                      handleCopy(account.accountNumber, `Nomor rekening ${account.bank}`, copyId)
                    }
                  >
                    {copiedKey === copyId ? (
                      <>
                        <Check className="mr-1.5 size-3.5 text-emerald-600" />
                        Tersalin
                      </>
                    ) : (
                      <>
                        <Copy className="mr-1.5 size-3.5 text-stone-500" />
                        Salin Rekening
                      </>
                    )}
                  </Button>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {paymentStatus === 'proof_submitted' && (
        <div className="rounded-lg bg-sky-50 border border-sky-200 p-3.5 flex items-start gap-2.5">
          <Info className="size-4 shrink-0 text-sky-700 mt-0.5" />
          <div className="text-xs text-sky-900 leading-relaxed">
            <span className="font-semibold">Bukti transfer telah Anda kirim.</span> Tim kami sedang
            melakukan verifikasi ke mutasi bank. Status pesanan akan otomatis berubah setelah
            pembayaran disetujui.
          </div>
        </div>
      )}
    </div>
  )
}
